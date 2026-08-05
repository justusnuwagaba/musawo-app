import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import Icon from '@expo/vector-icons/Ionicons';
import { collection, query, where, orderBy, startAt, endAt, onSnapshot } from 'firebase/firestore';
import { db as firestore } from '../../config/firebaseConfig';
import Input from '../../components/Input';
import SpecialtyChip from '../../components/SpecialtyChip';
import DoctorCard from '../../components/DoctorCard';
import EmptyState from '../../components/EmptyState';
import RadarPulse from '../../components/RadarPulse';
import { useUserContext } from '../../context/UserProvider';
import { boundsForRadius, distanceKm, formatDistance } from '../../utils/geo';
import { getDoctorRatingSummary } from '../../utils/ratings';
import { isFavoriteDoctor, toggleFavoriteDoctor } from '../../utils/favorites';
import { colors, spacing, radii, fontSize, fontWeight, shadow } from '../../theme/tokens';
import { darkMapStyle, DEFAULT_MAP_CENTER } from '../../theme/mapStyle';

const NEARBY_RADIUS_KM = 50;
const USERS_ROLE_DOCTOR_VERIFIED = [where('role', '==', 'doctor'), where('isVerified', '==', true)];

export default function FindDoctorScreen({ navigation }) {
  const { t } = useTranslation();
  const { profile, updateProfile } = useUserContext();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('All');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list' — map first, matching a live find-nearby pattern
  const [userLocation, setUserLocation] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);

  const mapRef = useRef(null);
  const hasFitRef = useRef(false); // only auto-fit once per map-mode session, not on every live update
  // Per-doctor rating cache: attachRatingsToDoctors-equivalent, but memoized
  // across snapshot ticks — without this, every live update (e.g. one
  // doctor's isOnline flag flipping) would re-run a `reviews` aggregation
  // query for every doctor in range, not just the one that changed.
  const ratingsCacheRef = useRef(new Map());

  async function withCachedRatings(list) {
    return Promise.all(
      list.map(async (d) => {
        let ratingFields = ratingsCacheRef.current.get(d.id);
        if (!ratingFields) {
          const summary = await getDoctorRatingSummary(d.id);
          ratingFields = { rating: summary.average, ratingCount: summary.count };
          ratingsCacheRef.current.set(d.id, ratingFields);
        }
        return { ...d, ...ratingFields };
      })
    );
  }

  // Live nearby search + fallbacks, all via onSnapshot rather than a
  // one-time getDocs — a doctor going online/offline or a new verified
  // doctor appearing updates this screen without a manual refresh.
  useEffect(() => {
    let cancelled = false;
    let unsubscribers = [];

    function startAllVerifiedListener() {
      const q = query(collection(firestore, 'users'), ...USERS_ROLE_DOCTOR_VERIFIED);
      const unsub = onSnapshot(
        q,
        async (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const withRatings = await withCachedRatings(list);
          if (cancelled) return;
          setDoctors(withRatings);
          setLoading(false);
          setRefreshing(false);
        },
        (err) => {
          console.error('[FindDoctorScreen] all-verified listener error:', err);
          if (!cancelled) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      );
      unsubscribers.push(unsub);
      return unsub;
    }

    // Merges live results from the (possibly several) geohash-bound range
    // listeners a "nearby" search needs, since Firestore can only bound a
    // geohash prefix (a square-ish box), not a true circular radius —
    // distanceKm below trims the box down to an accurate radius. If nothing
    // is live within range, falls back to a live all-verified listener so
    // the screen isn't empty — and tears that fallback back down the moment
    // a nearby doctor does show up.
    function startNearbyListeners(lat, lng) {
      const bounds = boundsForRadius(lat, lng, NEARBY_RADIUS_KM);
      const usersRef = collection(firestore, 'users');
      const byBound = new Map();
      let fallbackUnsub = null;

      const applyMerge = async () => {
        const merged = new Map();
        byBound.forEach((docsMap) => docsMap.forEach((data, id) => merged.set(id, data)));
        const list = Array.from(merged.values()).sort((a, b) => a.distanceKm - b.distanceKm);

        if (list.length === 0) {
          if (!fallbackUnsub) fallbackUnsub = startAllVerifiedListener();
          return;
        }
        if (fallbackUnsub) {
          fallbackUnsub();
          unsubscribers = unsubscribers.filter((u) => u !== fallbackUnsub);
          fallbackUnsub = null;
        }

        const withRatings = await withCachedRatings(list);
        if (cancelled) return;
        setDoctors(withRatings);
        setLoading(false);
        setRefreshing(false);
      };

      bounds.forEach(([start, end], i) => {
        const q = query(usersRef, ...USERS_ROLE_DOCTOR_VERIFIED, orderBy('geohash'), startAt(start), endAt(end));
        const unsub = onSnapshot(
          q,
          (snap) => {
            const docsMap = new Map();
            snap.docs.forEach((d) => {
              const data = d.data();
              if (!data.location) return;
              const km = distanceKm(lat, lng, data.location.lat, data.location.lng);
              if (km <= NEARBY_RADIUS_KM) docsMap.set(d.id, { id: d.id, ...data, distanceKm: km });
            });
            byBound.set(i, docsMap);
            applyMerge();
          },
          (err) => console.error('[FindDoctorScreen] nearby listener error:', err)
        );
        unsubscribers.push(unsub);
      });
    }

    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        let granted = status === 'granted';
        if (!granted) {
          const req = await Location.requestForegroundPermissionsAsync();
          granted = req.status === 'granted';
        }

        if (cancelled) return;

        if (granted) {
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (cancelled) return;
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          startNearbyListeners(position.coords.latitude, position.coords.longitude);
        } else {
          startAllVerifiedListener();
        }
      } catch (err) {
        console.error('[FindDoctorScreen] location error:', err);
        if (!cancelled) startAllVerifiedListener();
      }
    })();

    return () => {
      cancelled = true;
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [refreshKey]);

  const refresh = () => {
    setRefreshing(true);
    hasFitRef.current = false; // let the recenter also re-fit the camera once fresh data lands
    setRefreshKey((k) => k + 1);
  };

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

  // The bottom card is always visible in map mode (matches a standard
  // find-nearby map pattern) — defaults to the closest doctor until the
  // patient taps a specific pin, rather than showing nothing.
  const displayedDoctor = selectedDoctor ?? mappable[0] ?? null;

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

  // Auto-fit the camera to you + every nearby pin once per map-mode session
  // — not on every live update, which would yank the camera around under
  // the patient's thumb every time a doctor's doc changes.
  useEffect(() => {
    if (viewMode !== 'map') {
      hasFitRef.current = false;
      return;
    }
    if (hasFitRef.current || !mapRef.current) return;

    const coords = [];
    if (userLocation) coords.push({ latitude: userLocation.lat, longitude: userLocation.lng });
    mappable.forEach((d) => coords.push({ latitude: d.location.lat, longitude: d.location.lng }));
    if (coords.length < 2) return;

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 60, bottom: 220, left: 60 },
      animated: true,
    });
    hasFitRef.current = true;
  }, [viewMode, userLocation, mappable]);

  const handleRecenter = () => {
    hasFitRef.current = false;
    refresh();
  };

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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
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
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={initialMapRegion}
            customMapStyle={darkMapStyle}
            userInterfaceStyle="dark"
            onPress={() => setSelectedDoctorId(null)}
          >
            {userLocation && (
              <Marker
                coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
                anchor={{ x: 0.5, y: 0.5 }}
                zIndex={2}
              >
                <View style={styles.youGlow}>
                  <View style={styles.youDot} />
                </View>
              </Marker>
            )}
            {mappable.map((d) => {
              const isSelected = d.id === selectedDoctorId;
              return (
                <Marker
                  key={d.id}
                  coordinate={{ latitude: d.location.lat, longitude: d.location.lng }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setSelectedDoctorId(d.id);
                  }}
                >
                  <View style={[styles.pin, isSelected && styles.pinSelected, !d.isOnline && !isSelected && styles.pinOffline]}>
                    <View style={styles.pinIconWrap}>
                      <Icon name="medkit" size={12} color={isSelected ? colors.onSecondary : colors.secondary} />
                    </View>
                  </View>
                </Marker>
              );
            })}
          </MapView>

          <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="navigate-outline" size={18} color={colors.ink} />
          </TouchableOpacity>

          {displayedDoctor && (
            <View style={styles.mapCard}>
              <DoctorCard
                doctor={displayedDoctor}
                distanceLabel={displayedDoctor.distanceKm != null ? formatDistance(displayedDoctor.distanceKm) : null}
                onPress={() => navigation.navigate('DoctorProfile', { doctorId: displayedDoctor.id })}
                isFavorite={isFavoriteDoctor(profile, displayedDoctor.id)}
                onToggleFavorite={() => handleToggleFavorite(displayedDoctor.id)}
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
  // Teardrop map-pin shape: three rounded corners + one square corner,
  // rotated -45° so the square corner becomes the downward-pointing tip.
  // The icon inside counter-rotates +45° to stay upright.
  pin: {
    width: 26,
    height: 26,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderBottomRightRadius: 13,
    borderBottomLeftRadius: 0,
    backgroundColor: colors.secondaryMuted,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
  },
  // Verified but not currently online — still shown (still bookable for a
  // scheduled appointment) but visually de-emphasized vs. a doctor who'd
  // actually respond to an instant consult right now.
  pinOffline: {
    opacity: 0.45,
  },
  pinIconWrap: {
    transform: [{ rotate: '45deg' }],
  },
  // "You" marker — green (self), per theme/tokens.js's documented
  // green=self/cyan=other-party convention (doctor pins above stay cyan).
  youGlow: {
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  youDot: {
    width: 12,
    height: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
  },
  recenterButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  mapCard: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
  },
});
