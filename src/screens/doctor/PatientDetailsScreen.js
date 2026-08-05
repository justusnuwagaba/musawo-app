import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';
import { DOCTOR_ROUTES } from '../../navigation/routes';

function formatDate(scheduledAt) {
  if (!scheduledAt?.toDate) return 'Date TBD';
  return scheduledAt.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PatientDetailsScreen({ route, navigation }) {
  const { patientId, patientName } = route.params;
  const { user } = useUserContext();
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [patientSnap, historySnap] = await Promise.all([
          getDoc(doc(firestore, 'users', patientId)),
          getDocs(query(collection(firestore, 'appointments'), where('doctorId', '==', user.uid), where('patientId', '==', patientId))),
        ]);
        setPatient(patientSnap.exists() ? patientSnap.data() : null);
        setHistory(historySnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('[PatientDetailsScreen] fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [patientId, user]);

  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => (b.scheduledAt?.toMillis?.() ?? 0) - (a.scheduledAt?.toMillis?.() ?? 0)),
    [history]
  );

  if (loading) return <LoadingSpinner />;

  const displayName = patient?.displayName || patientName || 'Patient';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Avatar name={displayName} photoURL={patient?.photoURL} size="lg" />
          <Text style={styles.name}>{displayName}</Text>
          {!!patient?.phone && <Text style={styles.subtext}>{patient.phone}</Text>}
        </View>

        {!!patient?.chronicConditions?.length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chronic conditions</Text>
            <Text style={styles.sectionText}>{patient.chronicConditions.join(', ')}</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <Button
            title="Medical records"
            variant="outline"
            onPress={() => navigation.navigate(DOCTOR_ROUTES.MEDICAL_RECORDS, { patientId, patientName: displayName })}
            style={styles.actionButton}
          />
          <Button
            title="Schedule visit"
            onPress={() => navigation.navigate(DOCTOR_ROUTES.SCHEDULE_APPOINTMENT, { patientId, patientName: displayName })}
            style={styles.actionButton}
          />
        </View>

        <Text style={styles.sectionTitle}>Appointment history</Text>
        {sortedHistory.length === 0 ? (
          <Text style={styles.emptyText}>No appointments with this patient yet.</Text>
        ) : (
          sortedHistory.map((appt, index) => (
            <View key={appt.id} style={styles.timelineRow}>
              <View style={styles.rail}>
                <View style={[styles.railLine, index === 0 && styles.railLineHidden]} />
                <View style={styles.iconCircle}>
                  <Icon name="calendar-outline" size={18} color={colors.primary} />
                </View>
                <View style={[styles.railLine, index === sortedHistory.length - 1 && styles.railLineHidden]} />
              </View>
              <View style={styles.historyBody}>
                <Text style={styles.historyDate}>{formatDate(appt.scheduledAt)}</Text>
                <Text style={styles.historyStatus}>{appt.status} · {appt.specialty}</Text>
              </View>
            </View>
          ))
        )}
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  subtext: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  sectionText: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },
  // Same connected-timeline treatment as MedicalRecordsScreen — a rail
  // column (line + icon) beside the entry, rather than a separate card per
  // row, for a chronological list that's the same shape as that one.
  timelineRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  rail: {
    width: 40,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  railLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
  },
  railLineHidden: {
    backgroundColor: 'transparent',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBody: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: spacing.sm,
  },
  historyDate: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.ink,
  },
  historyStatus: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    textTransform: 'capitalize',
  },
});
