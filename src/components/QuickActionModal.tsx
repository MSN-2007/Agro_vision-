import React, { useState } from 'react';
import {
  X,
  Camera,
  Video,
  Eye,
  CheckSquare,
  Bell,
  Bot,
  Mic,
  MicOff,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

export type QuickActionType =
  | 'photo'
  | 'video'
  | 'observation'
  | 'task'
  | 'reminder'
  | 'ask'
  | null;

interface QuickActionModalProps {
  action: QuickActionType;
  onClose: () => void;
  onNavigateToAssistant?: () => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  action,
  onClose,
  onNavigateToAssistant
}) => {
  const {
    currentFarm,
    currentField,
    currentGps,
    addObservation,
    addMediaItem,
    addTask,
    addReminder,
    sendAssistantMessage,
    showToast
  } = useFarm();

  // Form states
  const [obsTitle, setObsTitle] = useState('');
  const [obsNotes, setObsNotes] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState('Tomorrow');
  const [remTitle, setRemTitle] = useState('');
  const [remTime, setRemTime] = useState('Today • 5:00 PM');
  const [askQuery, setAskQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  if (!action) return null;

  // Voice speech simulation toggle
  const toggleVoiceInput = (setter: (text: string) => void, promptText: string) => {
    setIsListening(true);
    showToast('Listening...', 'Microphone active', 'info');
    setTimeout(() => {
      setter(promptText);
      setIsListening(false);
      showToast('Voice Transcribed', promptText, 'success');
    }, 1800);
  };

  const handleCapturePhoto = () => {
    const fieldName = currentField ? currentField.name : 'Mango Plantation';
    addMediaItem({
      farmId: currentFarm.id,
      fieldId: currentField ? currentField.id : 'field-mango-01',
      crop: currentField ? currentField.crop : 'Mango',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=80',
      caption: `Captured in ${fieldName} via AgroVision Glasses`,
      location: currentGps,
      aiAnalyzed: false
    });
    showToast('Photo Saved', `Saved to ${fieldName} media library`, 'success');
    onClose();
  };

  const handleRecordVideo = () => {
    const fieldName = currentField ? currentField.name : 'Mango Plantation';
    addMediaItem({
      farmId: currentFarm.id,
      fieldId: currentField ? currentField.id : 'field-mango-01',
      crop: currentField ? currentField.crop : 'Mango',
      type: 'video',
      url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=1000&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&auto=format&fit=crop&q=80',
      caption: `15s canopy inspection clip in ${fieldName}`,
      location: currentGps,
      aiAnalyzed: false
    });
    showToast('Video Saved', `Video recorded and synced to ${fieldName}`, 'success');
    onClose();
  };

  const handleSubmitObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsTitle.trim()) return;
    addObservation({
      title: obsTitle,
      notes: obsNotes,
      source: 'manual',
      mediaUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80'
    });
    onClose();
  };

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    addTask(taskTitle, currentField ? currentField.id : 'field-mango-01', taskDate);
    onClose();
  };

  const handleSubmitReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remTitle.trim()) return;
    addReminder(remTitle, remTime, currentField ? currentField.id : 'field-mango-01');
    onClose();
  };

  const handleSubmitAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim()) return;
    sendAssistantMessage(askQuery);
    onClose();
    if (onNavigateToAssistant) onNavigateToAssistant();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-forest-600 text-white shadow-xs">
              {action === 'photo' && <Camera className="w-5 h-5" />}
              {action === 'video' && <Video className="w-5 h-5" />}
              {action === 'observation' && <Eye className="w-5 h-5" />}
              {action === 'task' && <CheckSquare className="w-5 h-5" />}
              {action === 'reminder' && <Bell className="w-5 h-5" />}
              {action === 'ask' && <Bot className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base capitalize">
                {action === 'ask' ? 'Ask AgroVision AI' : `${action}`}
              </h3>
              <p className="text-xs text-forest-700 font-medium">
                {currentField ? currentField.name : 'Current Location'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content depending on action */}
        <div className="p-6">
          {/* PHOTO ACTION */}
          {action === 'photo' && (
            <div className="text-center space-y-4">
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80"
                  alt="Crop Preview"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4 text-left text-white">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>AgroVision Dual 12MP Camera Active</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1">
                    Geo-fence: {currentField ? currentField.name : 'Mango Plantation'} (13.2990° N, 77.5345° E)
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Trigger camera capture to save geotagged field photos.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo Now</span>
                </button>
              </div>
            </div>
          )}

          {/* VIDEO ACTION */}
          {action === 'video' && (
            <div className="text-center space-y-4">
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&auto=format&fit=crop&q=80"
                  alt="Video Preview"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-4 text-left text-white">
                  <div className="flex items-center gap-2 text-xs text-red-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <span>Ready to Record 1080p Video</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1">
                    Field: {currentField ? currentField.name : 'Mango Plantation'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRecordVideo}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <Video className="w-4 h-4" />
                <span>Record 15s Inspection Clip</span>
              </button>
            </div>
          )}

          {/* OBSERVATION FORM */}
          {action === 'observation' && (
            <form onSubmit={handleSubmitObservation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observation Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={obsTitle}
                    onChange={e => setObsTitle(e.target.value)}
                    placeholder="e.g. Yellow leaves on lower mango branches"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      toggleVoiceInput(
                        setObsTitle,
                        'The leaves on the northeast tree cluster are turning yellow'
                      )
                    }
                    className="absolute right-2.5 top-2.5 text-forest-600 hover:text-forest-800"
                    title="Speak to input title"
                  >
                    {isListening ? <Mic className="w-5 h-5 text-red-500 animate-pulse" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Notes & Details
                </label>
                <textarea
                  rows={3}
                  value={obsNotes}
                  onChange={e => setObsNotes(e.target.value)}
                  placeholder="Describe symptoms, pest activity, or soil condition..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-forest-50/60 border border-forest-100 flex items-center justify-between text-xs text-forest-900">
                <span className="font-semibold">Attached Field:</span>
                <span className="font-bold">{currentField ? currentField.name : 'Mango Plantation'}</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                Save Observation
              </button>
            </form>
          )}

          {/* TASK FORM */}
          {action === 'task' && (
            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Task Description
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={e => setTaskTitle(e.target.value)}
                    placeholder="e.g. Inspect drip line emitters"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      toggleVoiceInput(setTaskTitle, 'Apply foliar calcium fertilizer spray')
                    }
                    className="absolute right-2.5 top-2.5 text-forest-600 hover:text-forest-800"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Due Date
                </label>
                <select
                  value={taskDate}
                  onChange={e => setTaskDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                >
                  <option value="Today">Today</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="This Weekend">This Weekend</option>
                  <option value="Next Week">Next Week</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                Create Task
              </button>
            </form>
          )}

          {/* REMINDER FORM */}
          {action === 'reminder' && (
            <form onSubmit={handleSubmitReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reminder
                </label>
                <input
                  type="text"
                  required
                  value={remTitle}
                  onChange={e => setRemTitle(e.target.value)}
                  placeholder="e.g. Turn off main borewell pump"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Scheduled Time
                </label>
                <input
                  type="text"
                  value={remTime}
                  onChange={e => setRemTime(e.target.value)}
                  placeholder="e.g. Today • 5:00 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                Schedule Reminder
              </button>
            </form>
          )}

          {/* ASK ASSISTANT QUICK */}
          {action === 'ask' && (
            <form onSubmit={handleSubmitAsk} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ask Anything About Your Farm
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={askQuery}
                    onChange={e => setAskQuery(e.target.value)}
                    placeholder="e.g. What did I record yesterday? Or check weather."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      toggleVoiceInput(setAskQuery, 'What are my tasks for today in the mango field?')
                    }
                    className="absolute right-2.5 top-2.5 text-forest-600 hover:text-forest-800"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  'What are my tasks today?',
                  'What did I record yesterday?',
                  'Check weather & spray advisory',
                  'Is Anthracnose reported?'
                ].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setAskQuery(q)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Ask AgroVision</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
