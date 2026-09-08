import React from 'react';
import {
  Glasses,
  Battery,
  Bluetooth,
  Navigation,
  Camera,
  Mic,
  Volume2,
  RefreshCw,
  Power,
  Sliders,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

export const DevicePage: React.FC = () => {
  const { device, toggleDeviceConnection, syncDevice } = useFarm();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <Glasses className="w-4 h-4" />
            <span>Hardware Telemetry & Wearable Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            AgroVision Smart Glasses Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time diagnostics, sensor calibration, optical camera status, and wireless synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={syncDevice}
            className="px-4 py-2.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold text-xs border border-forest-200 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-forest-600" />
            <span>Sync Buffer</span>
          </button>
          <button
            onClick={toggleDeviceConnection}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-colors ${
              device.connected
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{device.connected ? 'Disconnect Glasses' : 'Connect Glasses'}</span>
          </button>
        </div>
      </div>

      {/* Visual Glasses Representation HUD (Master Prompt Section 18) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-forest-950 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Device Graphic */}
          <div className="lg:col-span-5 text-center space-y-4">
            <div className="relative inline-block">
              {/* Stylized Glasses Silhouette with HUD accents */}
              <div className="w-64 h-32 mx-auto bg-slate-800/80 rounded-3xl border-2 border-forest-500/60 flex items-center justify-center p-4 relative shadow-inner">
                <Glasses className="w-36 h-36 text-forest-400 opacity-90 drop-shadow-md" />
                {/* Glowing LED sensor dot */}
                <span className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                  device.connected ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50 animate-ping' : 'bg-rose-500'
                }`} />
              </div>
              <p className="text-xs font-mono text-forest-300 mt-2">
                SER: {device.serialNumber} • FW: {device.firmwareVersion}
              </p>
            </div>

            <div>
              <h2 className="text-xl font-extrabold">{device.model}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upgraded 1080p Dual Optics (Medium-High Spec) • Quad Noise-Cancelling Microphones
              </p>
              <p className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center justify-center gap-1">
                <Cpu className="w-3 h-3" />
                USB-C Fast Charging Supported
              </p>
            </div>
          </div>

          {/* Right: Telemetry Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Battery */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-2 text-forest-300 text-xs font-bold mb-1">
                <Battery className="w-4 h-4" />
                <span>Battery Level</span>
              </div>
              <p className="text-2xl font-black text-white">{device.batteryLevel}%</p>
              <p className="text-[10px] text-slate-300 mt-0.5">16 Hours (Extended Backup)</p>
            </div>

            {/* Bluetooth */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-2 text-forest-300 text-xs font-bold mb-1">
                <Bluetooth className="w-4 h-4" />
                <span>Bluetooth 5.3</span>
              </div>
              <p className="text-2xl font-black text-white">
                {device.bluetoothConnected ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-[10px] text-slate-300 mt-0.5">Mobile Bridge Paired</p>
            </div>

            {/* GPS */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-2 text-forest-300 text-xs font-bold mb-1">
                <Navigation className="w-4 h-4" />
                <span>RTK GPS Sensor</span>
              </div>
              <p className="text-2xl font-black text-white">
                {device.gpsActive ? 'Active' : 'Standby'}
              </p>
              <p className="text-[10px] text-slate-300 mt-0.5">&plusmn; 0.8m accuracy</p>
            </div>

            {/* Camera */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-2 text-forest-300 text-xs font-bold mb-1">
                <Camera className="w-4 h-4" />
                <span>Dual Optics</span>
              </div>
              <p className="text-2xl font-black text-white">{device.cameraStatus}</p>
              <p className="text-[10px] text-slate-300 mt-0.5">Upgraded 1080p Medium-High Spec</p>
            </div>

            {/* Mic */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-2 text-forest-300 text-xs font-bold mb-1">
                <Mic className="w-4 h-4" />
                <span>Wake Mic</span>
              </div>
              <p className="text-2xl font-black text-white">{device.microphoneStatus}</p>
              <p className="text-[10px] text-slate-300 mt-0.5">“Hey Vision” wake listener</p>
            </div>

            {/* Speaker */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
              <div className="flex items-center gap-2 text-forest-300 text-xs font-bold mb-1">
                <Volume2 className="w-4 h-4" />
                <span>Open-Ear Audio</span>
              </div>
              <p className="text-2xl font-black text-white">{device.speakerStatus}</p>
              <p className="text-[10px] text-slate-300 mt-0.5">Directional acoustic drivers</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <span>Last synchronized: <strong>{device.lastSyncTime}</strong></span>
          <span>Security: Hardware cryptographic token verified</span>
        </div>
      </div>

      {/* Hardware Settings Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base">Wearable Device Preferences</h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
            <div>
              <p className="font-bold text-slate-900">Wake Word Detection</p>
              <p className="text-slate-500">Enable on-device listening for “Hey Vision”</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold">Enabled</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
            <div>
              <p className="font-bold text-slate-900">Automatic Geo-Tagging</p>
              <p className="text-slate-500">Tag photo captures with high-precision RTK coordinates</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold">Active</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50">
            <div>
              <p className="font-bold text-slate-900">Acoustic Audio Guidance</p>
              <p className="text-slate-500">Provide spoken confirmations after photo and voice recordings</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
