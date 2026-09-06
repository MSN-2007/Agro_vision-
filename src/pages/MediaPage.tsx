import React, { useState } from 'react';
import {
  Camera,
  Video,
  Filter,
  MapPin,
  X,
  Bot,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { MediaItem } from '../types/agro';

export const MediaPage: React.FC = () => {
  const { mediaItems, currentFarm } = useFarm();

  const [typeFilter, setTypeFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const filtered = mediaItems.filter(item => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (fieldFilter !== 'all' && item.fieldId !== fieldFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <Camera className="w-4 h-4" />
            <span>Digital Crop Imagery Vault</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Photos & Videos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Automatically organized by Farm &rarr; Field &rarr; Crop &rarr; Date &rarr; Type.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mr-2">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            All Media
          </button>
          <button
            onClick={() => setTypeFilter('photo')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              typeFilter === 'photo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Photos Only
          </button>
          <button
            onClick={() => setTypeFilter('video')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              typeFilter === 'video' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Videos Only
          </button>
        </div>

        {/* Field Filter */}
        <select
          value={fieldFilter}
          onChange={e => setFieldFilter(e.target.value)}
          aria-label="Filter media by Field"
          className="text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none cursor-pointer"
        >
          <option value="all">All Fields</option>
          {currentFarm.fields.map(f => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.crop})
            </option>
          ))}
        </select>

        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} items recorded
        </span>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filtered.map(item => {
          const field = currentFarm.fields.find(f => f.id === item.fieldId);
          return (
            <div
              key={item.id}
              onClick={() => setSelectedMedia(item)}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:border-forest-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="relative aspect-square overflow-hidden bg-slate-900">
                <img
                  src={item.thumbnailUrl}
                  alt={item.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white uppercase backdrop-blur-xs flex items-center gap-1">
                    {item.type === 'photo' ? <Camera className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                    <span>{item.type}</span>
                  </span>
                  {item.aiAnalyzed && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-600/80 text-white backdrop-blur-xs flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      <span>AI Analyzed</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>{item.crop}</span>
                  <span>{item.timestamp.split('•')[0]}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.caption}</h4>
                <p className="text-[11px] text-forest-700 font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{field?.name || 'Mango Plantation'}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Media Detail Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col md:flex-row">
            <div className="md:w-1/2 bg-black flex items-center justify-center">
              <img
                src={selectedMedia.url}
                alt={selectedMedia.caption}
                className="max-h-96 w-full object-contain"
              />
            </div>

            <div className="p-6 md:w-1/2 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                    {selectedMedia.type} • {selectedMedia.crop}
                  </span>
                  <button
                    onClick={() => setSelectedMedia(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 mt-2">
                  {selectedMedia.caption}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{selectedMedia.timestamp}</p>

                <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Farm:</span>
                    <strong className="text-slate-800">{currentFarm.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Field:</span>
                    <strong className="text-forest-700">Mango Plantation</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS Coordinates:</span>
                    <span className="font-mono text-slate-700">
                      {selectedMedia.location.lat.toFixed(4)}° N, {selectedMedia.location.lng.toFixed(4)}° E
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Wearable Device:</span>
                    <strong className="text-slate-800">AgroVision Pro Glasses</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedMedia(null)}
                  className="w-full py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs transition-colors"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
