import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  INITIAL_DEVICE,
  INITIAL_WELLBEING,
  INITIAL_NOTIFICATIONS,
  INITIAL_CHAT,
  INITIAL_ACTIVITY_LOG
} from '../data/mockData';
import { findContainingField, calculatePolygonAreaAcres } from '../services/geofence';
import { speechService } from '../services/speechService';
import { fetchFieldWeather } from '../services/weatherService';
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
  addField: (farmId: string, fieldData: Omit<Field, 'id' | 'farmId'>) => Field;
  updateFieldBoundary: (fieldId: string, newBoundary: LatLng[]) => void;
  deleteField: (fieldId: string) => void;
  
  // Real GPS Locate Me
  locateMe: () => void;

  // Observations (strictly field scoped)
  observations: Observation[];
  getFieldObservations: (fieldId?: string | null) => Observation[];
  addObservation: (data: {
    title: string;
    notes: string;
    fieldId?: string | null;
    source?: ObservationSource;
    mediaUrl?: string;
    voiceTranscript?: string;
  }) => Observation;
  resolveObservation: (id: string) => void;
  deleteObservation: (id: string) => void;

  // Media (strictly field scoped)
  mediaItems: MediaItem[];
  getFieldMedia: (fieldId?: string | null) => MediaItem[];
  addMediaItem: (item: Omit<MediaItem, 'id' | 'timestamp'>) => MediaItem;

  // Problems & Alerts (strictly field scoped)
  problems: ProblemReport[];
  getFieldProblems: (fieldId?: string | null) => ProblemReport[];
  addProblemReport: (data: Omit<ProblemReport, 'id' | 'reportedAt'>) => ProblemReport;
  resolveProblem: (id: string) => void;

  // Tasks & Reminders (strictly field scoped)
  tasks: FarmTask[];
  getFieldTasks: (fieldId?: string | null) => FarmTask[];
  addTask: (title: string, fieldId: string | null, dueDate: string, notes?: string, voiceCreated?: boolean) => void;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;
  reminders: FarmReminder[];
  getFieldReminders: (fieldId?: string | null) => FarmReminder[];
  addReminder: (title: string, timeStr: string, fieldId: string | null) => void;
  dismissReminder: (id: string) => void;

  // Real Weather API Integration
  weatherData: Record<string, FieldWeather>;
  getFieldWeather: (fieldId?: string | null) => FieldWeather | null;
  refreshCurrentWeather: () => Promise<void>;
  isWeatherLoading: boolean;

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
  const [currentGps, setCurrentGpsState] = useState<LatLng>({ lat: 13.2990, lng: 77.5345 });

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

  // Real weather state map (fieldId -> FieldWeather)
  const [weatherData, setWeatherData] = useState<Record<string, FieldWeather>>({});
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);

  const [device, setDevice] = useState<SmartGlassesDevice>(INITIAL_DEVICE);
  const [wellBeing, setWellBeing] = useState<WellBeingMetric>(INITIAL_WELLBEING);
  const [notifications, setNotifications] = useState<FarmNotification[]>(INITIAL_NOTIFICATIONS);
  const [chatMessages, setChatMessages] = useState<AssistantChatMessage[]>(INITIAL_CHAT);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOG);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState<boolean>(false);

  // Sync to localStorage
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
  const showToast = useCallback((title: string, message: string, type: ToastMessage['type'] = 'info') => {
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
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addActivityLog = useCallback((
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
  }, [currentField?.name]);

  // When GPS updates, evaluate Geo-fence
  const handleGpsUpdate = useCallback((coords: LatLng) => {
    setCurrentGpsState(coords);
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
  }, [currentFarm?.fields, currentField, showToast, addActivityLog]);

  // Real GPS "Locate Me"
  const locateMe = () => {
    if (!navigator.geolocation) {
      showToast('GPS Unavailable', 'Location services not supported by browser.', 'error');
      return;
    }
    showToast('Locating GPS...', 'Querying device satellite positioning', 'info');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        handleGpsUpdate(coords);
        const inside = findContainingField(coords, currentFarm?.fields || []);
        if (inside) {
          showToast('Located', `You are inside ${inside.name}`, 'success');
        } else {
          showToast('Located', 'You are outside registered fields.', 'warning');
        }
      },
      err => {
        // Fallback gracefully without crash
        showToast('GPS Unavailable', 'Could not retrieve hardware location. Check browser permissions.', 'warning');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Weather fetching for a specific field or current context
  const loadWeatherForField = useCallback(async (field: Field, force = false) => {
    setIsWeatherLoading(true);
    try {
      const weather = await fetchFieldWeather(
        field.id,
        field.name,
        field.center.lat,
        field.center.lng,
        force
      );
      setWeatherData(prev => ({
        ...prev,
        [field.id]: weather
      }));
    } catch {
      // Handled in weatherService
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  // Fetch live weather when currentField changes
  useEffect(() => {
    if (currentField) {
      loadWeatherForField(currentField);
    } else if (currentFarm && currentFarm.fields.length > 0) {
      loadWeatherForField(currentFarm.fields[0]);
    }
  }, [currentField, currentFarm, loadWeatherForField]);

  const refreshCurrentWeather = async () => {
    const target = currentField || currentFarm.fields[0];
    if (target) {
      await loadWeatherForField(target, true);
      showToast('Weather Refreshed', `Live conditions updated for ${target.name}`, 'success');
    }
  };

  const getFieldWeather = (fieldId?: string | null): FieldWeather | null => {
    const id = fieldId || currentField?.id || currentFarm.fields[0]?.id;
    if (!id) return null;
    return weatherData[id] || null;
  };

  // Navigation / Selection
  const selectFarm = (farmId: string) => {
    setCurrentFarmId(farmId);
    const targetFarm = farms.find(f => f.id === farmId);
    if (targetFarm && targetFarm.fields.length > 0) {
      setCurrentField(targetFarm.fields[0]);
      setCurrentGpsState(targetFarm.fields[0].center);
    } else {
      setCurrentField(null);
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
      setCurrentGpsState(f.center);
    }
  };

  // Farm Creation (Strict Data Isolation - Master Prompt Section 1 & 2)
  const addFarm = (name: string, locationName: string) => {
    const newFarm: Farm = {
      id: 'farm-' + Date.now(),
      name,
      locationName,
      center: { lat: 13.2985, lng: 77.5350 },
      totalAreaAcres: 0,
      createdAt: new Date().toISOString().split('T')[0],
      isDemoFarm: false,
      fields: []
    };
    setFarms(prev => [...prev, newFarm]);
    setCurrentFarmId(newFarm.id);
    setCurrentField(null);
    showToast('Farm Created', `"${name}" added. It starts with zero fields and zero records.`, 'success');
  };

  const updateFarm = (farmId: string, updates: Partial<Farm>) => {
    setFarms(prev => prev.map(f => f.id === farmId ? { ...f, ...updates } : f));
  };

  // Field Creation (Strict Data Isolation - Master Prompt Sections 1, 26, 27, 28, 29, 30, 31)
  const addField = (farmId: string, fieldData: Omit<Field, 'id' | 'farmId'>): Field => {
    const newField: Field = {
      ...fieldData,
      id: 'field-' + Date.now(),
      farmId,
      healthPercentage: null, // Starts as Unanalyzed - No fake percentages
      healthBreakdown: null,
      status: 'Unanalyzed',
      isDemoField: false
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

    setCurrentField(newField);
    setCurrentGpsState(newField.center);
    showToast(
      'Field Registered',
      `"${newField.name}" created with 0 observations, 0 media, 0 tasks, and no fake data.`,
      'success'
    );
    return newField;
  };

  const updateFieldBoundary = (fieldId: string, newBoundary: LatLng[]) => {
    const newArea = calculatePolygonAreaAcres(newBoundary);
    const center = {
      lat: newBoundary.reduce((acc, p) => acc + p.lat, 0) / (newBoundary.length || 1),
      lng: newBoundary.reduce((acc, p) => acc + p.lng, 0) / (newBoundary.length || 1)
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

    // If updating current field, sync currentField state
    if (currentField?.id === fieldId) {
      setCurrentField(prev => prev ? { ...prev, boundary: newBoundary, areaAcres: newArea || prev.areaAcres, center } : null);
    }

    showToast('Field Boundary Updated', `Boundary saved (${newArea} acres).`, 'success');
  };

  const deleteField = (fieldId: string) => {
    setFarms(prev => prev.map(f => ({
      ...f,
      fields: f.fields.filter(field => field.id !== fieldId)
    })));
    // Also clean up field-specific records
    setObservations(prev => prev.filter(o => o.fieldId !== fieldId));
    setMediaItems(prev => prev.filter(m => m.fieldId !== fieldId));
    setProblems(prev => prev.filter(p => p.fieldId !== fieldId));
    setTasks(prev => prev.filter(t => t.fieldId !== fieldId));
    setReminders(prev => prev.filter(r => r.fieldId !== fieldId));

    if (currentField?.id === fieldId) {
      setCurrentField(null);
    }
    showToast('Field Deleted', 'Field and its records removed.', 'info');
  };

  // Strict Field-Specific Selectors (Master Prompt Section 2 & 28-31)
  const getFieldObservations = (fieldId?: string | null): Observation[] => {
    if (fieldId === undefined) fieldId = currentField?.id;
    if (!fieldId) return [];
    return observations.filter(o => o.fieldId === fieldId);
  };

  const getFieldMedia = (fieldId?: string | null): MediaItem[] => {
    if (fieldId === undefined) fieldId = currentField?.id;
    if (!fieldId) return [];
    return mediaItems.filter(m => m.fieldId === fieldId);
  };

  const getFieldProblems = (fieldId?: string | null): ProblemReport[] => {
    if (fieldId === undefined) fieldId = currentField?.id;
    if (!fieldId) return [];
    return problems.filter(p => p.fieldId === fieldId);
  };

  const getFieldTasks = (fieldId?: string | null): FarmTask[] => {
    if (fieldId === undefined) fieldId = currentField?.id;
    if (!fieldId) return [];
    return tasks.filter(t => t.fieldId === fieldId);
  };

  const getFieldReminders = (fieldId?: string | null): FarmReminder[] => {
    if (fieldId === undefined) fieldId = currentField?.id;
    if (!fieldId) return [];
    return reminders.filter(r => r.fieldId === fieldId);
  };

  // Observations CRUD
  const addObservation = (data: {
    title: string;
    notes: string;
    fieldId?: string | null;
    source?: ObservationSource;
    mediaUrl?: string;
    voiceTranscript?: string;
  }): Observation => {
    // If fieldId is not provided, associate with currentField if inside, otherwise null
    const targetFieldId = data.fieldId !== undefined
      ? data.fieldId
      : (currentField ? currentField.id : null);

    const targetField = currentFarm.fields.find(f => f.id === targetFieldId) || null;

    const newObs: Observation = {
      id: 'obs-' + Date.now(),
      title: data.title,
      notes: data.notes,
      farmId: currentFarm.id,
      fieldId: targetFieldId,
      crop: targetField ? targetField.crop : 'Unassigned',
      location: currentGps,
      locationName: targetField ? targetField.name : 'Outside Registered Fields',
      timestamp: 'Today • ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: data.source || 'manual',
      status: 'Needs Attention',
      voiceTranscript: data.voiceTranscript,
      mediaUrl: data.mediaUrl,
      mediaType: 'photo'
    };

    setObservations(prev => [newObs, ...prev]);
    speechService.playSuccessChime();
    showToast(
      'Observation Saved',
      targetField ? `Associated with ${targetField.name}` : 'Saved without registered field assignment',
      'success'
    );
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
    showToast('Deleted', 'Observation removed', 'info');
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

  const addTask = (
    title: string,
    fieldId: string | null,
    dueDate: string,
    notes?: string,
    voiceCreated = false
  ) => {
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
    showToast('Task Removed', 'Task deleted', 'info');
  };

  const addReminder = (title: string, timeStr: string, fieldId: string | null) => {
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

    setTimeout(() => {
      let reply = '';
      const lower = userText.toLowerCase();

      // Respect field isolation in chat answers
      if (lower.includes('task') || lower.includes('to do')) {
        const fieldTasks = currentField
          ? tasks.filter(t => t.fieldId === currentField.id && t.status === 'Pending')
          : tasks.filter(t => t.status === 'Pending');
        reply = fieldTasks.length > 0
          ? `You have ${fieldTasks.length} pending task(s)${currentField ? ` in ${currentField.name}` : ''}: ${fieldTasks.map(t => t.title).join(', ')}.`
          : `You have no pending tasks${currentField ? ` in ${currentField.name}` : ''}.`;
      } else if (lower.includes('yesterday') || lower.includes('last record')) {
        const fieldObs = currentField
          ? observations.filter(o => o.fieldId === currentField.id)
          : observations;
        const targetObs = fieldObs[0];
        reply = targetObs
          ? `In ${targetObs.locationName || 'the field'}, observation recorded: "${targetObs.title}".`
          : `No observations found for ${currentField ? currentField.name : 'this area'}.`;
      } else if (lower.includes('weather') || lower.includes('rain')) {
        const w = getFieldWeather(currentField?.id);
        reply = w && !w.isError
          ? `In ${w.fieldName}, current weather is ${w.temperature}°C, ${w.condition}. Humidity is ${w.humidity}% with wind at ${w.windKmh} km/h (${w.windDirectionCompass}). Spray conditions are ${w.sprayAdvisory.status}.`
          : `Weather data is currently unavailable for ${currentField?.name || 'this location'}.`;
      } else if (lower.includes('where am i') || lower.includes('location')) {
        reply = currentField
          ? `You are inside ${currentField.name} at GPS ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E.`
          : `You are outside registered field boundaries at GPS ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E.`;
      } else {
        reply = `I am monitoring ${currentFarm.name}. You can ask about crop observations, weather advisories, or tasks.`;
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

  // ================= DEMO WORKFLOW SIMULATORS =================
  const simulateGpsMovement = (target: 'mango' | 'tomato' | 'strawberry' | 'outside') => {
    speechService.playWakeChime();
    let coords: LatLng = { lat: 13.2990, lng: 77.5345 };
    if (target === 'mango') coords = { lat: 13.2990, lng: 77.5345 };
    if (target === 'tomato') coords = { lat: 13.2965, lng: 77.5352 };
    if (target === 'strawberry') coords = { lat: 13.2980, lng: 77.5380 };
    if (target === 'outside') coords = { lat: 13.3050, lng: 77.5450 };

    handleGpsUpdate(coords);
  };

  const simulatePhotoCapture = () => {
    speechService.playShutterChime();
    showToast('Photo Captured', 'Dual 12MP glasses camera snapped image', 'info');

    setTimeout(() => {
      showToast('Location Detected', `GPS: ${currentGps.lat.toFixed(4)}° N, ${currentGps.lng.toFixed(4)}° E`, 'info');
    }, 600);

    setTimeout(() => {
      const field = currentField;
      const fieldName = field ? field.name : 'No registered field';
      
      addMediaItem({
        farmId: currentFarm.id,
        fieldId: field ? field.id : null,
        crop: field ? field.crop : 'Unassigned',
        type: 'photo',
        url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=80',
        caption: `Capture in ${fieldName}`,
        location: currentGps,
        aiAnalyzed: false
      });

      if (field) {
        showToast('Geo-fence Matched', `${field.name} identified`, 'success');
        addActivityLog('Photo captured', `Saved to ${field.name}`, field.name, 'photo');
      } else {
        showToast('Unregistered Location', 'Photo saved without registered field association', 'warning');
      }
    }, 1200);
  };

  const simulateVoiceObservation = () => {
    speechService.playWakeChime();
    showToast('Wake Word Detected', '“Hey Vision, the mango leaves are turning yellow”', 'info');

    setTimeout(() => {
      const targetField = currentField || currentFarm.fields.find(f => f.id === 'field-mango-01') || null;
      addObservation({
        title: 'Yellow leaves observed on lower canopy',
        notes: 'Farmer voice logged: Leaves turning yellow with chlorosis.',
        fieldId: targetField ? targetField.id : null,
        source: 'voice',
        voiceTranscript: '“Hey Vision, the mango leaves are turning yellow.”',
        mediaUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80'
      });

      speechService.speak(`Observation recorded for ${targetField?.name || 'current location'}.`);
    }, 900);
  };

  const simulateAiDiseaseAlert = () => {
    speechService.playWakeChime();
    showToast('AI Analysis Running', 'Crop-Vision CV model analyzing foliage image...', 'info');

    setTimeout(() => {
      const field = currentField || currentFarm.fields[0];
      if (field) {
        addProblemReport({
          fieldId: field.id,
          farmId: currentFarm.id,
          crop: field.crop,
          farmerNote: '“Leaves look unusual with dark necrotic specks.”',
          imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
          status: 'AI Analyzed',
          aiAnalysis: {
            detectedCrop: field.crop,
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
          title: `High Alert: Anthracnose in ${field.name}`,
          message: 'Computer vision identified fungal lesions on foliage (87% confidence).',
          timestamp: 'Just now',
          read: false,
          fieldId: field.id
        };
        setNotifications(prev => [newNotif, ...prev]);
        showToast('AI Diagnosis Ready', `Anthracnose (87% conf) in ${field.name}`, 'warning');
        speechService.speak(`Alert: AgroVision CropVision model detected Anthracnose with 87% confidence in ${field.name}.`);
      }
    }, 1200);
  };

  const simulateTaskCreation = () => {
    speechService.playWakeChime();
    showToast('Voice Command Received', '“Hey Vision, add fertilizer application tomorrow”', 'info');

    setTimeout(() => {
      const field = currentField || currentFarm.fields[0] || null;
      addTask(
        'Apply foliar fertilizer (19:19:19 NPK)',
        field ? field.id : null,
        'Tomorrow',
        'Voice created via AgroVision glasses: Early morning foliar application.',
        true
      );
      speechService.speak(`Task added for ${field ? field.name : 'farm'}.`);
    }, 800);
  };

  const simulateMorningBriefing = () => {
    setIsBriefingModalOpen(true);
    const field = currentField || currentFarm.fields[0];
    const w = getFieldWeather(field?.id);
    const briefingText = `Good morning Ravi. ${field ? field.name : currentFarm.name} is currently being monitored. Current weather is ${w?.temperature ?? 28} degrees Celsius, ${w?.condition ?? 'partly cloudy'}.`;
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
        deleteField,
        locateMe,
        observations,
        getFieldObservations,
        addObservation,
        resolveObservation,
        deleteObservation,
        mediaItems,
        getFieldMedia,
        addMediaItem,
        problems,
        getFieldProblems,
        addProblemReport,
        resolveProblem,
        tasks,
        getFieldTasks,
        addTask,
        toggleTaskStatus,
        deleteTask,
        reminders,
        getFieldReminders,
        addReminder,
        dismissReminder,
        weatherData,
        getFieldWeather,
        refreshCurrentWeather,
        isWeatherLoading,
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
