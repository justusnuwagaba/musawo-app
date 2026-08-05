import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

const TYPE_LABEL_KEY = {
  video: 'appointments.typeVideo',
  audio: 'appointments.typeAudio',
  in_person: 'appointments.typeInPerson',
};

function formatDate(scheduledAt) {
  if (!scheduledAt?.toDate) return '';
  return scheduledAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ConsultationHistoryScreen() {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [history, setHistory] = useState([]);
  // Reviews are stored as reviews/{appointmentId} (see RateAppointmentScreen)
  // — a direct 1:1 lookup, not a fabricated rating.
  const [ratingsByAppointment, setRatingsByAppointment] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(
          collection(firestore, 'appointments'),
          where('doctorId', '==', user.uid),
          where('status', '==', 'completed'),
          orderBy('scheduledAt', 'desc')
        );
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setHistory(items);

        const reviewSnaps = await Promise.all(items.map((item) => getDoc(doc(firestore, 'reviews', item.id))));
        const ratings = {};
        reviewSnaps.forEach((reviewSnap, i) => {
          if (reviewSnap.exists()) ratings[items[i].id] = reviewSnap.data().rating;
        });
        setRatingsByAppointment(ratings);
      } catch (err) {
        console.error('[ConsultationHistoryScreen] fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>{t('appointments.historyTitle')}</Text>}
        renderItem={({ item }) => {
          const rating = ratingsByAppointment[item.id];
          const typeLabel = TYPE_LABEL_KEY[item.type] ? t(TYPE_LABEL_KEY[item.type]) : item.type;
          return (
            <View style={styles.card}>
              <Avatar name={item.patientName} size="sm" />
              <View style={styles.info}>
                <Text style={styles.patientName}>{item.patientName}</Text>
                <Text style={styles.detail}>
                  {formatDate(item.scheduledAt)} · {typeLabel}
                  {item.durationMinutes ? ` · ${t('appointments.minutesSuffix', { count: item.durationMinutes })}` : ''}
                </Text>
                {!!item.reasonForVisit && <Text style={styles.reason}>"{item.reasonForVisit}"</Text>}
              </View>
              {rating != null && (
                <View style={styles.ratingPill}>
                  <Text style={styles.ratingText}>★{rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState icon="time-outline" title={t('appointments.noConsultationsTitle')} message={t('appointments.noConsultationsMessage')} />
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
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  patientName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  detail: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    marginTop: 2,
  },
  reason: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  ratingPill: {
    flexShrink: 0,
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
  },
  ratingText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});
