import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, orderBy, getDocs, getAggregateFromServer, sum, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import Button from '../../components/Button';
import SegmentedToggle from '../../components/SegmentedToggle';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

function formatDateTime(timestamp) {
  if (!timestamp?.toDate) return null;
  return timestamp.toDate().toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

async function getRevenueSummary() {
  const paymentsRef = collection(firestore, 'payments');
  const completedQuery = query(paymentsRef, where('status', '==', 'completed'));
  try {
    const snap = await getAggregateFromServer(completedQuery, {
      commission: sum('commissionAmount'),
      earnings: sum('doctorEarnings'),
    });
    return { commission: snap.data().commission ?? 0, earnings: snap.data().earnings ?? 0 };
  } catch (err) {
    console.error('[TransactionsTab] aggregate error, falling back to client sum:', err);
    const snap = await getDocs(completedQuery);
    return snap.docs.reduce(
      (acc, d) => {
        const data = d.data();
        acc.commission += data.commissionAmount ?? 0;
        acc.earnings += data.doctorEarnings ?? 0;
        return acc;
      },
      { commission: 0, earnings: 0 }
    );
  }
}

export default function TransactionsTab() {
  const { user } = useUserContext();
  const [payments, setPayments] = useState([]);
  const [revenue, setRevenue] = useState({ commission: 0, earnings: 0 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [paymentsSnap, revenueSummary] = await Promise.all([
        getDocs(query(collection(firestore, 'payments'), orderBy('createdAt', 'desc'))),
        getRevenueSummary(),
      ]);
      setPayments(paymentsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setRevenue(revenueSummary);
    } catch (err) {
      console.error('[TransactionsTab] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkPaid = async (payment) => {
    setMarkingId(payment.id);
    try {
      await updateDoc(doc(firestore, 'payments', payment.id), {
        status: 'completed',
        paidAt: serverTimestamp(),
        markedPaidBy: user.uid,
        updatedAt: serverTimestamp(),
      });
      setPayments((prev) => prev.map((p) => (p.id === payment.id ? { ...p, status: 'completed' } : p)));
    } catch (err) {
      console.error('[TransactionsTab] mark paid error:', err);
      showAlert('Could not update', 'Please try again.');
    } finally {
      setMarkingId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const filtered = payments.filter((p) => p.status === statusFilter);

  return (
    <FlatList
      data={filtered}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <>
          <View style={styles.statsRow}>
            <StatCard icon="cash-outline" label="Commission collected" value={`UGX ${revenue.commission.toLocaleString()}`} color={colors.primary} />
            <StatCard icon="wallet-outline" label="Paid to doctors" value={`UGX ${revenue.earnings.toLocaleString()}`} color={colors.success} />
          </View>

          <View style={styles.banner}>
            <Icon name="information-circle-outline" size={18} color={colors.info} />
            <Text style={styles.bannerText}>
              Manual reconciliation — confirm the Mobile Money payment was actually received before marking it paid. Not a live payment gateway.
            </Text>
          </View>

          <SegmentedToggle
            style={styles.toggle}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
        </>
      }
      renderItem={({ item }) => {
        const dateLabel = formatDateTime(item.createdAt);
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.patientName}>{item.patientName}</Text>
              <Text style={styles.amount}>+UGX {item.amount?.toLocaleString()}</Text>
            </View>
            <Text style={styles.doctorName}>to {item.doctorName}</Text>
            {!!dateLabel && <Text style={styles.dateLabel}>{dateLabel}</Text>}
            <Text style={styles.breakdown}>
              Commission UGX {item.commissionAmount?.toLocaleString()} · Doctor earns UGX {item.doctorEarnings?.toLocaleString()}
            </Text>
            {item.status === 'pending' && (
              <Button title="Mark as paid (manual)" variant="outline" onPress={() => handleMarkPaid(item)} loading={markingId === item.id} style={styles.markButton} />
            )}
          </View>
        );
      }}
      ListEmptyComponent={<EmptyState icon="receipt-outline" title="No transactions" message={`No ${statusFilter} payments right now.`} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    marginHorizontal: spacing.xs,
    ...shadow.card,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoLight,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.ink,
    marginLeft: spacing.sm,
  },
  toggle: {
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
  },
  patientName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  amount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  doctorName: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  dateLabel: {
    fontSize: fontSize.xs,
    color: colors.inkFaint,
    marginTop: 2,
  },
  breakdown: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  markButton: {
    marginTop: spacing.sm,
  },
});
