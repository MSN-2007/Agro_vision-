import React from 'react';
import {
  Sparkles,
  Camera,
  Mic,
  Navigation,
  AlertTriangle,
  CheckSquare,
  Sun,
  X
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

interface DemoBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoBar: React.FC<DemoBarProps> = ({ isOpen, onClose }) => {
  const {
    simulateGpsMovement,
    simulatePhotoCapture,
    simulateVoiceObservation,
    simulateAiDiseaseAlert,
    simulateTaskCreation,
    simulateMorningBriefing,
    currentField
  } = useFarm();

  if (!isOpen) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-md text-slate-100 px-4 py-2 shadow-lg border-b border-slate-700/80 relative z-20 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Title / Description */}
        <div className="flex items-center gap-2 text-xs">
          <div className="p-1 rounded bg-slate-800 text-emerald-400 border border-slate-700">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold tracking-wide uppercase text-slate-200">Field Diagnostics & Simulation Sandbox</span>
            <span className="hidden lg:inline text-slate-400 ml-2">
              (Quickly test GPS location jumps, photo capture, and voice events)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 justify-center">
          {/* GPS Movement Dropdown / Trigger */}
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => simulateGpsMovement('mango')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded hover:bg-slate-700 transition-colors text-slate-200"
              title="Move GPS into Mango Plantation"
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate GPS Movement</span>
            </button>
            <div className="h-4 w-px bg-white/20 mx-0.5" />
            <select
              onChange={e => simulateGpsMovement(e.target.value as 'mango' | 'tomato' | 'strawberry' | 'outside')}
              aria-label="Target Field Simulation"
              className="bg-transparent text-xs text-white font-medium border-0 focus:ring-0 focus:outline-none pr-1 cursor-pointer"
            >
              <option value="mango" className="text-slate-800">Mango Field (Inside)</option>
              <option value="tomato" className="text-slate-800">Tomato Field (Inside)</option>
              <option value="strawberry" className="text-slate-800">Strawberry Field (Inside)</option>
              <option value="outside" className="text-slate-800">Outside Boundary</option>
            </select>
          </div>

          {/* Photo Capture */}
          <button
            onClick={simulatePhotoCapture}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all shadow-sm active:scale-95"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span>Simulate Photo Capture</span>
          </button>

          {/* Voice Observation */}
          <button
            onClick={simulateVoiceObservation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all shadow-sm active:scale-95"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate Voice Observation</span>
          </button>

          {/* Disease Alert */}
          <button
            onClick={simulateAiDiseaseAlert}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all shadow-sm active:scale-95"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Disease Alert</span>
          </button>

          {/* Task Creation */}
          <button
            onClick={simulateTaskCreation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all shadow-sm active:scale-95"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate Task Creation</span>
          </button>

          {/* Morning Briefing */}
          <button
            onClick={simulateMorningBriefing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all shadow-sm active:scale-95"
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Morning Briefing</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ml-1"
            title="Hide Diagnostics Bar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
