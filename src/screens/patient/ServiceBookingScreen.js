import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { collection, addDoc, query, where, orderBy, startAt, endAt, getDocs, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import SegmentedToggle from '../../components/SegmentedToggle';
import RadarPulse from '../../components/RadarPulse';
import { showAlert } from '../../components/AppAlert';
import { boundsForRadius, distanceKm, formatDistance } from '../../utils/geo';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

// Categories where a "Home" visit gets matched to a real nearby available
// doctor (Uber-style geohash matching, same technique as FindDoctorScreen),
// rather than just recording a preference — starting with vaccination since
// a licensed doctor administering it at a patient's home is both medically
// reasonable and, in East Africa specifically, a real way to put
// underemployed/licensed-but-idle doctors to work. Extend this list as more
// categories earn the same treatment.
const HOME_VISIT_MATCHING_CATEGORIES = ['vaccination'];
const HOME_VISIT_RADIUS_KM = 15; // tighter than FindDoctorScreen's 50km — a home visit needs to be genuinely nearby

// Generic booking form shared by all six catalog categories (Lab,
// Vaccination, Chronic Illness, Health Screening, Pharmacy, Insurance) —
// reached from ServiceScreenTemplate.js, which is itself already
// parameterized the same way. Writes to the shared serviceOrders
// collection (see firestore.rules) rather than a per-category one.
export default function ServiceBookingScreen({ route, navigation }) {
  const { item, category, categoryLabel } = route.params;
  const { user, profile } = useUserContext();
  const [fulfillmentMethod, setFulfillmentMethod] = useState('home');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const supportsHomeMatching = HOME_VISIT_MATCHING_CATEGORIES.includes(category);
  const [matchedDoctor, setMatchedDoctor] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);

  useEffect(() => {
    if (!supportsHomeMatching || fulfillmentMethod !== 'home') {
      setMatchedDoctor(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingMatch(true);
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        let granted = status === 'granted';
        if (!granted) {
          const req = await Location.requestForegroundPermissionsAsync();
          granted = req.status === 'granted';
        }
        if (!granted) {
          if (!cancelled) setMatchedDoctor(null);
          return;
        }

        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = position.coords;
        const bounds = boundsForRadius(latitude, longitude, HOME_VISIT_RADIUS_KM);
        const usersRef = collection(firestore, 'users');
        const snapshots = await Promise.all(
          bounds.map(([start, end]) =>
            getDocs(
              query(
                usersRef,
                where('role', '==', 'doctor'),
                where('isVerified', '==', true),
                where('isOnline', '==', true),
                orderBy('geohash'),
                startAt(start),
                endAt(end)
              )
            )
          )
        );

        const byId = new Map();
        snapshots.forEach((snap) => {
          snap.docs.forEach((d) => {
            const data = d.data();
            if (!data.location) return;
            const km = distanceKm(latitude, longitude, data.location.lat, data.location.lng);
            if (km <= HOME_VISIT_RADIUS_KM) byId.set(d.id, { id: d.id, ...data, distanceKm: km });
          });
        });
        const nearest = Array.from(byId.values()).sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null;
        if (!cancelled) setMatchedDoctor(nearest);
      } catch (err) {
        console.error('[ServiceBookingScreen] nearby match error:', err);
        if (!cancelled) setMatchedDoctor(null);
      } finally {
        if (!cancelled) setLoadingMatch(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supportsHomeMatching, fulfillmentMethod]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await addDoc(collection(firestore, 'serviceOrders'), {
        category,
        itemId: item.id,
        itemName: item.name,
        price: item.price ?? 0,
        patientId: user.uid,
        patientName: profile?.displayName || 'Patient',
        fulfillmentMethod,
        preferredDate: preferredDate.trim(),
        notes: notes.trim(),
        status: 'requested',
        assignedDoctorId: matchedDoctor?.id ?? null,
        assignedDoctorName: matchedDoctor?.displayName ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const confirmMessage = matchedDoctor
        ? `${matchedDoctor.displayName} (${formatDistance(matchedDoctor.distanceKm)} away) has been requested for your home visit.`
        : `Your ${categoryLabel.toLowerCase()} request has been sent — we'll confirm it shortly.`;
      showAlert('Request sent', confirmMessage, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      console.error('[ServiceBookingScreen] booking error:', err);
      showAlert('Could not send request', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.itemCard}>
          <Text style={styles.itemName}>{item.name}</Text>
          {!!item.description && <Text style={styles.itemDescription}>{item.description}</Text>}
          {!!item.price && <Text style={styles.itemPrice}>UGX {item.price.toLocaleString?.() ?? item.price}</Text>}
        </View>

        <Text style={styles.label}>How would you like this done?</Text>
        <SegmentedToggle
          style={styles.toggle}
          value={fulfillmentMethod}
          onChange={setFulfillmentMethod}
          options={[
            { value: 'home', label: 'Home' },
            { value: 'facility', label: 'Visit a facility' },
          ]}
        />

        {supportsHomeMatching && fulfillmentMethod === 'home' && (
          <View style={styles.matchCard}>
            {loadingMatch ? (
              <View style={styles.matchLoading}>
                <RadarPulse color={colors.primary} size={64} />
                <Text style={styles.matchLoadingText}>Finding a nearby provider...</Text>
              </View>
            ) : matchedDoctor ? (
              <View style={styles.matchRow}>
                <Avatar name={matchedDoctor.displayName} photoURL={matchedDoctor.photoURL} size="sm" />
                <View style={styles.matchInfo}>
                  <Text style={styles.matchName}>{matchedDoctor.displayName}</Text>
                  <Text style={styles.matchMeta}>
                    {matchedDoctor.specialty || 'General Practice'} · {formatDistance(matchedDoctor.distanceKm)} away
                  </Text>
                </View>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>Matched</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.matchEmptyText}>
                No nearby providers available for a home visit right now — you can still send this request and we'll assign one as soon as possible.
              </Text>
            )}
          </View>
        )}

        <Input label="Preferred date (optional)" placeholder="e.g. Aug 20" value={preferredDate} onChangeText={setPreferredDate} />

        <Input
          label="Notes for the provider (optional)"
          placeholder="Anything they should know before this visit"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Button title={`Request ${categoryLabel}`} onPress={handleConfirm} loading={submitting} style={styles.confirmButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  itemName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  itemDescription: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  itemPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  toggle: {
    marginBottom: spacing.lg,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  matchLoading: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  matchLoadingText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  matchName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  matchMeta: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  matchBadge: {
    flexShrink: 0,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  matchBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  matchEmptyText: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },
  confirmButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
});
