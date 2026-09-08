import React from 'react';
import { useFarm } from '../context/FarmContext';
import { Map, MapPin, CalendarClock, CloudRain, Droplets, Sprout, ShieldAlert, ArrowRight } from 'lucide-react';

export const FarmGuidancePage: React.FC = () => {
  const { currentField, currentFarm } = useFarm();

  const guidanceData = [
    { day: 'Day 1-14', title: 'Seedling Establishment', task: 'Monitor soil moisture closely. Maintain 60-70% humidity.' },
    { day: 'Day 15-30', title: 'Vegetative Growth', task: 'Apply first round of nitrogen-rich fertilizer. Check for early pests.' },
    { day: 'Day 31-45', title: 'Pre-Flowering', task: 'Reduce nitrogen, increase phosphorus. Setup drip irrigation properly.' },
    { day: 'Day 46-60', title: 'Flowering & Fruit Set', task: 'Critical water period. Apply calcium/boron foliar spray.' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <Sprout className="w-4 h-4" />
            <span>Agronomy & Crop Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Advanced Farm Guidance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Day-wise roadmap, weather-compatible irrigation, and field insights for {currentField?.name || currentFarm.name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Roadmap */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <CalendarClock className="w-6 h-6 text-forest-600" />
              <h2 className="text-lg font-extrabold text-slate-900">Crop Roadmap: Day-wise Guidance</h2>
            </div>
            
            <div className="relative border-l-2 border-forest-100 ml-3 space-y-8 pb-4">
              {guidanceData.map((step, idx) => (
                <div key={idx} className="relative pl-6">
                  <span className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white ${idx === 1 ? 'bg-amber-500 animate-pulse' : 'bg-forest-400'}`}></span>
                  <div className={`p-4 rounded-2xl ${idx === 1 ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-100'}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{step.day}</span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-1">{step.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{step.task}</p>
                    {idx === 1 && (
                      <button className="mt-3 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold transition-colors">
                        Mark in Progress
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Irrigation & Forecasting */}
        <div className="space-y-6">
          {/* Weather Compatible Irrigation */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-3xl p-6 border border-sky-200/60 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sky-900 text-sm flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-sky-600" />
                Weather-Compatible Irrigation
              </h3>
            </div>
            
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-white/60 rounded-2xl border border-sky-100">
                <p className="font-bold text-slate-700">Rain Pattern Analysis</p>
                <p className="text-slate-500 mt-1">15mm of rain detected in the last 48 hours. Forecast predicts light showers tomorrow.</p>
              </div>

              <div className="p-3 bg-white/60 rounded-2xl border border-sky-100">
                <p className="font-bold text-slate-700">Water Distribution</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-500 rounded-full h-2 w-[30%]"></div>
                  </div>
                  <span className="font-bold text-blue-700">30% Volume</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Recommendation: Reduce drip irrigation volume by 70% to prevent root rot.</p>
              </div>

              <button className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center justify-center gap-2 transition-colors">
                <Droplets className="w-4 h-4" />
                Apply Irrigation Strategy
              </button>
            </div>
          </div>

          {/* Forecasting Assistant */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
             <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Forecasting Assistant
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              AI predictive model indicates a <strong>65% probability</strong> of powdery mildew outbreak in the next 5 days due to high humidity.
            </p>
            <button className="text-[10px] font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1">
              View Preventative Measures <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
