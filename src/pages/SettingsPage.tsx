import React, { useState } from 'react';
import {
  Settings,
  Heart,
  Droplets,
  Clock,
  ThermometerSun,
  Key,
  Sparkles,
  CloudSun
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { geminiService } from '../services/geminiService';
import { getStoredWeatherKeys, saveStoredWeatherKeys } from '../services/weatherService';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../types/agro';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, wellBeing, acknowledgeHydration, showToast, setLanguage: setGlobalLanguage } = useFarm();

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [language, setLanguage] = useState<SupportedLanguage>(user.preferredLanguage || 'en');
  const [wakeWord, setWakeWord] = useState('Hey Vision');
  const [speakingSpeed, setSpeakingSpeed] = useState('Normal (1.0x)');

  const initialGeminiKeys = geminiService.getApiKeys();
  const initialOwmKeys = getStoredWeatherKeys();
  const [primaryGeminiKey, setPrimaryGeminiKey] = useState(initialGeminiKeys[0] || '');
  const [backupGeminiKey, setBackupGeminiKey] = useState(initialGeminiKeys[1] || '');
  const [primaryOwmKey, setPrimaryOwmKey] = useState(initialOwmKeys[0] || '');
  const [backupOwmKey, setBackupOwmKey] = useState(initialOwmKeys[1] || '');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, phone, preferredLanguage: language });
    setGlobalLanguage(language);
    geminiService.setApiKeys([primaryGeminiKey, backupGeminiKey].filter(Boolean));
    saveStoredWeatherKeys([primaryOwmKey, backupOwmKey].filter(Boolean));
    showToast('Settings Saved', 'Profile, Gemini AI, and Weather credentials updated successfully', 'success');
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

      {/* 1. Farmer Well-Being & Safety Section */}
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

          <button
            onClick={acknowledgeHydration}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <Droplets className="w-4 h-4" />
            <span>Log Hydration Break</span>
          </button>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Interface & Voice Language (Indian Localization Ready)
            </label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as SupportedLanguage)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Speaking Speed
                </label>
                <select
                  value={speakingSpeed}
                  onChange={e => setSpeakingSpeed(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                >
                  <option>Gentle (0.9x)</option>
                  <option>Normal (1.0x)</option>
                  <option>Fast (1.2x)</option>
                </select>
              </div>
            </div>
          </div>

          {/* API Keys & Integrations */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-forest-700" />
              <h4 className="font-extrabold text-slate-900 text-sm">API Integrations & Telemetry Credentials</h4>
            </div>

            {/* Gemini Keys */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Primary Gemini AI Key
                </label>
                <input
                  type="password"
                  value={primaryGeminiKey}
                  onChange={e => setPrimaryGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Backup Gemini AI Key (Failover)
                </label>
                <input
                  type="password"
                  value={backupGeminiKey}
                  onChange={e => setBackupGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* OpenWeather Keys */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <CloudSun className="w-3.5 h-3.5 text-forest-600" />
                  Primary OpenWeather Key
                </label>
                <input
                  type="password"
                  value={primaryOwmKey}
                  onChange={e => setPrimaryOwmKey(e.target.value)}
                  placeholder="659e3216..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <CloudSun className="w-3.5 h-3.5 text-forest-600" />
                  Backup OpenWeather Key
                </label>
                <input
                  type="password"
                  value={backupOwmKey}
                  onChange={e => setBackupOwmKey(e.target.value)}
                  placeholder="2e6f5c9c..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none font-mono"
                />
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
