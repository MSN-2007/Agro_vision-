import React from 'react';
import {
  LayoutDashboard,
  Trees,
  MapPin,
  HeartPulse,
  Eye,
  Camera,
  AlertTriangle,
  CheckSquare,
  Bell,
  CloudSun,
  BrainCircuit,
  Bot,
  Glasses,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

export type PageId =
  | 'dashboard'
  | 'farms'
  | 'map'
  | 'crop-health'
  | 'observations'
  | 'media'
  | 'problems'
  | 'tasks'
  | 'reminders'
  | 'weather'
  | 'farm-memory'
  | 'assistant'
  | 'device'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isOpen,
  onClose
}) => {
  const { device, tasks, problems, observations } = useFarm();

  const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
  const unresolvedProblems = problems.filter(p => p.status !== 'Resolved').length;

  const navItems: Array<{
    id: PageId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'farms', label: 'My Farms', icon: Trees },
    { id: 'map', label: 'Farm Map & Boundary', icon: MapPin },
    { id: 'crop-health', label: 'Crop Health', icon: HeartPulse },
    { id: 'observations', label: 'Observations', icon: Eye, badge: observations.length },
    { id: 'media', label: 'Photos & Videos', icon: Camera },
    { id: 'problems', label: 'Problems & Alerts', icon: AlertTriangle, badge: unresolvedProblems, badgeColor: 'bg-amber-500 text-white' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: pendingTasks, badgeColor: 'bg-forest-600 text-white' },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'weather', label: 'Weather', icon: CloudSun },
    { id: 'farm-memory', label: 'Farm Memory', icon: BrainCircuit },
    { id: 'assistant', label: 'AgroVision Assistant', icon: Bot, badge: 'AI', badgeColor: 'bg-emerald-500 text-white' },
    { id: 'device', label: 'Smart Glasses', icon: Glasses, badge: device.connected ? `${device.batteryLevel}%` : 'Off', badgeColor: device.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600' },
    { id: 'settings', label: 'Profile & Settings', icon: Settings }
  ];

  const handleNav = (id: PageId) => {
    onSelectPage(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forest-600 to-forest-800 flex items-center justify-center text-white shadow-md shadow-forest-900/10">
              <Glasses className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  AGRO<span className="text-forest-600">VISION</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-forest-100 text-forest-700">
                  Wearable
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight font-medium">
                Your Farm. Your Vision. Your AI.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Quick Status Banner */}
        <div className="mx-4 mt-3 p-3 rounded-xl bg-forest-50/80 border border-forest-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-2.5 h-2.5 rounded-full ${device.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <div>
              <p className="text-xs font-semibold text-forest-900">AgroVision Glasses</p>
              <p className="text-[10px] text-forest-700">
                {device.connected ? `Connected • ${device.batteryLevel}% Battery` : 'Offline'}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleNav('device')}
            className="text-[11px] font-semibold text-forest-700 hover:text-forest-900 hover:underline"
          >
            HUD
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-forest-600 text-white shadow-sm shadow-forest-900/20 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      item.badgeColor || (active ? 'bg-forest-700 text-white' : 'bg-slate-200 text-slate-700')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Farmer Card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
                  alt="Ravi Kumar"
                  className="w-10 h-10 rounded-full object-cover border-2 border-forest-500"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">Ravi Kumar</p>
                <p className="text-[11px] text-slate-500 truncate">Green Valley Farm</p>
              </div>
            </div>
            <ShieldCheck className="w-5 h-5 text-forest-600" />
          </div>
        </div>
      </aside>
    </>
  );
};
