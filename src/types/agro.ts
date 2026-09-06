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
  healthPercentage: number;
  healthBreakdown: {
    healthy: number;
    atRisk: number;
    critical: number;
  };
  status: FieldHealthStatus;
  boundary: LatLng[];
  center: LatLng;
  notes?: string;
}

export interface Farm {
  id: string;
  name: string;
  locationName: string;
  center: LatLng;
  totalAreaAcres: number;
  fields: Field[];
  createdAt: string;
}

export interface FarmerUser {
  id: string;
  name: string;
  phone: string;
  preferredLanguage: string;
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
  fieldId: string;
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
  fieldId: string;
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
  fieldId: string;
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
  };
}

export type TaskStatus = 'Pending' | 'Completed' | 'Overdue';

export interface FarmTask {
  id: string;
  title: string;
  fieldId: string;
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
  fieldId: string;
  status: 'Scheduled' | 'Triggered' | 'Dismissed';
  createdAt: string;
}

export interface FieldWeather {
  fieldId: string;
  fieldName: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  conditionIcon: string;
  humidity: number;
  windKmh: number;
  rainProbability: number;
  rainfallMm: number;
  sprayAdvisory: {
    status: 'Optimal' | 'Caution' | 'Unsuitable';
    reason: string;
  };
  forecast: Array<{
    day: string;
    temp: number;
    condition: string;
    rainProb: number;
  }>;
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
  fieldId?: string;
}

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionTaken?: string;
  hasAudio?: boolean;
  voiceInputDetected?: boolean;
}

export interface ActivityLogItem {
  id: string;
  time: string;
  title: string;
  detail: string;
  field?: string;
  type: 'voice' | 'photo' | 'gps' | 'observation' | 'task' | 'alert';
}
