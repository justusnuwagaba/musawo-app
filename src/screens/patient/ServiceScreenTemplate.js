import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, getDocs, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import SegmentedToggle from '../../components/SegmentedToggle';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';
import { PATIENT_ROUTES } from '../../navigation/routes';

const ORDER_STATUS_STYLE = {
  requested: { color: colors.warning, bg: colors.warningLight, label: 'Requested' },
  confirmed: { color: colors.info, bg: colors.infoLight, label: 'Confirmed' },
  completed: { color: colors.success, bg: colors.successLight, label: 'Completed' },
  cancelled: { color: colors.danger, bg: colors.dangerLight, label: 'Cancelled' },
};

/**
 * Reusable template screen for dynamic services — both the catalog browse
 * (existing) and, now, a real "My Orders" view + a real booking flow
 * (previously tapping a catalog item just showed a "coming soon" alert).
 * @param {string} title - The title of the service (e.g., 'Vaccination').
 * @param {string} collectionName - The Firestore catalog collection to fetch
 *   from (e.g., 'vaccination') — also used as `category` on serviceOrders.
 * @param {string} iconName - The Ionicons icon for the service.
 */
export default function ServiceScreenTemplate({ title, collectionName, iconName, navigation }) {
  const { user } = useUserContext();
  const [view, setView] = useState('browse'); // 'browse' | 'orders'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(firestore, collectionName), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(`[ServiceScreenTemplate] fetch ${collectionName} error:`, err);
      setError(`Failed to load ${title} options. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [collectionName, title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live, scoped to this patient + this category. Sorted client-side rather
  // than via orderBy in the query — a compound where(patientId)+
  // where(category)+orderBy(createdAt) query needs a composite index that
  // doesn't exist yet, and this list is small enough that client sort is fine.
  useEffect(() => {
    if (!user) return;
    const q = query(collection(firestore, 'serviceOrders'), where('patientId', '==', user.uid), where('category', '==', collectionName));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        setOrders(items);
        setOrdersLoading(false);
      },
      (err) => {
        console.error(`[ServiceScreenTemplate] orders fetch error:`, err);
        setOrdersLoading(false);
      }
    );
    return unsubscribe;
  }, [user, collectionName]);

  const handleItemPress = (item) => {
    navigation.navigate(PATIENT_ROUTES.SERVICE_BOOKING, { item, category: collectionName, categoryLabel: title });
  };

  if (view === 'browse' && loading) return <LoadingSpinner label={`Loading ${title}...`} />;

  if (view === 'browse' && error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle-outline" size={40} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SegmentedToggle
        style={styles.toggle}
        value={view}
        onChange={setView}
        options={[
          { value: 'browse', label: 'Browse' },
          { value: 'orders', label: 'My Orders' },
        ]}
      />

      {view === 'browse' ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleItemPress(item)}>
              <View style={styles.cardIcon}>
                <Icon name={item.icon || iconName} size={26} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {!!item.description && <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>}
                {!!item.price && <Text style={styles.cardPrice}>From UGX {item.price.toLocaleString?.() ?? item.price}</Text>}
              </View>
              <Icon name="chevron-forward" size={20} color={colors.inkFaint} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState icon={iconName} title={`No ${title} services yet`} message="Check back soon — we're adding more services regularly." />
          }
        />
      ) : ordersLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const statusStyle = ORDER_STATUS_STYLE[item.status] ?? ORDER_STATUS_STYLE.requested;
            return (
              <View style={styles.orderCard}>
                <View style={styles.orderTopRow}>
                  <Text style={styles.orderName} numberOfLines={1}>{item.itemName}</Text>
                  <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusPillText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                  </View>
                </View>
                {!!item.price && <Text style={styles.orderMeta}>UGX {item.price.toLocaleString?.() ?? item.price}</Text>}
                <Text style={styles.orderMeta}>
                  {item.fulfillmentMethod === 'home' ? 'Home' : 'Facility visit'}
                  {item.preferredDate ? ` · ${item.preferredDate}` : ''}
                </Text>
                {!!item.notes && <Text style={styles.orderNotes}>"{item.notes}"</Text>}
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState icon="receipt-outline" title="No orders yet" message={`Requests you make for ${title} will show up here.`} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toggle: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  listContent: {
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
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  cardDescription: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    marginTop: 2,
  },
  cardPrice: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.success,
    marginTop: spacing.xs,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
    marginRight: spacing.sm,
  },
  statusPill: {
    flexShrink: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  statusPillText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  orderMeta: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 2,
  },
  orderNotes: {
    fontSize: fontSize.xs,
    color: colors.inkMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    color: colors.onPrimary,
    fontWeight: fontWeight.bold,
  },
});
