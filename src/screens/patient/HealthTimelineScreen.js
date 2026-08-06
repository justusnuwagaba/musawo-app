import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';

// The real version of what MedicalRecordsScreen alone could never be: a
// single chronological view across every source of health data this app
// actually has — consultations (appointments), doctor notes/diagnoses/
// prescriptions (medicalRecords), lab results (labResults), and completed
// vaccinations/screenings/pharmacy deliveries (serviceOrders). Flagged as a
// real gap during the earlier mockup pass — building it now that there are
// enough genuine data sources to make it worth building, not a merge of
// mostly-empty collections.
// {color, bg} pairing — same pattern as AuditLogTab's ACTION_STYLE, using
// the existing *Muted/*Light tokens rather than computing a dim background
// dynamically.
const ENTRY_STYLE = {
  consultation: { icon: 'videocam-outline', color: colors.primary, bg: colors.primaryMuted },
  note: { icon: 'document-text-outline', color: colors.primary, bg: colors.primaryMuted },
  diagnosis: { icon: 'pulse-outline', color: colors.warning, bg: colors.warningLight },
  prescription: { icon: 'medkit-outline', color: colors.info, bg: colors.infoLight },
  lab_result: { icon: 'flask-outline', color: colors.info, bg: colors.infoLight },
  vaccination: { icon: 'shield-checkmark-outline', color: colors.success, bg: colors.successLight },
  healthScreening: { icon: 'medical-outline', color: colors.success, bg: colors.successLight },
  pharmacy: { icon: 'bicycle-outline', color: colors.success, bg: colors.successLight },
  insurance: { icon: 'document-text-outline', color: colors.inkMuted, bg: colors.surface },
};

const CATEGORY_LABEL = {
  lab: 'Lab',
  vaccination: 'Vaccination',
  healthScreening: 'Health Screening',
  pharmacy: 'Pharmacy delivery',
  insurance: 'Insurance',
};

function formatEntryDate(date) {
  if (!date) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function HealthTimelineScreen() {
  const { user } = useUserContext();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Each query is a single-field or two-equality-field filter with no
        // orderBy — sorted client-side once merged instead, so none of
        // these need a composite index.
        const [recordsSnap, labSnap, ordersSnap, apptSnap] = await Promise.all([
          getDocs(query(collection(firestore, 'medicalRecords'), where('patientId', '==', user.uid))),
          getDocs(query(collection(firestore, 'labResults'), where('patientId', '==', user.uid))),
          getDocs(query(collection(firestore, 'serviceOrders'), where('patientId', '==', user.uid), where('status', '==', 'completed'))),
          getDocs(query(collection(firestore, 'appointments'), where('patientId', '==', user.uid), where('status', '==', 'completed'))),
        ]);

        const merged = [];

        recordsSnap.docs.forEach((d) => {
          const data = d.data();
          const style = ENTRY_STYLE[data.type] || ENTRY_STYLE.note;
          merged.push({
            id: `record-${d.id}`,
            date: data.createdAt?.toDate?.() ?? null,
            title: data.title || (data.type === 'prescription' ? 'Prescription' : 'Medical note'),
            subtitle: data.content || '',
            icon: style.icon,
            color: style.color,
            bg: style.bg,
          });
        });

        labSnap.docs.forEach((d) => {
          const data = d.data();
          merged.push({
            id: `lab-${d.id}`,
            date: data.createdAt?.toDate?.() ?? null,
            title: `Lab result — ${data.testName || 'Test'}`,
            subtitle: `${data.result || ''}${data.units ? ` ${data.units}` : ''}${data.flag ? ` · ${data.flag}` : ''}`.trim(),
            icon: ENTRY_STYLE.lab_result.icon,
            color: ENTRY_STYLE.lab_result.color,
            bg: ENTRY_STYLE.lab_result.bg,
          });
        });

        ordersSnap.docs.forEach((d) => {
          const data = d.data();
          const style = ENTRY_STYLE[data.category] || ENTRY_STYLE.healthScreening;
          merged.push({
            id: `order-${d.id}`,
            date: data.updatedAt?.toDate?.() ?? data.createdAt?.toDate?.() ?? null,
            title: `${CATEGORY_LABEL[data.category] || data.category} — ${data.itemName || ''}`.trim(),
            subtitle: data.assignedDoctorName ? `With ${data.assignedDoctorName}` : '',
            icon: style.icon,
            color: style.color,
            bg: style.bg,
          });
        });

        apptSnap.docs.forEach((d) => {
          const data = d.data();
          merged.push({
            id: `appt-${d.id}`,
            date: data.scheduledAt?.toDate?.() ?? null,
            title: `Consultation${data.doctorName ? ` — Dr. ${data.doctorName}` : ''}`,
            subtitle: data.specialty || '',
            icon: ENTRY_STYLE.consultation.icon,
            color: ENTRY_STYLE.consultation.color,
            bg: ENTRY_STYLE.consultation.bg,
          });
        });

        merged.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));
        if (!cancelled) setEntries(merged);
      } catch (err) {
        console.error('[HealthTimelineScreen] fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <View style={styles.timelineRow}>
            <View style={styles.rail}>
              <View style={[styles.railLine, index === 0 && styles.railLineHidden]} />
              <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
                <Icon name={item.icon} size={18} color={item.color} />
              </View>
              <View style={[styles.railLine, index === entries.length - 1 && styles.railLineHidden]} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.entryTitle}>{item.title}</Text>
              {!!item.subtitle && <Text style={styles.entrySubtitle} numberOfLines={2}>{item.subtitle}</Text>}
              <Text style={styles.entryDate}>{formatEntryDate(item.date)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            title="Nothing here yet"
            message="Consultations, prescriptions, lab results, and completed vaccinations or screenings will all show up here as they happen."
          />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: spacing.sm,
  },
  entryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  entrySubtitle: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  entryDate: {
    fontSize: fontSize.xs,
    color: colors.inkFaint,
    marginTop: 4,
  },
});
