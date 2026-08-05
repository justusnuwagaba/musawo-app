import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';

const FLAG_COLOR = { normal: colors.success, abnormal: colors.danger };
// success is a bright neon green under the dark re-theme (needs dark text),
// while danger stays a mid-tone red (white text still reads fine on it) —
// so, unlike the background map above, the text color isn't uniform.
const FLAG_TEXT_COLOR = { normal: colors.onPrimary, abnormal: colors.white };

export default function LabResultsScreen() {
  const { user } = useUserContext();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(collection(firestore, 'labResults'), where('patientId', '==', user.uid));
        const snap = await getDocs(q);
        setResults(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('[LabResultsScreen] fetch error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.testName}>{item.testName}</Text>
              {!!item.flag && (
                <View style={[styles.flagBadge, { backgroundColor: FLAG_COLOR[item.flag] ?? colors.inkFaint }]}>
                  <Text style={[styles.flagText, { color: FLAG_TEXT_COLOR[item.flag] ?? colors.ink }]}>{item.flag}</Text>
                </View>
              )}
            </View>
            <Text style={styles.result}>{item.result} {item.units}</Text>
            {!!item.resultDate && <Text style={styles.date}>{item.resultDate}</Text>}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="flask-outline" title="No lab results yet" message="Results from tests ordered by your doctor will show up here." />
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
  testName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  flagBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  flagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'capitalize',
  },
  result: {
    fontSize: fontSize.sm,
    color: colors.inkMuted,
    marginTop: 4,
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.inkFaint,
    marginTop: 4,
  },
});
