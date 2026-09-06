import React, { useState } from 'react';
import {
  BrainCircuit,
  Search,
  Sparkles,
  Calendar,
  Eye,
  Camera,
  AlertTriangle,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

export const FarmMemoryPage: React.FC = () => {
  const { currentFarm, observations, problems, tasks, mediaItems } = useFarm();
  const [query, setQuery] = useState('');
  const [activeResult, setActiveResult] = useState<string | null>(null);

  const sampleQuestions = [
    'What did I record in my mango field yesterday?',
    'What problem did I report last week?',
    'When did I last inspect the tomato field?',
    'Show me all problems in the mango plantation.'
  ];

  const handleAskMemory = (question: string) => {
    setQuery(question);
    const lower = question.toLowerCase();

    if (lower.includes('yesterday') || lower.includes('record in my mango')) {
      setActiveResult(
        'On September 5th at 10:32 AM, you captured a voice observation in the Mango Plantation (NE Sector): "Leaves on lower tree clusters are turning yellow". A 12MP photo was automatically geo-tagged, and the Agricultural CV model identified Anthracnose (87% confidence).'
      );
    } else if (lower.includes('problem') && lower.includes('mango')) {
      setActiveResult(
        'Found 1 active problem in Mango Plantation: Anthracnose detected with moderate severity. Recommended action: Prune affected branches and apply Copper Oxychloride spray before evening humidity.'
      );
    } else if (lower.includes('tomato')) {
      setActiveResult(
        'Tomato Field was last inspected 2 days ago at 04:15 PM. A photo of a drip line leak near Row 4 was logged, and early blight signs were flagged for trellis repair.'
      );
    } else {
      setActiveResult(
        `AgroVision Farm Memory has indexed 3 fields, ${observations.length} observations, ${mediaItems.length} photos/videos, and ${problems.length} crop alerts across ${currentFarm.name}.`
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
          <BrainCircuit className="w-4 h-4 text-emerald-600" />
          <span>Long-Term Digital Farm Memory & Retrieval Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Farm Memory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          AgroVision remembers every voice note, geo-tagged photo, disease symptom, weather pattern, and agronomic intervention.
        </p>
      </div>

      {/* Query Search Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
        <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
          Query Farm Memory in Natural Language
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAskMemory(query)}
              placeholder="e.g. What did I record in my mango field yesterday?"
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => handleAskMemory(query)}
            className="px-6 py-3 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all shrink-0 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Search Memory</span>
          </button>
        </div>

        {/* Suggested Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-bold text-slate-400">Try Asking:</span>
          {sampleQuestions.map(q => (
            <button
              key={q}
              onClick={() => handleAskMemory(q)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-forest-50 hover:text-forest-800 text-slate-700 font-medium transition-colors"
            >
              “{q}”
            </button>
          ))}
        </div>

        {/* Memory Search Result Banner */}
        {activeResult && (
          <div className="mt-4 p-5 rounded-2xl bg-forest-50/80 border border-forest-200 space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 text-forest-800 text-xs font-extrabold uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>AgroVision Memory Recall</span>
            </div>
            <p className="text-sm font-medium text-forest-950 leading-relaxed">
              {activeResult}
            </p>
          </div>
        )}
      </div>

      {/* Memory Chronology Feed */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">Historical Memory Archive</h2>
        <div className="space-y-4">
          {observations.map(obs => (
            <div
              key={obs.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center shrink-0">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                      {obs.crop}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{obs.locationName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400">{obs.timestamp}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">{obs.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{obs.notes}</p>
                  {obs.voiceTranscript && (
                    <p className="text-xs italic text-forest-800 bg-forest-50 p-2.5 rounded-xl border border-forest-100 mt-2">
                      {obs.voiceTranscript}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-forest-700 bg-forest-50 px-3 py-1.5 rounded-xl">
                  GPS Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
