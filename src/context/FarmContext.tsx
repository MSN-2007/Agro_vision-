import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  TaskStatus,
  SupportedLanguage,
  SUPPORTED_LANGUAGES
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
import { geminiService } from '../services/geminiService';
import { parseVoiceTaskCommand, VoiceTaskResult } from '../services/voiceTaskService';
import confetti from 'canvas-confetti';
// ── Shared Backend API Services ──────────────────────────────────────────────
import { farmService } from '../services/api/farmService';

import { taskService } from '../services/api/taskService';
import { observationService } from '../services/api/observationService';
import { mediaService } from '../services/api/mediaService';
import { reminderService } from '../services/api/reminderService';
import { activityApiService } from '../services/api/activityApiService';
import { syncService } from '../services/api/syncService';

export type SyncStatus = 'connected' | 'disconnected' | 'reconnecting';

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
  currentLanguage: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
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
  updateTask: (id: string, updates: Partial<FarmTask>) => void;
  executeVoiceTaskCommand: (transcript: string) => VoiceTaskResult;
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
  isAssistantThinking: boolean;
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

  // Backend Sync Status
  syncStatus: SyncStatus;

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

  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('agrovision_lang') as SupportedLanguage;
    return saved && ['en', 'hi', 'mr', 'te'].includes(saved)
      ? saved
      : (user.preferredLanguage || 'en');
  });

  useEffect(() => {
    speechService.setLanguage(currentLanguage);
  }, [currentLanguage]);

  const setLanguage = (lang: SupportedLanguage) => {
    setCurrentLanguageState(lang);
    localStorage.setItem('agrovision_lang', lang);
    setUser(prev => ({ ...prev, preferredLanguage: lang }));
    speechService.setLanguage(lang);

    let greeting = 'Language switched to English. AgroVision Assistant is ready.';
    let toastTitle = 'Language: English';
    if (lang === 'mr') {
      greeting = 'नमस्कार, भाषा मराठी निवडली आहे. ॲग्रोव्हिजन शेती सहाय्यक सज्ज आहे.';
      toastTitle = 'भाषा: मराठी';
    } else if (lang === 'hi') {
      greeting = 'नमस्ते, भाषा हिन्दी चुनी गई है। एग्रोविज़न कृषि सहायक तैयार है।';
      toastTitle = 'भाषा: हिन्दी';
    } else if (lang === 'te') {
      greeting = 'నమస్కారం, తెలుగు భాష ఎంపిక చేయబడింది. ఆగ్రోవిజన్ వ్యవసాయ అసిస్టెంట్ సిద్ధంగా ఉంది.';
      toastTitle = 'భాష: తెలుగు';
    }

    showToast(toastTitle, greeting, 'info');
    speechService.speak(greeting, lang);
  };

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
  const [isAssistantThinking, setIsAssistantThinking] = useState<boolean>(false);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>(INITIAL_ACTIVITY_LOG);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState<boolean>(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState<boolean>(false);

  // ── Backend Sync Status ───────────────────────────────────────────────────
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('disconnected');
  // Track if we already loaded data from the backend to avoid re-seeding
  const backendLoadedRef = useRef(false);

  // ── Initial Data Load from Shared Backend ────────────────────────────────
  useEffect(() => {
    if (backendLoadedRef.current) return;

    const loadFromBackend = async () => {
      try {
        // Farms (contains fields)
        const apiFarms = await farmService.getFarms().catch(() => null);
        if (apiFarms && apiFarms.length > 0) {
          setFarms(apiFarms);
          localStorage.setItem('agrovision_farms', JSON.stringify(apiFarms));
        }

        // Tasks
        const apiTasks = await taskService.getTasks().catch(() => null);
        if (apiTasks && apiTasks.length > 0) {
          setTasks(apiTasks);
          localStorage.setItem('agrovision_tasks', JSON.stringify(apiTasks));
        }

        // Observations
        const apiObs = await observationService.getObservations().catch(() => null);
        if (apiObs && apiObs.length > 0) {
          setObservations(apiObs);
          localStorage.setItem('agrovision_obs', JSON.stringify(apiObs));
        }

        // Media
        const apiMedia = await mediaService.getMedia().catch(() => null);
        if (apiMedia && apiMedia.length > 0) {
          setMediaItems(apiMedia);
          localStorage.setItem('agrovision_media', JSON.stringify(apiMedia));
        }

        // Reminders
        const apiReminders = await reminderService.getReminders().catch(() => null);
        if (apiReminders && apiReminders.length > 0) {
          setReminders(apiReminders);
          localStorage.setItem('agrovision_reminders', JSON.stringify(apiReminders));
        }

        // Activity Log
        const apiActivity = await activityApiService.getActivity().catch(() => null);
        if (apiActivity && apiActivity.length > 0) {
          setActivityLog(apiActivity);
        }

        backendLoadedRef.current = true;
      } catch {
        // Backend offline — local state (localStorage) is already loaded, continue gracefully
      }
    };

    loadFromBackend();
  }, []);

  // ── Real-Time SSE Sync from Backend (Mobile / Raspberry Pi events) ───────
  useEffect(() => {
    const unsubStatus = syncService.onStatusChange(setSyncStatus);

    const unsubEvents = syncService.onEvent((eventType, data) => {
      const d = data as Record<string, unknown>;

      switch (eventType) {
        case 'TASK_CREATED': {
          const task = data as unknown as FarmTask;
          setTasks(prev => prev.some(t => t.id === task.id) ? prev : [task, ...prev]);
          setNotifications(prev => [{
            id: 'notif-' + Date.now(),
            type: 'Task' as const,
            title: `New task from ${String(d.source || 'device')}: ${task.title}`,
            message: `Due: ${task.dueDate || 'Today'}`,
            timestamp: 'Just now',
            read: false,
            fieldId: task.fieldId || undefined
          }, ...prev]);
          break;
        }
        case 'TASK_UPDATED': {
          const task = data as unknown as FarmTask;
          setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...task } : t));
          break;
        }
        case 'TASK_DELETED': {
          const id = String(d.id || d.taskId || '');
          if (id) setTasks(prev => prev.filter(t => t.id !== id));
          break;
        }
        case 'OBSERVATION_CREATED': {
          const obs = data as unknown as Observation;
          setObservations(prev => prev.some(o => o.id === obs.id) ? prev : [obs, ...prev]);
          const src = String(d.source || 'device');
          setNotifications(prev => [{
            id: 'notif-' + Date.now(),
            type: 'Crop Problem' as const,
            title: `Observation from ${src}: ${obs.title}`,
            message: obs.notes?.substring(0, 80) || '',
            timestamp: 'Just now',
            read: false,
            fieldId: obs.fieldId || undefined
          }, ...prev]);
          break;
        }
        case 'OBSERVATION_UPDATED': {
          const obs = data as unknown as Observation;
          setObservations(prev => prev.map(o => o.id === obs.id ? { ...o, ...obs } : o));
          break;
        }
        case 'OBSERVATION_DELETED': {
          const id = String(d.id || d.observationId || '');
          if (id) setObservations(prev => prev.filter(o => o.id !== id));
          break;
        }
        case 'MEDIA_CREATED': {
          const item = data as unknown as MediaItem;
          setMediaItems(prev => prev.some(m => m.id === item.id) ? prev : [item, ...prev]);
          break;
        }
        case 'MEDIA_DELETED': {
          const id = String(d.id || d.mediaId || '');
          if (id) setMediaItems(prev => prev.filter(m => m.id !== id));
          break;
        }
        case 'FARM_UPDATED':
        case 'FARM_CREATED':
        case 'FIELD_CREATED':
        case 'FIELD_UPDATED':
        case 'FIELD_DELETED': {
          // Re-fetch farms on field/farm changes from other clients
          farmService.getFarms().then(apiFarms => {
            if (apiFarms && apiFarms.length > 0) setFarms(apiFarms);
          }).catch(() => {});
          break;
        }
        case 'DEVICE_STATUS_CHANGED': {
          const dev = data as unknown as Partial<SmartGlassesDevice>;
          if (dev) {
            setDevice(prev => ({ ...prev, ...dev, connected: dev.connected ?? prev.connected }));
          }
          break;
        }
        case 'ACTIVITY_CREATED': {
          const act = data as unknown as ActivityLogItem;
          if (act) setActivityLog(prev => [act, ...prev].slice(0, 100));
          break;
        }
        default:
          break;
      }
    });

    syncService.connect();

    return () => {
      unsubStatus();
      unsubEvents();
      syncService.disconnect();
    };
  }, []);

  // Keep localStorage updated (local backup)
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
    // Persist to shared backend
    observationService.createObservation({ ...newObs, source: (data.source || 'manual') as ObservationSource }).catch(() => {});
    return newObs;
  };

  const resolveObservation = (id: string) => {
    setObservations(prev => prev.map(o => o.id === id ? { ...o, status: 'Resolved' } : o));
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    showToast('Resolved', 'Observation marked as resolved', 'success');
    // Persist to backend
    observationService.updateObservation(id, { status: 'Resolved' }).catch(() => {});
  };

  const deleteObservation = (id: string) => {
    setObservations(prev => prev.filter(o => o.id !== id));
    showToast('Deleted', 'Observation removed', 'info');
    // Persist to backend
    observationService.deleteObservation(id).catch(() => {});
  };

  const addMediaItem = (item: Omit<MediaItem, 'id' | 'timestamp'>): MediaItem => {
    const newItem: MediaItem = {
      ...item,
      id: 'media-' + Date.now(),
      timestamp: 'Today • ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMediaItems(prev => [newItem, ...prev]);
    // Persist to backend
    mediaService.createMedia({ ...newItem }).catch(() => {});
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
    // Persist to shared backend (fire-and-forget, local state is source of truth for UI)
    taskService.createTask({ ...newTask, source: 'website' } as Parameters<typeof taskService.createTask>[0]).catch(() => {});
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus: TaskStatus = t.status === 'Completed' ? 'Pending' : 'Completed';
        if (nextStatus === 'Completed') {
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
        }
        // Persist to backend
        taskService.updateTask(id, { status: nextStatus } as Partial<FarmTask>).catch(() => {});
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('Task Removed', 'Task deleted', 'info');
    // Persist to backend
    taskService.deleteTask(id).catch(() => {});
  };

  const updateTask = (id: string, updates: Partial<FarmTask>) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, ...updates };
      }
      return t;
    }));
    speechService.playSuccessChime();
    showToast('Task Updated', 'Schedule and details modified', 'success');
    // Persist to backend
    taskService.updateTask(id, updates).catch(() => {});
  };

  const executeVoiceTaskCommand = (transcript: string): VoiceTaskResult => {
    const result = parseVoiceTaskCommand(transcript, tasks, currentField, currentFarm.fields, currentLanguage);
    if (!result.handled) return result;

    if (result.action === 'create' && result.title) {
      const newTask: FarmTask = {
        id: 'task-' + Date.now(),
        title: result.title,
        fieldId: result.fieldId || null,
        dueDate: result.dueDate || 'Today',
        status: 'Pending',
        voiceCreated: true,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setTasks(prev => [newTask, ...prev]);
      speechService.playSuccessChime();
      showToast('Voice Task Created', `${result.title} (${result.dueDate})`, 'success');
      addActivityLog('Voice task created', result.title, result.fieldName, 'task');
      return { ...result, task: newTask };
    }

    if (result.action === 'complete' && result.targetTaskId) {
      setTasks(prev => prev.map(t => t.id === result.targetTaskId ? { ...t, status: 'Completed' } : t));
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
      speechService.playSuccessChime();
      showToast('Task Completed', result.title || 'Marked completed', 'success');
      addActivityLog('Task completed via voice', result.title || 'Task', undefined, 'task');
      return result;
    }

    if (result.action === 'delete' && result.targetTaskId) {
      setTasks(prev => prev.filter(t => t.id !== result.targetTaskId));
      showToast('Task Deleted', result.title || 'Task removed', 'info');
      addActivityLog('Task deleted via voice', result.title || 'Task', undefined, 'task');
      return result;
    }

    if (result.action === 'update' && result.targetTaskId) {
      setTasks(prev => prev.map(t => t.id === result.targetTaskId ? { ...t, dueDate: result.dueDate || t.dueDate } : t));
      speechService.playSuccessChime();
      showToast('Task Rescheduled', `${result.title} (${result.dueDate})`, 'success');
      addActivityLog('Task rescheduled via voice', `${result.title} -> ${result.dueDate}`, undefined, 'task');
      return result;
    }

    return result;
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
    // Persist to backend
    reminderService.createReminder({ ...newRem }).catch(() => {});
  };

  const dismissReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    // Persist to backend
    reminderService.deleteReminder(id).catch(() => {});
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

  // Conversational Assistant Chat Engine with Gemini AI
  const sendAssistantMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: AssistantChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setIsAssistantThinking(true);

    // 0. Safety & Scope Guardrail: Block self-harm, trading, coding/Python, academic math
    const scopeCheck = geminiService.checkScopeAndSafety(userText, currentLanguage);
    if (scopeCheck.blocked && scopeCheck.refusalMessage) {
      const botMsg: AssistantChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: scopeCheck.refusalMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasAudio: true
      };
      setChatMessages(prev => [...prev, botMsg]);
      speechService.speak(scopeCheck.refusalMessage, currentLanguage);
      setIsAssistantThinking(false);
      return;
    }

    // 1. Direct Voice Task Command Processing (Deterministic, zero latency)
    const voiceTaskResult = executeVoiceTaskCommand(userText);
    if (voiceTaskResult.handled && voiceTaskResult.speechReply) {
      const botMsg: AssistantChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: voiceTaskResult.speechReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasAudio: true,
        actionTaken: voiceTaskResult.action ? `Task ${voiceTaskResult.action.toUpperCase()}` : undefined,
        taskActionMeta: {
          type: voiceTaskResult.action as any,
          taskTitle: voiceTaskResult.title || 'Farm Task',
          dueDate: voiceTaskResult.dueDate,
          fieldName: voiceTaskResult.fieldName,
          taskId: voiceTaskResult.targetTaskId || voiceTaskResult.task?.id
        }
      };
      setChatMessages(prev => [...prev, botMsg]);
      speechService.speak(voiceTaskResult.speechReply, currentLanguage);
      setIsAssistantThinking(false);
      return;
    }

    // 2. Conversational Processing via Gemini 3.6 / 2.5 Flash
    try {
      const weather = getFieldWeather(currentField?.id);
      const reply = await geminiService.askAssistant(
        userText,
        updatedMessages.map(m => ({ role: m.role, content: m.content })),
        {
          farmerName: 'Ravi Kumar',
          farmName: currentFarm.name,
          farmLocation: currentFarm.locationName,
          field: currentField,
          gps: currentGps,
          weather: weather || null,
          tasks,
          observations,
          problems,
          language: currentLanguage
        }
      );

      // Check if Gemini embedded a [TASK_ACTION: {...}] tag
      let cleanReply = reply;
      let taskMeta: AssistantChatMessage['taskActionMeta'] = undefined;
      const taskActionRegex = /\[TASK_ACTION:\s*(\{.*?\})\]/s;
      const actionMatch = reply.match(taskActionRegex);

      if (actionMatch) {
        try {
          const actionData = JSON.parse(actionMatch[1]);
          cleanReply = reply.replace(taskActionRegex, '').trim();

          if (actionData.action === 'complete') {
            const matched = actionData.taskQuery
              ? tasks.find(t => t.title.toLowerCase().includes(actionData.taskQuery.toLowerCase()))
              : tasks.find(t => t.status === 'Pending');
            if (matched) {
              setTasks(prev => prev.map(t => t.id === matched.id ? { ...t, status: 'Completed' } : t));
              confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
              showToast('Task Completed', matched.title, 'success');
              taskMeta = { type: 'completed', taskTitle: matched.title, taskId: matched.id };
            }
          } else if (actionData.action === 'create' && actionData.title) {
            const newTask: FarmTask = {
              id: 'task-' + Date.now(),
              title: actionData.title,
              fieldId: currentField?.id || null,
              dueDate: actionData.dueDate || 'Today',
              status: 'Pending',
              voiceCreated: true,
              createdAt: new Date().toISOString().split('T')[0]
            };
            setTasks(prev => [newTask, ...prev]);
            speechService.playSuccessChime();
            showToast('Task Created', actionData.title, 'success');
            taskMeta = { type: 'created', taskTitle: newTask.title, dueDate: newTask.dueDate, taskId: newTask.id };
          } else if (actionData.action === 'delete') {
            const matched = actionData.taskQuery
              ? tasks.find(t => t.title.toLowerCase().includes(actionData.taskQuery.toLowerCase()))
              : null;
            if (matched) {
              setTasks(prev => prev.filter(t => t.id !== matched.id));
              showToast('Task Removed', matched.title, 'info');
              taskMeta = { type: 'deleted', taskTitle: matched.title, taskId: matched.id };
            }
          } else if (actionData.action === 'update') {
            const matched = actionData.taskQuery
              ? tasks.find(t => t.title.toLowerCase().includes(actionData.taskQuery.toLowerCase()))
              : null;
            if (matched && actionData.dueDate) {
              setTasks(prev => prev.map(t => t.id === matched.id ? { ...t, dueDate: actionData.dueDate } : t));
              speechService.playSuccessChime();
              showToast('Task Updated', `${matched.title} -> ${actionData.dueDate}`, 'success');
              taskMeta = { type: 'updated', taskTitle: matched.title, dueDate: actionData.dueDate, taskId: matched.id };
            }
          }
        } catch (err) {
          console.error('Failed to parse Gemini task action JSON:', err);
        }
      }

      const botMsg: AssistantChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: cleanReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasAudio: true,
        taskActionMeta: taskMeta
      };

      setChatMessages(prev => [...prev, botMsg]);
      speechService.speak(cleanReply, currentLanguage);
    } catch (err) {
      console.error('Error in assistant response:', err);
    } finally {
      setIsAssistantThinking(false);
    }
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
            severityScore: 6.8,
            foliarImpactPct: 18,
            urgencyLevel: 'Within 48h',
            recommendedAction: 'Inspect affected branch cluster. Prune affected leaves. Apply Copper Oxychloride (0.3%) before rain.',
            modelName: 'AgroVision-CropVision v3.2',
            analyzedAt: 'Just now',
            dataSource: {
              sourceType: 'Smartphone High-Res Field Photo + Multi-Spectral Sensor Scan',
              imageResolution: '3024 × 4032 (12.2 MP, RGB Exif)',
              weatherTelemetry: 'OpenWeather/Open-Meteo Ground Telemetry: 28°C, 62% humidity, 11 km/h wind',
              gpsLocation: `${field.center.lat.toFixed(4)}° N, ${field.center.lng.toFixed(4)}° E`,
              parcelName: field.name,
              referenceCorpus: 'ICAR-CISH Mango Pathology Corpus & AgroVision-CropVision v3.2',
              extractedFeatures: [
                'Concentric dark necrotic lesions on lower foliage edges',
                'Chlorotic halo around irregular foliar spots',
                'Early petiole and leaf margin necrosis'
              ]
            }
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
        currentLanguage,
        setLanguage,
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
        updateTask,
        executeVoiceTaskCommand,
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
        isAssistantThinking,
        sendAssistantMessage,
        clearChat,
        activityLog,
        toasts,
        dismissToast,
        showToast,
        isBriefingModalOpen,
        setIsBriefingModalOpen,
        syncStatus,
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
