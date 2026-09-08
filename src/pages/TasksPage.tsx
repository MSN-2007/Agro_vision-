import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Mic,
  Calendar,
  Trash2,
  Bell,
  Clock,
  MapPin,
  Volume2,
  Sparkles,
  Layers
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { TaskStatus } from '../types/agro';
import { QuickActionModal } from '../components/QuickActionModal';
import { speechService } from '../services/speechService';

interface TasksPageProps {
  initialTab?: 'all' | 'tasks' | 'reminders';
}

export const TasksPage: React.FC<TasksPageProps> = ({ initialTab = 'all' }) => {
  const {
    tasks,
    reminders,
    currentFarm,
    toggleTaskStatus,
    deleteTask,
    dismissReminder
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'all' | 'tasks' | 'reminders'>(initialTab);
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [modalAction, setModalAction] = useState<'task' | 'reminder' | null>(null);

  const pendingTasksCount = tasks.filter(t => t.status === 'Pending').length;
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  const activeRemindersCount = reminders.length;

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <CheckSquare className="w-4 h-4 text-forest-700" />
            <span>Farm Operations & Scheduling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Tasks & Reminders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Work orders, hands-free voice tasks, and time-sensitive smart glasses audio reminders.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setModalAction('reminder')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Bell className="w-4 h-4" />
            <span>New Reminder</span>
          </button>
          <button
            onClick={() => setModalAction('task')}
            className="px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Task</span>
          </button>
        </div>
      </div>

      {/* Main Tabs (Segmented Switcher) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'all'
                ? 'bg-forest-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Items ({tasks.length + reminders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'tasks'
                ? 'bg-forest-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks ({tasks.length})</span>
            {pendingTasksCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'tasks' ? 'bg-forest-900 text-forest-100' : 'bg-forest-100 text-forest-800'
              }`}>
                {pendingTasksCount} pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'reminders'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Reminders ({reminders.length})</span>
            {activeRemindersCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'reminders' ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-800'
              }`}>
                {activeRemindersCount} active
              </span>
            )}
          </button>
        </div>

        {/* Quick Voice Tip */}
        <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 font-semibold px-2">
          <Mic className="w-3.5 h-3.5 text-forest-600" />
          <span>Say "Hey Vision, remind me to check irrigation at 4 PM"</span>
        </div>
      </div>

      {/* SECTION 1: Reminders Section (Displayed on 'all' and 'reminders' tabs) */}
      {(activeTab === 'all' || activeTab === 'reminders') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Bell className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                Time-Sensitive Reminders ({reminders.length})
              </h2>
              <span className="text-[11px] text-slate-400">Glasses Audio & Chime alerts</span>
            </div>
            {activeTab === 'all' && (
              <button
                onClick={() => setActiveTab('reminders')}
                className="text-xs font-bold text-forest-700 hover:text-forest-900 hover:underline"
              >
                View all reminders →
              </button>
            )}
          </div>

          {reminders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center text-slate-400 border border-slate-200">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No active reminders</p>
              <p className="text-xs mt-1">Tap "New Reminder" or schedule via glasses hands-free audio.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {reminders.map(rem => {
                const field = currentFarm.fields.find(f => f.id === rem.fieldId);
                return (
                  <div
                    key={rem.id}
                    className="bg-white rounded-3xl p-5 border border-amber-200/70 shadow-xs hover:border-amber-400 hover:shadow-sm transition-all flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-forest-700 block">
                          {field?.name || 'Farm General'}
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">{rem.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {rem.timeStr}
                          </span>
                          <button
                            type="button"
                            onClick={() => speechService.speak(`Reminder: ${rem.title}. Scheduled for ${rem.timeStr}.`)}
                            className="text-xs font-bold text-forest-700 hover:text-forest-900 flex items-center gap-1 hover:underline"
                            title="Audition audio reminder chime & speech"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                        {rem.status}
                      </span>
                      <button
                        onClick={() => dismissReminder(rem.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Dismiss reminder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: Tasks Section (Displayed on 'all' and 'tasks' tabs) */}
      {(activeTab === 'all' || activeTab === 'tasks') && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-forest-100 text-forest-800">
                <CheckSquare className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                Farm Tasks & Work Orders ({tasks.length})
              </h2>
            </div>

            {/* Task Status Filters */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
              {(['all', 'Pending', 'Completed', 'Overdue'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 capitalize ${
                    filterStatus === status
                      ? 'bg-white text-forest-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {status} ({status === 'all' ? tasks.length : tasks.filter(t => t.status === status).length})
                </button>
              ))}
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center text-slate-400 border border-slate-200">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">No tasks in this category</p>
                <p className="text-xs mt-1">Say "Hey Vision, add task" to schedule hands-free.</p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const field = currentFarm.fields.find(f => f.id === task.fieldId);
                return (
                  <div
                    key={task.id}
                    className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      task.status === 'Completed'
                        ? 'bg-slate-50/80 border-slate-200 text-slate-400'
                        : 'bg-white border-slate-200/90 shadow-xs hover:border-forest-400'
                    }`}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={task.status === 'Completed'}
                        onChange={() => toggleTaskStatus(task.id)}
                        className="mt-1 w-5 h-5 rounded text-forest-600 focus:ring-forest-500 cursor-pointer"
                      />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${task.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.title}
                          </span>
                          {task.voiceCreated && (
                            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-forest-100 text-forest-800 flex items-center gap-1">
                              <Mic className="w-3 h-3" />
                              Voice Created
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-semibold text-forest-800">
                            <MapPin className="w-3.5 h-3.5" />
                            {field?.name || 'Mango Plantation'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Due: {task.dueDate}
                          </span>
                        </div>

                        {task.notes && (
                          <p className="text-xs text-slate-600 mt-1 italic">{task.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold ${
                          task.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {task.status}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Quick Action Modal for Task or Reminder */}
      <QuickActionModal
        action={modalAction}
        onClose={() => setModalAction(null)}
      />
    </div>
  );
};
