import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, orderBy, startAt, endAt, getDocs } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import Input from '../../components/Input';
import SpecialtyChip from '../../components/SpecialtyChip';
import DoctorCard from '../../components/DoctorCard';
import EmptyState from '../../components/EmptyState';
import RadarPulse from '../../components/RadarPulse';
import { useUserContext } from '../../context/UserProvider';
import { boundsForRadius, distanceKm, formatDistance } from '../../utils/geo';
import { attachRatingsToDoctors } from '../../utils/ratings';
import { isFavoriteDoctor, toggleFavoriteDoctor } from '../../utils/favorites';
import { colors, spacing, radii, fontSize, fontWeight } from '../../theme/tokens';
import { darkMapStyle, DEFAULT_MAP_CENTER } from '../../theme/mapStyle';

const NEARBY_RADIUS_KM = 50;

// Merges results from the (possibly several) geohash-bound range queries a
// "nearby" search needs, since Firestore can only bound a geohash prefix
// (a square-ish box), not a true circular radius — distanceKm below trims
// the box down to an accurate radius.
async function fetchDoctorsNear(lat, lng) {
  const bounds = boundsForRadius(lat, lng, NEARBY_RADIUS_KM);
  const usersRef = collection(firestore, 'users');
  const snapshots = await Promise.all(
    bounds.map(([start, end]) =>
      getDocs(
        query(
          usersRef,
          where('role', '==', 'doctor'),
          where('isVerified', '==', true),
          orderBy('geohash'),
          startAt(start),
          endAt(end)
        )
      )
    )
  );

  const byId = new Map();
  snapshots.forEach((snap) => {
    snap.docs.forEach((d) => {
      const data = d.data();
      if (!data.location) return;
      const km = distanceKm(lat, lng, data.location.lat, data.location.lng);
      if (km <= NEARBY_RADIUS_KM) byId.set(d.id, { id: d.id, ...data, distanceKm: km });
    });
  });

  return Array.from(byId.values()).sort((a, b) => a.distanceKm - b.distanceKm);
}

