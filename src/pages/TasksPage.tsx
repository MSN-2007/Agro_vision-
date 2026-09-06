import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Mic,
  Calendar,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  MapPin
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { TaskStatus } from '../types/agro';
import { QuickActionModal } from '../components/QuickActionModal';

export const TasksPage: React.FC = () => {
  const { tasks, currentFarm, toggleTaskStatus, deleteTask } = useFarm();
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <CheckSquare className="w-4 h-4" />
            <span>Farm Operations & Scheduling</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Tasks & Work Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Created via hands-free voice commands on smart glasses or scheduled from the web console.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Task Filters */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        {(['all', 'Pending', 'Completed', 'Overdue'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 capitalize ${
              filterStatus === status
                ? 'bg-forest-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {status} ({status === 'all' ? tasks.length : tasks.filter(t => t.status === status).length})
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
            <CheckSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
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
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <QuickActionModal
        action={isAddModalOpen ? 'task' : null}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
