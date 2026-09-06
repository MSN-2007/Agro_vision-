import React from 'react';
import {
  X,
  Bell,
  CheckCheck,
  AlertTriangle,
  CloudRain,
  Clock,
  Glasses,
  Bot
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { FarmNotification } from '../types/agro';

export const NotificationDrawer: React.FC = () => {
  const {
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    notifications,
    markNotificationRead,
    clearNotifications
  } = useFarm();

  if (!isNotificationDrawerOpen) return null;

  const getIcon = (type: FarmNotification['type']) => {
    switch (type) {
      case 'Crop Problem':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'Weather':
        return <CloudRain className="w-4 h-4 text-blue-500" />;
      case 'Reminder':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'Device':
        return <Glasses className="w-4 h-4 text-forest-600" />;
      case 'AI Analysis':
        return <Bot className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsNotificationDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-forest-100 text-forest-800">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Notification Center</h3>
                <p className="text-xs text-slate-500">
                  {notifications.filter(n => !n.read).length} unread updates
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearNotifications}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsNotificationDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <CheckCheck className="w-10 h-10 mb-2 text-forest-500" />
                <p className="font-bold text-slate-700">All caught up!</p>
                <p className="text-xs mt-1">No pending alerts or notifications from your farm.</p>
              </div>
            ) : (
              notifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => markNotificationRead(item.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    item.read
                      ? 'bg-white border-slate-200/80 text-slate-600 opacity-80'
                      : 'bg-forest-50/50 border-forest-200 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          {item.type}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
