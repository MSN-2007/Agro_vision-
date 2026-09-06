import React, { useState } from 'react';
import {
  CloudSun,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Compass,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Sparkles,
  Info
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

export const WeatherPage: React.FC = () => {
  const {
    currentFarm,
    currentField,
    getFieldWeather,
    refreshCurrentWeather,
    isWeatherLoading,
    selectField
  } = useFarm();

  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    currentField?.id || currentFarm.fields[0]?.id || ''
  );

  const selectedField = currentFarm.fields.find(f => f.id === selectedFieldId) || currentFarm.fields[0];
  const weather = getFieldWeather(selectedField?.id);

  const handleFieldChange = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    selectField(fieldId);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <CloudSun className="w-4 h-4" />
            <span>Open-Meteo Agricultural Meteorological Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Field Weather Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time atmospheric telemetry and foliar spray windows queried directly from exact parcel coordinates.
          </p>
        </div>

        {/* Controls: Field Switcher + Refresh Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-forest-600" />
            <select
              value={selectedFieldId}
              onChange={e => handleFieldChange(e.target.value)}
              className="text-xs font-extrabold bg-transparent text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              {currentFarm.fields.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.crop})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={refreshCurrentWeather}
            disabled={isWeatherLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold text-xs border border-forest-200 shadow-xs transition-colors disabled:opacity-50"
            title="Force refresh live weather data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-forest-600 ${isWeatherLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error State Banner (Section 36 & Test 8) */}
      {weather && weather.isError ? (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-extrabold text-rose-950 text-base">Weather data temporarily unavailable</h3>
            <p className="text-xs text-rose-800 mt-1 leading-relaxed">
              Unable to connect to meteorological stations for coordinates ({selectedField?.center.lat.toFixed(4)}° N, {selectedField?.center.lng.toFixed(4)}° E). Fake measurements will not be displayed. Please check network connection or click Refresh.
            </p>
            <button
              onClick={refreshCurrentWeather}
              className="mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-rose-700"
            >
              Retry Weather Request
            </button>
          </div>
        </div>
      ) : weather ? (
        <>
          {/* Main Weather Card */}
          <div className="bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-forest-200 text-xs font-bold uppercase tracking-widest">
                  <span>Current Conditions</span>
                  <span>•</span>
                  <span>{weather.fieldName}</span>
                  <span className="text-[10px] text-forest-300 font-normal">
                    (Updated {weather.lastUpdated})
                  </span>
                </div>

                <div className="flex items-baseline gap-4 mt-2">
                  <span className="text-5xl sm:text-7xl font-black tracking-tight">
                    {weather.temperature}°C
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-white">{weather.condition}</p>
                    <p className="text-xs text-forest-200">
                      Feels like {weather.feelsLike}°C • Min {weather.tempMin}°C / Max {weather.tempMax}°C
                    </p>
                  </div>
                </div>

                <p className="text-xs text-forest-200 mt-3 flex items-center gap-1.5 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>Parcel GPS: {weather.latitude.toFixed(4)}° N, {weather.longitude.toFixed(4)}° E</span>
                </p>
              </div>

              {/* Foliar Spray Window Badge */}
              <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 max-w-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-forest-200 uppercase tracking-wide">
                    Foliar Spray Advisory
                  </span>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-black ${
                      weather.sprayAdvisory.status === 'Optimal'
                        ? 'bg-emerald-400 text-emerald-950'
                        : weather.sprayAdvisory.status === 'Caution'
                        ? 'bg-amber-300 text-amber-950'
                        : 'bg-rose-400 text-rose-950'
                    }`}
                  >
                    {weather.sprayAdvisory.status}
                  </span>
                </div>
                <p className="text-xs text-forest-100 leading-relaxed">
                  {weather.sprayAdvisory.reason}
                </p>
              </div>
            </div>
          </div>

          {/* Meteorological Metrics Grid (Sections 13, 16, 17) */}
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-3">Atmospheric Parameters</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* Humidity */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  <span>Humidity</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{weather.humidity}%</p>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div style={{ width: `${weather.humidity}%` }} className="h-full bg-sky-500" />
                </div>
              </div>

              {/* Wind Speed & Direction */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                  <Wind className="w-4 h-4 text-forest-600" />
                  <span>Wind Speed</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{weather.windKmh} <span className="text-xs font-semibold text-slate-500">km/h</span></p>
                <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-forest-700" />
                  <span>{weather.windDirectionCompass} ({weather.windDirectionDeg}°)</span>
                </p>
              </div>

              {/* Wind Gusts */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                  <Wind className="w-4 h-4 text-amber-500" />
                  <span>Wind Gusts</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{weather.windGustsKmh} <span className="text-xs font-semibold text-slate-500">km/h</span></p>
                <p className="text-[11px] text-slate-400">Peak surface breeze</p>
              </div>

              {/* Rain Probability & Rainfall */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                  <CloudRain className="w-4 h-4 text-blue-500" />
                  <span>Precipitation</span>
                </div>
                <p className="text-2xl font-black text-blue-900">{weather.rainProbability}%</p>
                <p className="text-[11px] text-slate-500">{weather.rainfallMm} mm (24h accumulation)</p>
              </div>

              {/* Surface Pressure */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                  <Gauge className="w-4 h-4 text-purple-500" />
                  <span>Pressure</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{weather.pressureHpa} <span className="text-xs font-semibold text-slate-500">hPa</span></p>
                <p className="text-[11px] text-slate-400">Barometric surface</p>
              </div>

              {/* UV Index */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>UV Index</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{weather.uvIndex}</p>
                <p className="text-[11px] text-emerald-700 font-bold">
                  {weather.uvIndex > 7 ? 'Very High' : weather.uvIndex > 4 ? 'Moderate' : 'Low'} Exposure
                </p>
              </div>
            </div>
          </div>

          {/* Section 14: Solar / Light Information & Hardware Sensor Distinction */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Daylight Section */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base">Daylight & Sun Times</h3>
                <span className="text-xs font-bold text-forest-700 bg-forest-50 px-2.5 py-0.5 rounded-full">
                  Astronomical API Data
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
                  <Sunrise className="w-8 h-8 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-800 block">Sunrise</span>
                    <strong className="text-lg font-black text-slate-900">{weather.sunriseTime}</strong>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex items-center gap-3">
                  <Sunset className="w-8 h-8 text-orange-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-orange-800 block">Sunset</span>
                    <strong className="text-lg font-black text-slate-900">{weather.sunsetTime}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Solar Radiation & Light Intensity (Section 14) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base">Solar Radiation & Light</h3>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                  Solar Irradiance
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-forest-800">
                    Direct Solar Radiation (API)
                  </span>
                  <p className="text-2xl font-black text-forest-950 mt-0.5">
                    {weather.solarRadiationWm2 !== null ? `${weather.solarRadiationWm2} W/m²` : 'Calculating...'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Cloud cover: {weather.cloudCoverPct}%</p>
                </div>
                <Sun className="w-10 h-10 text-amber-500" />
              </div>

              {/* Explicit Hardware Sensor State distinction required by Section 14 */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2.5 text-slate-600">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <p>
                  <strong>AgroVision Wearable Light Sensor:</strong> Light sensor data unavailable (optical photodiode module on glasses in standby mode).
                </p>
              </div>
            </div>
          </div>

          {/* Hourly Forecast (Next 12 hours) */}
          {weather.hourlyForecast.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h2 className="text-lg font-extrabold text-slate-900">Hourly Conditions Trend</h2>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {weather.hourlyForecast.map((hour, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-center shrink-0 w-24 space-y-1"
                  >
                    <p className="text-xs font-bold text-slate-500">{hour.time}</p>
                    <p className="text-lg font-black text-slate-900">{hour.temp}°C</p>
                    <p className="text-[10px] text-sky-700 font-bold">{hour.humidity}% hum</p>
                    <p className="text-[10px] text-blue-600 font-semibold">{hour.rainProb}% rain</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5-Day Daily Forecast */}
          {weather.dailyForecast.length > 0 && (
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 mb-3">5-Day Meteorological Forecast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {weather.dailyForecast.map(day => (
                  <div
                    key={day.day}
                    className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs text-center space-y-2"
                  >
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{day.day}</p>
                    <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                      {day.rainProb > 40 ? <CloudRain className="w-6 h-6 text-blue-600" /> : <Sun className="w-6 h-6 text-amber-500" />}
                    </div>
                    <p className="text-2xl font-black text-slate-900">{day.tempMax}°C</p>
                    <p className="text-[11px] text-slate-400">Min: {day.tempMin}°C</p>
                    <p className="text-[11px] font-semibold text-slate-600">{day.condition}</p>
                    <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                      {day.rainProb}% Rain
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
          <CloudSun className="w-10 h-10 mx-auto mb-2 text-slate-300 animate-spin" />
          <p className="font-bold text-slate-700">Loading live weather data...</p>
          <p className="text-xs mt-1">Connecting to Open-Meteo station coordinates.</p>
        </div>
      )}
    </div>
  );
};
