import React from 'react';
import { CheckCircle2, AlertTriangle, Info, AlertOctagon, X } from 'lucide-react';
import { useFarm, ToastMessage } from '../context/FarmContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useFarm();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
          error: <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
        };

        const borderColors = {
          success: 'border-emerald-200 bg-emerald-50/95 text-emerald-950',
          info: 'border-blue-200 bg-blue-50/95 text-blue-950',
          warning: 'border-amber-200 bg-amber-50/95 text-amber-950',
          error: 'border-rose-200 bg-rose-50/95 text-rose-950'
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-lg backdrop-blur-md flex items-start gap-3 transition-all duration-300 animate-slide-in ${
              borderColors[toast.type]
            }`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold uppercase tracking-wider">{toast.title}</p>
                <span className="text-[10px] text-slate-400">{toast.time}</span>
              </div>
              <p className="text-xs font-medium mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
