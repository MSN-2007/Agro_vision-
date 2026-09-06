import React, { useState } from 'react';
import {
  Sun,
  MapPin,
  Trees,
  Glasses,
  CloudSun,
  AlertTriangle,
  CheckSquare,
  Eye,
  Camera,
  Video,
  Plus,
  Bot,
  Activity,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { PageId } from '../components/Sidebar';
import { QuickActionModal, QuickActionType } from '../components/QuickActionModal';

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

  const [quickAction, setQuickAction] = useState<QuickActionType>(null);

  const weather = currentField ? getFieldWeather(currentField.id) : getFieldWeather('field-mango-01');
  const todayTasks = tasks.filter(t => t.dueDate.toLowerCase().includes('today') || t.status === 'Pending');
  const activeAlerts = problems.filter(p => p.status !== 'Resolved');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Farmer Personalized Greeting & Status Strip */}
      <div className="bg-gradient-to-r from-forest-800 via-forest-700 to-forest-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle background leaves/grain decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-forest-600/30 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-forest-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Personalized Agricultural Overview</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Good morning, {user.name}
            </h1>
            <p className="text-forest-100 text-sm sm:text-base mt-1">
              Your AgroVision smart glasses are tracking real-time farm activities in{' '}
              <span className="font-bold underline decoration-forest-400">{currentFarm.name}</span>.
            </p>

            {/* Current Context Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md">
                <Trees className="w-3.5 h-3.5 text-emerald-300" />
                <span>{currentFarm.name}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>{currentField ? currentField.name : 'Outside Boundary'}</span>
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
                  Glasses: {device.connected ? `Connected (${device.batteryLevel}%)` : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          {/* Morning Briefing Quick Trigger */}
          <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
            <button
              onClick={() => setIsBriefingModalOpen(true)}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>Listen to Morning Briefing</span>
            </button>
            <span className="text-xs text-forest-200">
              Audio summary of weather, alerts & tasks
            </span>
          </div>
        </div>
      </div>

      {/* 2. Quick Actions Row (Master Prompt Section 3-G) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Quick Actions
          </h2>
          <span className="text-xs text-slate-400">Wearable & Hands-Free Shortcuts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setQuickAction('photo')}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-forest-400 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-forest-50 group-hover:bg-forest-600 text-forest-700 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Take Photo</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Glasses Camera</span>
          </button>

          <button
            onClick={() => setQuickAction('video')}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-rose-400 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-rose-50 group-hover:bg-rose-600 text-rose-700 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <Video className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Record Video</span>
            <span className="text-[10px] text-slate-400 mt-0.5">15s Canopy Clip</span>
          </button>

          <button
            onClick={() => setQuickAction('observation')}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 group-hover:bg-amber-600 text-amber-700 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <Eye className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Add Observation</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Voice or Text</span>
          </button>

          <button
            onClick={() => setQuickAction('task')}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-400 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Add Task</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Schedule work</span>
          </button>

          <button
            onClick={() => setQuickAction('reminder')}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Add Reminder</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Time-based alert</span>
          </button>

          <button
            onClick={() => setQuickAction('ask')}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-400 hover:shadow-md transition-all flex flex-col items-center text-center group"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-700 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-800">Ask AgroVision</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Conversational AI</span>
          </button>
        </div>
      </div>

      {/* 3. Core Cards Grid: A. Current Field, B. Weather, C. Tasks, D. Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Current Field & Active Alerts */}
        <div className="lg:col-span-7 space-y-6">
          {/* A. Current Field Card */}
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
                <span>View Full Map</span>
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
                        {currentField.healthPercentage}%
                      </span>
                      <p className="text-[10px] font-bold text-forest-700 uppercase">Crop Health</p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                        currentField.status === 'Healthy'
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentField.status === 'At Risk'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {currentField.status}
                    </span>
                  </div>
                </div>

                {/* Health Breakdown progress bar */}
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

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-forest-600" />
                    GPS: {currentGps.lat.toFixed(4)}° N, {currentGps.lng.toFixed(4)}° E
                  </span>
                  <button
                    onClick={() => onNavigate('crop-health')}
                    className="font-bold text-forest-700 hover:underline"
                  >
                    Health Breakdown & History &rarr;
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
              {activeAlerts.map(prob => (
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
                        AI: {prob.aiAnalysis.confidence}% Conf.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Weather & Today's Tasks */}
        <div className="lg:col-span-5 space-y-6">
          {/* B. Weather Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-forest-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Field Weather</h3>
              </div>
              <span className="text-xs font-bold text-forest-700">
                {weather.fieldName}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-forest-50 to-emerald-50 border border-forest-100">
              <div>
                <span className="text-4xl font-black text-slate-900">{weather.temperature}°C</span>
                <p className="text-xs font-bold text-forest-900 mt-0.5">{weather.condition}</p>
                <p className="text-[11px] text-slate-500">Feels like {weather.feelsLike}°C</p>
              </div>
              <div className="text-right space-y-1 text-xs text-slate-700">
                <div>
                  <span className="text-slate-500">Humidity:</span>{' '}
                  <strong>{weather.humidity}%</strong>
                </div>
                <div>
                  <span className="text-slate-500">Wind:</span>{' '}
                  <strong>{weather.windKmh} km/h</strong>
                </div>
                <div>
                  <span className="text-slate-500">Rain Prob:</span>{' '}
                  <strong className="text-blue-700">{weather.rainProbability}%</strong>
                </div>
              </div>
            </div>

            {/* Spray Advisory Banner */}
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-700">Spraying Condition:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  {weather.sprayAdvisory.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{weather.sprayAdvisory.reason}</p>
            </div>
          </div>

          {/* C. Today's Tasks */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-forest-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Today's Tasks</h3>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-bold text-forest-700 hover:text-forest-900"
              >
                Manage &rarr;
              </button>
            </div>

            <div className="space-y-2.5">
              {todayTasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No tasks scheduled for today.</p>
              ) : (
                todayTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => toggleTaskStatus(task.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      task.status === 'Completed'
                        ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                        : 'bg-white border-slate-200/80 text-slate-800 hover:border-forest-400 shadow-xs'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.status === 'Completed'}
                      onChange={() => toggleTaskStatus(task.id)}
                      className="mt-0.5 rounded text-forest-600 focus:ring-forest-500 w-4 h-4 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold leading-snug">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        {task.voiceCreated && (
                          <span className="text-forest-700 font-bold bg-forest-50 px-1.5 py-0.2 rounded">
                            Voice Created
                          </span>
                        )}
                        <span>Due {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: E. Recent Observations & F. Recent Photos/Videos & Assistant Timeline */}
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
            {observations.slice(0, 3).map(obs => (
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
            ))}
          </div>
        </div>

        {/* Recent Photos & Videos (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-forest-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Media Feed</h3>
            </div>
            <button
              onClick={() => onNavigate('media')}
              className="text-xs font-bold text-forest-700 hover:text-forest-900"
            >
              Gallery &rarr;
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {mediaItems.slice(0, 4).map(item => (
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
        </div>

        {/* Assistant Activity Timeline (4 cols) - Master Prompt Section 9 */}
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

      {/* Quick Action Sheet Modal */}
      <QuickActionModal
        action={quickAction}
        onClose={() => setQuickAction(null)}
        onNavigateToAssistant={() => onNavigate('assistant')}
      />
    </div>
  );
};
