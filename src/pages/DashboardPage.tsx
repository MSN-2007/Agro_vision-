import React, { useState } from 'react';
import {
  Sun,
  MapPin,
  Trees,
  Glasses,
  CloudSun,
  AlertTriangle,
  CheckSquare,
  CheckCircle2,
  Eye,
  Camera,
  Activity,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Droplets,
  Wind
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { PageId } from '../components/Sidebar';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const {
    user,
    currentFarm,
    currentField,
    currentGps,
    getFieldWeather,
    device,
    tasks,
    problems,
    observations,
    mediaItems,
    activityLog,
    toggleTaskStatus,
    setIsBriefingModalOpen
  } = useFarm();

  const weather = getFieldWeather(currentField?.id);

  const [taskScope, setTaskScope] = useState<'all' | 'field'>('all');

  // Filter tasks due today for this farm
  const farmTodayTasks = tasks.filter(t => {
    const matchesFarm = currentFarm.fields.some(f => f.id === t.fieldId) || !t.fieldId;
    if (!matchesFarm) return false;
    return t.dueDate.toLowerCase().includes('today');
  });

  const todayTasks = farmTodayTasks.filter(t => {
    if (taskScope === 'field' && currentField && t.fieldId) {
      return t.fieldId === currentField.id;
    }
    return true;
  });

  const completedTodayCount = todayTasks.filter(t => t.status === 'Completed').length;
  const pendingTodayCount = todayTasks.filter(t => t.status === 'Pending').length;

  const activeAlerts = problems.filter(p => {
    if (p.status === 'Resolved') return false;
    if (p.farmId !== currentFarm.id) return false;
    if (currentField && p.fieldId && p.fieldId !== currentField.id) return false;
    return true;
  });

  const recentObs = currentField
    ? observations.filter(o => o.fieldId === currentField.id)
    : observations.filter(o => o.farmId === currentFarm.id);

  const recentMedia = currentField
    ? mediaItems.filter(m => m.fieldId === currentField.id)
    : mediaItems.filter(m => m.farmId === currentFarm.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Farmer Personalized Greeting & Overview Banner */}
      <div className="bg-gradient-to-r from-forest-800 via-forest-700 to-forest-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-forest-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Personalized Farm Intelligence Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Good morning, {user.name}
            </h1>
            <p className="text-forest-100 text-sm sm:text-base mt-1">
              {currentField ? (
                <>Currently monitoring <strong>{currentField.name}</strong> ({currentField.crop}) in {currentFarm.name}.</>
              ) : (
                <>Monitoring estate operations across <strong>{currentFarm.name}</strong>.</>
              )}
            </p>

            {/* Live Telemetry Context Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md">
                <Trees className="w-3.5 h-3.5 text-emerald-300" />
                <span>{currentFarm.name}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentField ? currentField.name : 'Outside Registered Field'}</span>
              </div>
              {currentField && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md">
                  <span className="text-emerald-200">Crop:</span>
                  <span>{currentField.crop}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md">
                <Glasses className="w-3.5 h-3.5 text-sky-300" />
                <span>
                  Glasses: {device.connected ? `Connected (${device.batteryLevel}%)` : 'Standby'}
                </span>
              </div>
            </div>
          </div>

          {/* Morning Briefing Audio Action */}
          <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
            <button
              onClick={() => setIsBriefingModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>Listen to Morning Briefing</span>
            </button>
            <span className="text-xs text-forest-200">
              Audio weather, alerts & daily tasks
            </span>
          </div>
        </div>
      </div>

      {/* 2. Core Information Grid: Current Field & Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Current Field & Active Alerts */}
        <div className="lg:col-span-7 space-y-6">
          {/* A. Current Field Status Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-extrabold text-slate-900 text-base">Current Field Status</h3>
              </div>
              <button
                onClick={() => onNavigate('map')}
                className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1"
              >
                <span>Interactive Map</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {currentField ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-forest-50/70 border border-forest-100 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-forest-700">
                      Inside Field Geo-Fence
                    </span>
                    <h4 className="text-xl font-extrabold text-forest-950 mt-0.5">
                      {currentField.name}
                    </h4>
                    <p className="text-xs text-forest-800 font-medium">
                      Crop: {currentField.crop} • {currentField.areaAcres} Acres
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-2xl font-black text-forest-950">
                        {currentField.healthPercentage !== null ? `${currentField.healthPercentage}%` : '—'}
                      </span>
                      <p className="text-[10px] font-bold text-forest-700 uppercase">Crop Health</p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                        currentField.status === 'Healthy'
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentField.status === 'At Risk'
                          ? 'bg-amber-100 text-amber-800'
                          : currentField.status === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {currentField.status}
                    </span>
                  </div>
                </div>

                {/* Crop Health Distribution (Section 26 & 27: No fake values for unanalyzed fields) */}
                {currentField.healthBreakdown ? (
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                      <span>Field Condition Distribution</span>
                      <span className="font-bold text-slate-800">
                        {currentField.healthBreakdown.healthy}% Healthy
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${currentField.healthBreakdown.healthy}%` }}
                        className="bg-emerald-500 h-full"
                        title="Healthy"
                      />
                      <div
                        style={{ width: `${currentField.healthBreakdown.atRisk}%` }}
                        className="bg-amber-400 h-full"
                        title="At Risk"
                      />
                      <div
                        style={{ width: `${currentField.healthBreakdown.critical}%` }}
                        className="bg-rose-500 h-full"
                        title="Critical"
                      />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Healthy ({currentField.healthBreakdown.healthy}%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        At Risk ({currentField.healthBreakdown.atRisk}%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Critical ({currentField.healthBreakdown.critical}%)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                    No crop health analysis data available yet for this field.
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono">
                    <MapPin className="w-4 h-4 text-forest-600" />
                    GPS: {currentGps.lat.toFixed(4)}° N, {currentGps.lng.toFixed(4)}° E
                  </span>
                  <button
                    onClick={() => onNavigate('crop-health')}
                    className="font-bold text-forest-700 hover:underline"
                  >
                    Crop Health &rarr;
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h4 className="font-bold text-amber-950 text-sm">Outside Field Geo-Fence</h4>
                <p className="text-xs text-amber-800 mt-1 max-w-md mx-auto">
                  GPS location detected at ({currentGps.lat.toFixed(4)}° N, {currentGps.lng.toFixed(4)}° E), but you are currently outside registered boundaries.
                </p>
                <button
                  onClick={() => onNavigate('map')}
                  className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Open Map & Register Boundary
                </button>
              </div>
            )}
          </div>

          {/* D. Active Alerts & Problems */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Active Alerts & Problems</h3>
              </div>
              <button
                onClick={() => onNavigate('problems')}
                className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1"
              >
                <span>View All ({activeAlerts.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {activeAlerts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No active crop alerts or pathology problems in this field.
                </div>
              ) : (
                activeAlerts.map(prob => (
                  <div
                    key={prob.id}
                    className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {prob.imageUrl && (
                        <img
                          src={prob.imageUrl}
                          alt={prob.crop}
                          className="w-14 h-14 rounded-xl object-cover border border-amber-300 shrink-0"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                            {prob.crop}
                          </span>
                          <span className="text-xs text-slate-500">{prob.reportedAt}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">
                          {prob.aiAnalysis?.possibleDisease || 'Possible Crop Anomaly'}
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                          {prob.aiAnalysis?.recommendedAction || prob.farmerNote}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {prob.aiAnalysis && (
                        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                          CV: {prob.aiAnalysis.confidence}%
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Weather & Today's Tasks */}
        <div className="lg:col-span-5 space-y-6">
          {/* B. Real Weather Card (Section 12 & 13) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-forest-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Field Weather (Live)</h3>
              </div>
              <button
                onClick={() => onNavigate('weather')}
                className="text-xs font-bold text-forest-700 hover:text-forest-900"
              >
                Full Weather &rarr;
              </button>
            </div>

            {weather && !weather.isError ? (
              <>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-forest-50 to-emerald-50 border border-forest-100">
                  <div>
                    <span className="text-4xl font-black text-slate-900">{weather.temperature}°C</span>
                    <p className="text-xs font-bold text-forest-900 mt-0.5">{weather.condition}</p>
                    <p className="text-[11px] text-slate-500">Feels like {weather.feelsLike}°C • {weather.fieldName}</p>
                  </div>
                  <div className="text-right space-y-1 text-xs text-slate-700">
                    <div className="flex items-center justify-end gap-1">
                      <Droplets className="w-3.5 h-3.5 text-sky-600" />
                      <span>{weather.humidity}% Humidity</span>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Wind className="w-3.5 h-3.5 text-slate-500" />
                      <span>{weather.windKmh} km/h ({weather.windDirectionCompass})</span>
                    </div>
                    <div>
                      Rain Prob: <strong className="text-blue-700">{weather.rainProbability}%</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700">Spraying Condition:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      weather.sprayAdvisory.status === 'Optimal'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {weather.sprayAdvisory.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{weather.sprayAdvisory.reason}</p>
                </div>
              </>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Weather data temporarily unavailable for this location.
              </div>
            )}
          </div>

          {/* C. Today's Tasks */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-forest-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Today's Tasks</h3>
                {pendingTodayCount > 0 && (
                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                    {pendingTodayCount} Due
                  </span>
                )}
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1"
              >
                <span>Manage</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scope Filter & Progress Bar */}
            {farmTodayTasks.length > 0 && (
              <div className="mb-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setTaskScope('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        taskScope === 'all'
                          ? 'bg-forest-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Farm ({farmTodayTasks.length})
                    </button>
                    {currentField && (
                      <button
                        onClick={() => setTaskScope('field')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          taskScope === 'field'
                            ? 'bg-forest-700 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {currentField.name} ({farmTodayTasks.filter(t => t.fieldId === currentField.id).length})
                      </button>
                    )}
                  </div>
                  <span className="font-semibold text-slate-600 text-[11px]">
                    {completedTodayCount}/{todayTasks.length} Done
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-forest-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${todayTasks.length > 0 ? (completedTodayCount / todayTasks.length) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {todayTasks.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1.5 opacity-80" />
                  <p className="font-bold text-slate-700">No pending tasks for today!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Say "Hey Vision, add task" to schedule new work.</p>
                </div>
              ) : (
                todayTasks.map(task => {
                  const field = currentFarm.fields.find(f => f.id === task.fieldId);
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskStatus(task.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                        task.status === 'Completed'
                          ? 'bg-slate-50 border-slate-200 text-slate-400'
                          : 'bg-white border-slate-200/80 text-slate-800 hover:border-forest-400 shadow-xs'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.status === 'Completed'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleTaskStatus(task.id)}
                        className="mt-0.5 rounded text-forest-600 focus:ring-forest-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-snug ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-forest-800 bg-forest-50 px-2 py-0.5 rounded">
                            <MapPin className="w-3 h-3 text-forest-600" />
                            {field?.name || 'Farm General'}
                          </span>
                          {task.voiceCreated && (
                            <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              Voice Created
                            </span>
                          )}
                          <span className="font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                            Due {task.dueDate}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Grid: E. Recent Observations, F. Media, & Assistant Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Observations (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-forest-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Recent Observations</h3>
            </div>
            <button
              onClick={() => onNavigate('observations')}
              className="text-xs font-bold text-forest-700 hover:text-forest-900"
            >
              All &rarr;
            </button>
          </div>
          <div className="space-y-3">
            {recentObs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No observations recorded in this field.</p>
            ) : (
              recentObs.slice(0, 3).map(obs => (
                <div key={obs.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-forest-800 uppercase">{obs.crop}</span>
                    <span>{obs.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{obs.title}</h4>
                  {obs.voiceTranscript && (
                    <p className="text-[11px] italic text-forest-800 mt-1 bg-forest-50 p-2 rounded-lg border border-forest-100">
                      {obs.voiceTranscript}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Photos & Videos (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-forest-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Field Media</h3>
            </div>
            <button
              onClick={() => onNavigate('media')}
              className="text-xs font-bold text-forest-700 hover:text-forest-900"
            >
              Gallery &rarr;
            </button>
          </div>
          {recentMedia.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">No media captured in this field yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {recentMedia.slice(0, 4).map(item => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('media')}
                  className="relative rounded-2xl overflow-hidden aspect-square border border-slate-200 cursor-pointer group"
                >
                  <img
                    src={item.thumbnailUrl}
                    alt={item.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-white text-[10px]">
                    <p className="font-bold line-clamp-1">{item.caption}</p>
                    <p className="text-slate-300 text-[9px]">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assistant Activity Timeline (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-forest-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Assistant Activity</h3>
            </div>
            <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full">
              Live Stream
            </span>
          </div>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
            {activityLog.slice(0, 5).map(act => (
              <div key={act.id} className="relative pl-7 text-xs">
                <div className="absolute left-1.5 top-1 w-3 h-3 rounded-full bg-forest-600 border-2 border-white shadow-xs" />
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-slate-900">{act.title}</span>
                  <span className="text-[10px] text-slate-400">{act.time}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">{act.detail}</p>
                {act.field && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-forest-700 bg-forest-50 px-1.5 py-0.2 rounded">
                    {act.field}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
