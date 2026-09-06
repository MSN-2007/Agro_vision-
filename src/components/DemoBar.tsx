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
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white px-4 py-2.5 shadow-md border-b border-amber-400 relative z-20 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Title / Description */}
        <div className="flex items-center gap-2 text-xs">
          <div className="p-1 rounded bg-white/20">
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
          <div>
            <span className="font-extrabold tracking-wide uppercase">Wearable Hardware Simulator</span>
            <span className="hidden lg:inline text-amber-100 ml-2">
              (Simulate smart glasses hands-free actions & AI analysis)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 justify-center">
          {/* GPS Movement Dropdown / Trigger */}
          <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/20">
            <button
              onClick={() => simulateGpsMovement('mango')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded hover:bg-white/20 transition-colors"
              title="Move GPS into Mango Plantation"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-200" />
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 transition-all shadow-sm active:scale-95"
          >
            <Camera className="w-3.5 h-3.5 text-amber-200" />
            <span>Simulate Photo Capture</span>
          </button>

          {/* Voice Observation */}
          <button
            onClick={simulateVoiceObservation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 transition-all shadow-sm active:scale-95"
          >
            <Mic className="w-3.5 h-3.5 text-amber-200" />
            <span>Simulate Voice Observation</span>
          </button>

          {/* Disease Alert */}
          <button
            onClick={simulateAiDiseaseAlert}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 transition-all shadow-sm active:scale-95"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
            <span>Simulate Disease Alert</span>
          </button>

          {/* Task Creation */}
          <button
            onClick={simulateTaskCreation}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 transition-all shadow-sm active:scale-95"
          >
            <CheckSquare className="w-3.5 h-3.5 text-amber-200" />
            <span>Simulate Task Creation</span>
          </button>

          {/* Morning Briefing */}
          <button
            onClick={simulateMorningBriefing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 transition-all shadow-sm active:scale-95"
          >
            <Sun className="w-3.5 h-3.5 text-amber-200" />
            <span>Simulate Morning Briefing</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors ml-1"
            title="Hide Demo Bar"
          >
            <X className="w-4 h-4 text-amber-200 hover:text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
