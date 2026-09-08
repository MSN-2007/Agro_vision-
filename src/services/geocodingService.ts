import { LatLng, Field } from '../types/agro';

export interface MapLandmark {
  id: string;
  name: string;
  category: 'landmark' | 'town' | 'village' | 'water' | 'road' | 'field' | 'coords' | 'market';
  address: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  isField?: boolean;
  fieldId?: string;
}

// Pre-indexed key agricultural hubs, mandi markets, irrigation canals & landmarks
const CURATED_AGRO_LANDMARKS: Omit<MapLandmark, 'distanceKm'>[] = [
  // Doddaballapur & Bengaluru Rural agro-belt (Default Farm 1)
  {
    id: 'cur-dodd-01',
    name: 'Doddaballapura APMC Krishi Mandi',
    category: 'market',
    address: 'APMC Yard, Doddaballapura, Bengaluru Rural, Karnataka',
    lat: 13.2890,
    lng: 77.5450
  },
  {
    id: 'cur-dodd-02',
    name: 'Doddaballapura Lake & Watershed',
    category: 'water',
    address: 'Major Irrigation Tank, Doddaballapura Taluk, Karnataka',
    lat: 13.2950,
    lng: 77.5420
  },
  {
    id: 'cur-dodd-03',
    name: 'Tubagere Agricultural Research Station',
    category: 'landmark',
    address: 'Tubagere Hobli, Doddaballapura, Karnataka',
    lat: 13.3420,
    lng: 77.5890
  },
  {
    id: 'cur-dodd-04',
    name: 'Nandi Hills Agro-Weather Station',
    category: 'landmark',
    address: 'Nandi Hills Plateau, Chikkaballapur District, Karnataka',
    lat: 13.3702,
    lng: 77.6835
  },
  {
    id: 'cur-dodd-05',
    name: 'Ghati Subramanya Rural Farming Belt',
    category: 'village',
    address: 'Tubagere Hobli, Doddaballapura, Karnataka',
    lat: 13.3980,
    lng: 77.5120
  },

  // Nashik & Dindori agro-belt (Sahyadri Farm 2)
  {
    id: 'cur-nsk-01',
    name: 'Nashik Agriculture Produce Market (APMC)',
    category: 'market',
    address: 'Panchavati Mandi, Nashik, Maharashtra',
    lat: 19.9880,
    lng: 73.8050
  },
  {
    id: 'cur-nsk-02',
    name: 'Dindori Grape & Onion Mandi',
    category: 'market',
    address: 'Main Market Road, Dindori, Nashik, Maharashtra',
    lat: 20.1980,
    lng: 73.8340
  },
  {
    id: 'cur-nsk-03',
    name: 'Gangapur Dam & Left Bank Irrigation Canal',
    category: 'water',
    address: 'Godavari River Irrigation System, Nashik, Maharashtra',
    lat: 20.0210,
    lng: 73.6840
  },
  {
    id: 'cur-nsk-04',
    name: 'Niphad Krishi Vigyan Kendra (KVK)',
    category: 'landmark',
    address: 'Agricultural Research Station, Niphad, Nashik, Maharashtra',
    lat: 20.0820,
    lng: 74.1120
  },
  {
    id: 'cur-nsk-05',
    name: 'Pimpalgaon Baswant Tomato Market',
    category: 'market',
    address: 'National Highway 3, Pimpalgaon Baswant, Maharashtra',
    lat: 20.1740,
    lng: 73.9850
  }
];

/**
 * Calculates Great-Circle distance between two coordinates in Kilometers (Haversine formula)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Parses user input to detect decimal coordinates (e.g., "13.2985, 77.5350" or "13.2985 77.5350")
 */
