import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Button from '../../components/Button';
import SpecialtyChip from '../../components/SpecialtyChip';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

const CATEGORY_LABEL = {
  unsafe_behavior: 'Unsafe behavior',
  inappropriate_content: 'Inappropriate content',
  technical_issue: 'Technical issue',
  no_show: 'No-show',
  other: 'Other',
};

const STATUS_FILTERS = ['open', 'reviewed', 'resolved', 'All'];

function formatTime(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function SafetyReportsTab() {
  const { user } = useUserContext();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const q = query(collection(firestore, 'safetyReports'), orderBy('createdAt', 'desc'), limit(100));
      const snap = await getDocs(q);
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('[SafetyReportsTab] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => reports.filter((r) => statusFilter === 'All' || r.status === statusFilter),
    [reports, statusFilter]
  );

  const handleUpdateStatus = async (report, nextStatus) => {
    setBusyId(report.id);
    try {
      await updateDoc(doc(firestore, 'safetyReports', report.id), {
        status: nextStatus,
        reviewedBy: user.uid,
        reviewedAt: serverTimestamp(),
      });
      setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, status: nextStatus } : r)));
    } catch (err) {
      console.error('[SafetyReportsTab] update error:', err);
      showAlert('Could not update', 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <SpecialtyChip label={item} selected={item === statusFilter} onPress={() => setStatusFilter(item)} />
          )}
          style={styles.chipRow}
        />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.category}>{CATEGORY_LABEL[item.category] || item.category}</Text>
            <View style={[styles.statusBadge, item.status === 'open' && styles.statusOpen, item.status === 'resolved' && styles.statusResolved]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.reportedBy}>{item.reporterName} ({item.reporterRole}) reported {item.reportedUserName}</Text>
          <Text style={styles.context}>{item.context === 'video_call' ? 'During a call' : 'In chat'} · {formatTime(item.createdAt)}</Text>
          {!!item.description && <Text style={styles.description}>"{item.description}"</Text>}

          {item.status !== 'resolved' && (
            <View style={styles.actionsRow}>
              {item.status === 'open' && (
                <Button title="Mark reviewed" variant="outline" onPress={() => handleUpdateStatus(item, 'reviewed')} loading={busyId === item.id} style={styles.actionButton} />
              )}
              <Button title="Resolve" onPress={() => handleUpdateStatus(item, 'resolved')} loading={busyId === item.id} style={styles.actionButton} />
            </View>
          )}
        </View>
      )}
      ListEmptyComponent={
        <EmptyState icon="shield-checkmark-outline" title="No reports" message={`No ${statusFilter === 'All' ? '' : statusFilter} safety reports right now.`} />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  chipRow: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    flexShrink: 1,
  },
  statusBadge: {
    flexShrink: 0,
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.warningLight,
  },
  statusOpen: {
    backgroundColor: colors.dangerLight,
  },
  statusResolved: {
    backgroundColor: colors.successLight,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    textTransform: 'capitalize',
  },
  reportedBy: {
    fontSize: fontSize.sm,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  context: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    marginTop: 2,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginRight: spacing.sm,
  },
});
