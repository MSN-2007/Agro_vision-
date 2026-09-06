import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Farm,
  Field,
  FarmerUser,
  LatLng,
  Observation,
  MediaItem,
  ProblemReport,
  FarmTask,
  FarmReminder,
  FieldWeather,
  SmartGlassesDevice,
  WellBeingMetric,
  FarmNotification,
  AssistantChatMessage,
  ActivityLogItem,
  ObservationSource,
  TaskStatus
} from '../types/agro';
import {
  INITIAL_USER,
  INITIAL_FARMS,
  INITIAL_OBSERVATIONS,
  INITIAL_MEDIA,
  INITIAL_PROBLEMS,
  INITIAL_TASKS,
  INITIAL_REMINDERS,
  FIELD_WEATHER_DATA,
  INITIAL_DEVICE,
  INITIAL_WELLBEING,
  INITIAL_NOTIFICATIONS,
  INITIAL_CHAT,
  INITIAL_ACTIVITY_LOG
} from '../data/mockData';
import { findContainingField, calculatePolygonAreaAcres } from '../services/geofence';
import { speechService } from '../services/speechService';
import confetti from 'canvas-confetti';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  time: string;
}

interface FarmContextType {
  user: FarmerUser;
  updateUser: (updates: Partial<FarmerUser>) => void;
  farms: Farm[];
  currentFarm: Farm;
  currentField: Field | null;
  currentGps: LatLng;
  setCurrentGps: (coords: LatLng) => void;
  selectFarm: (farmId: string) => void;
  selectField: (fieldId: string | null) => void;
  addFarm: (name: string, locationName: string) => void;
  updateFarm: (farmId: string, updates: Partial<Farm>) => void;
  addField: (farmId: string, fieldData: Omit<Field, 'id' | 'farmId'>) => void;
  updateFieldBoundary: (fieldId: string, newBoundary: LatLng[]) => void;
  
  // Observations
  observations: Observation[];
  addObservation: (data: {
    title: string;
    notes: string;
    fieldId?: string;
    source?: ObservationSource;
    mediaUrl?: string;
    voiceTranscript?: string;
  }) => Observation;
  resolveObservation: (id: string) => void;
  deleteObservation: (id: string) => void;

  // Media
  mediaItems: MediaItem[];
  addMediaItem: (item: Omit<MediaItem, 'id' | 'timestamp'>) => MediaItem;

  // Problems & Alerts
  problems: ProblemReport[];
  addProblemReport: (data: Omit<ProblemReport, 'id' | 'reportedAt'>) => ProblemReport;
  resolveProblem: (id: string) => void;

  // Tasks & Reminders
  tasks: FarmTask[];
  addTask: (title: string, fieldId: string, dueDate: string, notes?: string, voiceCreated?: boolean) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;
  reminders: FarmReminder[];
  addReminder: (title: string, timeStr: string, fieldId: string) => void;
  dismissReminder: (id: string) => void;

  // Weather
  weatherData: Record<string, FieldWeather>;
  getFieldWeather: (fieldId: string) => FieldWeather;

  // Device
  device: SmartGlassesDevice;
  toggleDeviceConnection: () => void;
  syncDevice: () => void;

  // Well-being
  wellBeing: WellBeingMetric;
  acknowledgeHydration: () => void;

  // Notifications
  notifications: FarmNotification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  isNotificationDrawerOpen: boolean;
  setIsNotificationDrawerOpen: (open: boolean) => void;

  // Chat & AI Assistant
  chatMessages: AssistantChatMessage[];
  sendAssistantMessage: (userText: string) => void;
  clearChat: () => void;

  // Activity Log
  activityLog: ActivityLogItem[];

  // Toasts
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;

  // Morning Briefing Modal
  isBriefingModalOpen: boolean;
  setIsBriefingModalOpen: (open: boolean) => void;