export function parseCoordinates(query: string): MapLandmark | null {
  const clean = query.trim();
  // Regex to match "lat, lng" or "lat lng" (with optional +/- signs and decimals)
  const regex = /^\s*([+-]?\d{1,2}(?:\.\d+)?)\s*[, ]\s*([+-]?\d{1,3}(?:\.\d+)?)\s*$/;
  const match = clean.match(regex);

  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const latStr = lat >= 0 ? `${lat.toFixed(5)}° N` : `${(-lat).toFixed(5)}° S`;
      const lngStr = lng >= 0 ? `${lng.toFixed(5)}° E` : `${(-lng).toFixed(5)}° W`;

      return {
        id: `coords-${lat.toFixed(5)}-${lng.toFixed(5)}`,
        name: `GPS Point: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        category: 'coords',
        address: `Custom Geodetic Coordinates (${latStr}, ${lngStr})`,
        lat,
        lng
      };
    }
  }

  return null;
}

/**
 * Searches places, landmarks, village names, existing fields, and exact coordinates.
 * Combines local high-speed indexing with OpenStreetMap Nominatim live geocoding.
 */
export async function searchPlacesAndLandmarks(
  query: string,
  farmCenter: LatLng,
  farmFields: Field[]
): Promise<MapLandmark[]> {
  const trimmed = query.trim().toLowerCase();
  const results: MapLandmark[] = [];

  // 1. Check if user typed coordinates directly
  const coordsMatch = parseCoordinates(query);
  if (coordsMatch) {
    coordsMatch.distanceKm = calculateDistanceKm(farmCenter.lat, farmCenter.lng, coordsMatch.lat, coordsMatch.lng);
    results.push(coordsMatch);
  }

  // 2. Search existing registered farm fields
  farmFields.forEach(f => {
    const match =
      f.name.toLowerCase().includes(trimmed) ||
      f.crop.toLowerCase().includes(trimmed) ||
      trimmed === 'field' ||
      trimmed === 'plot';

    if (match && f.center) {
      results.push({
        id: `field-${f.id}`,
        name: f.name,
        category: 'field',
        address: `${f.crop} • ${f.areaAcres} acres • Status: ${f.status}`,
        lat: f.center.lat,
        lng: f.center.lng,
        isField: true,
        fieldId: f.id,
        distanceKm: calculateDistanceKm(farmCenter.lat, farmCenter.lng, f.center.lat, f.center.lng)
      });
    }
  });

  // 3. Search curated agricultural landmarks
  CURATED_AGRO_LANDMARKS.forEach(item => {
    const match =
      item.name.toLowerCase().includes(trimmed) ||
      item.address.toLowerCase().includes(trimmed);

    if (match && !results.some(r => r.id === item.id)) {
      results.push({
        ...item,
        distanceKm: calculateDistanceKm(farmCenter.lat, farmCenter.lng, item.lat, item.lng)
      });
    }
  });

  // 4. Live OpenStreetMap Nominatim Search (if query has at least 3 characters)
  if (trimmed.length >= 3 && !coordsMatch) {
    try {
      // Prioritize locations near farm center using viewbox
      const delta = 1.5; // ~150km box around farm
      const viewbox = `${farmCenter.lng - delta},${farmCenter.lat + delta},${farmCenter.lng + delta},${farmCenter.lat - delta}`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&viewbox=${viewbox}&bounded=0&addressdetails=1&limit=6`;

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json'
        }
      });

      if (res.ok) {
        const osmData = await res.json();
        if (Array.isArray(osmData)) {
          osmData.forEach((item: any) => {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            if (isNaN(lat) || isNaN(lng)) return;

            const addr = item.address || {};
            const category: MapLandmark['category'] =
              item.type === 'village' || item.type === 'hamlet'
                ? 'village'
                : item.type === 'town' || item.type === 'city'
                ? 'town'
                : item.class === 'waterway' || item.class === 'water' || item.type === 'dam'
                ? 'water'
                : item.class === 'highway'
                ? 'road'
                : 'landmark';

            const placeTitle = item.name || (item.display_name ? item.display_name.split(',')[0] : 'Landmark');
            const regionDetails = [
              addr.suburb || addr.village || addr.town || addr.city,
              addr.county || addr.district || addr.state_district,
              addr.state
            ]
              .filter(Boolean)
              .join(', ');

            if (!results.some(r => Math.abs(r.lat - lat) < 0.0005 && Math.abs(r.lng - lng) < 0.0005)) {
              results.push({
                id: `osm-${item.place_id || Math.random()}`,
                name: placeTitle,
                category,
                address: regionDetails || item.display_name || 'Mapped Location',
                lat,
                lng,
                distanceKm: calculateDistanceKm(farmCenter.lat, farmCenter.lng, lat, lng)
              });
            }
          });
        }
      }
    } catch {
      // Gracefully fall back to local results if external network query fails
    }
  }

  // Sort: Exact coords first, then fields, then closest distance
  return results.sort((a, b) => {
    if (a.category === 'coords') return -1;
    if (b.category === 'coords') return 1;
    if (a.isField && !b.isField) return -1;
    if (!a.isField && b.isField) return 1;
    return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
  });
}

/**
 * Reverse geocodes a map-clicked point to discover nearby landmarks & address
 */
export async function reverseGeocodePoint(lat: number, lng: number): Promise<MapLandmark> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const title =
        data.name ||
        addr.village ||
        addr.suburb ||
        addr.town ||
        addr.hamlet ||
        addr.county ||
        'Inspected Point';

      const hierarchy = [
        addr.road,
        addr.village || addr.suburb || addr.town,
        addr.county || addr.district || addr.state_district,
        addr.state
      ]
        .filter(Boolean)
        .join(', ');

      return {
        id: `rev-${lat.toFixed(5)}-${lng.toFixed(5)}`,
        name: title,
        category: 'landmark',
        address: hierarchy || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng
      };
    }
  } catch {
    // Ignore fetch error
  }

  return {
    id: `rev-${lat.toFixed(5)}-${lng.toFixed(5)}`,
    name: `Location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    category: 'coords',
    address: `Map Point (${lat >= 0 ? `${lat.toFixed(5)}°N` : `${(-lat).toFixed(5)}°S`}, ${lng >= 0 ? `${lng.toFixed(5)}°E` : `${(-lng).toFixed(5)}°W`})`,
    lat,
    lng
  };
}
