import React from 'react';
import {
  Menu,
  MapPin,
  Smartphone,
  Bell,
  Volume2,
  SlidersHorizontal,
  ChevronDown,
  Navigation,
  Languages,
  Cloud,
  CloudOff,
  RefreshCw
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../types/agro';

interface HeaderProps {
  onOpenSidebar: () => void;
  isDemoOpen: boolean;
  setIsDemoOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  isDemoOpen,
  setIsDemoOpen
}) => {
  const {
    currentFarm,
    currentField,
    currentGps,
    device,
    notifications,
    setIsNotificationDrawerOpen,
    simulateMorningBriefing,
    selectField,
    currentLanguage,
    setLanguage,
    syncStatus
  } = useFarm();

  const unreadCount = notifications.filter(n => !n.read).length;

  const syncPill = syncStatus === 'connected'
    ? { icon: <Cloud className="w-3.5 h-3.5" />, label: 'Cloud Synced', cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' }
    : syncStatus === 'reconnecting'
    ? { icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, label: 'Reconnecting...', cls: 'bg-amber-50 border-amber-200 text-amber-800' }
    : { icon: <CloudOff className="w-3.5 h-3.5" />, label: 'Backend Offline', cls: 'bg-red-50 border-red-200 text-red-700' };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu + Current Farm & Geofence Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Location & Field Geo-fence Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest-900 font-semibold text-xs sm:text-sm">
                <MapPin className="w-3.5 h-3.5 text-forest-600 animate-bounce" />
                <span>{currentFarm.name}</span>
                <span className="text-slate-300">|</span>
                {/* Field dropdown selector */}
                <select
                  value={currentField ? currentField.id : ''}
                  onChange={e => selectField(e.target.value ? e.target.value : null)}
                  aria-label="Select Current Field"
                  className="bg-transparent border-0 font-bold text-forest-800 text-xs sm:text-sm focus:ring-0 focus:outline-none cursor-pointer"
                >
                  {currentFarm.fields.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.crop})
                    </option>
                  ))}
                  <option value="">Outside Boundary</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-forest-600" />
              </div>
            </div>

            {/* Live Geo-fence Status Pill */}
            {currentField ? (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-medium">
                  Inside <strong>{currentField.name}</strong> ({currentField.areaAcres} ac)
                </span>
                <span className="text-[10px] text-emerald-600">
                  {currentGps.lat.toFixed(4)}°N, {currentGps.lng.toFixed(4)}°E
                </span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Navigation className="w-3 h-3 text-amber-600" />
                <span className="font-medium">Outside Registered Boundaries</span>
                <span className="text-[10px] text-amber-600">
                  {currentGps.lat.toFixed(4)}°N, {currentGps.lng.toFixed(4)}°E
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Dev Sim Toggle + Companion Status + Morning Briefing + Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Multilingual Voice & Assistant Language Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-forest-50 border border-forest-200/90 text-forest-900 font-semibold text-xs shadow-2xs">
            <Languages className="w-3.5 h-3.5 text-forest-700 shrink-0" />
            <select
              value={currentLanguage}
              onChange={e => setLanguage(e.target.value as SupportedLanguage)}
              aria-label="Select AI Voice & Language"
              className="bg-transparent border-0 font-bold text-forest-900 text-xs focus:ring-0 focus:outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
                  {lang.flag} {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

          {/* Diagnostic Simulator Toggle */}
          <button
            onClick={() => setIsDemoOpen(!isDemoOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all border ${
              isDemoOpen
                ? 'bg-forest-700 text-white border-forest-800 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
            }`}
            title="Toggle Farm GPS & Sensor Simulator"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sim Sandbox</span>
          </button>

          {/* Morning Briefing Audio Button */}
          <button
            onClick={simulateMorningBriefing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-200 transition-colors"
            title="Listen to Morning Briefing"
          >
            <Volume2 className="w-4 h-4 text-forest-600" />
            <span className="hidden sm:inline">Morning Briefing</span>
          </button>

          {/* Backend Sync Status Pill */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all duration-500 ${syncPill.cls}`} title={`Backend: ${syncStatus}`}>
            {syncPill.icon}
            <span className="hidden md:inline">{syncPill.label}</span>
          </div>

          {/* Mobile Companion Live Connectivity Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-forest-50 text-forest-800 text-xs font-semibold border border-forest-200/80">
            <Smartphone className={`w-3.5 h-3.5 ${device.connected ? 'text-forest-600' : 'text-slate-400'}`} />
            <span>{device.connected ? `Phone Sync (${device.batteryLevel}%)` : 'Offline'}</span>
          </div>

          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotificationDrawerOpen(true)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
