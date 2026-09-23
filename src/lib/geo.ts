/** Haversine distance + friendly distance text. */

export interface LatLon {
  lat: number;
  lng: number;
}

export function haversineKm(a: LatLon, b: LatLon): number {
  const R = 6371;
  const toRad = (x: number): number => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function distanceText(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
