import {
  Farm,
  FarmerUser,
  Observation,
  MediaItem,
  ProblemReport,
  FarmTask,
  FarmReminder,
  SmartGlassesDevice,
  WellBeingMetric,
  FarmNotification,
  AssistantChatMessage,
  ActivityLogItem
} from '../types/agro';

// Farm Coordinates around a lush fertile agro-belt in Karnataka, India
export const INITIAL_USER: FarmerUser = {
  id: 'user-ravi-01',
  name: 'Ravi Kumar',
  phone: '+91 98450 12890',
  preferredLanguage: 'English',
  defaultFarmId: 'farm-gv-01',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
};

export const INITIAL_FARMS: Farm[] = [
  {
    id: 'farm-gv-01',
    name: 'Green Valley Farm',
    locationName: 'Doddaballapur Taluk, Bengaluru Rural',
    center: { lat: 13.2985, lng: 77.5350 },
    totalAreaAcres: 8.5,
    createdAt: '2024-03-15',
    isDemoFarm: true,
    fields: [
      {
        id: 'field-mango-01',
        farmId: 'farm-gv-01',
        name: 'Mango Plantation',
        crop: 'Mango (Alphonso & Kesar)',
        areaAcres: 5.0,
        plantingDate: '2026-06-01',
        healthPercentage: 82,
        healthBreakdown: {
          healthy: 82,
          atRisk: 12,
          critical: 6
        },
        status: 'Healthy',
        center: { lat: 13.2990, lng: 77.5345 },
        boundary: [
          { lat: 13.3002, lng: 77.5332 },
          { lat: 13.3005, lng: 77.5360 },
          { lat: 13.2978, lng: 77.5365 },
          { lat: 13.2974, lng: 77.5330 }
        ],
        notes: 'High-density plantation. Drip irrigated. Pruning completed in May.',
        isDemoField: true
      },
      {
        id: 'field-tomato-02',
        farmId: 'farm-gv-01',
        name: 'Tomato Field',
        crop: 'Tomato (Arka Rakshak)',
        areaAcres: 2.0,
        plantingDate: '2026-07-10',
        healthPercentage: 68,
        healthBreakdown: {
          healthy: 68,
          atRisk: 22,
          critical: 10
        },
        status: 'At Risk',
        center: { lat: 13.2965, lng: 77.5352 },
        boundary: [
          { lat: 13.2972, lng: 77.5335 },
          { lat: 13.2974, lng: 77.5365 },
          { lat: 13.2952, lng: 77.5368 },
          { lat: 13.2950, lng: 77.5338 }
        ],
        notes: 'Trellis supported. Early blight susceptibility observed on west ridge.',
        isDemoField: true
      },
      {
        id: 'field-strawberry-03',
        farmId: 'farm-gv-01',
        name: 'Strawberry Field',
        crop: 'Strawberry (Winter Dawn)',
        areaAcres: 1.5,
        plantingDate: '2026-08-01',
        healthPercentage: 91,
        healthBreakdown: {
          healthy: 91,
          atRisk: 7,
          critical: 2
        },
        status: 'Healthy',
        center: { lat: 13.2980, lng: 77.5380 },
        boundary: [
          { lat: 13.2995, lng: 77.5368 },
          { lat: 13.2998, lng: 77.5395 },
          { lat: 13.2968, lng: 77.5398 },
          { lat: 13.2965, lng: 77.5370 }
        ],
        notes: 'Raised beds with black plastic mulch. Fertigation running 3x/week.',
        isDemoField: true
      }
    ]
  }
];

export const INITIAL_OBSERVATIONS: Observation[] = [
  {
    id: 'obs-01',
    title: 'Yellow leaves on northeast branch cluster',
    notes: 'Noticed chlorosis on several lower tier leaves. Moisture level appears adequate.',
    farmId: 'farm-gv-01',
    fieldId: 'field-mango-01',
    crop: 'Mango',
    location: { lat: 13.2992, lng: 77.5348 },
    locationName: 'Mango Plantation - Sector NE',
    timestamp: 'Yesterday • 10:32 AM',
    source: 'voice',
    status: 'Needs Attention',
    voiceAudioUrl: 'voice-note-mango-chlorosis.mp3',
    voiceTranscript: '“Hey Vision, the mango leaves on the northeast tree cluster are turning yellow.”',
    mediaUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
    mediaType: 'photo',
    associatedProblemId: 'prob-01'
  },
  {
    id: 'obs-02',
    title: 'Drip line leak spotted near Row 4',
    notes: 'Puddle accumulating near central valve connector. Needs gasket replacement.',
    farmId: 'farm-gv-01',
    fieldId: 'field-tomato-02',
    crop: 'Tomato',
    location: { lat: 13.2962, lng: 77.5349 },
    locationName: 'Tomato Field - Row 4 Central',
    timestamp: '2 days ago • 04:15 PM',
    source: 'photo',
    status: 'Under Investigation',
    mediaUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=80',
    mediaType: 'photo'
  },
  {
    id: 'obs-03',
    title: 'Excellent early flowering and fruit set',
    notes: 'Strawberry plants showing vigorous crown growth and uniform white blossoms.',
    farmId: 'farm-gv-01',
    fieldId: 'field-strawberry-03',
    crop: 'Strawberry',
    location: { lat: 13.2978, lng: 77.5382 },
    locationName: 'Strawberry Field - Bed 2',
    timestamp: '3 days ago • 08:45 AM',
    source: 'manual',
    status: 'Resolved',
    mediaUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&auto=format&fit=crop&q=80',
    mediaType: 'photo'
  }
];