  // Demo Mode triggers
  simulateGpsMovement: (targetField: 'mango' | 'tomato' | 'strawberry' | 'outside') => void;
  simulatePhotoCapture: () => void;
  simulateVoiceObservation: () => void;
  simulateAiDiseaseAlert: () => void;
  simulateTaskCreation: () => void;
  simulateMorningBriefing: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load saved state or default to realistic mock data
  const [user, setUser] = useState<FarmerUser>(() => {
    const saved = localStorage.getItem('agrovision_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [farms, setFarms] = useState<Farm[]>(() => {
    const saved = localStorage.getItem('agrovision_farms');
    return saved ? JSON.parse(saved) : INITIAL_FARMS;
  });

  const [currentFarmId, setCurrentFarmId] = useState<string>(farms[0]?.id || 'farm-gv-01');
  const currentFarm = farms.find(f => f.id === currentFarmId) || farms[0];

  // GPS coordinates - Defaults to center of Mango Plantation
  const [currentGps, setCurrentGps] = useState<LatLng>({ lat: 13.2990, lng: 77.5345 });

  // Automatically detect field using point-in-polygon
  const [currentField, setCurrentField] = useState<Field | null>(() => {
    return findContainingField({ lat: 13.2990, lng: 77.5345 }, currentFarm?.fields || []);
  });

  const [observations, setObservations] = useState<Observation[]>(() => {
    const saved = localStorage.getItem('agrovision_obs');
    return saved ? JSON.parse(saved) : INITIAL_OBSERVATIONS;
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('agrovision_media');
    return saved ? JSON.parse(saved) : INITIAL_MEDIA;
  });

  const [problems, setProblems] = useState<ProblemReport[]>(() => {
    const saved = localStorage.getItem('agrovision_problems');
    return saved ? JSON.parse(saved) : INITIAL_PROBLEMS;
  });

  const [tasks, setTasks] = useState<FarmTask[]>(() => {
    const saved = localStorage.getItem('agrovision_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [reminders, setReminders] = useState<FarmReminder[]>(() => {
    const saved = localStorage.getItem('agrovision_reminders');
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
  });

  const [weatherData] = useState<Record<string, FieldWeather>>(FIELD_WEATHER_DATA);
  const [device, setDevice] = useState<SmartGlassesDevice>(INITIAL_DEVICE);
  const [wellBeing, setWellBeing] = useState<WellBeingMetric>(INITIAL_WELLBEING);
  const [notifications, setNotifications] = useState<FarmNotification[]>(INITIAL_NOTIFICATIONS);
  const [chatMessages, setChatMessages] = useState<AssistantChatMessage[]>(INITIAL_CHAT);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOG);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState<boolean>(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('agrovision_farms', JSON.stringify(farms));
  }, [farms]);

  useEffect(() => {
    localStorage.setItem('agrovision_obs', JSON.stringify(observations));
  }, [observations]);

  useEffect(() => {
    localStorage.setItem('agrovision_media', JSON.stringify(mediaItems));
  }, [mediaItems]);

  useEffect(() => {
    localStorage.setItem('agrovision_problems', JSON.stringify(problems));
  }, [problems]);

