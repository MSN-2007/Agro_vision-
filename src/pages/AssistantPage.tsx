import React, { useState } from 'react';
import {
  Bot,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  MapPin,
  Trees,
  Glasses,
  Trash2,
  Sparkles
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { speechService } from '../services/speechService';

export const AssistantPage: React.FC = () => {
  const {
    chatMessages,
    sendAssistantMessage,
    clearChat,
    currentFarm,
    currentField,
    currentGps,
    device,
    showToast
  } = useFarm();

  const [inputVal, setInputVal] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendAssistantMessage(inputVal);
    setInputVal('');
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    setIsListening(true);
    speechService.playWakeChime();
    showToast('Wake Word Active', 'AgroVision microphone listening...', 'info');

    // Simulate speech recognition transcription after 2s
    setTimeout(() => {
      const simulatedVoiceQueries = [
        'What are my tasks today?',
        'What did I record yesterday in the mango field?',
        'Is it suitable to spray fungicide today?'
      ];
      const randomQuery =
        simulatedVoiceQueries[Math.floor(Math.random() * simulatedVoiceQueries.length)];
      sendAssistantMessage(randomQuery);
      setIsListening(false);
    }, 2200);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <Bot className="w-4 h-4 text-emerald-600" />
            <span>Voice & Conversational Agricultural Agent</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            AgroVision Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Communicate naturally hands-free using your smart glasses wake word (“Hey Vision”) or type below.
          </p>
        </div>

        <button
          onClick={clearChat}
          className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 self-start sm:self-auto"
          title="Clear chat history"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Real-Time Context Banner (Master Prompt Section 17) */}
      <div className="p-4 rounded-3xl bg-forest-50/80 border border-forest-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-bold text-forest-950">
            <Trees className="w-4 h-4 text-forest-700" />
            <span>Farm: {currentFarm.name}</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-forest-950">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>Field: {currentField ? currentField.name : 'Outside Boundary'}</span>
          </div>
          {currentField && (
            <div className="font-semibold text-forest-800">
              Crop: <strong>{currentField.crop}</strong>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Context Aware
          </span>
          <span className="text-[10px] text-forest-700">
            Glasses Mic: {device.connected ? 'Ready' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs min-h-[460px] max-h-[550px] overflow-y-auto flex flex-col justify-between">
        <div className="space-y-4">
          {chatMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg rounded-3xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-forest-700 text-white rounded-tr-xs shadow-sm'
                    : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75 font-semibold">
                  <span>{msg.role === 'user' ? 'Farmer Ravi' : 'AgroVision AI'}</span>
                  <span>{msg.timestamp}</span>
                </div>
                <p>{msg.content}</p>

                {/* Read aloud button on assistant messages */}
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => speechService.speak(msg.content)}
                      className="text-xs font-bold text-forest-800 hover:underline flex items-center gap-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Play Audio</span>
                    </button>
                    <button
                      onClick={() => speechService.stopSpeaking()}
                      className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Pause Audio</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isListening && (
            <div className="flex justify-start">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-xs font-bold flex items-center gap-3 animate-pulse">
                <Mic className="w-5 h-5 text-red-500" />
                <span>AgroVision listening to hands-free voice command...</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Question Pills */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Quick prompts:</span>
          {[
            'What are my tasks today?',
            'What did I record yesterday?',
            'Check weather & spray advisory',
            'Where am I?'
          ].map(prompt => (
            <button
              key={prompt}
              onClick={() => sendAssistantMessage(prompt)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-forest-50 hover:text-forest-800 text-slate-700 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Type or click the microphone to speak hands-free..."
            className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none shadow-xs"
          />
        </div>

        <button
          type="button"
          onClick={handleToggleVoiceInput}
          className={`px-4 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
          title="Speak to AgroVision"
        >
          <Mic className="w-5 h-5" />
          <span className="hidden sm:inline">Voice</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3.5 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
