import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { showAlert } from '../../components/AppAlert';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

/**
 * Reusable template screen for dynamic services.
 * @param {string} title - The title of the service (e.g., 'Vaccination').
 * @param {string} collectionName - The Firestore collection to fetch data from (e.g., 'vaccination').
 * @param {string} iconName - The Ionicons icon for the service.
 */
export default function ServiceScreenTemplate({ title, collectionName, iconName }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <LoadingSpinner label={`Loading ${title}...`} />;

  if (error) {
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
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => showAlert(item.name, item.description || 'More details coming soon.')}
          >
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
