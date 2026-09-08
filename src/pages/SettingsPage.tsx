import React, { useState } from 'react';
import {
  User,
  Settings,
  Globe,
  Heart,
  Bell,
  Shield,
  Glasses,
  Check,
  Droplets,
  Clock,
  ThermometerSun,
  Volume2
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { speechService } from '../services/speechService';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, wellBeing, acknowledgeHydration, triggerBreakAlert, showToast, currentFarm } = useFarm();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [language, setLanguage] = useState(user.preferredLanguage);
  const [wakeWord, setWakeWord] = useState(user.wakeWord || 'Hey Vision');
  const [speakingSpeed, setSpeakingSpeed] = useState(user.speakingSpeed || '1.0x');

  const indianLanguages = [
    { code: 'en', name: 'English (India)' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' }
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, phone, preferredLanguage: language, wakeWord, speakingSpeed });
    speechService.setRate(speakingSpeed);
    showToast('Settings Saved', `Profile preferences and speech speed (${speakingSpeed}) updated`, 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
          <Settings className="w-4 h-4" />
          <span>System & Farmer Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Profile & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Manage your farmer profile, regional language preferences, and safety reminders.
        </p>
      </div>

      {/* 1. Farmer Well-Being & Safety Section (Master Prompt Section 19) */}
      <div className="bg-gradient-to-r from-emerald-50 via-forest-50 to-teal-50 rounded-3xl p-6 border border-emerald-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200/60">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-md">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Farmer Well-Being & Field Safety</h3>
              <p className="text-xs text-forest-800">
                Health safety alerts tracked during long field scouting shifts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={triggerBreakAlert}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors"
            >
              <span>Simulate Break Alert</span>
            </button>
            <button
              onClick={acknowledgeHydration}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors"
            >
              <Droplets className="w-4 h-4" />
              <span>Log Hydration Break</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-100 flex items-center gap-3">
            <Droplets className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Hydration Check</span>
              <strong className="text-slate-900">{wellBeing.nextHydrationTime}</strong>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-100 flex items-center gap-3">
            <Clock className="w-5 h-5 text-forest-700 shrink-0" />
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Working Period</span>
              <strong className="text-slate-900">{wellBeing.workingHoursToday} hours active today</strong>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 border border-emerald-100 flex items-center gap-3">
            <ThermometerSun className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase">Heat Index</span>
              <strong className="text-slate-900">Normal (28°C Ambient)</strong>
            </div>
          </div>
        </div>

        <p className="text-xs text-forest-800 mt-3 italic">"{wellBeing.message}"</p>
      </div>

      {/* 2. Farmer Profile Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <h3 className="font-extrabold text-slate-900 text-lg mb-4">Farmer Profile Information</h3>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Regional Multilingual Selector (Master Prompt Section 22) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Interface & Voice Language (Indian Localization Ready)
            </label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
            >
              {indianLanguages.map(lang => (
                <option key={lang.code} value={lang.name}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports multilingual speech recognition and regional text for Indian farmers.
            </p>
          </div>

          {/* Assistant Settings */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm">Assistant & Voice Preferences</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Wake Word
                </label>
                <input
                  type="text"
                  value={wakeWord}
                  onChange={e => setWakeWord(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Speaking Speed
                  </label>
                  <span className="text-[10px] font-bold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-md border border-forest-200">
                    Active: {speakingSpeed}
                  </span>
                </div>
                <select
                  value={speakingSpeed}
                  onChange={e => {
                    const val = e.target.value;
                    setSpeakingSpeed(val);
                    speechService.setRate(val);
                    updateUser({ speakingSpeed: val });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none bg-white font-medium"
                >
                  <option value="0.5x">0.5x (Slow)</option>
                  <option value="1.0x">1.0x (Normal)</option>
                  <option value="1.25x">1.25x (Moderate)</option>
                  <option value="1.5x">1.5x (Fast)</option>
                  <option value="2.0x">2.0x (Very Fast)</option>
                </select>

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      speechService.setRate(speakingSpeed);
                      speechService.speak(`Speaking speed is aligned to ${speakingSpeed}. Ready for field operations.`);
                    }}
                    className="text-xs font-bold text-forest-800 hover:text-forest-950 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-100 hover:bg-forest-200 transition-colors shadow-2xs"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-forest-700" />
                    <span>Test Voice Speed ({speakingSpeed})</span>
                  </button>
                  <span className="text-[10px] text-slate-400">
                    Synced across app
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm">Google & Workspace Integration</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">Google Calendar Sync</p>
                  <p className="text-[10px] text-slate-500">Sync farm tasks & reminders to Google Calendar</p>
                </div>
                <button type="button" className="px-3 py-1 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-colors">Connect</button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">Google Assistant</p>
                  <p className="text-[10px] text-slate-500">Enable voice access via Google Assistant on mobile</p>
                </div>
                <button type="button" className="px-3 py-1 rounded-xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-colors">Connect</button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h4 className="font-extrabold text-slate-900 text-sm">Accessibility (Disabled Farmer Support)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">Gesture Control</p>
                  <p className="text-[10px] text-slate-500">Enable head-nod and hand-swipe camera recognition</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold cursor-pointer">Enabled</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">Sign Language Translation</p>
                  <p className="text-[10px] text-slate-500">Real-time ISL/ASL translation via dual optics</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold cursor-pointer">Enabled</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-md transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
