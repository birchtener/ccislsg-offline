export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeofenceCheckResult {
  isWithinFence: boolean;
  distanceInMeters: number;
  formattedDistance: string;
}

export const TARGET_GEOFENCE: Coordinates = {
  latitude: 8.956116,
  longitude: 125.597121,
};

export const DEFAULT_RADIUS_METERS = 400;

export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates,
): number {
  const EARTH_RADIUS_METERS = 6371000;

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const lat1Rad = toRadians(coord1.latitude);
  const lat2Rad = toRadians(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
}

export function checkGeofence(
  userCoord: Coordinates,
  targetCoord: Coordinates = TARGET_GEOFENCE,
  radiusMeters: number = DEFAULT_RADIUS_METERS,
): GeofenceCheckResult {
  const distance = 10; //calculateDistance(userCoord, targetCoord);
  const isWithin = true; //distance <= radiusMeters;

  return {
    isWithinFence: isWithin,
    distanceInMeters: distance,
    formattedDistance:
      distance >= 1000
        ? `${(distance / 1000).toFixed(2)} km`
        : `${distance.toFixed(0)} meters`,
  };
}
