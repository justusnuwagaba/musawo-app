import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../theme/tokens';

const TYPE_ICON = { video: 'videocam', audio: 'call', chat: 'chatbubble-ellipses', in_person: 'business' };

const STATUS_STYLE = {
  requested: { bg: colors.warningLight, text: colors.warning, label: 'Requested' },
  confirmed: { bg: colors.infoLight, text: colors.info, label: 'Confirmed' },
  in_progress: { bg: colors.primaryMuted, text: colors.primary, label: 'In progress' },
  completed: { bg: colors.successLight, text: colors.success, label: 'Completed' },
  cancelled: { bg: colors.dangerLight, text: colors.danger, label: 'Cancelled' },
  no_show: { bg: colors.dangerLight, text: colors.danger, label: 'No-show' },
};

function formatWhen(scheduledAt) {
  if (!scheduledAt) return 'Date TBD';
  const date = typeof scheduledAt.toDate === 'function' ? scheduledAt.toDate() : new Date(scheduledAt);
  return date.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// `actions` is an array of { label, onPress, destructive? } — the patient
// side passes Reschedule/Cancel, the doctor side passes Accept/Decline or
// Start call/Mark complete, etc.
export default function AppointmentCard({ appointment, personName, actions = [] }) {
  const status = STATUS_STYLE[appointment.status] ?? STATUS_STYLE.requested;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.typeIcon}>
          <Icon name={TYPE_ICON[appointment.type] ?? 'calendar'} size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.doctorName} numberOfLines={1}>{personName}</Text>
          <Text style={styles.specialty} numberOfLines={1}>{appointment.specialty || 'General'}</Text>
        </View>
      </View>

      <View style={styles.whenRow}>
        <View style={styles.whenLeft}>
          <Icon name="time-outline" size={15} color={colors.inkMuted} />
          <Text style={styles.whenText} numberOfLines={1}>{formatWhen(appointment.scheduledAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.text }]} numberOfLines={1}>{status.label}</Text>
        </View>
      </View>

      {!!appointment.reasonForVisit && (
        <Text style={styles.reason} numberOfLines={2}>"{appointment.reasonForVisit}"</Text>
      )}

      {!!actions.length && (
        <View style={styles.actions}>
          {actions.map((action) => (
            <TouchableOpacity key={action.label} style={styles.actionButton} onPress={action.onPress}>
              <Text style={[styles.actionText, action.destructive && styles.cancelText]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  doctorName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  specialty: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
  },
  statusBadge: {
    flexShrink: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    marginLeft: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  whenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  whenText: {
    flexShrink: 1,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginLeft: spacing.xs,
  },
  reason: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  actionButton: {
    marginRight: spacing.lg,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  cancelText: {
    color: colors.danger,
  },
});
