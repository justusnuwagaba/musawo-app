import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SegmentedToggle from '../../components/SegmentedToggle';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';
import { PATIENT_ROUTES } from '../../navigation/routes';

// Chronic conditions (diabetes, hypertension, etc.) are managed over time,
// not booked once — this used to route through the generic
// ServiceScreenTemplate/ServiceBookingScreen "catalog item" flow, which
// never made sense here (what would "buying" a diabetes plan as a discrete
// item even mean?). Real chronic-care apps (Livongo, Omada Health) work
// because they're a recurring relationship: track readings between visits,
// check in with a doctor when something looks off or it's routine-review
// time. This screen does that instead — a vitals log + a way to book a
// check-in, not a purchase form.
const VITAL_TYPES = [
  { value: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', icon: 'pulse-outline', placeholder: '120/80' },
  { value: 'blood_sugar', label: 'Blood Sugar', unit: 'mg/dL', icon: 'water-outline', placeholder: '110' },
  { value: 'weight', label: 'Weight', unit: 'kg', icon: 'body-outline', placeholder: '70' },
];

function formatVitalDate(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ChronicHome({ navigation }) {
  const { user } = useUserContext();
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vitalType, setVitalType] = useState('blood_pressure');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sorted client-side rather than via orderBy in the query, same reasoning
  // as ServiceScreenTemplate's orders query — avoids needing a composite
  // index for a small, single-patient list.
  useEffect(() => {
    if (!user) return;
    const q = query(collection(firestore, 'vitals'), where('patientId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (b.recordedAt?.toMillis?.() ?? 0) - (a.recordedAt?.toMillis?.() ?? 0));
        setVitals(items);
        setLoading(false);
      },
      (err) => {
        console.error('[ChronicHome] vitals fetch error:', err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  const handleLogVital = async () => {
    if (!value.trim()) {
      showAlert('Missing value', 'Enter a reading before saving.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(firestore, 'vitals'), {
        patientId: user.uid,
        type: vitalType,
        value: value.trim(),
        recordedAt: serverTimestamp(),
      });
      setValue('');
    } catch (err) {
      console.error('[ChronicHome] log vital error:', err);
      showAlert('Could not save', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const typeMeta = VITAL_TYPES.find((t) => t.value === vitalType);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={vitals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.intro}>
              Chronic conditions are managed over time, not booked once — log your readings here and check in with a
              doctor whenever something looks off, or it's time for a routine review.
            </Text>

            <TouchableOpacity style={styles.checkinCard} onPress={() => navigation.navigate(PATIENT_ROUTES.FIND_DOCTOR_TAB)}>
              <View style={styles.checkinIcon}>
                <Icon name="videocam-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.checkinText}>
                <Text style={styles.checkinTitle}>Book a check-in</Text>
                <Text style={styles.checkinSubtitle}>Talk to a doctor about your condition or recent readings</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.inkFaint} />
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Log a reading</Text>
            <SegmentedToggle
              style={styles.toggle}
              value={vitalType}
              onChange={setVitalType}
              options={VITAL_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            />
            <View style={styles.logRow}>
              <Input
                placeholder={`e.g. ${typeMeta.placeholder} ${typeMeta.unit}`}
                value={value}
                onChangeText={setValue}
                keyboardType={vitalType === 'blood_pressure' ? 'default' : 'numeric'}
                style={styles.logInput}
              />
              <Button title="Log" onPress={handleLogVital} loading={submitting} style={styles.logButton} />
            </View>

            <Text style={styles.sectionTitle}>Recent readings</Text>
          </>
        }
        renderItem={({ item }) => {
          const meta = VITAL_TYPES.find((t) => t.value === item.type);
          return (
            <View style={styles.vitalCard}>
              <View style={styles.vitalIcon}>
                <Icon name={meta?.icon || 'pulse-outline'} size={18} color={colors.primary} />
              </View>
              <View style={styles.vitalInfo}>
                <Text style={styles.vitalType}>{meta?.label || item.type}</Text>
                <Text style={styles.vitalDate}>{formatVitalDate(item.recordedAt)}</Text>
              </View>
              <Text style={styles.vitalValue}>
                {item.value}
                {meta?.unit ? ` ${meta.unit}` : ''}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="pulse-outline" title="No readings yet" message="Log your first blood pressure, blood sugar, or weight reading above." />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  intro: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  checkinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  checkinIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkinText: {
    flex: 1,
  },
  checkinTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  checkinSubtitle: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  toggle: {
    marginBottom: spacing.md,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  logInput: {
    flex: 1,
    marginRight: spacing.sm,
  },
  logButton: {
    marginTop: spacing.xs,
  },
  vitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  vitalIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  vitalInfo: {
    flex: 1,
  },
  vitalType: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  vitalDate: {
    fontSize: fontSize.xs,
    color: colors.inkFaint,
    marginTop: 2,
  },
  vitalValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
