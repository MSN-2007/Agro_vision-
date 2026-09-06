import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Trash2,
  Calendar
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { QuickActionModal } from '../components/QuickActionModal';

export const RemindersPage: React.FC = () => {
  const { reminders, currentFarm, dismissReminder } = useFarm();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <Bell className="w-4 h-4" />
            <span>Time-Sensitive Farm Reminders</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Voice & Scheduled Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Smart glasses audio alerts and push notifications for irrigation pumps, fertigation timers, and farm visits.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Reminders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reminders.map(rem => {
          const field = currentFarm.fields.find(f => f.id === rem.fieldId);
          return (
            <div
              key={rem.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-forest-300 transition-all flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 block">
                    {field?.name || 'Mango Plantation'}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{rem.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{rem.timeStr}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                  {rem.status}
                </span>
                <button
                  onClick={() => dismissReminder(rem.id)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700"
                  title="Dismiss reminder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <QuickActionModal
        action={isAddModalOpen ? 'reminder' : null}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
