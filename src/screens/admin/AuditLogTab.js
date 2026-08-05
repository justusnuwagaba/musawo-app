import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';

const ACTION_LABEL = {
  approve_doctor_application: 'Approved doctor application',
  reject_doctor_application: 'Rejected doctor application',
  set_user_role: 'Changed user role',
  ban_user: 'Banned user',
  unban_user: 'Unbanned user',
  reset_user_password: 'Reset user password',
};

// Same {color, bg} pairing pattern as AppointmentCard's STATUS_STYLE —
// success/danger/warning/info reused for what they already mean elsewhere,
// not the doctor-patient green=self/cyan=other-party convention, which
// doesn't apply to an admin looking at various other people's actions.
const ACTION_STYLE = {
  approve_doctor_application: { color: colors.success, bg: colors.successLight, icon: 'checkmark-circle-outline' },
  reject_doctor_application: { color: colors.danger, bg: colors.dangerLight, icon: 'close-circle-outline' },
  set_user_role: { color: colors.warning, bg: colors.warningLight, icon: 'swap-horizontal-outline' },
  ban_user: { color: colors.danger, bg: colors.dangerLight, icon: 'ban-outline' },
  unban_user: { color: colors.success, bg: colors.successLight, icon: 'checkmark-circle-outline' },
  reset_user_password: { color: colors.info, bg: colors.infoLight, icon: 'key-outline' },
};
const DEFAULT_ACTION_STYLE = { color: colors.primary, bg: colors.primaryMuted, icon: 'shield-checkmark-outline' };

function formatTime(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AuditLogTab() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(firestore, 'adminAuditLog'), orderBy('timestamp', 'desc'), limit(100));
        const snap = await getDocs(q);
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('[AuditLogTab] fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item, index }) => {
        const { color, bg, icon } = ACTION_STYLE[item.action] ?? DEFAULT_ACTION_STYLE;
        return (
          <View style={styles.timelineRow}>
            <View style={styles.rail}>
              <View style={[styles.railLine, index === 0 && styles.railLineHidden]} />
              <View style={[styles.iconCircle, { backgroundColor: bg }]}>
                <Icon name={icon} size={18} color={color} />
              </View>
              <View style={[styles.railLine, index === entries.length - 1 && styles.railLineHidden]} />
            </View>
            <View style={styles.info}>
              <Text style={styles.action}>{ACTION_LABEL[item.action] || item.action}</Text>
              <Text style={styles.detail}>Target: {item.targetUid}</Text>
              <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
            </View>
          </View>
        );
      }}
      ListEmptyComponent={<EmptyState icon="document-lock-outline" title="No activity yet" message="Admin actions (approvals, bans, role changes) will be logged here." />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  // Same rail/line/icon connected-timeline pattern as MedicalRecordsScreen
  // and PatientDetailsScreen — a chronological sequence, not separate cards.
  timelineRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  rail: {
    width: 36,
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
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: spacing.sm,
  },
  action: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  detail: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    marginTop: 2,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.inkFaint,
    marginTop: 2,
  },
});
