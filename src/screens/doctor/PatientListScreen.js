import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';
import { DOCTOR_ROUTES } from '../../navigation/routes';

function formatDate(scheduledAt) {
  if (!scheduledAt?.toDate) return '';
  return scheduledAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PatientListScreen({ navigation }) {
  const { user } = useUserContext();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(collection(firestore, 'appointments'), where('doctorId', '==', user.uid));
        const snap = await getDocs(q);
        setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('[PatientListScreen] fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const patients = useMemo(() => {
    const byPatient = new Map();
    for (const appt of appointments) {
      const existing = byPatient.get(appt.patientId);
      if (!existing || (appt.scheduledAt?.toMillis?.() ?? 0) > (existing.scheduledAt?.toMillis?.() ?? 0)) {
        byPatient.set(appt.patientId, appt);
      }
    }
    return Array.from(byPatient.values()).sort((a, b) => (b.scheduledAt?.toMillis?.() ?? 0) - (a.scheduledAt?.toMillis?.() ?? 0));
  }, [appointments]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={patients}
        keyExtractor={(item) => item.patientId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate(DOCTOR_ROUTES.PATIENT_DETAILS, { patientId: item.patientId, patientName: item.patientName })}
          >
            <Avatar name={item.patientName} size="sm" />
            <View style={styles.info}>
              <Text style={styles.name}>{item.patientName || 'Patient'}</Text>
              <Text style={styles.lastVisit}>Last visit: {formatDate(item.scheduledAt)}</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.inkFaint} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState icon="people-outline" title="No patients yet" message="Once patients book with you, they'll show up here." />
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
    marginLeft: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  lastVisit: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },
});
