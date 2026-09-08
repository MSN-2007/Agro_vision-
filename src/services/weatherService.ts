import { FieldWeather, HourlyWeatherPoint, DailyWeatherForecast } from '../types/agro';

interface CacheEntry {
  data: FieldWeather;
  timestamp: number;
}

const WEATHER_CACHE: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const DEFAULT_OWM_KEYS = [
  '659e3216ae3cb03306b371693901e9a6',
  '2e6f5c9cd10bea233a70b72066799c11'
];

export function getStoredWeatherKeys(): string[] {
  try {
    const custom = localStorage.getItem('agro_owm_api_keys');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Ignore local storage parse error
  }
  return DEFAULT_OWM_KEYS;
}

export function saveStoredWeatherKeys(keys: string[]): void {
  localStorage.setItem('agro_owm_api_keys', JSON.stringify(keys));
}

/**
 * Convert wind degrees to 16-point compass direction
 */
export function degToCompass(deg: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];
  const val = Math.round(deg / 22.5) % 16;
  return directions[val] || 'N';
}

/**
 * Translate WMO Weather Interpretation Code to human-readable condition
 */
export function wmoCodeToCondition(code: number): string {
  switch (code) {
    case 0:
      return 'Clear Sky';
    case 1:
      return 'Mainly Clear';
    case 2:
      return 'Partly Cloudy';
    case 3:
      return 'Overcast';
    case 45:
    case 48:
      return 'Foggy';
    case 51:
    case 53:
    case 55:
      return 'Light Drizzle';
    case 61:
      return 'Slight Rain';
    case 63:
      return 'Moderate Rain';
    case 65:
      return 'Heavy Rain';
    case 71:
    case 73:
    case 75:
      return 'Snow Fall';
    case 80:
    case 81:
    case 82:
      return 'Rain Showers';
    case 95:
      return 'Thunderstorm';
    case 96:
    case 99:
      return 'Thunderstorm with Hail';
    default:
      return 'Fair Conditions';
  }
}

/**
 * Evaluate agronomic foliar spray advisory based on real weather parameters
 */
export function evaluateSprayAdvisory(
  windKmh: number,
  rainProb: number,
  tempC: number
): { status: 'Optimal' | 'Caution' | 'Unsuitable'; reason: string } {
  if (rainProb >= 50) {
    return {
      status: 'Unsuitable',
      reason: `Rain probability is ${rainProb}%. High risk of chemical washoff. Wait for dry spell.`
    };
  }
  if (windKmh > 20) {
    return {
      status: 'Unsuitable',
      reason: `Wind speed is ${windKmh} km/h (above 20 km/h threshold). High droplet drift hazard.`
    };
  }
  if (tempC > 34) {
    return {
      status: 'Caution',
      reason: `High ambient temperature (${tempC}°C). Risk of rapid droplet evaporation; spray in early morning.`
    };
  }
  if (windKmh > 12 || rainProb >= 30) {
    return {
      status: 'Caution',
      reason: `Breeze at ${windKmh} km/h with ${rainProb}% rain chance. Monitor wind direction closely.`
    };
  }
  return {
    status: 'Optimal',
    reason: `Wind speed is calm (${windKmh} km/h) and rain probability is low (${rainProb}%). Ideal for foliar application.`
  };
}

/**
 * Attempt to fetch live weather from OpenWeatherMap using provided API keys
 */
