import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { doc, getDoc } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import { useUserContext } from '../../context/UserProvider';
import DoctorCard from '../../components/DoctorCard';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { attachRatingsToDoctors } from '../../utils/ratings';
import { toggleFavoriteDoctor } from '../../utils/favorites';
import { colors, spacing } from '../../theme/tokens';
import { PATIENT_ROUTES } from '../../navigation/routes';

export default function FavoriteDoctorsScreen({ navigation }) {
  const { t } = useTranslation();
  const { profile, updateProfile } = useUserContext();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const ids = profile?.favoriteDoctorIds || [];
    if (ids.length === 0) {
      setDoctors([]);
      setLoading(false);
      return;
    }
    try {
      const snaps = await Promise.all(ids.map((id) => getDoc(doc(firestore, 'users', id))));
      const list = snaps.filter((s) => s.exists()).map((s) => ({ id: s.id, ...s.data() }));
      setDoctors(await attachRatingsToDoctors(list));
    } catch (err) {
      console.error('[FavoriteDoctorsScreen] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.favoriteDoctorIds]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleFavorite = async (doctorId) => {
    await toggleFavoriteDoctor(profile, updateProfile, doctorId);
    setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <DoctorCard
            doctor={item}
            isFavorite
            onToggleFavorite={() => handleToggleFavorite(item.id)}
            onPress={() =>
              navigation.navigate(PATIENT_ROUTES.FIND_DOCTOR_TAB, {
                screen: PATIENT_ROUTES.DOCTOR_PROFILE,
                params: { doctorId: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState icon="heart-outline" title={t('favoriteDoctors.emptyTitle')} message={t('favoriteDoctors.emptyMessage')} />
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
});
