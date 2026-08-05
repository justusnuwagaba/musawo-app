import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { collection, query, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import Input from '../../components/Input';
import Button from '../../components/Button';
import SpecialtyChip from '../../components/SpecialtyChip';
import SegmentedToggle from '../../components/SegmentedToggle';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

// No chronicIllness — that category no longer creates serviceOrders at all
// (see ChronicHome.js: it's a vitals-log + check-in screen now, not a
// catalog booking).
const CATEGORY_FILTERS = ['All', 'lab', 'vaccination', 'healthScreening', 'pharmacy', 'insurance'];
const CATEGORY_LABEL = {
  All: 'All',
  lab: 'Lab',
  vaccination: 'Vaccination',
  healthScreening: 'Health Screening',
  pharmacy: 'Pharmacy',
  insurance: 'Insurance',
};
const STATUS_TABS = [
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
];

export default function ServiceOrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('requested');
  const [busyId, setBusyId] = useState(null);
  const [completingLabId, setCompletingLabId] = useState(null);
  const [resultValue, setResultValue] = useState('');
  const [resultUnits, setResultUnits] = useState('');
  const [resultFlag, setResultFlag] = useState('normal');

  // Live across all categories — filtered client-side rather than via a
  // where('category', ...) query, so switching the category chip doesn't
  // need a new listener/composite index for every combination.
  useEffect(() => {
    const q = query(collection(firestore, 'serviceOrders'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setOrders(items);
        setLoading(false);
      },
      (err) => {
        console.error('[ServiceOrdersTab] fetch error:', err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesCategory = categoryFilter === 'All' || o.category === categoryFilter;
      const matchesStatus = o.status === statusFilter;
      return matchesCategory && matchesStatus;
    });
  }, [orders, categoryFilter, statusFilter]);

  const handleConfirm = async (order) => {
    setBusyId(order.id);
    try {
      await updateDoc(doc(firestore, 'serviceOrders', order.id), { status: 'confirmed', updatedAt: serverTimestamp() });
    } catch (err) {
      console.error('[ServiceOrdersTab] confirm error:', err);
      showAlert('Could not update', 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = (order) => {
    showAlert('Cancel order', `Cancel this ${CATEGORY_LABEL[order.category] || order.category} request from ${order.patientName}?`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          setBusyId(order.id);
          try {
            await updateDoc(doc(firestore, 'serviceOrders', order.id), { status: 'cancelled', updatedAt: serverTimestamp() });
          } catch (err) {
            console.error('[ServiceOrdersTab] cancel error:', err);
            showAlert('Could not cancel', 'Please try again.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  // Non-lab categories: completing is just a status flip. Lab orders open an
  // inline result-entry form instead, since "complete" for a lab test means
  // a real result exists — writes both the serviceOrders status AND a new
  // labResults doc (which LabResultsScreen already reads from) in one batch.
  const handleComplete = (order) => {
    if (order.category === 'lab') {
      setCompletingLabId(order.id);
      setResultValue('');
      setResultUnits('');
      setResultFlag('normal');
      return;
    }
    completeOrder(order);
  };

  const completeOrder = async (order) => {
    setBusyId(order.id);
    try {
      await updateDoc(doc(firestore, 'serviceOrders', order.id), { status: 'completed', updatedAt: serverTimestamp() });
    } catch (err) {
      console.error('[ServiceOrdersTab] complete error:', err);
      showAlert('Could not update', 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmitLabResult = async (order) => {
    if (!resultValue.trim()) {
      showAlert('Missing result', 'Enter a result value before completing this order.');
      return;
    }
    setBusyId(order.id);
    try {
      const batch = writeBatch(firestore);
      const resultRef = doc(collection(firestore, 'labResults'));
      batch.set(resultRef, {
        patientId: order.patientId,
        testName: order.itemName,
        result: resultValue.trim(),
        units: resultUnits.trim(),
        flag: resultFlag,
        resultDate: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        orderId: order.id,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(firestore, 'serviceOrders', order.id), { status: 'completed', updatedAt: serverTimestamp() });
      await batch.commit();
      setCompletingLabId(null);
    } catch (err) {
      console.error('[ServiceOrdersTab] submit lab result error:', err);
      showAlert('Could not save result', 'Please try again.');
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
        <View style={styles.header}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORY_FILTERS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <SpecialtyChip label={CATEGORY_LABEL[item]} selected={item === categoryFilter} onPress={() => setCategoryFilter(item)} />
            )}
            style={styles.chipRow}
          />
          <SegmentedToggle style={styles.toggle} value={statusFilter} onChange={setStatusFilter} options={STATUS_TABS} />
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{CATEGORY_LABEL[item.category] || item.category}</Text>
            </View>
          </View>
          <Text style={styles.patientName}>{item.patientName}</Text>
          {item.source === 'prescription' && (
            <View style={styles.prescriptionPill}>
              <Text style={styles.prescriptionPillText}>From prescription</Text>
            </View>
          )}
          <Text style={styles.detail}>
            {item.fulfillmentMethod === 'home' ? 'Home' : item.fulfillmentMethod === 'facility' ? 'Facility visit' : 'Inquiry'}
            {item.preferredDate ? ` · ${item.preferredDate}` : ''}
            {item.price ? ` · UGX ${item.price.toLocaleString?.() ?? item.price}` : ''}
          </Text>
          {/* Only vaccination/healthScreening get real doctor-matching (see
              ServiceBookingScreen) — a pharmacy "home" order is a delivery,
              nothing ever assigns a doctor to it, so showing "not yet
              matched to a provider" there would wrongly imply one should be. */}
          {(item.category === 'vaccination' || item.category === 'healthScreening') && item.fulfillmentMethod === 'home' && (
            <Text style={styles.detail}>
              {item.assignedDoctorName ? `Matched: ${item.assignedDoctorName}` : 'Not yet matched to a provider'}
            </Text>
          )}
          {!!item.notes && <Text style={styles.notes}>"{item.notes}"</Text>}

          {completingLabId === item.id ? (
            <View style={styles.resultForm}>
              <Input placeholder="Result value (e.g. Negative, 12.4)" value={resultValue} onChangeText={setResultValue} />
              <Input placeholder="Units (optional)" value={resultUnits} onChangeText={setResultUnits} />
              <SegmentedToggle
                style={styles.flagToggle}
                value={resultFlag}
                onChange={setResultFlag}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'abnormal', label: 'Abnormal' },
                ]}
              />
              <View style={styles.actionsRow}>
                <Button title="Save result" onPress={() => handleSubmitLabResult(item)} loading={busyId === item.id} style={styles.actionButton} />
                <Button title="Cancel" variant="ghost" onPress={() => setCompletingLabId(null)} style={styles.actionButton} />
              </View>
            </View>
          ) : (
            <View style={styles.actionsRow}>
              {item.status === 'requested' && (
                <Button title="Confirm" onPress={() => handleConfirm(item)} loading={busyId === item.id} style={styles.actionButton} />
              )}
              {item.status === 'confirmed' && (
                <Button title="Complete" onPress={() => handleComplete(item)} loading={busyId === item.id} style={styles.actionButton} />
              )}
              {item.status !== 'completed' && (
                <Button title="Cancel" variant="outline" onPress={() => handleCancel(item)} loading={busyId === item.id} style={styles.actionButton} />
              )}
            </View>
          )}
        </View>
      )}
      ListEmptyComponent={<EmptyState icon="cube-outline" title="No orders" message={`No ${statusFilter} requests right now.`} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.sm,
  },
  chipRow: {
    marginBottom: spacing.sm,
  },
  toggle: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginRight: spacing.sm,
  },
  categoryPill: {
    flexShrink: 0,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  categoryPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  prescriptionPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.infoLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginTop: spacing.xs,
  },
  prescriptionPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.info,
  },
  patientName: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  detail: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    marginTop: 4,
  },
  notes: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  resultForm: {
    marginTop: spacing.md,
  },
  flagToggle: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
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
