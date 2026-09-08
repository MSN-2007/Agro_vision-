import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Mic,
  Send,
  Volume2,
  Trash2,
  Sparkles,
  CheckCircle2,
  CheckSquare,
  Clock,
  Calendar,
  MapPin,
  Languages
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { speechService } from '../services/speechService';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../types/agro';

export const AssistantPage: React.FC = () => {
  const {
    chatMessages,
    isAssistantThinking,
    sendAssistantMessage,
    clearChat,
    currentFarm,
    currentField,
    showToast,
    currentLanguage,
    setLanguage
  } = useFarm();

  const [inputVal, setInputVal] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimVoiceText, setInterimVoiceText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isListening, interimVoiceText, isAssistantThinking]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    sendAssistantMessage(inputVal);
    setInputVal('');
  };

  const handleTestAudio = () => {
    speechService.playWakeChime();
    const testPhrases: Record<SupportedLanguage, string> = {
      en: 'AgroVision voice engine is active. Ready for farm queries.',
      mr: 'AgroVision व्हॉइस इंजिन सक्रिय आहे. शेती प्रश्नांसाठी तयार आहे.',
      hi: 'AgroVision वॉइस इंजन सक्रिय है। कृषि प्रश्नों के लिए तैयार है।',
      te: 'AgroVision వాయిస్ ఇంజిన్ యాక్టివ్‌గా ఉంది. సిద్ధంగా ఉంది.'
    };
    speechService.speak(testPhrases[currentLanguage] || testPhrases.en, currentLanguage);
    showToast('Audio Test', `Playing test voice in ${activeLangConfig.name}`, 'info');
  };

  const handleToggleVoiceInput = async () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      setInterimVoiceText('');
      return;
    }

    speechService.playWakeChime();
    setInterimVoiceText('');

    const promptTips: Record<SupportedLanguage, string> = {
      en: 'Speak your farm query or command...',
      mr: 'तुमचा शेती प्रश्न किंवा काम बोला...',
      hi: 'अपना कृषि प्रश्न या कार्य बोलें...',
      te: 'మీ వ్యవసాయ ప్రశ్న లేదా పని మాట్లాడండి...'
    };

    const started = await speechService.startListening({
      lang: currentLanguage,
      onStart: () => {
        setIsListening(true);
        showToast('Listening...', promptTips[currentLanguage] || promptTips.en, 'info');
      },
      onResult: (transcript: string, isFinal: boolean) => {
        if (isFinal) {
          setIsListening(false);
          setInterimVoiceText('');
          setInputVal('');
          sendAssistantMessage(transcript);
        } else {
          setInterimVoiceText(transcript);
          setInputVal(transcript);
        }
      },
      onError: (errMsg: string) => {
        setIsListening(false);
        setInterimVoiceText('');
        showToast('Voice Notice', errMsg, 'info');
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    if (!started) {
      setIsListening(false);
    }
  };

  const SUGGESTED_PROMPTS_BY_LANG: Record<SupportedLanguage, string[]> = {
    en: [
      'What are my tasks today?',
      'Mark task 1 as completed',
      'New task spray copper tomorrow at 10 AM',
      'Reschedule task 1 to 5 PM',
      'Delete task 2',
      'Check weather & spray advisory'
    ],
    mr: [
      'माझे आजचे काम काय आहे?',
      'काम १ पूर्ण झाले म्हणून चिन्हांकित करा',
      'उद्या सकाळी १० वाजता कीटकनाशक फवारणीचे नवीन काम जोडा',
      'काम १ ची वेळ संध्याकाळी ५ ची करा',
      'काम २ हटवा',
      'हवामान आणि फवारणी सल्ला सांगा'
    ],
    hi: [
      'आज के मेरे कार्य क्या हैं?',
      'टास्क 1 को पूरा मार्क करें',
      'कल सुबह 10 बजे कॉपर स्प्रे का नया काम जोड़ें',
      'टास्क 1 का समय शाम 5 बजे करें',
      'टास्क 2 को हटाओ',
      'मौसम और छिड़काव सलाह देखें'
    ],
    te: [
      'ఈరోజు నా పనులు ఏమిటి?',
      'టాస్క్ 1 పూర్తయినట్లు మార్క్ చేయండి',
      'రేపు ఉదయం 10 గంటలకు కాపర్ స్ప్రే కొత్త పని జోడించండి',
      'టాస్క్ 1 సమయం సాయంత్రం 5 గంటలకు మార్చండి',
      'టాస్క్ 2 తొలగించండి',
      'వాతావరణం & పిచికారీ సలహా తనిఖీ చేయండి'
    ]
  };

  const inputPlaceholders: Record<SupportedLanguage, string> = {
    en: 'Type a message or tap the microphone to speak...',
    mr: 'संदेश टाइप करा किंवा बोलण्यासाठी माइक टॅप करा...',
    hi: 'संदेश टाइप करें या बोलने के लिए माइक टैप करें...',
    te: 'సందేశాన్ని టైప్ చేయండి లేదా మాట్లాడటానికి మైక్ నొక్కండి...'
  };

  const activeLangConfig = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 max-w-4xl w-full mx-auto">
      {/* 1. Compact Top Bar: Title + Field Context + Language Switcher + Clear */}
      <div className="shrink-0 pb-3 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-forest-700" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-none truncate">
              AgroVision Assistant
            </h1>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {currentFarm.name} • {currentField ? currentField.name : 'Outside Registered Field'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Multilingual Voice Pills */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            <Languages className="w-3.5 h-3.5 text-slate-500 ml-1 shrink-0" />
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                  currentLanguage === lang.code
                    ? 'bg-forest-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
                title={`Switch assistant & voice to ${lang.name}`}
              >
                {lang.flag} {lang.nativeName.split(' ')[0]}
              </button>
            ))}
          </div>

          <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Gemini 3.6 Flash
          </span>

          <button
            onClick={clearChat}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Messages Log: Fills all available vertical space, scrolls independently */}
      <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-3 pr-1">
        {chatMessages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-forest-700 text-white rounded-tr-xs shadow-xs'
                  : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-70 font-semibold">
                <span>{msg.role === 'user' ? 'Farmer Ravi' : 'AgroVision Assistant'}</span>
                <span>{msg.timestamp}</span>
              </div>
              <p className="whitespace-pre-line">{msg.content}</p>

              {/* Task Action Confirmation Card (Voice Task Operations) */}
              {msg.taskActionMeta && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    {msg.taskActionMeta.type === 'completed' && (
                      <span className="flex items-center gap-1 text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md font-extrabold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Task Marked Completed</span>
                      </span>
                    )}
                    {msg.taskActionMeta.type === 'created' && (
                      <span className="flex items-center gap-1 text-forest-800 bg-forest-100/90 px-2 py-0.5 rounded-md font-extrabold">
                        <CheckSquare className="w-3.5 h-3.5 text-forest-700" />
                        <span>New Task Scheduled</span>
                      </span>
                    )}
                    {msg.taskActionMeta.type === 'deleted' && (
                      <span className="flex items-center gap-1 text-rose-800 bg-rose-100/90 px-2 py-0.5 rounded-md font-extrabold">
                        <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                        <span>Task Removed</span>
                      </span>
                    )}
                    {msg.taskActionMeta.type === 'updated' && (
                      <span className="flex items-center gap-1 text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md font-extrabold">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Task Rescheduled</span>
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-slate-800 text-sm">
                    {msg.taskActionMeta.taskTitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                    {msg.taskActionMeta.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Due: <strong className="text-slate-700">{msg.taskActionMeta.dueDate}</strong></span>
                      </span>
                    )}
                    {msg.taskActionMeta.fieldName && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>Parcel: <strong className="text-slate-700">{msg.taskActionMeta.fieldName}</strong></span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => speechService.speak(msg.content, currentLanguage)}
                    className="text-xs font-semibold text-forest-700 hover:text-forest-900 hover:underline flex items-center gap-1.5 transition-colors"
                    title={`Speak in natural ${activeLangConfig.nativeName} voice`}
                  >
                    <Volume2 className="w-3.5 h-3.5 text-forest-600" />
                    <span>Listen ({activeLangConfig.nativeName})</span>
                  </button>
                  <span className="text-[10px] text-slate-400">
                    {activeLangConfig.flag} {activeLangConfig.code.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isAssistantThinking && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 text-xs font-semibold flex items-center gap-2.5 shadow-xs text-slate-600">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" />
              <span>Analyzing parcel telemetry with Gemini 3.6...</span>
            </div>
          </div>
        )}

        {isListening && (
          <div className="flex justify-start">
            <div className="bg-rose-50 border-2 border-rose-300 text-rose-950 rounded-2xl p-3.5 text-xs font-semibold space-y-2 shadow-sm max-w-md w-full animate-pulse">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-rose-700 font-bold">
                  <Mic className="w-4 h-4 text-rose-600 animate-bounce" />
                  <span>Listening ({activeLangConfig.nativeName})...</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    speechService.stopListening();
                    setIsListening(false);
                  }}
                  className="px-2 py-0.5 rounded bg-rose-200 hover:bg-rose-300 text-rose-900 text-[11px] font-bold"
                >
                  Stop
                </button>
              </div>

              <div className="bg-white/90 rounded-lg p-2 border border-rose-200 text-slate-800 text-[11px] font-mono min-h-[28px] flex items-center">
                {interimVoiceText ? (
                  <span>"{interimVoiceText}"</span>
                ) : (
                  <span className="text-slate-400 italic">Speak now or tap a quick command below...</span>
                )}
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {(SUGGESTED_PROMPTS_BY_LANG[currentLanguage] || SUGGESTED_PROMPTS_BY_LANG.en).slice(0, 3).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      speechService.stopListening();
                      setIsListening(false);
                      sendAssistantMessage(p);
                    }}
                    className="text-[10px] bg-white hover:bg-rose-100 text-rose-900 border border-rose-200 px-2 py-0.5 rounded transition-colors"
                  >
                    🎙️ {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Docked Action Bar: Always visible on screen, never cut off */}
      <div className="shrink-0 pt-2 pb-1 space-y-2 border-t border-slate-200/80 bg-[#F8FAF7]">
        {/* Suggested Prompts based on active language */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">
            {activeLangConfig.flag} Prompts:
          </span>
          {(SUGGESTED_PROMPTS_BY_LANG[currentLanguage] || SUGGESTED_PROMPTS_BY_LANG.en).map(prompt => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendAssistantMessage(prompt)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-forest-50 hover:text-forest-800 text-slate-700 transition-colors shadow-2xs whitespace-nowrap shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Text Input & Mic Form */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder={inputPlaceholders[currentLanguage] || inputPlaceholders.en}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none shadow-xs"
          />

          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className={`px-3.5 py-3 rounded-xl font-semibold text-sm shadow-xs transition-all flex items-center gap-1.5 shrink-0 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title={`Voice Input (${activeLangConfig.nativeName})`}
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">{isListening ? 'Listening' : 'Voice'}</span>
          </button>

          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="px-4 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 disabled:opacity-40 text-white font-semibold text-sm shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

