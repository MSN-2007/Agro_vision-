import React, { useState, useMemo, useEffect } from 'react';
import {
  HeartPulse,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Layers,
  Info,
  MapPin,
  ChevronDown,
  Droplets,
  Sun,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { Field } from '../types/agro';

type TimeRange = '7days' | '30days' | '3months';

interface TimelinePoint {
  label: string;
  dateStr: string;
  health: number;
  ndvi: number;
  healthy: number;
  atRisk: number;
  critical: number;
  note?: string;
}

export const CropHealthPage: React.FC = () => {
  const { currentFarm, currentField, selectField, problems, observations } = useFarm();

  // Field Scope: 'all' for estate aggregate, or specific fieldId
  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    currentField ? currentField.id : 'all'
  );

  // Time Range: '7days' | '30days' | '3months'
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Sync if global currentField changes
  useEffect(() => {
    if (currentField && selectedFieldId !== currentField.id && selectedFieldId !== 'all') {
      setSelectedFieldId(currentField.id);
    }
  }, [currentField]);

  // Handle local field change
  const handleFieldChange = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    if (fieldId !== 'all') {
      selectField(fieldId);
    }
  };

  const analyzedFields = useMemo(() => {
    return currentFarm.fields.filter(f => f.healthPercentage !== null && f.healthBreakdown !== null);
  }, [currentFarm.fields]);

  const activeField: Field | undefined = useMemo(() => {
    if (selectedFieldId === 'all') return undefined;
    return currentFarm.fields.find(f => f.id === selectedFieldId);
  }, [currentFarm.fields, selectedFieldId]);

  // Deterministic, realistic historical timeline calculation per field and time range
  const timelineData: { points: TimelinePoint[]; deltaText: string; isPositive: boolean } = useMemo(() => {
    // Base target health
    let baseHealth = 80;
    let fieldSlug = 'all';

    if (activeField) {
      baseHealth = activeField.healthPercentage ?? 75;
      fieldSlug = activeField.id;
    } else if (analyzedFields.length > 0) {
      baseHealth = Math.round(
        analyzedFields.reduce((sum, f) => sum + (f.healthPercentage || 0), 0) / analyzedFields.length
      );
    }

    if (timeRange === '7days') {
      // 7 Daily Points
      const days = ['Sep 2', 'Sep 3', 'Sep 4', 'Sep 5', 'Sep 6', 'Sep 7', 'Today'];

      // Trajectory patterns
      let values: number[] = [];
      if (fieldSlug.includes('tomato')) {
        // Declining due to blight / drip leak
        values = [73, 72, 71, 70, 69, 68, 68];
      } else if (fieldSlug.includes('strawberry')) {
        // Robust flowering
        values = [89, 89, 90, 90, 91, 91, 91];
      } else if (fieldSlug.includes('mango')) {
        // Slow canopy flush
        values = [80, 80, 81, 81, 81, 82, 82];
      } else {
        // Aggregate estate
        values = [78, 78, 79, 79, 80, 80, baseHealth];
      }

      const points: TimelinePoint[] = days.map((day, idx) => {
        const val = values[idx] ?? baseHealth;
        const ndvi = Number(((val / 100) * 0.55 + 0.35).toFixed(2));
        const atRiskPct = Math.max(5, Math.round((100 - val) * 0.7));
        const critPct = Math.max(2, Math.round((100 - val) * 0.3));
        const healthyPct = 100 - atRiskPct - critPct;
        return {
          label: day,
          dateStr: `2026-09-0${idx + 2}`,
          health: val,
          ndvi,
          healthy: healthyPct,
          atRisk: atRiskPct,
          critical: critPct,
          note: idx === 6 ? 'Latest Aerial CV Scan' : undefined
        };
      });

      const delta = values[values.length - 1] - values[0];
      return {
        points,
        deltaText: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs 7 days ago`,
        isPositive: delta >= 0
      };
    }

    if (timeRange === '30days') {
      // 6 Weekly / 5-day Interval Points
      const intervals = ['Aug 9', 'Aug 15', 'Aug 21', 'Aug 27', 'Sep 2', 'Today'];

      let values: number[] = [];
      if (fieldSlug.includes('tomato')) {
        values = [78, 76, 74, 72, 70, 68];
      } else if (fieldSlug.includes('strawberry')) {
        values = [86, 87, 88, 89, 90, 91];
      } else if (fieldSlug.includes('mango')) {
        values = [77, 78, 79, 80, 81, 82];
      } else {
        values = [76, 77, 78, 79, 80, baseHealth];
      }

      const points: TimelinePoint[] = intervals.map((label, idx) => {
        const val = values[idx] ?? baseHealth;
        const ndvi = Number(((val / 100) * 0.55 + 0.35).toFixed(2));
        const atRiskPct = Math.max(5, Math.round((100 - val) * 0.68));
        const critPct = Math.max(2, Math.round((100 - val) * 0.32));
        const healthyPct = 100 - atRiskPct - critPct;
        return {
          label,
          dateStr: `Aug/Sep Cycle ${idx + 1}`,
          health: val,
          ndvi,
          healthy: healthyPct,
          atRisk: atRiskPct,
          critical: critPct
        };
      });

      const delta = values[values.length - 1] - values[0];
      return {
        points,
        deltaText: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs 30 days ago`,
        isPositive: delta >= 0
      };
    }

    // '3months' (90 Days)
    const seasonal = ['Jun 10', 'Jun 25', 'Jul 10', 'Jul 25', 'Aug 10', 'Today'];
    let values: number[] = [];
    if (fieldSlug.includes('tomato')) {
      values = [85, 82, 79, 75, 71, 68];
    } else if (fieldSlug.includes('strawberry')) {
      values = [82, 84, 86, 88, 90, 91];
    } else if (fieldSlug.includes('mango')) {
      values = [74, 75, 77, 79, 80, 82];
    } else {
      values = [73, 75, 77, 78, 79, baseHealth];
    }

    const points: TimelinePoint[] = seasonal.map((label, idx) => {
      const val = values[idx] ?? baseHealth;
      const ndvi = Number(((val / 100) * 0.55 + 0.35).toFixed(2));
      const atRiskPct = Math.max(5, Math.round((100 - val) * 0.65));
      const critPct = Math.max(2, Math.round((100 - val) * 0.35));
      const healthyPct = 100 - atRiskPct - critPct;
      return {
        label,
        dateStr: `Q3 Scan ${idx + 1}`,
        health: val,
        ndvi,
        healthy: healthyPct,
        atRisk: atRiskPct,
        critical: critPct
      };
    });

    const delta = values[values.length - 1] - values[0];
    return {
      points,
      deltaText: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}% vs 3 months ago`,
      isPositive: delta >= 0
    };
  }, [activeField, analyzedFields, timeRange]);

  // Current selected health metrics
  const activeMetrics = useMemo(() => {
    const latest = timelineData.points[timelineData.points.length - 1];

    if (activeField) {
      const breakdown = activeField.healthBreakdown || {
        healthy: latest.healthy,
        atRisk: latest.atRisk,
        critical: latest.critical
      };
      return {
        title: activeField.name,
        subtitle: `${activeField.crop} • ${activeField.areaAcres} ac`,
        healthScore: activeField.healthPercentage !== null ? activeField.healthPercentage : latest.health,
        healthyPct: breakdown.healthy,
        atRiskPct: breakdown.atRisk,
        criticalPct: breakdown.critical,
        status: activeField.status,
        ndviScore: latest.ndvi
      };
    }

    // Estate Aggregate
    const avgScore = analyzedFields.length > 0
      ? Math.round(analyzedFields.reduce((sum, f) => sum + (f.healthPercentage || 0), 0) / analyzedFields.length)
      : latest.health;

    const healthyAvg = analyzedFields.length > 0
      ? Number((analyzedFields.reduce((sum, f) => sum + (f.healthBreakdown?.healthy || 0), 0) / analyzedFields.length).toFixed(1))
      : latest.healthy;

    const atRiskAvg = analyzedFields.length > 0
      ? Number((analyzedFields.reduce((sum, f) => sum + (f.healthBreakdown?.atRisk || 0), 0) / analyzedFields.length).toFixed(1))
      : latest.atRisk;

    const criticalAvg = analyzedFields.length > 0
      ? Number((analyzedFields.reduce((sum, f) => sum + (f.healthBreakdown?.critical || 0), 0) / analyzedFields.length).toFixed(1))
      : latest.critical;

    return {
      title: 'Estate Average Health',
      subtitle: `${analyzedFields.length} of ${currentFarm.fields.length} parcels analyzed`,
      healthScore: avgScore,
      healthyPct: healthyAvg,
      atRiskPct: atRiskAvg,
      criticalPct: criticalAvg,
      status: avgScore >= 80 ? 'Healthy' : avgScore >= 65 ? 'At Risk' : 'Critical',
      ndviScore: latest.ndvi
    };
  }, [activeField, analyzedFields, currentFarm.fields.length, timelineData.points]);

  // Field-specific stress factor indicators
  const stressIndicators = useMemo(() => {
    if (activeField?.id.includes('tomato')) {
      return [
        { label: 'Chlorophyll Absorption', value: 68, status: 'Moderate', desc: 'Mild yellowing on lower petioles', color: 'text-amber-600 bg-amber-50' },
        { label: 'Moisture / Drip Stress', value: 38, status: 'Elevated Risk', desc: 'Central valve pooling reported', color: 'text-rose-600 bg-rose-50' },
        { label: 'Foliar Blight Exposure', value: 46, status: 'Active Watch', desc: 'Early blight dark concentric spots', color: 'text-rose-600 bg-rose-50' }
      ];
    }
    if (activeField?.id.includes('strawberry')) {
      return [
        { label: 'Chlorophyll Absorption', value: 93, status: 'Optimal', desc: 'Dense dark green crown development', color: 'text-emerald-700 bg-emerald-50' },
        { label: 'Moisture / Fertigation', value: 10, status: 'Optimal', desc: 'Uniform root hydration schedule', color: 'text-emerald-700 bg-emerald-50' },
        { label: 'Pathogen / Spore Exposure', value: 4, status: 'Low Risk', desc: 'Clean leaves under mulch beds', color: 'text-emerald-700 bg-emerald-50' }
      ];
    }
    if (activeField?.id.includes('mango')) {
      return [
        { label: 'Chlorophyll Absorption', value: 84, status: 'Normal', desc: 'Active vegetative leaf flush', color: 'text-emerald-700 bg-emerald-50' },
        { label: 'Moisture / Evaporation', value: 16, status: 'Low Risk', desc: 'Drip lines operating normally', color: 'text-emerald-700 bg-emerald-50' },
        { label: 'Anthracnose Spore Risk', value: 24, status: 'Moderate', desc: 'Isolated necrotic spots in Sector NE', color: 'text-amber-600 bg-amber-50' }
      ];
    }
    // All Estate Aggregate
    return [
      { label: 'Estate Chlorophyll Index', value: 81, status: 'Normal', desc: 'Average photosynthetic density', color: 'text-emerald-700 bg-emerald-50' },
      { label: 'Irrigation Discrepancy', value: 21, status: 'Attention', desc: 'Tomato sector leak requires check', color: 'text-amber-600 bg-amber-50' },
      { label: 'Foliar Pathogen Risk', value: 25, status: 'Moderate', desc: 'Early blight & anthracnose watch', color: 'text-amber-600 bg-amber-50' }
    ];
  }, [activeField]);

  // Filter observations & problems matching active field
  const fieldObservations = useMemo(() => {
    if (!activeField) return observations;
    return observations.filter(o => o.fieldId === activeField.id);
  }, [observations, activeField]);

  const fieldProblems = useMemo(() => {
    if (!activeField) return problems;
    return problems.filter(p => p.fieldId === activeField.id);
  }, [problems, activeField]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header with Field Dropdown & Timeline Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

        {/* Controls: Field Switcher + Time Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Field Scope Selector */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-forest-600" />
            <select
              value={selectedFieldId}
              onChange={e => handleFieldChange(e.target.value)}
              className="text-xs font-extrabold bg-transparent text-slate-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">All Parcels (Estate Overview)</option>
              {currentFarm.fields.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.crop})
                </option>
              ))}
            </select>
          </div>

          {/* Time Filter Pills */}
          <div className="flex items-center bg-white border border-slate-200/90 p-1 rounded-2xl shadow-xs">
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
      </div>

      {/* 2. Dynamic Primary Score Cards - Updates on Field & Timeline */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main Score Column */}
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-forest-700 tracking-wider">
                  {selectedFieldId === 'all' ? 'Estate Overall Health' : 'Parcel Health Index'}
                </span>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                  NDVI {activeMetrics.ndviScore}
                </span>
              </div>

              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="text-4xl sm:text-5xl font-black text-slate-900">
                  {activeMetrics.healthScore}%
                </span>
                <span
                  className={`text-xs font-bold flex items-center gap-0.5 ${
                    timelineData.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {timelineData.isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {timelineData.deltaText}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs font-bold text-slate-800">{activeMetrics.title}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{activeMetrics.subtitle}</p>
            </div>
          </div>

          {/* Healthy Canopy */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
              <span>Healthy Canopy</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-3xl font-black text-emerald-950 mt-2">
              {activeMetrics.healthyPct}%
            </p>
            <p className="text-[10px] text-emerald-700 mt-1">Vigorous chlorophyll & biomass</p>
          </div>

          {/* At Risk (Stress) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
              <span>At Risk (Stress)</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-3xl font-black text-amber-950 mt-2">
              {activeMetrics.atRiskPct}%
            </p>
            <p className="text-[10px] text-amber-700 mt-1">Mild moisture or foliar stress</p>
          </div>

          {/* Critical / Pathogen */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
              <span>Critical / Pathogen</span>
              <HeartPulse className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-3xl font-black text-rose-950 mt-2">
              {activeMetrics.criticalPct}%
            </p>
            <p className="text-[10px] text-rose-700 mt-1">Necrotic lesions or chlorosis</p>
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC INTERACTIVE TIMELINE CHART */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-forest-700" />
              <span>Historical Vegetation Index & Canopy Trajectory ({timeRange.replace('days', ' Days').replace('months', ' Months')})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Showing multi-spectral NDVI trends for {activeField ? activeField.name : currentFarm.name}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium">Optimal (&ge;80%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-600 font-medium">Stress (65-79%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600 font-medium">Critical (&lt;65%)</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Chart with Hover Tooltip */}
        <div className="pt-4">
          <div className="flex items-end gap-3 sm:gap-6 h-44 w-full px-2 border-b border-slate-200/80 pb-2">
            {timelineData.points.map((pt, idx) => {
              const isHovered = hoveredPointIndex === idx;
              const barHeightPx = Math.max(20, Math.round((pt.health / 100) * 140));
              const colorClass =
                pt.health >= 80 ? 'bg-emerald-500 hover:bg-emerald-600' : pt.health >= 65 ? 'bg-amber-400 hover:bg-amber-500' : 'bg-rose-500 hover:bg-rose-600';

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                  className="flex-1 flex flex-col items-center justify-end relative group cursor-pointer h-full"
                >
                  {/* Hover Floating Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-14 z-30 bg-slate-900 text-white text-[11px] font-mono px-2.5 py-1.5 rounded-xl shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in">
                      <div className="font-bold text-emerald-400">{pt.health}% Health • NDVI {pt.ndvi}</div>
                      <div className="text-slate-300 text-[10px]">{pt.label} ({pt.dateStr})</div>
                    </div>
                  )}

                  {/* Percentage label above bar */}
                  <span className="text-[10px] font-bold text-slate-500 mb-1 opacity-80 group-hover:opacity-100">
                    {pt.health}%
                  </span>

                  {/* Bar */}
                  <div
                    style={{ height: `${barHeightPx}px` }}
                    className={`w-full rounded-t-lg transition-all duration-300 shadow-xs ${colorClass} ${
                      isHovered ? 'ring-2 ring-forest-600 scale-[1.02]' : ''
                    }`}
                  />

                  {/* Date Label */}
                  <span className="text-[11px] font-semibold text-slate-600 mt-2 truncate max-w-full">
                    {pt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Foliar Stress Distribution & Field Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stress Factors Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Diagnostic Stress Factors</span>
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Live Sensor Map</span>
          </div>

          <div className="space-y-3">
            {stressIndicators.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.color}`}>
                    {item.status} ({item.value}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{item.desc}</p>
                {/* Visual meter */}
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mt-1">
                  <div
                    style={{ width: `${item.value}%` }}
                    className={`h-full ${item.value >= 70 ? 'bg-emerald-500' : item.value >= 30 ? 'bg-amber-400' : 'bg-rose-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Disease Alerts & Observations Filtered to Field (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-forest-700" />
              <span>Active Field Diagnostics & Scout Observations</span>
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {activeField ? activeField.name : 'All Registered Parcels'}
            </span>
          </div>

          {fieldProblems.length > 0 ? (
            <div className="space-y-3">
              {fieldProblems.map(prob => (
                <div
                  key={prob.id}
                  className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-rose-950">
                          {prob.aiAnalysis?.possibleDisease || `${prob.crop} Foliar Anomaly`}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                          {prob.aiAnalysis?.severity || 'Active'} Severity
                        </span>
                      </div>
                      <p className="text-xs text-rose-800 mt-1">
                        {prob.aiAnalysis?.recommendedAction || prob.farmerNote}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Reported {prob.reportedAt} • {prob.crop}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="text-xs font-bold text-emerald-950">No Unresolved Pathogens</p>
              <p className="text-[11px] text-emerald-800">
                Vegetation index shows clean foliar coverage in {activeField ? activeField.name : 'all fields'}.
              </p>
            </div>
          )}

          {/* Recent Scouting Logs */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Recent Observation Logs
            </h4>
            <div className="space-y-2">
              {fieldObservations.slice(0, 3).map(obs => (
                <div
                  key={obs.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-800">{obs.title}</span>
                    <span className="text-slate-400 text-[11px] block">{obs.locationName || 'Field boundary'} • {obs.timestamp}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      obs.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {obs.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Field-by-Field Breakdown Cards with Direct Action Link */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">All Parcel Health Overview</h2>
          <span className="text-xs text-slate-500 font-semibold">Click parcel to inspect</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {currentFarm.fields.map(field => {
            const isSelected = field.id === selectedFieldId;
            const health = field.healthPercentage ?? 70;
            const breakdown = field.healthBreakdown || { healthy: 70, atRisk: 20, critical: 10 };

            return (
              <div
                key={field.id}
                onClick={() => handleFieldChange(field.id)}
                className={`bg-white rounded-3xl p-6 border shadow-xs flex flex-col justify-between space-y-4 cursor-pointer transition-all hover:border-forest-500 hover:shadow-md ${
                  isSelected ? 'border-2 border-forest-600 ring-2 ring-forest-100' : 'border-slate-200/80'
                }`}
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
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700">Health Index</span>
                      <span className="text-2xl font-black text-slate-900">
                        {health}%
                      </span>
                    </div>

                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                      <div style={{ width: `${breakdown.healthy}%` }} className="bg-emerald-500 h-full" />
                      <div style={{ width: `${breakdown.atRisk}%` }} className="bg-amber-400 h-full" />
                      <div style={{ width: `${breakdown.critical}%` }} className="bg-rose-500 h-full" />
                    </div>

                    <div className="grid grid-cols-3 gap-1 mt-2 text-center text-[10px]">
                      <div className="p-1 rounded bg-emerald-100 text-emerald-900 font-bold">
                        {breakdown.healthy}% Healthy
                      </div>
                      <div className="p-1 rounded bg-amber-100 text-amber-900 font-bold">
                        {breakdown.atRisk}% At Risk
                      </div>
                      <div className="p-1 rounded bg-rose-100 text-rose-900 font-bold">
                        {breakdown.critical}% Critical
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                  <span className="text-slate-400 font-medium">Focus Parcel</span>
                  <span className={`font-bold ${isSelected ? 'text-forest-700' : 'text-slate-600'}`}>
                    {isSelected ? '✓ Active Focus' : 'Click to select →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