export const INITIAL_MEDIA: MediaItem[] = [
  {
    id: 'media-01',
    farmId: 'farm-gv-01',
    fieldId: 'field-mango-01',
    crop: 'Mango',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=80',
    caption: 'Suspected fungal discoloration on mango foliage',
    timestamp: 'Yesterday • 10:32 AM',
    location: { lat: 13.2992, lng: 77.5348 },
    observationId: 'obs-01',
    aiAnalyzed: true
  },
  {
    id: 'media-02',
    farmId: 'farm-gv-01',
    fieldId: 'field-tomato-02',
    crop: 'Tomato',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=400&auto=format&fit=crop&q=80',
    caption: 'Tomato vine inspected during morning walkthrough',
    timestamp: '2 days ago • 04:15 PM',
    location: { lat: 13.2962, lng: 77.5349 },
    observationId: 'obs-02',
    aiAnalyzed: true
  },
  {
    id: 'media-03',
    farmId: 'farm-gv-01',
    fieldId: 'field-strawberry-03',
    crop: 'Strawberry',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&auto=format&fit=crop&q=80',
    caption: 'Healthy strawberry foliage and early berry set',
    timestamp: '3 days ago • 08:45 AM',
    location: { lat: 13.2978, lng: 77.5382 },
    observationId: 'obs-03',
    aiAnalyzed: true
  },
  {
    id: 'media-04',
    farmId: 'farm-gv-01',
    fieldId: 'field-mango-01',
    crop: 'Mango',
    type: 'video',
    url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=1000&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&auto=format&fit=crop&q=80',
    caption: 'AgroVision 15s canopy inspection clip',
    timestamp: 'Yesterday • 10:35 AM',
    location: { lat: 13.2995, lng: 77.5350 },
    aiAnalyzed: false
  }
];

export const INITIAL_PROBLEMS: ProblemReport[] = [
  {
    id: 'prob-01',
    fieldId: 'field-mango-01',
    farmId: 'farm-gv-01',
    crop: 'Mango',
    reportedAt: 'Yesterday • 10:32 AM',
    farmerNote: '“Leaves look unusual and yellowing with small necrotic edges.”',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
    status: 'AI Analyzed',
    aiAnalysis: {
      detectedCrop: 'Mango (Mangifera indica)',
      possibleDisease: 'Anthracnose (Colletotrichum gloeosporioides)',
      confidence: 87,
      severity: 'Moderate',
      recommendedAction: 'Inspect affected branch cluster. Prune severely spotted leaves. Apply Copper Oxychloride (0.3%) or Carbendazim spray before humid evening forecast.',
      modelName: 'AgroVision-CropVision v3.2 (Dedicated Agricultural CV Model)',
      analyzedAt: 'Yesterday • 10:33 AM'
    }
  },
  {
    id: 'prob-02',
    fieldId: 'field-tomato-02',
    farmId: 'farm-gv-01',
    crop: 'Tomato',
    reportedAt: '3 days ago • 11:20 AM',
    farmerNote: '“Lower leaves showing concentric dark rings.”',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=80',
    status: 'Action Taken',
    aiAnalysis: {
      detectedCrop: 'Tomato (Solanum lycopersicum)',
      possibleDisease: 'Early Blight (Alternaria solani)',
      confidence: 92,
      severity: 'Mild',
      recommendedAction: 'Remove lower foliage touching soil. Avoid overhead sprinkler irrigation. Ensure mulch covers exposed soil.',
      modelName: 'AgroVision-CropVision v3.2',
      analyzedAt: '3 days ago • 11:22 AM'
    }
  }
];

export const INITIAL_TASKS: FarmTask[] = [
  {
    id: 'task-01',
    title: 'Check drip irrigation line & pressure regulators',
    fieldId: 'field-mango-01',
    dueDate: 'Today',
    status: 'Pending',
    voiceCreated: false,
    notes: 'Verify emitter flow rates on north slope',
    createdAt: '2026-09-06'
  },
  {
    id: 'task-02',
    title: 'Inspect mango leaves for Anthracnose spread',
    fieldId: 'field-mango-01',
    dueDate: 'Today',
    status: 'Pending',
    voiceCreated: true,
    notes: 'Triggered by observation obs-01',
    createdAt: '2026-09-06'
  },
  {
    id: 'task-03',
    title: 'Repair tomato trellis drip connection',
    fieldId: 'field-tomato-02',
    dueDate: 'Today',
    status: 'Pending',
    voiceCreated: false,
    notes: 'Fix leaking connector identified 2 days ago',
    createdAt: '2026-09-05'
  },
  {
    id: 'task-04',
    title: 'Strawberry organic foliar calcium spray',
    fieldId: 'field-strawberry-03',
    dueDate: 'Yesterday',
    status: 'Completed',
    voiceCreated: true,
    notes: 'Completed in early morning calm wind',
    createdAt: '2026-09-04'
  }
];

