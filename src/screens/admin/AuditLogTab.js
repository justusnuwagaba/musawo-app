import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

const ACTION_LABEL = {
  approve_doctor_application: 'Approved doctor application',
  reject_doctor_application: 'Rejected doctor application',
  set_user_role: 'Changed user role',
  ban_user: 'Banned user',
  unban_user: 'Unbanned user',
  reset_user_password: 'Reset user password',
};

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
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Icon name="shield-checkmark-outline" size={18} color={colors.primary} />
          <View style={styles.info}>
            <Text style={styles.action}>{ACTION_LABEL[item.action] || item.action}</Text>
            <Text style={styles.detail}>Target: {item.targetUid}</Text>
            <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={<EmptyState icon="document-lock-outline" title="No activity yet" message="Admin actions (approvals, bans, role changes) will be logged here." />}
    />
  );
}

const styles = StyleSheet.create({
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
    marginLeft: spacing.sm,
    flex: 1,
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
