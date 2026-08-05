// Google Maps JSON style tuned to Musawo's near-black/mint theme (see
// theme/tokens.js). Applies via MapView's `customMapStyle` prop — takes
// effect on Android (and iOS only if PROVIDER_GOOGLE is forced there).
// For plain Apple Maps on iOS, pair with MapView's `userInterfaceStyle="dark"`
// prop instead, which forces the native dark map without a custom style.
export const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0d1512' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8fa79d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#070b09' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1a2622' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#161f1b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d1512' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e2b26' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#5b6e67' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1e1c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#2dd9e8' }] },
];

// Fallback map center when neither the patient's device location nor any
// doctor's saved location is available yet — Kampala, Uganda.
export const DEFAULT_MAP_CENTER = { latitude: 0.3476, longitude: 32.5825 };
