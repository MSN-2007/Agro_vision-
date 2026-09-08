import React, { useState } from 'react';
import {
  Eye,
  Plus,
  Mic,
  Camera,
  MapPin,
  CheckCircle2,
  Trash2,
  Filter,
  Volume2,
  Calendar,
  Layers
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { ObservationStatus } from '../types/agro';
import { QuickActionModal } from '../components/QuickActionModal';
import { speechService } from '../services/speechService';

export const ObservationsPage: React.FC = () => {
  const {
    observations,
    currentFarm,
    resolveObservation,
    deleteObservation,
    showToast
  } = useFarm();

  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filtered = observations.filter(obs => {
    if (selectedFieldFilter !== 'all' && obs.fieldId !== selectedFieldFilter) return false;
    if (selectedStatusFilter !== 'all' && obs.status !== selectedStatusFilter) return false;
    return true;
  });

  const handlePlayVoice = (transcript?: string) => {
    if (!transcript) return;
    showToast('Playing Audio', 'Playing voice note', 'info');
    speechService.speak(transcript);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <Eye className="w-4 h-4" />
            <span>Field Scouting & Observations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Farm Observations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Recorded via voice commands, geotagged camera captures, and scouting notes.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Observation</span>
        </button>
      </div>

      {/* Filters Strip */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2">
          <Filter className="w-4 h-4" />
          <span>Filter Records:</span>
        </div>

        <select
          value={selectedFieldFilter}
          onChange={e => setSelectedFieldFilter(e.target.value)}
          aria-label="Filter by Field"
          className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none cursor-pointer"
        >
          <option value="all">All Fields</option>
          {currentFarm.fields.map(f => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.crop})
            </option>
          ))}
        </select>

        <select
          value={selectedStatusFilter}
          onChange={e => setSelectedStatusFilter(e.target.value)}
          aria-label="Filter by Status"
          className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="Needs Attention">Needs Attention</option>
          <option value="Under Investigation">Under Investigation</option>
          <option value="Resolved">Resolved</option>
        </select>

        <span className="text-xs text-slate-400 ml-auto">
          Showing <strong>{filtered.length}</strong> of {observations.length} records
        </span>
      </div>

      {/* Observations Grid/Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
            <Eye className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">No matching observations found</p>
            <p className="text-xs mt-1">Try changing filter criteria or speak to AgroVision to add one.</p>
          </div>
        ) : (
          filtered.map(obs => (
            <div
              key={obs.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-forest-300 transition-all flex flex-col md:flex-row items-start justify-between gap-5"
            >
              <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                {obs.mediaUrl && (
                  <div className="relative rounded-2xl overflow-hidden w-full sm:w-36 aspect-video sm:aspect-square bg-slate-900 shrink-0 border border-slate-200">
                    <img
                      src={obs.mediaUrl}
                      alt={obs.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] font-bold bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-xs">
                      {obs.source === 'voice' ? 'Voice Note' : 'Field Photo'}
                    </span>
                  </div>
                )}

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                      {obs.crop}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {obs.locationName || currentFarm.name}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400">{obs.timestamp}</span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">{obs.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{obs.notes}</p>

                  {/* Attached Voice Recording */}
                  {obs.voiceTranscript && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-forest-50/70 border border-forest-100 text-xs text-forest-900">
                      <button
                        onClick={() => handlePlayVoice(obs.voiceTranscript)}
                        className="p-1.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white transition-colors"
                        title="Play audio playback"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <div>
                        <span className="font-bold text-[10px] uppercase tracking-wider text-forest-700 block">
                          Hands-Free Voice Note
                        </span>
                        <p className="italic text-forest-900 mt-0.5">{obs.voiceTranscript}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-forest-600" />
                      {obs.location.lat.toFixed(4)}° N, {obs.location.lng.toFixed(4)}° E
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Actions */}
              <div className="shrink-0 flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 gap-2">
                <span
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                    obs.status === 'Resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : obs.status === 'Under Investigation'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {obs.status}
                </span>

                <div className="flex items-center gap-2">
                  {obs.status !== 'Resolved' && (
                    <button
                      onClick={() => resolveObservation(obs.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                  <button
                    onClick={() => deleteObservation(obs.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <QuickActionModal
        action={isAddModalOpen ? 'observation' : null}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