export const INITIAL_REMINDERS: FarmReminder[] = [
  {
    id: 'rem-01',
    title: 'Check Mango Plantation irrigation valves',
    timeStr: 'Today • 5:00 PM',
    fieldId: 'field-mango-01',
    status: 'Scheduled',
    createdAt: '2026-09-06'
  },
  {
    id: 'rem-02',
    title: 'Fertilizer application review with agronomist',
    timeStr: 'Tomorrow • 09:30 AM',
    fieldId: 'field-tomato-02',
    status: 'Scheduled',
    createdAt: '2026-09-06'
  },
  {
    id: 'rem-03',
    title: 'Strawberry night frost sensor check',
    timeStr: 'Tonight • 9:00 PM',
    fieldId: 'field-strawberry-03',
    status: 'Scheduled',
    createdAt: '2026-09-06'
  }
];

export const INITIAL_DEVICE: SmartGlassesDevice = {
  model: 'AgroVision Pro Glasses (Gen 2)',
  connected: true,
  batteryLevel: 78,
  bluetoothConnected: true,
  gpsActive: true,
  cameraStatus: 'Ready',
  microphoneStatus: 'Ready',
  speakerStatus: 'Ready',
  lastSyncTime: '2 minutes ago',
  firmwareVersion: 'v2.4.1-agro',
  serialNumber: 'AGV-2026-IN-8891'
};

export const INITIAL_WELLBEING: WellBeingMetric = {
  waterRemindersSent: 3,
  nextHydrationTime: 'In 35 minutes',
  workingHoursToday: 4.2,
  ambientHeatAlert: false,
  message: 'Field temperature is comfortable. Keep a water bottle handy as midday approaches.'
};

export const INITIAL_NOTIFICATIONS: FarmNotification[] = [
  {
    id: 'notif-01',
    type: 'Crop Problem',
    title: 'Possible Anthracnose Detected',
    message: 'AI analyzed photo in Mango Plantation with 87% confidence.',
    timestamp: '10:33 AM',
    read: false,
    fieldId: 'field-mango-01'
  },
  {
    id: 'notif-02',
    type: 'Weather',
    title: 'Rain Forecast Alert',
    message: 'Scattered showers expected in Tomato Field tomorrow afternoon.',
    timestamp: '08:00 AM',
    read: false,
    fieldId: 'field-tomato-02'
  },
  {
    id: 'notif-03',
    type: 'Reminder',
    title: 'Check Irrigation at 5 PM',
    message: 'Scheduled reminder for Mango Plantation valves.',
    timestamp: '07:30 AM',
    read: true,
    fieldId: 'field-mango-01'
  },
  {
    id: 'notif-04',
    type: 'Device',
    title: 'Glasses Sync Complete',
    message: 'All 3 voice notes and 2 high-res captures synced successfully.',
    timestamp: '07:00 AM',
    read: true,
    fieldId: null
  }
];

export const INITIAL_CHAT: AssistantChatMessage[] = [
  {
    id: 'chat-01',
    role: 'assistant',
    content: 'Good morning Ravi! I am AgroVision, your wearable AI agricultural assistant. You are currently in the Mango Plantation. How can I assist you on the farm today?',
    timestamp: '10:30 AM',
    hasAudio: true
  }
];

export const INITIAL_ACTIVITY_LOG: ActivityLogItem[] = [
  {
    id: 'act-01',
    time: '10:32 AM',
    title: 'Voice command received',
    detail: '“Hey Vision, the mango leaves are turning yellow”',
    field: 'Mango Plantation',
    type: 'voice'
  },
  {
    id: 'act-02',
    time: '10:32 AM',
    title: 'Photo captured automatically',
    detail: 'Dual 12MP camera snapped foliage target (13.2992° N, 77.5348° E)',
    field: 'Mango Plantation',
    type: 'photo'
  },
  {
    id: 'act-03',
    time: '10:32 AM',
    title: 'Geo-fence matched',
    detail: 'GPS inside Mango Plantation (5.0 acres, Alphonso & Kesar)',
    field: 'Mango Plantation',
    type: 'gps'
  },
  {
    id: 'act-04',
    time: '10:33 AM',
    title: 'Observation record created',
    detail: 'Yellow leaves observation saved with attached voice note & GPS',
    field: 'Mango Plantation',
    type: 'observation'
  },
  {
    id: 'act-05',
    time: '10:33 AM',
    title: 'Agricultural CV analysis triggered',
    detail: 'Model evaluated image: Anthracnose 87% confidence',
    field: 'Mango Plantation',
    type: 'alert'
  }
];
