import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

const TYPE_ICON = { note: 'document-text-outline', prescription: 'medkit-outline', lab_result: 'flask-outline', diagnosis: 'pulse-outline' };

export default function MedicalRecordsScreen() {
  const { user } = useUserContext();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Medical Records</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Icon name={TYPE_ICON[item.type] ?? 'document-outline'} size={20} color={colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.recordTitle}>{item.title || 'Medical record'}</Text>
              {!!item.content && <Text style={styles.recordContent} numberOfLines={3}>{item.content}</Text>}
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
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardBody: {
    flex: 1,
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
});
