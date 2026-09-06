import React, { useState } from 'react';
import {
  CloudSun,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

export const WeatherPage: React.FC = () => {
  const { currentFarm, getFieldWeather } = useFarm();
  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    currentFarm.fields[0]?.id || 'field-mango-01'
  );

  const weather = getFieldWeather(selectedFieldId);
  const selectedField = currentFarm.fields.find(f => f.id === selectedFieldId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <CloudSun className="w-4 h-4" />
            <span>Micro-Climate & Agronomic Weather Station</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Location-Aware Weather
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time meteorology and spray windows localized to your specific parcel coordinates.
          </p>
        </div>

        {/* Field Switcher */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
          <MapPin className="w-4 h-4 text-forest-600 ml-2" />
          <select
            value={selectedFieldId}
            onChange={e => setSelectedFieldId(e.target.value)}
            className="text-xs font-extrabold bg-transparent text-slate-800 focus:outline-none cursor-pointer pr-2"
          >
            {currentFarm.fields.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.crop})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Weather Card */}
      <div className="bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-forest-300">
              Live Field Conditions • {weather.fieldName}
            </span>
            <div className="flex items-baseline gap-4 mt-2">
              <span className="text-5xl sm:text-7xl font-black tracking-tight">
                {weather.temperature}°C
              </span>
              <div>
                <p className="text-xl font-bold text-white">{weather.condition}</p>
                <p className="text-xs text-forest-200">Feels like {weather.feelsLike}°C</p>
              </div>
            </div>
            <p className="text-xs text-forest-200 mt-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>GPS localized: {selectedField?.center.lat.toFixed(4)}° N, {selectedField?.center.lng.toFixed(4)}° E</span>
            </p>
          </div>

          {/* Meteorological Metrics Matrix */}
          <div className="grid grid-cols-2 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5">
              <div className="flex items-center gap-1.5 text-forest-200 mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-300" />
                <span>Humidity</span>
              </div>
              <p className="text-xl font-black text-white">{weather.humidity}%</p>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5">
              <div className="flex items-center gap-1.5 text-forest-200 mb-1">
                <Wind className="w-3.5 h-3.5 text-slate-200" />
                <span>Wind Speed</span>
              </div>
              <p className="text-xl font-black text-white">{weather.windKmh} km/h</p>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5">
              <div className="flex items-center gap-1.5 text-forest-200 mb-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-300" />
                <span>Rain Probability</span>
              </div>
              <p className="text-xl font-black text-white">{weather.rainProbability}%</p>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5">
              <div className="flex items-center gap-1.5 text-forest-200 mb-1">
                <CloudSun className="w-3.5 h-3.5 text-amber-300" />
                <span>Rainfall (24h)</span>
              </div>
              <p className="text-xl font-black text-white">{weather.rainfallMm} mm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spray Window & Agronomic Advisory Card (Master Prompt Section 15) */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-2xl shrink-0 ${
            weather.sprayAdvisory.status === 'Optimal'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-base">Foliar Spray Advisory</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                weather.sprayAdvisory.status === 'Optimal'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {weather.sprayAdvisory.status} Window
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {weather.sprayAdvisory.reason}
            </p>
          </div>
        </div>
      </div>

      {/* 5-Day Forecast Grid */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 mb-3">5-Day Field Forecast</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {weather.forecast.map(day => (
            <div
              key={day.day}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs text-center space-y-2"
            >
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{day.day}</p>
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                {day.rainProb > 50 ? <CloudRain className="w-6 h-6 text-blue-600" /> : <Sun className="w-6 h-6 text-amber-500" />}
              </div>
              <p className="text-2xl font-black text-slate-900">{day.temp}°C</p>
              <p className="text-[11px] font-semibold text-slate-600">{day.condition}</p>
              <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                {day.rainProb}% Rain
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
