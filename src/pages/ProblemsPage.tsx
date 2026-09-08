import React from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Info
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { AiDiagnosisCard } from '../components/AiDiagnosisCard';

export const ProblemsPage: React.FC = () => {
  const { problems, currentFarm, resolveProblem, showToast } = useFarm();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Computer Vision Agricultural Diagnostic Pipeline</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Problems & Disease Alerts
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Detected via farmer voice scouting and analyzed through dedicated agricultural computer vision models.
        </p>
      </div>

      {/* Architecture Disclaimer Banner (Master Prompt Section 11) */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start gap-3 text-xs text-blue-950">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold uppercase tracking-wide text-blue-900">
            Dedicated Agricultural CV Model Pipeline
          </span>
          <p className="mt-0.5 leading-relaxed text-blue-800">
            Crop pathologies are evaluated by custom-trained agricultural vision models (
            <code className="bg-blue-100 px-1 py-0.2 rounded font-mono font-bold">AgroVision-CropVision v3.2</code>
            ) rather than a general LLM. The conversational AgroVision assistant explains findings and guides treatment schedules.
          </p>
        </div>
      </div>

      {/* Problems List */}
      <div className="space-y-4">
        {problems.map(prob => {
          const field = currentFarm.fields.find(f => f.id === prob.fieldId);
          return (
            <div
              key={prob.id}
              className="bg-white rounded-3xl p-6 border border-amber-200/90 shadow-xs space-y-4"
            >
              {/* Problem Card Top */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-4">
                  {prob.imageUrl && (
                    <img
                      src={prob.imageUrl}
                      alt={prob.crop}
                      className="w-24 h-24 rounded-2xl object-cover border border-amber-300 shrink-0"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                        {prob.crop}
                      </span>
                      <span className="text-xs text-slate-400">{prob.reportedAt}</span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 mt-1">
                      {prob.aiAnalysis?.possibleDisease || 'Possible Crop Anomaly'}
                    </h3>

                    <p className="text-xs text-forest-800 font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{field?.name || 'Mango Plantation'}</span>
                    </p>

                    <p className="text-xs text-slate-600 italic mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      Farmer Note: {prob.farmerNote}
                    </p>
                  </div>
                </div>

                {/* Status & Resolve button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <span
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                      prob.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : prob.status === 'AI Analyzed'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {prob.status}
                  </span>

                  {prob.status !== 'Resolved' && (
                    <button
                      onClick={() => resolveProblem(prob.id)}
                      className="px-3.5 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark Action Taken</span>
                    </button>
                  )}
                </div>
              </div>

              {/* AI Diagnosis Output Card with Scoring & Verified Data Sources */}
              {prob.aiAnalysis && (
                <AiDiagnosisCard
                  aiAnalysis={prob.aiAnalysis}
                  fieldName={field?.name}
                  cropName={prob.crop}
                  gpsFallback={field?.center}
                  defaultExpanded={false}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
