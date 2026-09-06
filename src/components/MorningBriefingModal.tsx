import React from 'react';
import {
  Sun,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertTriangle,
  Eye,
  CheckSquare,
  X,
  Trees
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { speechService } from '../services/speechService';

export const MorningBriefingModal: React.FC = () => {
  const {
    isBriefingModalOpen,
    setIsBriefingModalOpen,
    currentFarm,
    currentField,
    getFieldWeather,
    tasks,
    problems,
    observations
  } = useFarm();

  if (!isBriefingModalOpen) return null;

  const weather = getFieldWeather(currentField?.id);
  const targetField = currentField || currentFarm.fields[0];

  const todayTasks = tasks.filter(t => {
    if (t.status !== 'Pending' && !t.dueDate.toLowerCase().includes('today')) return false;
    if (targetField && t.fieldId && t.fieldId !== targetField.id) return false;
    return true;
  });

  const activeAlerts = problems.filter(p => {
    if (p.status === 'Resolved') return false;
    if (targetField && p.fieldId && p.fieldId !== targetField.id) return false;
    return true;
  });

  const fieldObs = targetField
    ? observations.filter(o => o.fieldId === targetField.id)
    : observations;
  const recentObs = fieldObs[0];

  const handleSpeakBriefing = () => {
    const weatherStr = weather && !weather.isError
      ? `Weather is ${weather.temperature} degrees Celsius, ${weather.condition} with ${weather.rainProbability} percent chance of rain.`
      : '';
    const taskStr = todayTasks.length > 0
      ? `Today's tasks include: ${todayTasks.map(t => t.title).join(', ')}.`
      : 'No tasks scheduled for today.';
    const alertStr = activeAlerts.length > 0
      ? `Active alerts: ${activeAlerts.length} observation requires attention.`
      : 'No active crop alerts.';

    const text = `Good morning Ravi. ${targetField?.name || currentFarm.name} is currently being monitored. ${weatherStr} ${taskStr} ${alertStr}`;
    speechService.speak(text);
  };

  const handleStopSpeaking = () => {
    speechService.stopSpeaking();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-forest-100 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-forest-700 via-forest-800 to-forest-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-forest-200 text-xs font-bold uppercase tracking-wider">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>AgroVision Daily Briefing</span>
            </div>
            <button
              onClick={() => {
                handleStopSpeaking();
                setIsBriefingModalOpen(false);
              }}
              className="text-white/70 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-2xl font-black mt-2 tracking-tight">
            Good Morning, Ravi
          </h2>
          <div className="flex items-center gap-2 mt-1 text-forest-100 text-xs">
            <Trees className="w-4 h-4 text-forest-300" />
            <span>
              <strong>{currentFarm.name}</strong> • {targetField ? targetField.name : 'Farm Overview'}
            </span>
          </div>

          {/* Audio controls */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleSpeakBriefing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-600 hover:bg-forest-500 text-white text-xs font-bold shadow-md transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Read Aloud</span>
            </button>
            <button
              onClick={handleStopSpeaking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-forest-100 text-xs font-medium transition-colors"
            >
              <VolumeX className="w-3.5 h-3.5" />
              <span>Stop Audio</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Weather Section */}
          {weather && !weather.isError ? (
            <div className="p-4 rounded-2xl bg-forest-50/60 border border-forest-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase text-forest-700 tracking-wider">Weather Conditions</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900">{weather.temperature}°C</span>
                  <span className="text-sm font-semibold text-forest-900">{weather.condition}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {weather.rainProbability}% chance of rain • Wind {weather.windKmh} km/h {weather.windDirectionCompass}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  weather.sprayAdvisory.status === 'Optimal' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {weather.sprayAdvisory.status} Spray Window
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
              Weather data temporarily unavailable for this parcel.
            </div>
          )}

          {/* Today's Tasks */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                <CheckSquare className="w-4 h-4 text-forest-600" />
                <span>Today's Farm Tasks</span>
              </div>
              <span className="text-xs font-bold text-forest-700">{todayTasks.length} pending</span>
            </div>
            {todayTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">No tasks scheduled for this field today.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-slate-700">
                {todayTasks.slice(0, 3).map(task => (
                  <li key={task.id} className="flex items-start gap-2">
                    <span className="text-forest-600 font-bold">•</span>
                    <span>{task.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Observation */}
          {recentObs && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wide mb-1">
                <Eye className="w-4 h-4 text-amber-600" />
                <span>Recent Observation ({recentObs.locationName})</span>
              </div>
              <p className="text-xs font-semibold text-slate-900">{recentObs.title}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">{recentObs.notes}</p>
            </div>
          )}

          {/* Active Alerts */}
          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-rose-950">Active Alerts</p>
                <p className="text-[11px] text-rose-800">
                  {activeAlerts.length > 0
                    ? `${activeAlerts.length} observation requires attention in ${targetField?.name || currentFarm.name}.`
                    : 'Zero critical crop problems detected.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={() => {
              handleStopSpeaking();
              setIsBriefingModalOpen(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs transition-colors shadow-sm"
          >
            Acknowledge & Start Day
          </button>
        </div>
      </div>
    </div>
  );
};