  useEffect(() => {
    localStorage.setItem('agrovision_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('agrovision_reminders', JSON.stringify(reminders));
  }, [reminders]);

  // Toast Helper
  const showToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const newToast: ToastMessage = {
      id: 'toast-' + Date.now() + Math.random().toString(36).substring(2, 5),
      title,
      message,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setToasts(prev => [newToast, ...prev].slice(0, 4));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // When GPS updates, evaluate Geo-fence
  const handleGpsUpdate = (coords: LatLng) => {
    setCurrentGps(coords);
    const field = findContainingField(coords, currentFarm?.fields || []);
    if (field && field.id !== currentField?.id) {
      setCurrentField(field);
      showToast('Field Identified', `Currently inside ${field.name}`, 'success');
      addActivityLog('Geo-fence entered', `GPS detected inside ${field.name}`, field.name, 'gps');
    } else if (!field && currentField !== null) {
      setCurrentField(null);
      showToast('Boundary Alert', 'Location detected, but no registered field was found.', 'warning');
      addActivityLog('Boundary exited', 'Moved outside registered field boundaries', undefined, 'gps');
    }
  };

  const addActivityLog = (
    title: string,
    detail: string,
    field?: string,
    type: ActivityLogItem['type'] = 'gps'
  ) => {
    const newLog: ActivityLogItem = {
      id: 'act-' + Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title,
      detail,
      field: field || currentField?.name,
      type
    };
    setActivityLog(prev => [newLog, ...prev]);
  };

  const selectFarm = (farmId: string) => {
    setCurrentFarmId(farmId);
    const targetFarm = farms.find(f => f.id === farmId);
    if (targetFarm && targetFarm.fields.length > 0) {
      setCurrentField(targetFarm.fields[0]);
    }
  };

  const selectField = (fieldId: string | null) => {
    if (!fieldId) {
      setCurrentField(null);
      return;
    }
    const f = currentFarm.fields.find(field => field.id === fieldId);
    if (f) {
      setCurrentField(f);
      setCurrentGps(f.center);
    }
  };

  const addFarm = (name: string, locationName: string) => {
    const newFarm: Farm = {
      id: 'farm-' + Date.now(),
      name,
      locationName,
      center: { lat: 13.2985, lng: 77.5350 },
      totalAreaAcres: 0,
      createdAt: new Date().toISOString().split('T')[0],
      fields: []
    };
    setFarms(prev => [...prev, newFarm]);
    showToast('Farm Created', `"${name}" added to your farm records.`, 'success');
  };

  const updateFarm = (farmId: string, updates: Partial<Farm>) => {
    setFarms(prev => prev.map(f => f.id === farmId ? { ...f, ...updates } : f));
  };

  const addField = (farmId: string, fieldData: Omit<Field, 'id' | 'farmId'>) => {
    const newField: Field = {
      ...fieldData,
      id: 'field-' + Date.now(),
      farmId
    };
    setFarms(prev => prev.map(f => {
      if (f.id === farmId) {
        return {
          ...f,
          totalAreaAcres: Math.round((f.totalAreaAcres + newField.areaAcres) * 10) / 10,
          fields: [...f.fields, newField]
        };
      }
      return f;
    }));
    showToast('Field Added', `"${newField.name}" added to farm.`, 'success');
  };

  const updateFieldBoundary = (fieldId: string, newBoundary: LatLng[]) => {
    const newArea = calculatePolygonAreaAcres(newBoundary);
    // Center point
    const center = {
      lat: newBoundary.reduce((acc, p) => acc + p.lat, 0) / newBoundary.length,
      lng: newBoundary.reduce((acc, p) => acc + p.lng, 0) / newBoundary.length
    };

    setFarms(prev => prev.map(f => ({
      ...f,
      fields: f.fields.map(field => {
        if (field.id === fieldId) {
          return {
            ...field,
            boundary: newBoundary,
            areaAcres: newArea || field.areaAcres,
            center
          };
        }
        return field;
      })
    })));

    showToast('Boundary Saved', `Geo-fence boundary updated (${newArea} acres).`, 'success');
  };

  const addObservation = (data: {
    title: string;
    notes: string;
    fieldId?: string;
    source?: ObservationSource;
    mediaUrl?: string;
    voiceTranscript?: string;
  }): Observation => {
    const targetField = data.fieldId
      ? currentFarm.fields.find(f => f.id === data.fieldId) || currentField
      : currentField;

    const newObs: Observation = {
      id: 'obs-' + Date.now(),
      title: data.title,
      notes: data.notes,
      farmId: currentFarm.id,
      fieldId: targetField ? targetField.id : 'unassigned',
      crop: targetField ? targetField.crop : 'Unassigned Crop',
      location: currentGps,
      locationName: targetField ? targetField.name : 'Unknown GPS Location',
      timestamp: 'Today • ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: data.source || 'manual',
      status: 'Needs Attention',
      voiceTranscript: data.voiceTranscript,
      mediaUrl: data.mediaUrl,
      mediaType: 'photo'
    };

    setObservations(prev => [newObs, ...prev]);
    speechService.playSuccessChime();
    showToast('Observation Saved', `Associated with ${targetField?.name || 'Current Location'}`, 'success');
    addActivityLog('Observation created', data.title, targetField?.name, 'observation');
    return newObs;
  };

  const resolveObservation = (id: string) => {
    setObservations(prev => prev.map(o => o.id === id ? { ...o, status: 'Resolved' } : o));
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    showToast('Resolved', 'Observation marked as resolved', 'success');
  };

  const deleteObservation = (id: string) => {
    setObservations(prev => prev.filter(o => o.id !== id));
    showToast('Deleted', 'Observation deleted', 'info');
  };

  const addMediaItem = (item: Omit<MediaItem, 'id' | 'timestamp'>): MediaItem => {
    const newItem: MediaItem = {
      ...item,
      id: 'media-' + Date.now(),
      timestamp: 'Today • ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMediaItems(prev => [newItem, ...prev]);
    return newItem;
  };

  const addProblemReport = (data: Omit<ProblemReport, 'id' | 'reportedAt'>): ProblemReport => {
    const newProb: ProblemReport = {
      ...data,
      id: 'prob-' + Date.now(),
      reportedAt: 'Today • ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setProblems(prev => [newProb, ...prev]);
    return newProb;
  };

  const resolveProblem = (id: string) => {
    setProblems(prev => prev.map(p => p.id === id ? { ...p, status: 'Resolved' } : p));
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    showToast('Problem Resolved', 'Field issue marked as resolved', 'success');
  };

  const addTask = (title: string, fieldId: string, dueDate: string, notes?: string, voiceCreated = false) => {
    const newTask: FarmTask = {
      id: 'task-' + Date.now(),
      title,
      fieldId,
      dueDate,
      status: 'Pending',
      voiceCreated,
      notes,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTasks(prev => [newTask, ...prev]);
    speechService.playSuccessChime();
    showToast('Task Added', `Scheduled for ${dueDate}`, 'success');
    addActivityLog('Task created', title, undefined, 'task');
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus: TaskStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
        if (nextStatus === 'Completed') {
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
        }
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('Task Removed', 'Task deleted from schedule', 'info');
  };

  const addReminder = (title: string, timeStr: string, fieldId: string) => {
    const newRem: FarmReminder = {
      id: 'rem-' + Date.now(),
      title,
      timeStr,
      fieldId,
      status: 'Scheduled',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setReminders(prev => [newRem, ...prev]);
    speechService.playSuccessChime();
    showToast('Reminder Scheduled', `${title} (${timeStr})`, 'success');
  };

  const dismissReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  const getFieldWeather = (fieldId: string): FieldWeather => {
    if (weatherData[fieldId]) return weatherData[fieldId];
    return weatherData['field-mango-01'] || {
      fieldId,
      fieldName: 'Selected Field',
      temperature: 28,
      feelsLike: 29,
      condition: 'Partly Cloudy',
      conditionIcon: 'cloud-sun',
      humidity: 60,
      windKmh: 10,
      rainProbability: 25,
      rainfallMm: 0,
      sprayAdvisory: { status: 'Optimal', reason: 'Ideal weather conditions' },
      forecast: []
    };
  };

  const toggleDeviceConnection = () => {
    setDevice(prev => ({
      ...prev,
      connected: !prev.connected,
      bluetoothConnected: !prev.connected
    }));
    showToast(
      device.connected ? 'Glasses Disconnected' : 'AgroVision Glasses Connected',
      device.connected ? 'Wearable offline' : 'Ready for voice & hands-free capture',
      device.connected ? 'warning' : 'success'
    );
  };

  const syncDevice = () => {
    setDevice(prev => ({
      ...prev,
      lastSyncTime: 'Just now'
    }));
    speechService.playSuccessChime();
    showToast('Synchronization Complete', 'Synced telemetry, GPS coordinates, and media buffer', 'success');
  };

  const acknowledgeHydration = () => {
    setWellBeing(prev => ({
      ...prev,
      waterRemindersSent: prev.waterRemindersSent + 1,
      nextHydrationTime: 'In 45 minutes'
    }));
    showToast('Hydration Logged', 'Stay hydrated during farm work!', 'success');
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Conversational Assistant Chat Engine
  const sendAssistantMessage = (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: AssistantChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);

    // Generate intelligent farm-contextual response
    setTimeout(() => {
      let reply = '';
      const lower = userText.toLowerCase();

      if (lower.includes('task') || lower.includes('to do')) {
        const pending = tasks.filter(t => t.status === 'Pending');
        reply = `You currently have ${pending.length} pending tasks for today: ${pending.map(t => t.title).join(', ')}.`;
      } else if (lower.includes('yesterday') || lower.includes('last record')) {
        const yesterdayObs = observations.find(o => o.timestamp.includes('Yesterday')) || observations[0];
        reply = `Yesterday at ${yesterdayObs?.timestamp.split('•')[1]?.trim() || '10:32 AM'}, you recorded an observation in ${yesterdayObs?.crop || 'Mango'}: "${yesterdayObs?.title}".`;
      } else if (lower.includes('weather') || lower.includes('rain')) {
        const currentWeather = currentField ? getFieldWeather(currentField.id) : getFieldWeather('field-mango-01');
        reply = `In ${currentWeather.fieldName}, it is currently ${currentWeather.temperature}°C, ${currentWeather.condition}. Rain probability is ${currentWeather.rainProbability}% and wind is ${currentWeather.windKmh} km/h. Spray conditions are ${currentWeather.sprayAdvisory.status}.`;
      } else if (lower.includes('mango') || lower.includes('problem') || lower.includes('yellow')) {
        reply = `In the Mango Plantation, we have 1 active alert for yellow leaves and suspected Anthracnose (87% confidence). Pruning and Copper Oxychloride spray are recommended before the rain.`;
      } else if (lower.includes('tomato')) {
        reply = `The Tomato Field is at 68% health. Early blight was noted on the lower leaves. Trellis repair is scheduled for today.`;
      } else if (lower.includes('strawberry')) {
        reply = `The Strawberry Field is in excellent health at 91%, with vigorous crown growth and uniform blossoming. Fertigation is on schedule.`;
      } else if (lower.includes('where am i') || lower.includes('location')) {
        reply = currentField
          ? `You are currently inside ${currentField.name} at GPS ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E.`
          : `You are outside your registered fields at GPS ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E.`;
      } else {
        reply = `I heard you, Ravi. I am tracking your activity across ${currentFarm.name}. You can ask me about crop observations, weather advisories, tasks, or speak to take a photo.`;
      }

      const botMsg: AssistantChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasAudio: true
      };

      setChatMessages(prev => [...prev, botMsg]);
      speechService.speak(reply);
    }, 600);
  };

  const clearChat = () => {
    setChatMessages(INITIAL_CHAT);
  };

  // ================= DEMO WORKFLOW SIMULATION SUITE =================
  // 1. Simulate GPS Movement
  const simulateGpsMovement = (target: 'mango' | 'tomato' | 'strawberry' | 'outside') => {
    speechService.playWakeChime();
    let coords: LatLng = { lat: 13.2990, lng: 77.5345 };
    if (target === 'mango') coords = { lat: 13.2990, lng: 77.5345 };
    if (target === 'tomato') coords = { lat: 13.2965, lng: 77.5352 };
    if (target === 'strawberry') coords = { lat: 13.2980, lng: 77.5380 };
    if (target === 'outside') coords = { lat: 13.3050, lng: 77.5450 };

    handleGpsUpdate(coords);
  };

  // 2. Simulate Photo Capture with Wearable Glasses
  const simulatePhotoCapture = () => {
    speechService.playShutterChime();
    showToast('Photo Captured', 'Dual 12MP glasses camera snapped image', 'info');

    setTimeout(() => {
      showToast('Location Detected', `GPS: ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E`, 'info');
    }, 700);

    setTimeout(() => {
      const fieldName = currentField ? currentField.name : 'Unknown Location';
      showToast('Geo-fence Matched', `${fieldName} identified`, 'success');
      
      const newMedia = addMediaItem({
        farmId: currentFarm.id,
        fieldId: currentField ? currentField.id : 'unassigned',
        crop: currentField ? currentField.crop : 'Unassigned',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=80',
        caption: `Wearable camera capture in ${fieldName}`,
        location: currentGps,
        aiAnalyzed: false
      });

      addActivityLog('Photo captured', `Saved to ${fieldName} media album`, fieldName, 'photo');
      showToast('Photo Saved', `Stored in ${fieldName} media library`, 'success');
    }, 1400);
  };

  // 3. Simulate Voice Observation
  const simulateVoiceObservation = () => {
    speechService.playWakeChime();
    showToast('Wake Word Detected', '“Hey Vision, the mango leaves are turning yellow”', 'info');

    setTimeout(() => {
      const fieldName = currentField ? currentField.name : 'Mango Plantation';
      const obs = addObservation({
        title: 'Yellow leaves observed on lower canopy',
        notes: 'Farmer voice logged: Leaves turning yellow and chlorotic.',
        fieldId: currentField ? currentField.id : 'field-mango-01',
        source: 'voice',
        voiceTranscript: '“Hey Vision, the mango leaves are turning yellow.”',
        mediaUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80'
      });

      speechService.speak(`Observation recorded for ${fieldName}. Yellow leaves logged.`);
    }, 1000);
  };

  // 4. Simulate Agricultural AI Disease Alert
  const simulateAiDiseaseAlert = () => {
    speechService.playWakeChime();
    showToast('AI Analysis Running', 'Dedicated Crop-Vision CV model analyzing foliage image...', 'info');

    setTimeout(() => {
      const field = currentFarm.fields[0]; // Mango
      const newProblem = addProblemReport({
        fieldId: field.id,
        farmId: currentFarm.id,
        crop: field.crop,
        farmerNote: '“Leaves look unusual with dark necrotic specks.”',
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
        status: 'AI Analyzed',
        aiAnalysis: {
          detectedCrop: 'Mango (Mangifera indica)',
          possibleDisease: 'Anthracnose (Colletotrichum gloeosporioides)',
          confidence: 87,
          severity: 'Moderate',
          recommendedAction: 'Inspect affected branch cluster. Prune affected leaves. Apply Copper Oxychloride (0.3%) before rain.',
          modelName: 'AgroVision-CropVision v3.2',
          analyzedAt: 'Just now'
        }
      });

      const newNotif: FarmNotification = {
        id: 'notif-' + Date.now(),
        type: 'Crop Problem',
        title: 'High Alert: Anthracnose Detected (87%)',
        message: 'Computer vision identified fungal lesions on Mango foliage.',
        timestamp: 'Just now',
        read: false,
        fieldId: field.id
      };
      setNotifications(prev => [newNotif, ...prev]);

      addActivityLog('AI Disease Alert', 'Anthracnose detected (87% confidence) in Mango Plantation', 'Mango Plantation', 'alert');
      showToast('AI Diagnosis Ready', 'Anthracnose (87% confidence) identified in Mango Plantation', 'warning');
      speechService.speak('Alert: AgroVision CropVision model detected Anthracnose with 87% confidence in Mango Plantation. Pruning recommended.');
    }, 1200);
  };

  // 5. Simulate Task Creation via Voice
  const simulateTaskCreation = () => {
    speechService.playWakeChime();
    showToast('Voice Command Received', '“Hey Vision, add fertilizer application for mango field tomorrow”', 'info');

    setTimeout(() => {
      addTask(
        'Apply NPK (19:19:19) foliar nutrition',
        'field-mango-01',
        'Tomorrow',
        'Voice created via AgroVision glasses: Apply foliar fertilizer in early morning.',
        true
      );
      speechService.speak('Task added: Fertilizer application scheduled for Mango Plantation tomorrow.');
    }, 900);
  };

  // 6. Simulate Morning Briefing
  const simulateMorningBriefing = () => {
    setIsBriefingModalOpen(true);
    const briefingText = `Good morning Ravi. Mango Plantation is currently being monitored. Current weather is 28 degrees Celsius, partly cloudy with 30 percent chance of rain. You have three tasks today, including checking irrigation lines and inspecting mango leaves. One observation of yellow leaves was reported yesterday and requires attention.`;
    speechService.speak(briefingText);
    showToast('Morning Briefing', 'Audio briefing initiated for Ravi Kumar', 'success');
  };

  return (
    <FarmContext.Provider
      value={{
        user,
        updateUser: updates => setUser(prev => ({ ...prev, ...updates })),
        farms,
        currentFarm,
        currentField,
        currentGps,
        setCurrentGps: handleGpsUpdate,
        selectFarm,
        selectField,
        addFarm,
        updateFarm,
        addField,
        updateFieldBoundary,
        observations,
        addObservation,
        resolveObservation,
        deleteObservation,
        mediaItems,
        addMediaItem,
        problems,
        addProblemReport,
        resolveProblem,
        tasks,
        addTask,
        toggleTaskStatus,
        deleteTask,
        reminders,
        addReminder,
        dismissReminder,
        weatherData,
        getFieldWeather,
        device,
        toggleDeviceConnection,
        syncDevice,
        wellBeing,
        acknowledgeHydration,
        notifications,
        markNotificationRead,
        clearNotifications,
        isNotificationDrawerOpen,
        setIsNotificationDrawerOpen,
        chatMessages,
        sendAssistantMessage,
        clearChat,
        activityLog,
        toasts,
        dismissToast,
        showToast,
        isBriefingModalOpen,
        setIsBriefingModalOpen,
        simulateGpsMovement,
        simulatePhotoCapture,
        simulateVoiceObservation,
        simulateAiDiseaseAlert,
        simulateTaskCreation,
        simulateMorningBriefing
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
