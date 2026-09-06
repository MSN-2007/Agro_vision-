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
  ArrowRight,
  Filter
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

export const FarmMemoryPage: React.FC = () => {
  const { currentFarm, currentField, observations, problems, tasks, mediaItems } = useFarm();
  const [query, setQuery] = useState('');
  const [activeResult, setActiveResult] = useState<string | null>(null);
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>('all');

  const sampleQuestions = [
    'What did I record in my mango field yesterday?',
    'What problems does my tomato field have?',
    'When did I last inspect the strawberry field?',
    'Show me all problems in the mango plantation.'
  ];

  // Farm Memory Query Engine respecting field isolation (Section 25)
  const handleAskMemory = (questionText: string) => {
    setQuery(questionText);
    const lower = questionText.toLowerCase();

    // 1. Identify target field from query
    let targetField = currentFarm.fields.find(f => lower.includes(f.name.toLowerCase()) || lower.includes(f.crop.toLowerCase()));
    
    // If not found in text, check if filtered by field
    if (!targetField && selectedFieldFilter !== 'all') {
      targetField = currentFarm.fields.find(f => f.id === selectedFieldFilter);
    }

    if (lower.includes('mango') || (targetField && targetField.name.toLowerCase().includes('mango'))) {
      const mangoField = currentFarm.fields.find(f => f.name.toLowerCase().includes('mango'));
      const mangoObs = observations.filter(o => o.fieldId === mangoField?.id);
      const mangoProbs = problems.filter(p => p.fieldId === mangoField?.id);

      if (lower.includes('problem')) {
        setActiveResult(
          mangoProbs.length > 0
            ? `Mango Plantation Memory: Found ${mangoProbs.length} recorded problem(s). Latest: ${mangoProbs[0].aiAnalysis?.possibleDisease || mangoProbs[0].farmerNote} (Confidence: ${mangoProbs[0].aiAnalysis?.confidence}%). Recommended Action: ${mangoProbs[0].aiAnalysis?.recommendedAction}`
            : 'Mango Plantation Memory: Zero crop problems currently active in the Mango Plantation.'
        );
      } else {
        setActiveResult(
          mangoObs.length > 0
            ? `Mango Plantation Memory: On ${mangoObs[0].timestamp}, you recorded: "${mangoObs[0].title}". Notes: "${mangoObs[0].notes}". Voice transcript attached.`
            : 'Mango Plantation Memory: No recent observations recorded for this parcel.'
        );
      }
    } else if (lower.includes('tomato') || (targetField && targetField.name.toLowerCase().includes('tomato'))) {
      const tomatoField = currentFarm.fields.find(f => f.name.toLowerCase().includes('tomato'));
      const tomatoObs = observations.filter(o => o.fieldId === tomatoField?.id);
      const tomatoProbs = problems.filter(p => p.fieldId === tomatoField?.id);

      if (lower.includes('problem')) {
        setActiveResult(
          tomatoProbs.length > 0
            ? `Tomato Field Memory: Found ${tomatoProbs.length} issue(s). Pathogen: ${tomatoProbs[0].aiAnalysis?.possibleDisease || 'Early Blight'}. Action taken: ${tomatoProbs[0].aiAnalysis?.recommendedAction}`
            : 'Tomato Field Memory: No active pathology issues recorded for the Tomato Field.'
        );
      } else {
        setActiveResult(
          tomatoObs.length > 0
            ? `Tomato Field Memory: Last recorded inspection on ${tomatoObs[0].timestamp}. Title: "${tomatoObs[0].title}".`
            : 'Tomato Field Memory: No scouting observations currently recorded for Tomato Field.'
        );
      }
    } else if (lower.includes('strawberry') || (targetField && targetField.name.toLowerCase().includes('strawberry'))) {
      const strawField = currentFarm.fields.find(f => f.name.toLowerCase().includes('strawberry'));
      const strawObs = observations.filter(o => o.fieldId === strawField?.id);

      setActiveResult(
        strawObs.length > 0
          ? `Strawberry Field Memory: Inspection on ${strawObs[0].timestamp}. Status: "${strawObs[0].title}". Crown growth and fruit set normal.`
          : 'Strawberry Field Memory: Zero scouting records stored for Strawberry Field.'
      );
    } else if (targetField) {
      const fieldObs = observations.filter(o => o.fieldId === targetField?.id);
      setActiveResult(
        fieldObs.length > 0
          ? `Memory for ${targetField.name}: Found ${fieldObs.length} observation(s). Latest: "${fieldObs[0].title}".`
          : `Memory for ${targetField.name}: This field has 0 observations and 0 problems recorded yet.`
      );
    } else {
      setActiveResult(
        `AgroVision Farm Memory holds ${observations.length} observations, ${mediaItems.length} media files, and ${problems.length} problems across ${currentFarm.name}. Specify a field name (e.g. Mango, Tomato) to query parcel-specific memory.`
      );
    }
  };

  const filteredObservations = observations.filter(obs => {
    if (selectedFieldFilter !== 'all' && obs.fieldId !== selectedFieldFilter) return false;
    return true;
  });

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
          Query past farm scouting, disease alerts, spray history, and weather patterns. Responses strictly isolate parcel-specific data.
        </p>
      </div>

      {/* Query Search Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Ask AgroVision Farm Memory
          </label>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Scope to Field:</span>
            <select
              value={selectedFieldFilter}
              onChange={e => setSelectedFieldFilter(e.target.value)}
              className="text-xs font-bold bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-slate-800"
            >
              <option value="all">All Parcels</option>
              {currentFarm.fields.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

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
            <span>Retrieve</span>
          </button>
        </div>

        {/* Suggested Queries */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-400">Sample Questions:</span>
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
          <div className="mt-4 p-5 rounded-2xl bg-forest-50/90 border border-forest-200 space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 text-forest-800 text-xs font-extrabold uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Digital Recall Output</span>
            </div>
            <p className="text-sm font-medium text-forest-950 leading-relaxed">
              {activeResult}
            </p>
          </div>
        )}
      </div>

      {/* Memory Chronology Feed */}
      <div>
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">Historical Farm Records</h2>
        {filteredObservations.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center text-slate-400 border border-slate-200">
            No memories or observations stored for this parcel.
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredObservations.map(obs => (
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
                    GPS Tagged
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