async function fetchAllVerifiedDoctors() {
  const q = query(collection(firestore, 'users'), where('role', '==', 'doctor'), where('isVerified', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export default function FindDoctorScreen({ navigation }) {
  const { t } = useTranslation();
  const { profile, updateProfile } = useUserContext();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [userLocation, setUserLocation] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      let granted = status === 'granted';
      if (!granted) {
        const req = await Location.requestForegroundPermissionsAsync();
        granted = req.status === 'granted';
      }

      if (granted) {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        const nearby = await fetchDoctorsNear(position.coords.latitude, position.coords.longitude);
        const list = nearby.length ? nearby : await fetchAllVerifiedDoctors();
        setDoctors(await attachRatingsToDoctors(list));
      } else {
        setDoctors(await attachRatingsToDoctors(await fetchAllVerifiedDoctors()));
      }
    } catch (err) {
      console.error('[FindDoctorScreen] load error:', err);
      const fallback = await fetchAllVerifiedDoctors().catch(() => []);
      setDoctors(await attachRatingsToDoctors(fallback));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const specialties = useMemo(() => {
    const unique = new Set(doctors.map((d) => d.specialty).filter(Boolean));
    return ['All', ...Array.from(unique)];
  }, [doctors]);

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSpecialty = specialty === 'All' || d.specialty === specialty;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q || d.displayName?.toLowerCase().includes(q) || d.specialty?.toLowerCase().includes(q);
      const matchesFavorite = !favoritesOnly || isFavoriteDoctor(profile, d.id);
      return matchesSpecialty && matchesSearch && matchesFavorite;
    });
  }, [doctors, specialty, search, favoritesOnly, profile]);

  const handleToggleFavorite = (doctorId) => toggleFavoriteDoctor(profile, updateProfile, doctorId);

  const mappable = useMemo(
    () => filtered.filter((d) => d.location?.lat != null && d.location?.lng != null),
    [filtered]
  );

  const selectedDoctor = useMemo(
    () => mappable.find((d) => d.id === selectedDoctorId) ?? null,
    [mappable, selectedDoctorId]
  );

  // Computed once per map mount (used as initialRegion, not a controlled
  // region) so the patient can freely pan/zoom without it snapping back.
  const initialMapRegion = useMemo(() => {
    const center = userLocation
      ? { latitude: userLocation.lat, longitude: userLocation.lng }
      : mappable[0]
      ? { latitude: mappable[0].location.lat, longitude: mappable[0].location.lng }
      : DEFAULT_MAP_CENTER;
    const delta = userLocation || mappable[0] ? 0.5 : 5;
    return { ...center, latitudeDelta: delta, longitudeDelta: delta };
  }, [userLocation, mappable]);

  const toggleViewMode = () => {
    setSelectedDoctorId(null);
    setViewMode((prev) => (prev === 'list' ? 'map' : 'list'));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <RadarPulse color={colors.primary} size={110} />
        <Text style={styles.loadingLabel}>{t('findDoctor.loadingNearby')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{t('findDoctor.title')}</Text>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={toggleViewMode}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name={viewMode === 'list' ? 'map-outline' : 'list-outline'} size={16} color={colors.primary} />
            <Text style={styles.viewToggleLabel}>
              {viewMode === 'list' ? t('findDoctor.mapView') : t('findDoctor.listView')}
            </Text>
          </TouchableOpacity>
        </View>
        <Input placeholder={t('findDoctor.searchPlaceholder')} value={search} onChangeText={setSearch} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={specialties}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <SpecialtyChip
              label={item === 'All' ? t('findDoctor.all') : item}
              selected={item === specialty}
              onPress={() => setSpecialty(item)}
            />
          )}
          style={styles.chipRow}
        />
        <SpecialtyChip
          label={t('findDoctor.favoritesOnly')}
          selected={favoritesOnly}
          onPress={() => setFavoritesOnly((prev) => !prev)}
        />
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              distanceLabel={item.distanceKm != null ? formatDistance(item.distanceKm) : null}
              onPress={() => navigation.navigate('DoctorProfile', { doctorId: item.id })}
              isFavorite={isFavoriteDoctor(profile, item.id)}
              onToggleFavorite={() => handleToggleFavorite(item.id)}
            />
          )}
          ListEmptyComponent={
            <EmptyState icon="medkit-outline" title={t('findDoctor.emptyTitle')} message={t('findDoctor.emptyMessage')} />
          }
        />
      ) : mappable.length === 0 ? (
        <EmptyState icon="medkit-outline" title={t('findDoctor.emptyTitle')} message={t('findDoctor.emptyMessage')} />
      ) : (
        <View style={styles.mapWrap}>
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={initialMapRegion}
            customMapStyle={darkMapStyle}
            userInterfaceStyle="dark"
            showsUserLocation={!!userLocation}
            onPress={() => setSelectedDoctorId(null)}
          >
            {mappable.map((d) => (
              <Marker
                key={d.id}
                coordinate={{ latitude: d.location.lat, longitude: d.location.lng }}
                onPress={(e) => {
                  e.stopPropagation?.();
                  setSelectedDoctorId(d.id);
                }}
              >
                <View style={[styles.pin, d.id === selectedDoctorId && styles.pinSelected]}>
                  <Icon name="medkit" size={14} color={colors.onSecondary} />
                </View>
              </Marker>
            ))}
          </MapView>
          {selectedDoctor && (
            <View style={styles.mapCard}>
              <DoctorCard
                doctor={selectedDoctor}
                distanceLabel={selectedDoctor.distanceKm != null ? formatDistance(selectedDoctor.distanceKm) : null}
                onPress={() => navigation.navigate('DoctorProfile', { doctorId: selectedDoctor.id })}
                isFavorite={isFavoriteDoctor(profile, selectedDoctor.id)}
                onToggleFavorite={() => handleToggleFavorite(selectedDoctor.id)}
              />
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingLabel: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.inkMuted,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
  },
  viewToggleLabel: {
    marginLeft: 4,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  chipRow: {
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  mapWrap: {
    flex: 1,
  },
  pin: {
    width: 30,
    height: 30,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  pinSelected: {
    backgroundColor: colors.secondaryDark,
    borderColor: colors.primary,
  },
  mapCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