async function fetchFromOpenWeatherMap(
  lat: number,
  lng: number,
  fieldId: string,
  fieldName: string
): Promise<FieldWeather | null> {
  const keys = getStoredWeatherKeys();

  for (const apiKey of keys) {
    try {
      const cleanKey = apiKey.trim().replace(/^[-*•]\s*/, '');
      if (!cleanKey) continue;

      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${cleanKey}&units=metric`;
      const currentRes = await fetch(currentUrl);

      if (!currentRes.ok) {
        continue; // Try next key if 401 (pending activation) or 429
      }

      const currentData = await currentRes.json();

      // Forecast for hourly & daily
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${cleanKey}&units=metric`;
      const forecastRes = await fetch(forecastUrl);
      const forecastData = forecastRes.ok ? await forecastRes.json() : null;

      const temp = Math.round(currentData.main?.temp ?? 25);
      const feelsLike = Math.round(currentData.main?.feels_like ?? temp);
      const tempMin = Math.round(currentData.main?.temp_min ?? temp - 3);
      const tempMax = Math.round(currentData.main?.temp_max ?? temp + 3);
      const humidity = Math.round(currentData.main?.humidity ?? 60);
      const pressureHpa = Math.round(currentData.main?.pressure ?? 1012);
      const windKmh = Math.round((currentData.wind?.speed ?? 0) * 3.6);
      const windGustsKmh = Math.round((currentData.wind?.gust ?? (currentData.wind?.speed || 0) * 1.3) * 3.6);
      const windDeg = currentData.wind?.deg ?? 0;
      const windCompass = degToCompass(windDeg);
      const cloudCoverPct = Math.round(currentData.clouds?.all ?? 20);
      const rainfallMm = Math.round((currentData.rain?.['1h'] ?? currentData.rain?.['3h'] ?? 0) * 10) / 10;
      const condition = currentData.weather?.[0]?.main || 'Clear';
      const rainProb = rainfallMm > 0 ? 80 : 15;

      const sunriseTime = currentData.sys?.sunrise
        ? new Date(currentData.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '06:00 AM';
      const sunsetTime = currentData.sys?.sunset
        ? new Date(currentData.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '06:30 PM';

      // Parse forecast points
      const hourlyForecast: HourlyWeatherPoint[] = [];
      const dailyForecast: DailyWeatherForecast[] = [];

      if (forecastData?.list && Array.isArray(forecastData.list)) {
        const list = forecastData.list;
        for (let i = 0; i < Math.min(list.length, 8); i++) {
          const item = list[i];
          const timeStr = item.dt_txt
            ? new Date(item.dt_txt).toLocaleTimeString([], { hour: 'numeric' })
            : `${i * 3}:00`;
          hourlyForecast.push({
            time: timeStr,
            temp: Math.round(item.main?.temp ?? temp),
            humidity: Math.round(item.main?.humidity ?? humidity),
            rainProb: Math.round((item.pop ?? 0) * 100),
            solarRadiation: 0
          });
        }

        // Daily aggregated items (every 8th item is roughly 24h)
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 0; i < list.length; i += 8) {
          const item = list[i];
          const dateObj = new Date(item.dt_txt || Date.now());
          dailyForecast.push({
            day: dailyForecast.length === 0 ? 'Today' : daysOfWeek[dateObj.getDay()] || 'Day',
            date: dateObj.toISOString().split('T')[0],
            tempMax: Math.round(item.main?.temp_max ?? temp + 2),
            tempMin: Math.round(item.main?.temp_min ?? temp - 3),
            condition: item.weather?.[0]?.main || 'Clear',
            rainProb: Math.round((item.pop ?? 0) * 100),
            windSpeed: Math.round((item.wind?.speed ?? 0) * 3.6)
          });
          if (dailyForecast.length >= 5) break;
        }
      }

      const sprayAdvisory = evaluateSprayAdvisory(windKmh, rainProb, temp);

      return {
        fieldId,
        fieldName,
        latitude: lat,
        longitude: lng,
        temperature: temp,
        feelsLike,
        tempMin,
        tempMax,
        condition,
        conditionCode: currentData.weather?.[0]?.id ?? 800,
        humidity,
        windKmh,
        windDirectionDeg: windDeg,
        windDirectionCompass: windCompass,
        windGustsKmh,
        pressureHpa,
        visibilityKm: Math.round((currentData.visibility ?? 10000) / 1000),
        cloudCoverPct,
        uvIndex: 5.5,
        rainProbability: rainProb,
        rainfallMm,
        sunriseTime,
        sunsetTime,
        solarRadiationWm2: null,
        sprayAdvisory,
        hourlyForecast,
        dailyForecast,
        lastUpdated: 'Just now',
        provider: 'OpenWeatherMap',
        isError: false
      };
    } catch {
      // Continue to next key or fallback
    }
  }

  return null;
}

/**
 * Fetch from Open-Meteo API using exact parcel coordinates
 */
async function fetchFromOpenMeteo(
  lat: number,
  lng: number,
  fieldId: string,
  fieldName: string
): Promise<FieldWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,direct_radiation&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,direct_radiation&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API returned status: ${response.status}`);
  }

  const json = await response.json();
  const current = json.current || {};
  const daily = json.daily || {};
  const hourly = json.hourly || {};

  const temp = Math.round(current.temperature_2m ?? 28);
  const feelsLike = Math.round(current.apparent_temperature ?? temp);
  const tempMax = Math.round(daily.temperature_2m_max?.[0] ?? temp + 3);
  const tempMin = Math.round(daily.temperature_2m_min?.[0] ?? temp - 5);
  const humidity = Math.round(current.relative_humidity_2m ?? 60);
  const windKmh = Math.round(current.wind_speed_10m ?? 10);
  const windGustsKmh = Math.round(current.wind_gusts_10m ?? windKmh * 1.3);
  const windDeg = current.wind_direction_10m ?? 0;
  const windCompass = degToCompass(windDeg);
  const pressureHpa = Math.round(current.surface_pressure ?? 1012);
  const cloudCoverPct = Math.round(current.cloud_cover ?? 30);
  const uvIndex = Math.round((current.uv_index ?? 5) * 10) / 10;
  const rainProb = Math.round(daily.precipitation_probability_max?.[0] ?? (current.rain > 0 ? 80 : 20));
  const rainfallMm = Math.round((current.precipitation ?? 0) * 10) / 10;
  const weatherCode = current.weather_code ?? 0;
  const condition = wmoCodeToCondition(weatherCode);

  const solarRadiationWm2 = current.direct_radiation !== undefined && current.direct_radiation !== null
    ? Math.round(current.direct_radiation)
    : null;

  const formatTime = (isoString?: string) => {
    if (!isoString) return '06:00 AM';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '06:00 AM';
    }
  };

  const sunriseTime = formatTime(daily.sunrise?.[0]);
  const sunsetTime = formatTime(daily.sunset?.[0]);

  const hourlyPoints: HourlyWeatherPoint[] = [];
  const hourlyTimes = hourly.time || [];
  const currentHourIndex = new Date().getHours();
  const startIndex = Math.max(0, Math.min(currentHourIndex, hourlyTimes.length - 12));

  for (let i = startIndex; i < Math.min(startIndex + 12, hourlyTimes.length); i++) {
    const t = hourlyTimes[i];
    const hourStr = t ? new Date(t).toLocaleTimeString([], { hour: 'numeric' }) : `${i}:00`;
    hourlyPoints.push({
      time: hourStr,
      temp: Math.round(hourly.temperature_2m?.[i] ?? temp),
      humidity: Math.round(hourly.relative_humidity_2m?.[i] ?? humidity),
      rainProb: Math.round(hourly.precipitation_probability?.[i] ?? rainProb),
      solarRadiation: Math.round(hourly.direct_radiation?.[i] ?? 0)
    });
  }

  const dailyForecast: DailyWeatherForecast[] = [];
  const dailyTimes = daily.time || [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < Math.min(dailyTimes.length, 5); i++) {
    const dateStr = dailyTimes[i];
    const dateObj = new Date(dateStr);
    const dayLabel = i === 0 ? 'Today' : daysOfWeek[dateObj.getDay()] || `Day ${i + 1}`;
    dailyForecast.push({
      day: dayLabel,
      date: dateStr,
      tempMax: Math.round(daily.temperature_2m_max?.[i] ?? temp + 2),
      tempMin: Math.round(daily.temperature_2m_min?.[i] ?? temp - 4),
      condition: wmoCodeToCondition(daily.weather_code?.[i] ?? 0),
      rainProb: Math.round(daily.precipitation_probability_max?.[i] ?? 20),
      windSpeed: Math.round(daily.wind_speed_10m_max?.[i] ?? windKmh)
    });
  }

  const sprayAdvisory = evaluateSprayAdvisory(windKmh, rainProb, temp);

  return {
    fieldId,
    fieldName,
    latitude: lat,
    longitude: lng,
    temperature: temp,
    feelsLike,
    tempMin,
    tempMax,
    condition,
    conditionCode: weatherCode,
    humidity,
    windKmh,
    windDirectionDeg: windDeg,
    windDirectionCompass: windCompass,
    windGustsKmh,
    pressureHpa,
    visibilityKm: 10,
    cloudCoverPct,
    uvIndex,
    rainProbability: rainProb,
    rainfallMm,
    sunriseTime,
    sunsetTime,
    solarRadiationWm2,
    sprayAdvisory,
    hourlyForecast: hourlyPoints,
    dailyForecast,
    lastUpdated: 'Just now',
    provider: 'OpenWeatherMap (Fallback: Open-Meteo)',
    isError: false
  };
}

/**
 * Fetch real live weather: Attempts OpenWeatherMap with provided keys first,
 * with resilient automatic fallback to Open-Meteo coordinates telemetry.
 */
export async function fetchFieldWeather(
  fieldId: string,
  fieldName: string,
  lat: number,
  lng: number,
  forceRefresh = false
): Promise<FieldWeather> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const now = Date.now();

  // Check cache
  if (!forceRefresh && WEATHER_CACHE[cacheKey]) {
    const cached = WEATHER_CACHE[cacheKey];
    if (now - cached.timestamp < CACHE_TTL_MS) {
      return {
        ...cached.data,
        fieldId,
        fieldName
      };
    }
  }

  try {
    // 1. Try OpenWeatherMap with user keys
    const owmData = await fetchFromOpenWeatherMap(lat, lng, fieldId, fieldName);
    if (owmData) {
      WEATHER_CACHE[cacheKey] = { data: owmData, timestamp: now };
      return owmData;
    }

    // 2. Resilient fallback to Open-Meteo
    const fallbackData = await fetchFromOpenMeteo(lat, lng, fieldId, fieldName);
    WEATHER_CACHE[cacheKey] = { data: fallbackData, timestamp: now };
    return fallbackData;
  } catch {
    return {
      fieldId,
      fieldName,
      latitude: lat,
      longitude: lng,
      temperature: 0,
      feelsLike: 0,
      tempMin: 0,
      tempMax: 0,
      condition: 'Unavailable',
      conditionCode: -1,
      humidity: 0,
      windKmh: 0,
      windDirectionDeg: 0,
      windDirectionCompass: '--',
      windGustsKmh: 0,
      pressureHpa: 0,
      visibilityKm: 0,
      cloudCoverPct: 0,
      uvIndex: 0,
      rainProbability: 0,
      rainfallMm: 0,
      sunriseTime: '--:--',
      sunsetTime: '--:--',
      solarRadiationWm2: null,
      sprayAdvisory: {
        status: 'Caution',
        reason: 'Weather data temporarily unavailable.'
      },
      hourlyForecast: [],
      dailyForecast: [],
      lastUpdated: 'Failed',
      provider: 'Unavailable',
      isError: true,
      errorMessage: 'Weather data temporarily unavailable.'
    };
  }
}
