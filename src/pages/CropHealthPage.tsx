import React, { useState } from 'react';
import {
  HeartPulse,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Layers,
  Info
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

export const CropHealthPage: React.FC = () => {
  const { currentFarm } = useFarm();
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '3months'>('30days');

  // Analyzed fields only (Section 27)
  const analyzedFields = currentFarm.fields.filter(f => f.healthPercentage !== null && f.healthBreakdown !== null);

  const avgHealth = analyzedFields.length > 0
    ? Math.round(analyzedFields.reduce((acc, f) => acc + (f.healthPercentage || 0), 0) / analyzedFields.length)
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <HeartPulse className="w-4 h-4" />
            <span>Vegetation Index & Foliage Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Crop Health Index
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Dedicated agricultural computer vision analysis of foliar stress, chlorophyll index, and necrotic lesions.
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center bg-white border border-slate-200 p-1 rounded-2xl shadow-xs">
          <button
            onClick={() => setTimeRange('7days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeRange === '7days' ? 'bg-forest-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30days')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeRange === '30days' ? 'bg-forest-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeRange('3months')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeRange === '3months' ? 'bg-forest-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 3 Months
          </button>
        </div>
      </div>

      {/* Aggregate Score Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
            <span className="text-[10px] uppercase font-bold text-forest-700 tracking-wider">
              Estate Average Health
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-slate-900">
                {avgHealth !== null ? `${avgHealth}%` : '—'}
              </span>
              {avgHealth !== null && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  +2.4% vs last cycle
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {analyzedFields.length} of {currentFarm.fields.length} parcels analyzed
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
              <span>Healthy Canopy</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-emerald-950 mt-2">
              {analyzedFields.length > 0 ? '80.3%' : '—'}
            </p>
            <p className="text-[10px] text-emerald-700 mt-1">Normal chlorophyll absorption</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
              <span>At Risk (Stress)</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-3xl font-black text-amber-950 mt-2">
              {analyzedFields.length > 0 ? '13.7%' : '—'}
            </p>
            <p className="text-[10px] text-amber-700 mt-1">Mild moisture or foliar stress</p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
              <span>Critical / Pathogen</span>
              <HeartPulse className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-3xl font-black text-rose-950 mt-2">
              {analyzedFields.length > 0 ? '6.0%' : '—'}
            </p>
            <p className="text-[10px] text-rose-700 mt-1">Necrotic spots or chlorosis</p>
          </div>
        </div>
      </div>

      {/* Field-by-Field Breakdown (Section 27: Strict data isolation) */}
      <div className="space-y-4">
        <h2 className="text-lg font-extrabold text-slate-900">Parcel Health Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {currentFarm.fields.map(field => (
            <div
              key={field.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                      {field.crop}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-1">{field.name}</h3>
                    <p className="text-xs text-slate-400">
                      {field.areaAcres} Acres • Planted {field.plantingDate}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                      field.status === 'Healthy'
                        ? 'bg-emerald-100 text-emerald-800'
                        : field.status === 'At Risk'
                        ? 'bg-amber-100 text-amber-800'
                        : field.status === 'Critical'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {field.status}
                  </span>
                </div>

                <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  {field.healthPercentage !== null && field.healthBreakdown ? (
                    <>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">Overall Health</span>
                        <span className="text-2xl font-black text-slate-900">
                          {field.healthPercentage}%
                        </span>
                      </div>

                      <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${field.healthBreakdown.healthy}%` }}
                          className="bg-emerald-500 h-full"
                        />
                        <div
                          style={{ width: `${field.healthBreakdown.atRisk}%` }}
                          className="bg-amber-400 h-full"
                        />
                        <div
                          style={{ width: `${field.healthBreakdown.critical}%` }}
                          className="bg-rose-500 h-full"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-1 mt-2 text-center text-[10px]">
                        <div className="p-1 rounded bg-emerald-100 text-emerald-900 font-bold">
                          {field.healthBreakdown.healthy}% Healthy
                        </div>
                        <div className="p-1 rounded bg-amber-100 text-amber-900 font-bold">
                          {field.healthBreakdown.atRisk}% At Risk
                        </div>
                        <div className="p-1 rounded bg-rose-100 text-rose-900 font-bold">
                          {field.healthBreakdown.critical}% Critical
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-3 text-xs text-slate-500 space-y-1">
                      <p className="font-bold text-slate-700">No health analysis available.</p>
                      <p className="text-[11px]">Capture crop photos to trigger dedicated CV analysis.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Health Trend Graph Simulation for Analyzed Fields */}
              {field.healthPercentage !== null && (
                <div className="pt-3 border-t border-slate-100 text-xs">
                  <p className="text-[11px] font-bold text-slate-500 mb-2">
                    Health Trend ({timeRange}):
                  </p>
                  <div className="flex items-end gap-1.5 h-14 w-full">
                    {[74, 76, 75, 78, 80, 81, field.healthPercentage].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          style={{ height: `${(val / 100) * 48}px` }}
                          className={`w-full rounded-t-sm transition-all ${
                            val >= 80 ? 'bg-emerald-500' : val >= 65 ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                          title={`${val}%`}
                        />
                        <span className="text-[8px] text-slate-400">D{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
