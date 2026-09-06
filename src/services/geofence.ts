import { LatLng, Field } from '../types/agro';

/**
 * Ray-casting algorithm for Point in Polygon detection.
 * Determines if point is strictly or on boundary of polygon.
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (!polygon || polygon.length < 3) return false;

  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate polygon area in acres using spherical polygon approximation
 */
export function calculatePolygonAreaAcres(points: LatLng[]): number {
  if (points.length < 3) return 0;
  
  // Approximate conversion at tropical latitude (~13 deg N)
  // 1 deg lat ~= 111,000 meters
  // 1 deg lng ~= 111,000 * cos(lat) meters
  const avgLatRad = (points.reduce((acc, p) => acc + p.lat, 0) / points.length) * (Math.PI / 180);
  const metersPerDegreeLat = 110900;
  const metersPerDegreeLng = 111320 * Math.cos(avgLatRad);

  let areaM2 = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const xi = points[i].lng * metersPerDegreeLng;
    const yi = points[i].lat * metersPerDegreeLat;
    const xj = points[j].lng * metersPerDegreeLng;
    const yj = points[j].lat * metersPerDegreeLat;
    areaM2 += (xi * yj) - (xj * yi);
  }
  areaM2 = Math.abs(areaM2) / 2;

  // 1 acre = 4046.86 square meters
  const acres = areaM2 / 4046.86;
  return Math.round(acres * 10) / 10;
}

/**
 * Given a GPS coordinate and a list of fields, identify which field contains the GPS coordinate.
 */
export function findContainingField(gps: LatLng, fields: Field[]): Field | null {
  for (const field of fields) {
    if (isPointInPolygon(gps, field.boundary)) {
      return field;
    }
  }
  return null;
}

/**
 * Distance in meters between two lat/lng points (Haversine formula)
 */
export function calculateDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (p1.lat * Math.PI) / 180;
  const phi2 = (p2.lat * Math.PI) / 180;
  const deltaPhi = ((p2.lat - p1.lat) * Math.PI) / 180;
  const deltaLambda = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
