import { geohashForLocation, geohashQueryBounds, distanceBetween } from 'geofire-common';

/** Computes the geohash to store on a doctor's profile doc for range queries. */
export function computeGeohash(lat, lng) {
  return geohashForLocation([lat, lng]);
}

/**
 * Returns the geohash range bounds to query around a center point within
 * radiusKm. Run one Firestore query per bound, then filter client-side with
 * distanceKm (Firestore range queries can only bound the geohash prefix, not
 * the true radius).
 */
export function boundsForRadius(centerLat, centerLng, radiusKm) {
  return geohashQueryBounds([centerLat, centerLng], radiusKm * 1000);
}

export function distanceKm(lat1, lng1, lat2, lng2) {
  return distanceBetween([lat1, lng1], [lat2, lng2]);
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}
