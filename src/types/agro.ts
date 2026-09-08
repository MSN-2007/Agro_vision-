export interface LatLng {
  lat: number;
  lng: number;
}

export type FieldHealthStatus = 'Healthy' | 'At Risk' | 'Critical';

export interface GeoFence {
  id: string;
  fieldId: string;
  points: LatLng[];
  color: string;
  areaAcres: number;
}

export interface Field {
  id: string;
  farmId: string;
  name: string;
  crop: string;
  areaAcres: number;
  plantingDate: string;
  healthPercentage: number | null; // Nullable for user-created fields without analysis
  healthBreakdown: {
    healthy: number;
    atRisk: number;
    critical: number;
  } | null;
  status: FieldHealthStatus | 'Unanalyzed';
  boundary: LatLng[];
  center: LatLng;
  notes?: string;
  isDemoField?: boolean;
}

export interface Farm {
  id: string;
  name: string;
  locationName: string;
  center: LatLng;
  totalAreaAcres: number;
  fields: Field[];
  createdAt: string;
  isDemoFarm?: boolean;
}

export type SupportedLanguage = 'en' | 'hi' | 'mr' | 'te';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  speechLocale: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English (India)', speechLocale: 'en-IN', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechLocale: 'hi-IN', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechLocale: 'mr-IN', flag: '🚩' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechLocale: 'te-IN', flag: '🌾' }
];

export interface FarmerUser {
  id: string;
  name: string;
  phone: string;
  preferredLanguage: SupportedLanguage;
  defaultFarmId: string;
  avatarUrl: string;
}

export type ObservationSource = 'voice' | 'photo' | 'video' | 'manual';
export type ObservationStatus = 'Needs Attention' | 'Under Investigation' | 'Resolved';

export interface Observation {
  id: string;
  title: string;
  notes: string;
  farmId: string;
  fieldId: string | null; // Strict field association
  crop: string;
  location: LatLng;
  locationName?: string;
  timestamp: string;
  source: ObservationSource;
  status: ObservationStatus;
  voiceAudioUrl?: string;
  voiceTranscript?: string;
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  associatedProblemId?: string;
}

export interface MediaItem {
  id: string;
  farmId: string;
  fieldId: string | null; // Strict field association
  crop: string;
  type: 'photo' | 'video';
  url: string;
  thumbnailUrl: string;
  caption: string;
  timestamp: string;
  location: LatLng;
  observationId?: string;
  aiAnalyzed?: boolean;
}

export interface ProblemReport {
  id: string;
  fieldId: string | null; // Strict field association
  farmId: string;
  crop: string;
  reportedAt: string;
  farmerNote: string;
  imageUrl?: string;
  status: 'Pending Analysis' | 'AI Analyzed' | 'Action Taken' | 'Resolved';
  aiAnalysis?: {
    detectedCrop: string;
    possibleDisease: string;
    confidence: number;
    severity: 'Mild' | 'Moderate' | 'Severe';
    recommendedAction: string;
    modelName: string;
    analyzedAt: string;
    severityScore?: number; // e.g. 6.8 / 10
    foliarImpactPct?: number; // e.g. 18% of canopy
    urgencyLevel?: 'Immediate (24h)' | 'Within 48h' | 'Routine Monitoring';
    dataSource?: {
      sourceType: string;
      imageResolution?: string;
      weatherTelemetry?: string;
      gpsLocation?: string;
      parcelName?: string;
      referenceCorpus?: string;
      extractedFeatures?: string[];
    };
  };
}

export type TaskStatus = 'Pending' | 'Completed' | 'Overdue';

export interface FarmTask {
  id: string;
  title: string;
  fieldId: string | null; // Strict field association
  dueDate: string;
  status: TaskStatus;
  voiceCreated?: boolean;
  notes?: string;
  createdAt: string;
}

export interface FarmReminder {
  id: string;
  title: string;
  timeStr: string;
  fieldId: string | null; // Strict field association
  status: 'Scheduled' | 'Triggered' | 'Dismissed';
  createdAt: string;
}

export interface HourlyWeatherPoint {
  time: string;
  temp: number;
  humidity: number;
  rainProb: number;
  solarRadiation: number;
}

export interface DailyWeatherForecast {
  day: string;
  date: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  rainProb: number;
  windSpeed: number;
}

export interface FieldWeather {
  fieldId: string;
  fieldName: string;
  latitude: number;
  longitude: number;
  temperature: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  conditionCode: number;
  humidity: number;
  windKmh: number;
  windDirectionDeg: number;
  windDirectionCompass: string;
  windGustsKmh: number;
  pressureHpa: number;
  visibilityKm: number;
  cloudCoverPct: number;
  uvIndex: number;
  rainProbability: number;
  rainfallMm: number;
  sunriseTime: string;
  sunsetTime: string;
  solarRadiationWm2: number | null; // Actual W/m² from solar radiation API
  sprayAdvisory: {
    status: 'Optimal' | 'Caution' | 'Unsuitable';
    reason: string;
  };
  hourlyForecast: HourlyWeatherPoint[];
  dailyForecast: DailyWeatherForecast[];
  lastUpdated: string;
  provider?: string;
  isError?: boolean;
  errorMessage?: string;
}

export interface SmartGlassesDevice {
  model: string;
  connected: boolean;
  batteryLevel: number;
  bluetoothConnected: boolean;
  gpsActive: boolean;
  cameraStatus: 'Ready' | 'Capturing' | 'Standby';
  microphoneStatus: 'Ready' | 'Listening' | 'Muted';
  speakerStatus: 'Ready' | 'Speaking' | 'Standby';
  lastSyncTime: string;
  firmwareVersion: string;
  serialNumber: string;
}

export interface WellBeingMetric {
  waterRemindersSent: number;
  nextHydrationTime: string;
  workingHoursToday: number;
  ambientHeatAlert: boolean;
  message: string;
}

export interface FarmNotification {
  id: string;
  type: 'Weather' | 'Task' | 'Reminder' | 'Crop Problem' | 'Device' | 'AI Analysis';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  fieldId?: string | null;
}

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionTaken?: string;
  hasAudio?: boolean;
  voiceInputDetected?: boolean;
  taskActionMeta?: {
    type: 'created' | 'completed' | 'deleted' | 'updated';
    taskTitle: string;
    dueDate?: string;
    fieldName?: string;
    taskId?: string;
  };
}

export interface ActivityLogItem {
  id: string;
  time: string;
  title: string;
  detail: string;
  field?: string;
  type: 'voice' | 'photo' | 'gps' | 'observation' | 'task' | 'alert';
}
