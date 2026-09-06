import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  HeartPulse,
  Eye,
  Camera,
  AlertTriangle,
  CheckSquare,
  History,
  Layers,
  CloudSun,
  Plus,
  CheckCircle2,
  Wind,
  Droplets,
  ExternalLink
} from 'lucide-react';
import { Field } from '../types/agro';
import { useFarm } from '../context/FarmContext';
import { QuickActionModal, QuickActionType } from '../components/QuickActionModal';

interface FieldDetailPageProps {
  field: Field;
  onBack: () => void;
  onOpenMap: () => void;
}

type TabType = 'overview' | 'map' | 'observations' | 'media' | 'problems' | 'tasks' | 'history';

export const FieldDetailPage: React.FC<FieldDetailPageProps> = ({ field, onBack, onOpenMap }) => {
  const {
    getFieldObservations,
    getFieldMedia,
    getFieldProblems,
    getFieldTasks,
    getFieldReminders,
    getFieldWeather,
    toggleTaskStatus,
    resolveObservation
  } = useFarm();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [modalAction, setModalAction] = useState<QuickActionType>(null);

  // Strict Field Data Isolation (Sections 26-31)
  const fieldObs = getFieldObservations(field.id);
  const fieldMedia = getFieldMedia(field.id);
  const fieldProblems = getFieldProblems(field.id);
  const fieldTasks = getFieldTasks(field.id);
  const fieldReminders = getFieldReminders(field.id);
  const weather = getFieldWeather(field.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation Strip */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Fields</span>
        </button>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
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
          <span className="text-xs text-slate-500 font-medium">
            Health: {field.healthPercentage !== null ? `${field.healthPercentage}%` : 'Unanalyzed'}
          </span>
        </div>
      </div>

      {/* Field Hero Banner */}
      <div className="bg-gradient-to-r from-forest-800 to-forest-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-forest-300 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Field Profile</span>
              <span>•</span>
              <span>Planted {field.plantingDate}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{field.name}</h1>
            <p className="text-forest-100 text-sm mt-1">
              Crop: <strong className="text-white">{field.crop}</strong> • {field.areaAcres} Acres registered area
            </p>

            <div className="flex items-center gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1.5 text-forest-200">
                <MapPin className="w-4 h-4 text-amber-300" />
                Center: {field.center.lat.toFixed(4)}° N, {field.center.lng.toFixed(4)}° E
              </span>
              <span className="text-forest-400">|</span>
              <span className="text-forest-200">
                Geo-fence: {field.boundary.length > 0 ? `${field.boundary.length} GPS Vertices` : 'No boundary drawn'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div className="text-center">
              <span className="text-3xl font-black text-white">
                {field.healthPercentage !== null ? `${field.healthPercentage}%` : '—'}
              </span>
              <p className="text-[10px] uppercase font-bold text-forest-300">Health Rating</p>
            </div>
            <div className="h-10 w-px bg-white/20" />
            <div className="text-center">
              <span className="text-3xl font-black text-amber-300">{fieldProblems.length}</span>
              <p className="text-[10px] uppercase font-bold text-forest-300">Active Issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* 7 Tabs Navigation (Section 5) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'map', label: 'Map & Boundary', icon: MapPin },
          { id: 'observations', label: 'Observations', icon: Eye, count: fieldObs.length },
          { id: 'media', label: 'Media Library', icon: Camera, count: fieldMedia.length },
          { id: 'problems', label: 'Problems & AI', icon: AlertTriangle, count: fieldProblems.length },
          { id: 'tasks', label: 'Tasks & Reminders', icon: CheckSquare, count: fieldTasks.length },
          { id: 'history', label: 'History & Logs', icon: History }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all ${
                active
                  ? 'bg-forest-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    active ? 'bg-forest-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Health Breakdown or Unanalyzed state (Section 26 & 27) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="font-extrabold text-slate-900 text-base mb-3">Health Distribution</h3>
              {field.healthBreakdown ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-600">Healthy Canopy</span>
                      <strong className="text-emerald-700">{field.healthBreakdown.healthy}%</strong>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${field.healthBreakdown.healthy}%` }}
                        className="bg-emerald-500 h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-600">At Risk (Monitor)</span>
                      <strong className="text-amber-600">{field.healthBreakdown.atRisk}%</strong>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${field.healthBreakdown.atRisk}%` }}
                        className="bg-amber-400 h-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span className="text-slate-600">Critical / Infected</span>
                      <strong className="text-rose-600">{field.healthBreakdown.critical}%</strong>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${field.healthBreakdown.critical}%` }}
                        className="bg-rose-500 h-full"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">No crop health data available yet.</p>
                  <p className="text-[11px]">Capture photos or observations to trigger agricultural CV analysis.</p>
                </div>
              )}
            </div>

            {/* Weather Snapshot on Field Page (Section 20) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-slate-900 text-base">Current Weather</h3>
                  <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full">
                    Localized
                  </span>
                </div>

                {weather && !weather.isError ? (
                  <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100 space-y-2 text-xs">
                    <div className="flex items-baseline justify-between">
                      <span className="text-3xl font-black text-slate-900">{weather.temperature}°C</span>
                      <span className="text-xs font-bold text-forest-900">{weather.condition}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                      <div>Humidity: <strong>{weather.humidity}%</strong></div>
                      <div>Wind: <strong>{weather.windKmh} km/h {weather.windDirectionCompass}</strong></div>
                      <div>Rain Prob: <strong>{weather.rainProbability}%</strong></div>
                      <div>UV Index: <strong>{weather.uvIndex}</strong></div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-400">
                    Weather data temporarily unavailable for this field.
                  </div>
                )}
              </div>

              {/* Section 20: "View Full Weather" link */}
              <button
                onClick={() => window.location.hash = '#weather'}
                className="mt-3 text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center justify-between p-2 rounded-xl bg-forest-50/50 hover:bg-forest-100 transition-colors"
              >
                <span>View Full Weather & Forecast</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Geo-Fence Metadata */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
              <h3 className="font-extrabold text-slate-900 text-base mb-3">Parcel Geo-Fence</h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex justify-between py-1 border-b border-slate-100">
                  <span>Planted Crop:</span>
                  <strong className="text-slate-900">{field.crop}</strong>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-100">
                  <span>Registered Area:</span>
                  <strong className="text-slate-900">{field.areaAcres} Acres</strong>
                </li>
                <li className="flex justify-between py-1 border-b border-slate-100">
                  <span>GPS Vertices:</span>
                  <strong className="text-slate-900">
                    {field.boundary.length > 0 ? `${field.boundary.length} Coordinates` : 'Unassigned'}
                  </strong>
                </li>
                <li className="flex justify-between py-1">
                  <span>Boundary Status:</span>
                  <strong className={field.boundary.length > 0 ? 'text-emerald-700' : 'text-amber-700'}>
                    {field.boundary.length > 0 ? 'Active Geo-fence' : 'Boundary Required'}
                  </strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Field Notes */}
          {field.notes && (
            <div className="p-5 rounded-3xl bg-forest-50/60 border border-forest-100">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-forest-900 mb-1">
                Field Notes & Agronomic Guidelines
              </h4>
              <p className="text-xs text-forest-800 leading-relaxed">{field.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MAP */}
      {activeTab === 'map' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Field Boundary Coordinates</h3>
              <p className="text-xs text-slate-500">
                Coordinates stored for automatic wearable hands-free geo-fence detection.
              </p>
            </div>
            <button
              onClick={onOpenMap}
              className="px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Open Interactive Boundary Studio
            </button>
          </div>

          {field.boundary.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {field.boundary.map((pt, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between">
                  <span className="font-semibold text-forest-800">Point #{i + 1}</span>
                  <span className="font-mono text-slate-600">{pt.lat.toFixed(5)}° N, {pt.lng.toFixed(5)}° E</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
              This field does not have a boundary yet. Click the button above to draw one on the interactive map.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OBSERVATIONS (Sections 23 & 29: Add Observation button available on field page) */}
      {activeTab === 'observations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base">
              Observations in {field.name} ({fieldObs.length})
            </h3>
            <button
              onClick={() => setModalAction('observation')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Observation</span>
            </button>
          </div>

          {fieldObs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200 space-y-3">
              <Eye className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700">0 observations recorded in this field.</p>
              <p className="text-xs">No records have been assigned to this plot yet.</p>
              <button
                onClick={() => setModalAction('observation')}
                className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Record First Observation
              </button>
            </div>
          ) : (
            fieldObs.map(obs => (
              <div
                key={obs.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {obs.mediaUrl && (
                    <img
                      src={obs.mediaUrl}
                      alt={obs.title}
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {obs.source}
                      </span>
                      <span className="text-xs text-slate-400">{obs.timestamp}</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900 mt-1">{obs.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{obs.notes}</p>
                    {obs.voiceTranscript && (
                      <p className="text-xs italic text-forest-800 bg-forest-50 p-2.5 rounded-xl border border-forest-100 mt-2">
                        {obs.voiceTranscript}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      obs.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {obs.status}
                  </span>
                  {obs.status !== 'Resolved' && (
                    <button
                      onClick={() => resolveObservation(obs.id)}
                      className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: MEDIA (Sections 23 & 28: Upload button on field page) */}
      {activeTab === 'media' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base">
              Field Media Library ({fieldMedia.length})
            </h3>
            <button
              onClick={() => setModalAction('photo')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Capture / Upload Media</span>
            </button>
          </div>

          {fieldMedia.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200 space-y-3">
              <Camera className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700">0 media items in this field.</p>
              <p className="text-xs">Take photos with your smart glasses inside this field boundary.</p>
              <button
                onClick={() => setModalAction('photo')}
                className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Upload Photo Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {fieldMedia.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs group relative"
                >
                  <img
                    src={item.thumbnailUrl}
                    alt={item.caption}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-3">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.caption}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROBLEMS (Section 31: Isolated per field) */}
      {activeTab === 'problems' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">
            Crop Problems in {field.name} ({fieldProblems.length})
          </h3>

          {fieldProblems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
              <p className="font-bold text-slate-700">No active problems reported in this field.</p>
              <p className="text-xs mt-1">Scout crops with AgroVision glasses to monitor plant health.</p>
            </div>
          ) : (
            fieldProblems.map(prob => (
              <div
                key={prob.id}
                className="bg-white rounded-3xl p-6 border border-amber-200/80 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    {prob.imageUrl && (
                      <img
                        src={prob.imageUrl}
                        alt={prob.crop}
                        className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        {prob.crop}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1">
                        {prob.aiAnalysis?.possibleDisease || 'Under Investigation'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{prob.reportedAt}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-100 text-emerald-800">
                      CV Conf: {prob.aiAnalysis?.confidence || 85}%
                    </span>
                  </div>
                </div>

                {prob.aiAnalysis && (
                  <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100 space-y-2 text-xs">
                    <p className="font-bold text-forest-900">Recommended Action:</p>
                    <p className="text-forest-800 leading-relaxed">{prob.aiAnalysis.recommendedAction}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 6: TASKS & REMINDERS (Sections 23 & 30: Isolated per field) */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base">
              Tasks & Reminders for {field.name} ({fieldTasks.length})
            </h3>
            <button
              onClick={() => setModalAction('task')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {fieldTasks.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200 space-y-3">
              <CheckSquare className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700">No tasks scheduled for this field.</p>
              <button
                onClick={() => setModalAction('task')}
                className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Create a Task
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {fieldTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => toggleTaskStatus(task.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    task.status === 'Completed'
                      ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                      : 'bg-white border-slate-200/80 text-slate-800 hover:border-forest-400 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.status === 'Completed'}
                      onChange={() => toggleTaskStatus(task.id)}
                      className="rounded text-forest-600 focus:ring-forest-500 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold">{task.title}</p>
                      <span className="text-[10px] text-slate-500">Due {task.dueDate}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{task.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Parcel Operational Log</h3>
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 pl-7 text-xs">
            <div className="relative">
              <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-forest-600 border-2 border-white" />
              <p className="font-bold text-slate-900">{field.plantingDate}</p>
              <p className="text-slate-600">Field parcel registered with {field.crop}.</p>
            </div>
            {fieldObs.map(obs => (
              <div key={obs.id} className="relative">
                <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white" />
                <p className="font-bold text-slate-900">{obs.timestamp}</p>
                <p className="text-slate-600">Observation logged: {obs.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contextual Action Modal for this field */}
      <QuickActionModal
        action={modalAction}
        onClose={() => setModalAction(null)}
      />
    </div>
  );
};
