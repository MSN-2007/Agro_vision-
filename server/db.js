import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'agrovision_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const SEED_DATA = {
  users: [
    {
      id: 'user-ravi-01',
      name: 'Ravi Kumar',
      email: 'ravi.kumar@agrovision.io',
      phone: '+91 98450 12890',
      preferredLanguage: 'en',
      defaultFarmId: 'farm-gv-01',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }
  ],
  farms: [
    {
      id: 'farm-gv-01',
      userId: 'user-ravi-01',
      name: 'Green Valley Farm',
      locationName: 'Doddaballapur Taluk, Bengaluru Rural',
      center: { lat: 13.2985, lng: 77.5350 },
      totalAreaAcres: 8.5,
      createdAt: '2024-03-15T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z',
      source: 'website'
    }
  ],
  fields: [
    {
      id: 'field-mango-01',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      name: 'Mango Plantation',
      crop: 'Mango (Alphonso & Kesar)',
      cropName: 'Mango',
      areaAcres: 5.0,
      plantingDate: '2026-06-01',
      healthPercentage: 82,
      healthBreakdown: { healthy: 82, atRisk: 12, critical: 6 },
      status: 'Healthy',
      center: { lat: 13.2990, lng: 77.5345 },
      boundary: [
        { lat: 13.3002, lng: 77.5332 },
        { lat: 13.3005, lng: 77.5360 },
        { lat: 13.2978, lng: 77.5365 },
        { lat: 13.2974, lng: 77.5330 }
      ],
      notes: 'High-density plantation. Drip irrigated. Pruning completed in May.',
      createdAt: '2024-03-15T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z',
      source: 'website'
    },
    {
      id: 'field-tomato-02',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      name: 'Tomato Field',
      crop: 'Tomato (Arka Rakshak)',
      cropName: 'Tomato',
      areaAcres: 2.0,
      plantingDate: '2026-07-10',
      healthPercentage: 68,
      healthBreakdown: { healthy: 68, atRisk: 22, critical: 10 },
      status: 'At Risk',
      center: { lat: 13.2965, lng: 77.5352 },
      boundary: [
        { lat: 13.2972, lng: 77.5335 },
        { lat: 13.2974, lng: 77.5365 },
        { lat: 13.2952, lng: 77.5368 },
        { lat: 13.2950, lng: 77.5338 }
      ],
      notes: 'High-tunnel polyhouse. Hydro-fertigation channel 4.',
      createdAt: '2024-03-15T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z',
      source: 'website'
    },
    {
      id: 'field-strawberry-03',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      name: 'Organic Strawberry Parcel',
      crop: 'Strawberry (Winter Dawn)',
      cropName: 'Strawberry',
      areaAcres: 1.5,
      plantingDate: '2026-08-01',
      healthPercentage: 94,
      healthBreakdown: { healthy: 94, atRisk: 4, critical: 2 },
      status: 'Healthy',
      center: { lat: 13.2975, lng: 77.5385 },
      boundary: [
        { lat: 13.2985, lng: 77.5372 },
        { lat: 13.2987, lng: 77.5398 },
        { lat: 13.2964, lng: 77.5401 },
        { lat: 13.2962, lng: 77.5375 }
      ],
      notes: 'Raised beds with black plastic mulch. Beehive nearby.',
      createdAt: '2024-03-15T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z',
      source: 'website'
    }
  ],
  crops: [
    {
      id: 'crop-mango-01',
      fieldId: 'field-mango-01',
      name: 'Mango',
      variety: 'Alphonso & Kesar',
      plantingDate: '2026-06-01',
      createdAt: '2024-03-15T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z'
    },
    {
      id: 'crop-tomato-02',
      fieldId: 'field-tomato-02',
      name: 'Tomato',
      variety: 'Arka Rakshak',
      plantingDate: '2026-07-10',
      createdAt: '2024-03-15T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z'
    },
    {
      id: 'crop-strawberry-03',
      fieldId: 'field-strawberry-03',
      name: 'Strawberry',
      variety: 'Winter Dawn',
      plantingDate: '2026-08-01',
      createdAt: '2024-03-15T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z'
    }
  ],
  observations: [
    {
      id: 'obs-01',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      fieldId: 'field-mango-01',
      cropId: 'crop-mango-01',
      crop: 'Mango',
      title: 'Anthracnose Fungal Lesions on Leaves',
      notes: 'Spotted irregular black spots with yellow halo on south canopy tier.',
      content: 'Anthracnose Fungal Lesions on Leaves. Spotted irregular black spots with yellow halo on south canopy tier.',
      latitude: 13.2992,
      longitude: 77.5348,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      source: 'raspberry_pi',
      status: 'Needs Attention',
      photoUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      aiDiagnosis: {
        diseaseName: 'Anthracnose (Colletotrichum gloeosporioides)',
        confidencePercentage: 91,
        recommendedAction: 'Apply Copper Oxychloride 50 WP (3g/L) spray in early morning.',
        urgency: 'Medium'
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'obs-02',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      fieldId: 'field-tomato-02',
      cropId: 'crop-tomato-02',
      crop: 'Tomato',
      title: 'Early Tomato Leaf Blight Symptoms',
      notes: 'Concentric ring lesions observed on lower leaves of row 4.',
      content: 'Early Tomato Leaf Blight Symptoms. Concentric ring lesions observed on lower leaves of row 4.',
      latitude: 13.2962,
      longitude: 77.5349,
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      source: 'mobile',
      status: 'Under Investigation',
      photoUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=800&auto=format&fit=crop&q=80',
      aiDiagnosis: {
        diseaseName: 'Early Blight (Alternaria solani)',
        confidencePercentage: 87,
        recommendedAction: 'Spray Mancozeb 75 WP (2.5g/L). Avoid overhead irrigation.',
        urgency: 'High'
      },
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString()
    }
  ],
  photos: [
    {
      id: 'photo-01',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      fieldId: 'field-mango-01',
      cropId: 'crop-mango-01',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=80',
      caption: 'Suspected fungal discoloration on mango foliage',
      latitude: 13.2992,
      longitude: 77.5348,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      source: 'raspberry_pi',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'photo-02',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      fieldId: 'field-tomato-02',
      cropId: 'crop-tomato-02',
      type: 'photo',
      url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=1000&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=400&auto=format&fit=crop&q=80',
      caption: 'Tomato vine inspected during morning walkthrough',
      latitude: 13.2962,
      longitude: 77.5349,
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      source: 'mobile',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString()
    }
  ],
  videos: [
    {
      id: 'video-01',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      fieldId: 'field-mango-01',
      cropId: 'crop-mango-01',
      type: 'video',
      url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=1000&auto=format&fit=crop&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400&auto=format&fit=crop&q=80',
      caption: 'AgroVision 15s canopy inspection clip',
      durationSeconds: 15,
      latitude: 13.2995,
      longitude: 77.5350,
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      source: 'raspberry_pi',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  tasks: [
    {
      id: 'task-01',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      fieldId: 'field-mango-01',
      title: 'Apply Copper Oxychloride antifungal spray on Mango Parcel',
      description: 'Mix 30g per 10L water. Spray uniformly across lower and middle canopies.',
      dueDate: 'Today',
      status: 'Pending',
      source: 'website',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'task-02',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      fieldId: 'field-tomato-02',
      title: 'Inspect Drip Emitters in Tomato Polyhouse',
      description: 'Check pressure regulation valves and flush line 2.',
      dueDate: 'Tomorrow',
      status: 'Pending',
      source: 'mobile',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: 'task-03',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      fieldId: 'field-strawberry-03',
      title: 'Harvest Grade A Strawberries for Dispatch',
      description: 'Pick early morning ripe berries before temperature exceeds 28°C.',
      dueDate: 'Today',
      status: 'Completed',
      source: 'raspberry_pi',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  reminders: [
    {
      id: 'rem-01',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      fieldId: 'field-mango-01',
      title: 'Calibrate soil moisture sensors in Mango Block B',
      timeStr: 'Today • 04:00 PM',
      dueDateTime: new Date().toISOString(),
      completed: false,
      status: 'Scheduled',
      source: 'website',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  problems: [
    {
      id: 'prob-01',
      userId: 'user-ravi-01',
      farmId: 'farm-gv-01',
      fieldId: 'field-mango-01',
      crop: 'Mango',
      issueType: 'Disease',
      severity: 'Medium',
      dateReported: 'Yesterday',
      farmerNote: 'Fungal leaf spotting observed on south edge.',
      status: 'Action Scheduled',
      aiAnalysis: {
        possibleDisease: 'Anthracnose',
        confidence: 91,
        recommendedAction: 'Apply Copper Oxychloride 50 WP (3g/L) spray in early morning.',
        preventativeTips: 'Improve canopy aeration through summer pruning.'
      },
      source: 'raspberry_pi',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  devices: [
    {
      deviceId: 'rpi-field-01',
      userId: 'user-ravi-01',
      deviceType: 'raspberry_pi',
      name: 'AgroVision Field Hub (Raspberry Pi 4B)',
      status: 'online',
      batteryLevel: 94,
      ipAddress: '192.168.1.105',
      firmwareVersion: 'v2.4.1',
      lastSeen: new Date().toISOString(),
      createdAt: '2024-03-15T00:00:00Z',
      updatedAt: new Date().toISOString()
    },
    {
      deviceId: 'mobile-pixel-01',
      userId: 'user-ravi-01',
      deviceType: 'mobile',
      name: 'Ravi Pixel 8 Pro',
      status: 'online',
      batteryLevel: 88,
      lastSeen: new Date().toISOString(),
      createdAt: '2024-03-15T00:00:00Z',
      updatedAt: new Date().toISOString()
    }
  ],
  weather: {},
  activity: [
    {
      id: 'act-01',
      userId: 'user-ravi-01',
      action: 'Observation Recorded',
      details: 'Anthracnose fungal lesions detected via optical camera',
      fieldName: 'Mango Plantation',
      type: 'observation',
      source: 'raspberry_pi',
      timestamp: 'Yesterday • 10:32 AM'
    },
    {
      id: 'act-02',
      userId: 'user-ravi-01',
      action: 'Task Created',
      details: 'Apply Copper Oxychloride antifungal spray',
      fieldName: 'Mango Plantation',
      type: 'task',
      source: 'website',
      timestamp: 'Yesterday • 10:35 AM'
    },
    {
      id: 'act-03',
      userId: 'user-ravi-01',
      action: 'Task Completed',
      details: 'Harvest Grade A Strawberries for Dispatch',
      fieldName: 'Organic Strawberry Parcel',
      type: 'task',
      source: 'mobile',
      timestamp: 'Today • 08:30 AM'
    },
    {
      id: 'act-04',
      userId: 'user-ravi-01',
      action: 'Device Online',
      details: 'Raspberry Pi Field Hub connected and synced telemetry',
      fieldName: 'Green Valley Farm',
      type: 'device',
      source: 'raspberry_pi',
      timestamp: 'Just now'
    }
  ]
};

class PersistentStore {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = JSON.parse(JSON.stringify(SEED_DATA));
        this.save();
      }
    } catch (err) {
      console.error('[Store] Error reading DB file, reinitializing from seeds:', err);
      this.data = JSON.parse(JSON.stringify(SEED_DATA));
      this.save();
    }
  }

  save() {
    try {
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('[Store] Atomic write failed:', err);
    }
  }

  // Generic collection operations
  getCollection(name) {
    if (!this.data[name]) {
      this.data[name] = [];
    }
    return this.data[name];
  }

  find(collectionName, predicate = () => true) {
    return this.getCollection(collectionName).filter(predicate);
  }

  findById(collectionName, id) {
    return this.getCollection(collectionName).find(item => item.id === id || item.deviceId === id);
  }

  insert(collectionName, item) {
    const col = this.getCollection(collectionName);
    const now = new Date().toISOString();
    const record = {
      ...item,
      id: item.id || `${collectionName.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: item.createdAt || now,
      updatedAt: now
    };
    col.unshift(record);
    this.save();
    return record;
  }

  update(collectionName, id, updates) {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => item.id === id || item.deviceId === id);
    if (index === -1) return null;

    col[index] = {
      ...col[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return col[index];
  }

  delete(collectionName, id) {
    const col = this.getCollection(collectionName);
    const index = col.findIndex(item => item.id === id || item.deviceId === id);
    if (index === -1) return false;

    col.splice(index, 1);
    this.save();
    return true;
  }

  // Weather Cache
  getWeather(fieldId) {
    return this.data.weather?.[fieldId] || null;
  }

  saveWeather(fieldId, weatherObj) {
    if (!this.data.weather) this.data.weather = {};
    this.data.weather[fieldId] = {
      ...weatherObj,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.weather[fieldId];
  }

  // Append to activity log
  logActivity({ action, details, fieldName, type, source = 'website', userId = 'user-ravi-01' }) {
    const record = {
      id: `act-${Date.now()}`,
      userId,
      action,
      details,
      fieldName: fieldName || 'Green Valley Farm',
      type: type || 'info',
      source,
      timestamp: 'Just now',
      createdAt: new Date().toISOString()
    };
    this.getCollection('activity').unshift(record);
    if (this.data.activity.length > 100) {
      this.data.activity = this.data.activity.slice(0, 100);
    }
    this.save();
    return record;
  }
}

export const db = new PersistentStore();
