import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

function formatDate(scheduledAt) {
  if (!scheduledAt?.toDate) return '';
  return scheduledAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ConsultationHistoryScreen() {
  const { user } = useUserContext();
  const [history, setHistory] = useState([]);
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
        setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Icon name="checkmark-circle-outline" size={20} color={colors.success} />
            <View style={styles.info}>
              <Text style={styles.patientName}>{item.patientName}</Text>
              <Text style={styles.detail}>{formatDate(item.scheduledAt)} · {item.specialty}</Text>
              {!!item.reasonForVisit && <Text style={styles.reason}>"{item.reasonForVisit}"</Text>}
            </View>
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="time-outline" title="No consultations yet" message="Completed consultations will appear here." />}
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
  card: {
    flexDirection: 'row',
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
});
