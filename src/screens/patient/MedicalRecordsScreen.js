import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';

const TYPE_ICON = { note: 'document-text-outline', prescription: 'medkit-outline', lab_result: 'flask-outline', diagnosis: 'pulse-outline' };

export default function MedicalRecordsScreen() {
  const { user, profile } = useUserContext();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderingId, setOrderingId] = useState(null);
  // Session-local only — not persisted/re-checked against serviceOrders on
  // reload, so this resets on next visit even though the real order still
  // exists. Good enough to prevent an accidental double-tap in one sitting;
  // a real "already ordered" badge would need querying serviceOrders by
  // itemId, deferred for now.
  const [orderedIds, setOrderedIds] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // IMPORTANT: always scoped to the logged-in patient — an earlier
        // version of this screen fetched the entire collection unfiltered.
        const q = query(
          collection(firestore, 'medicalRecords'),
          where('patientId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('[MedicalRecordsScreen] fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleOrderDelivery = (record) => {
    showAlert('Order for delivery', `Request delivery of ${record.medicationName || record.title}? Payment is collected on delivery.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request delivery',
        onPress: async () => {
          setOrderingId(record.id);
          try {
            // source:'prescription' + price:0 — firestore.rules cross-checks
            // this itemId against a real medicalRecords doc owned by this
            // patient with type=='prescription', so this can't be used to
            // order an arbitrary/fabricated item the way an open catalog
            // could. Payment-on-delivery, same manual-reconciliation model
            // as the rest of this app.
            await addDoc(collection(firestore, 'serviceOrders'), {
              category: 'pharmacy',
              source: 'prescription',
              itemId: record.id,
              itemName: record.medicationName || record.title,
              price: 0,
              patientId: user.uid,
              patientName: profile?.displayName || 'Patient',
              fulfillmentMethod: 'home',
              preferredDate: '',
              notes: record.content || '',
              status: 'requested',
              assignedDoctorId: null,
              assignedDoctorName: null,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            setOrderedIds((prev) => new Set(prev).add(record.id));
          } catch (err) {
            console.error('[MedicalRecordsScreen] order delivery error:', err);
            showAlert('Could not send request', 'Please try again.');
          } finally {
            setOrderingId(null);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Medical Records</Text>}
        renderItem={({ item, index }) => (
          <View style={styles.timelineRow}>
            <View style={styles.rail}>
              <View style={[styles.railLine, index === 0 && styles.railLineHidden]} />
              <View style={styles.iconCircle}>
                <Icon name={TYPE_ICON[item.type] ?? 'document-outline'} size={20} color={colors.primary} />
              </View>
              <View style={[styles.railLine, index === records.length - 1 && styles.railLineHidden]} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.recordTitle}>{item.title || 'Medical record'}</Text>
              {!!item.content && <Text style={styles.recordContent} numberOfLines={3}>{item.content}</Text>}
              {item.type === 'prescription' &&
                (orderedIds.has(item.id) ? (
                  <Text style={styles.orderedText}>Delivery requested</Text>
                ) : (
                  <TouchableOpacity style={styles.orderButton} onPress={() => handleOrderDelivery(item)} disabled={orderingId === item.id}>
                    <Icon name="bicycle-outline" size={14} color={colors.primary} />
                    <Text style={styles.orderButtonText}>{orderingId === item.id ? 'Sending...' : 'Order for delivery'}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No records yet"
            message="Notes and prescriptions from your consultations will appear here."
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
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  // Timeline layout: a rail column (connecting line + icon) beside the
  // record's text, rather than each entry looking like a separate floating
  // card — reinforces that this is a single chronological sequence.
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
  cardBody: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: spacing.sm,
  },
  recordTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  recordContent: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  orderButtonText: {
    marginLeft: 4,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  orderedText: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.success,
  },
});
