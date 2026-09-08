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
  MapPin,
  Volume2,
  Sparkles,
  RefreshCw,
  Languages
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { TaskStatus, SUPPORTED_LANGUAGES, SupportedLanguage } from '../types/agro';
import { QuickActionModal } from '../components/QuickActionModal';
import { speechService } from '../services/speechService';

export const TasksPage: React.FC = () => {
  const {
    tasks,
    currentFarm,
    toggleTaskStatus,
    deleteTask,
    updateTask,
    executeVoiceTaskCommand,
    showToast,
    currentLanguage,
    setLanguage
  } = useFarm();
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const activeLangConfig = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const handleToggleVoiceTask = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      setInterimText('');
      return;
    }

    speechService.playWakeChime();
    setInterimText('');
    setVoiceFeedback(null);

    const voicePromptsHint: Record<SupportedLanguage, string> = {
      en: 'Speak: "Mark task 1 as completed", "New task spray tomorrow 10 AM", or "Delete task 2"',
      mr: 'बोला: "काम १ पूर्ण झाले", "नवीन काम उद्या सकाळी १० वाजता फवारणी", किंवा "काम २ हटवा"',
      hi: 'बोलें: "कार्य 1 पूरा मार्क करें", "नया काम कल सुबह 10 बजे छिड़काव", या "कार्य 2 हटाएं"',
      te: 'మాట్లాడండి: "టాస్క్ 1 పూర్తి చేయండి", "కొత్త టాస్క్ రేపు ఉదయం 10 కి", లేదా "టాస్క్ 2 తొలగించండి"'
    };

    const started = speechService.startListening({
      lang: currentLanguage,
      onStart: () => {
        setIsListening(true);
        showToast('Listening...', voicePromptsHint[currentLanguage] || voicePromptsHint.en, 'info');
      },
      onResult: (transcript: string, isFinal: boolean) => {
        if (isFinal) {
          setIsListening(false);
          setInterimText('');
          const result = executeVoiceTaskCommand(transcript);
          if (result.handled && result.speechReply) {
            setVoiceFeedback(result.speechReply);
            speechService.speak(result.speechReply, currentLanguage);
          } else {
            let fallbackMsg = `Heard: "${transcript}". Say "Mark task 1 completed" or "New task check drip tomorrow 4 PM".`;
            if (currentLanguage === 'mr') fallbackMsg = `ऐकले: "${transcript}". म्हणा "काम १ पूर्ण झाले" किंवा "नवीन काम उद्या सकाळी १० वाजता".`;
            else if (currentLanguage === 'hi') fallbackMsg = `सुना: "${transcript}"। बोलें "कार्य 1 पूरा मार्क करें" या "नया कार्य कल सुबह 10 बजे"।`;
            else if (currentLanguage === 'te') fallbackMsg = `వినబడింది: "${transcript}". "టాస్క్ 1 పూర్తి చేయండి" లేదా "కొత్త టాస్క్ రేపు ఉదయం 10 కి" అనండి.`;

            setVoiceFeedback(fallbackMsg);
            speechService.speak(fallbackMsg, currentLanguage);
          }
        } else {
          setInterimText(transcript);
        }
      },
      onError: (errMsg: string) => {
        setIsListening(false);
        setInterimText('');
        showToast('Voice Recognition', errMsg, 'warning');
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    if (!started) {
      setIsListening(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    speechService.playWakeChime();
    setVoiceFeedback(null);
    const result = executeVoiceTaskCommand(promptText);
    if (result.handled && result.speechReply) {
      setVoiceFeedback(result.speechReply);
      speechService.speak(result.speechReply, currentLanguage);
    }
  };

  const VOICE_COMMAND_CHIPS_BY_LANG: Record<SupportedLanguage, { label: string; prompt: string }[]> = {
    en: [
      { label: 'Mark Task 1 Completed', prompt: 'Mark task 1 as completed' },
      { label: 'New Task: Spray Neem Tomorrow 10 AM', prompt: 'New task spray neem oil tomorrow at 10 AM' },
      { label: 'Reschedule Task 1 to 5 PM', prompt: 'Reschedule task 1 to today at 5 PM' },
      { label: 'Delete Task 2', prompt: 'Delete task 2' }
    ],
    mr: [
      { label: 'काम १ पूर्ण करा', prompt: 'काम १ पूर्ण झाले' },
      { label: 'नवीन काम: उद्या १० वा. निंबोळी अर्क', prompt: 'नवीन काम उद्या सकाळी १० वाजता निंबोळी अर्क फवारणी' },
      { label: 'काम १ ची वेळ संध्याकाळी ५ करा', prompt: 'काम १ ची वेळ संध्याकाळी ५ करा' },
      { label: 'काम २ हटवा', prompt: 'काम २ हटवा' }
    ],
    hi: [
      { label: 'कार्य 1 पूरा मार्क करें', prompt: 'कार्य 1 पूरा मार्क करें' },
      { label: 'नया कार्य: कल 10 बजे नीम छिड़काव', prompt: 'नया कार्य कल सुबह 10 बजे नीम स्प्रे' },
      { label: 'कार्य 1 समय शाम 5 बजे करें', prompt: 'कार्य 1 का समय शाम 5 बजे करें' },
      { label: 'कार्य 2 हटाएं', prompt: 'कार्य 2 हटाएं' }
    ],
    te: [
      { label: 'టాస్క్ 1 పూర్తి చేయండి', prompt: 'టాస్క్ 1 పూర్తయింది' },
      { label: 'కొత్త టాస్క్: రేపు 10 కి వేప పిచికారీ', prompt: 'కొత్త టాస్క్ రేపు ఉదయం 10 కి వేప నూనె స్ప్రే' },
      { label: 'టాస్క్ 1 సమయం మార్చండి', prompt: 'టాస్క్ 1 సమయం సాయంత్రం 5 కి మార్చండి' },
      { label: 'టాస్క్ 2 తొలగించండి', prompt: 'టాస్క్ 2 తొలగించండి' }
    ]
  };

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
            Create, reschedule, mark completed, or delete tasks seamlessly via voice commands or field console.
          </p>
        </div>

        {/* Action Buttons: Voice Mic + Add Task */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleToggleVoiceTask}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
            title={`Voice Task Command (${activeLangConfig.nativeName})`}
          >
            <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
            <span>{isListening ? 'Listening...' : `Voice (${activeLangConfig.nativeName.split(' ')[0]})`}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Task</span>
          </button>
        </div>
      </div>

      {/* Live Voice Status & Interactive Prompts Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-forest-100 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="w-4 h-4 text-forest-600 shrink-0" />
            <span className="font-extrabold text-slate-800 uppercase tracking-wide text-[11px]">
              Voice Task Assistant:
            </span>
            {/* Language switch pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <Languages className="w-3 h-3 text-slate-500 ml-1 shrink-0" />
              {SUPPORTED_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    currentLanguage === lang.code
                      ? 'bg-forest-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                  title={`Switch task voice language to ${lang.name}`}
                >
                  {lang.flag} {lang.nativeName.split(' ')[0]}
                </button>
              ))}
            </div>
            <span className="text-slate-500 text-[11px] hidden sm:inline">
              Tap mic or click command:
            </span>
          </div>
          {voiceFeedback && (
            <button
              onClick={() => speechService.speak(voiceFeedback, currentLanguage)}
              className="text-[11px] text-forest-700 hover:text-forest-900 font-bold flex items-center gap-1 bg-forest-50 px-2 py-0.5 rounded-md"
            >
              <Volume2 className="w-3 h-3" />
              <span>Replay Audio ({activeLangConfig.nativeName})</span>
            </button>
          )}
        </div>

        {/* Interim spoken text feedback */}
        {isListening && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2 animate-pulse">
            <Mic className="w-3.5 h-3.5 text-rose-600" />
            <span>{interimText ? `Heard: "${interimText}"` : `Listening in ${activeLangConfig.nativeName}... Speak now`}</span>
          </div>
        )}

        {/* Voice command result card */}
        {voiceFeedback && !isListening && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{voiceFeedback}</span>
            </div>
            <button
              onClick={() => setVoiceFeedback(null)}
              className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Voice Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-0.5 scrollbar-none text-xs">
          <span className="text-[10px] font-bold text-slate-400 shrink-0">{activeLangConfig.flag} Samples:</span>
          {(VOICE_COMMAND_CHIPS_BY_LANG[currentLanguage] || VOICE_COMMAND_CHIPS_BY_LANG.en).map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickPrompt(item.prompt)}
              className="px-3 py-1 rounded-xl bg-forest-50/80 hover:bg-forest-100 text-forest-900 border border-forest-200/70 font-semibold text-[11px] whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Mic className="w-3 h-3 text-forest-600" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
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
