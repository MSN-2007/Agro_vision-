import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { db } from './db.js';

const PORT = process.env.PORT || 5000;

// SSE Client Connections Manager
const sseClients = new Set();

export function broadcastEvent(eventType, data) {
  const message = `event: ${eventType}
data: ${JSON.stringify(data)}

`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Keep-alive heartbeat every 20s
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(':ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 20000);

// Helper: Parse JSON Body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Helper: Send JSON Response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-device-id, x-source'
  });
  res.end(JSON.stringify(data));
}

// Request Handler
const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-device-id, x-source'
    });
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method;
  const source = req.headers['x-source'] || 'website';
  const userId = req.headers['x-user-id'] || 'user-ravi-01';

  // Static file serving for uploads
  if (pathname.startsWith('/uploads/') && method === 'GET') {
    const relPath = pathname.replace(/^\/+/, '');
    const filePath = path.join(__dirname, relPath);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm'
      };
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*'
      });
      return fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File not found');
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. HEALTH & REALTIME SSE
    // -------------------------------------------------------------
    if (pathname === '/api/health' && method === 'GET') {
      return sendJson(res, 200, {
        status: 'ok',
        service: 'AgroVision Central Backend',
        version: '1.0.0',
        activeClients: sseClients.size,
        timestamp: new Date().toISOString()
      });
    }

    if (pathname === '/api/sync/events' && method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      sseClients.add(res);
      res.write(`event: CONNECTED\ndata: ${JSON.stringify({
        status: 'connected',
        clients: sseClients.size,
        serverTime: new Date().toISOString()
      })}\n\n`);

      req.on('close', () => {
        sseClients.delete(res);
      });
      return;
    }

    // -------------------------------------------------------------
    // 2. USER & PROFILE
    // -------------------------------------------------------------
    if (pathname === '/api/users/me' && method === 'GET') {
      const user = db.findById('users', userId) || db.getCollection('users')[0];
      return sendJson(res, 200, user);
    }

    if (pathname === '/api/users/me' && (method === 'PUT' || method === 'PATCH')) {
      const body = await parseBody(req);
      const updated = db.update('users', userId, body);
      broadcastEvent('USER_UPDATED', updated);
      return sendJson(res, 200, updated);
    }

    // -------------------------------------------------------------
    // 3. FARMS
    // -------------------------------------------------------------
    if (pathname === '/api/farms' && method === 'GET') {
      const farms = db.find('farms');
      const fields = db.find('fields');
      const hydrated = farms.map(f => ({
        ...f,
        fields: fields.filter(field => field.farmId === f.id)
      }));
      return sendJson(res, 200, hydrated);
    }

    if (pathname === '/api/farms' && method === 'POST') {
      const body = await parseBody(req);
      const farm = db.insert('farms', {
        userId,
        name: body.name || 'New Farm',
        locationName: body.locationName || 'Rural India',
        center: body.center || { lat: 13.2985, lng: 77.5350 },
        totalAreaAcres: body.totalAreaAcres || 1.0,
        source: body.source || source
      });
      db.logActivity({
        action: 'Farm Created',
        details: `Farm "${farm.name}" registered`,
        fieldName: farm.name,
        type: 'farm',
        source: farm.source,
        userId
      });
      broadcastEvent('FARM_CREATED', farm);
      return sendJson(res, 201, farm);
    }

    if (pathname.startsWith('/api/farms/') && method === 'PUT') {
      const farmId = pathname.split('/')[3];
      const body = await parseBody(req);
      const updated = db.update('farms', farmId, body);
      if (!updated) return sendJson(res, 404, { error: 'Farm not found' });
      broadcastEvent('FARM_UPDATED', updated);
      return sendJson(res, 200, updated);
    }

    // -------------------------------------------------------------
    // 4. FIELDS & GEOFENCES
    // -------------------------------------------------------------
    if (pathname === '/api/fields' && method === 'GET') {
      const farmId = urlObj.searchParams.get('farmId');
      const fields = farmId ? db.find('fields', f => f.farmId === farmId) : db.find('fields');
      return sendJson(res, 200, fields);
    }

    if (pathname.startsWith('/api/fields/') && method === 'GET') {
      const fieldId = pathname.split('/')[3];
      const field = db.findById('fields', fieldId);
      if (!field) return sendJson(res, 404, { error: 'Field not found' });
      return sendJson(res, 200, field);
    }

    if (pathname === '/api/fields' && method === 'POST') {
      const body = await parseBody(req);
      const field = db.insert('fields', {
        userId,
        farmId: body.farmId || 'farm-gv-01',
        name: body.name || 'New Field',
        crop: body.crop || 'Mixed Crop',
        cropName: body.cropName || body.crop || 'Mixed Crop',
        areaAcres: body.areaAcres || 1.0,
        plantingDate: body.plantingDate || new Date().toISOString().split('T')[0],
        healthPercentage: body.healthPercentage || 80,
        healthBreakdown: body.healthBreakdown || { healthy: 80, atRisk: 15, critical: 5 },
        status: body.status || 'Healthy',
        center: body.center || { lat: 13.2985, lng: 77.5350 },
        boundary: body.boundary || [],
        notes: body.notes || '',
        source: body.source || source
      });
      db.logActivity({
        action: 'Field Boundary Created',
        details: `Field "${field.name}" (${field.crop}) polygon mapped`,
        fieldName: field.name,
        type: 'field',
        source: field.source,
        userId
      });
      broadcastEvent('FIELD_CREATED', field);
      return sendJson(res, 201, field);
    }

    if (pathname.startsWith('/api/fields/') && (method === 'PUT' || method === 'PATCH')) {
      const fieldId = pathname.split('/')[3];
      const body = await parseBody(req);
      const updated = db.update('fields', fieldId, body);
      if (!updated) return sendJson(res, 404, { error: 'Field not found' });
      db.logActivity({
        action: 'Field Updated',
        details: `Field "${updated.name}" boundary or details updated`,
        fieldName: updated.name,
        type: 'field',
        source: body.source || source,
        userId
      });
      broadcastEvent('FIELD_UPDATED', updated);
      return sendJson(res, 200, updated);
    }

    if (pathname.startsWith('/api/fields/') && method === 'DELETE') {
      const fieldId = pathname.split('/')[3];
      const field = db.findById('fields', fieldId);
      const deleted = db.delete('fields', fieldId);
      if (!deleted) return sendJson(res, 404, { error: 'Field not found' });
      broadcastEvent('FIELD_DELETED', { id: fieldId });
      return sendJson(res, 200, { success: true, id: fieldId });
    }

    // -------------------------------------------------------------
    // 5. CROPS
    // -------------------------------------------------------------
    if (pathname === '/api/crops' && method === 'GET') {
      const fieldId = urlObj.searchParams.get('fieldId');
      const crops = fieldId ? db.find('crops', c => c.fieldId === fieldId) : db.find('crops');
      return sendJson(res, 200, crops);
    }

    if (pathname === '/api/crops' && method === 'POST') {
      const body = await parseBody(req);
      const crop = db.insert('crops', {
        fieldId: body.fieldId,
        name: body.name,
        variety: body.variety || '',
        plantingDate: body.plantingDate || new Date().toISOString().split('T')[0]
      });
      broadcastEvent('CROP_CREATED', crop);
      return sendJson(res, 201, crop);
    }

    // -------------------------------------------------------------
    // 6. OBSERVATIONS (Mobile, Raspberry Pi & Website)
    // -------------------------------------------------------------
    if (pathname === '/api/observations' && method === 'GET') {
      const fieldId = urlObj.searchParams.get('fieldId');
      const obs = fieldId ? db.find('observations', o => o.fieldId === fieldId) : db.find('observations');
      return sendJson(res, 200, obs);
    }

    if (pathname === '/api/observations' && method === 'POST') {
      const body = await parseBody(req);
      const obsSource = body.source || source;
      const observation = db.insert('observations', {
        userId,
        farmId: body.farmId || 'farm-gv-01',
        fieldId: body.fieldId || 'field-mango-01',
        cropId: body.cropId || null,
        crop: body.crop || 'Field Crop',
        title: body.title || body.content || 'Field Observation',
        notes: body.notes || body.content || '',
        content: body.content || body.notes || body.title || '',
        latitude: (body.latitude !== undefined && body.latitude !== null) ? body.latitude : (mediaSource === 'raspberry_pi' ? null : 13.2985),
        longitude: (body.longitude !== undefined && body.longitude !== null) ? body.longitude : (mediaSource === 'raspberry_pi' ? null : 77.5350),
        timestamp: body.timestamp || new Date().toISOString(),
        source: obsSource,
        status: body.status || 'Needs Attention',
        photoUrl: body.photoUrl || null,
        aiDiagnosis: body.aiDiagnosis || null
      });

      const field = db.findById('fields', observation.fieldId);
      db.logActivity({
        action: 'Observation Recorded',
        details: observation.title || observation.content,
        fieldName: field?.name || 'Farm',
        type: 'observation',
        source: obsSource,
        userId
      });

      broadcastEvent('OBSERVATION_CREATED', observation);
      return sendJson(res, 201, { success: true, observation });
    }

    if (pathname.startsWith('/api/observations/') && (method === 'PUT' || method === 'PATCH')) {
      const obsId = pathname.split('/')[3];
      const body = await parseBody(req);
      const updated = db.update('observations', obsId, body);
      if (!updated) return sendJson(res, 404, { error: 'Observation not found' });
      broadcastEvent('OBSERVATION_UPDATED', updated);
      return sendJson(res, 200, updated);
    }

    if (pathname.startsWith('/api/observations/') && method === 'DELETE') {
      const obsId = pathname.split('/')[3];
      const deleted = db.delete('observations', obsId);
      if (!deleted) return sendJson(res, 404, { error: 'Observation not found' });
      broadcastEvent('OBSERVATION_DELETED', { id: obsId });
      return sendJson(res, 200, { success: true, id: obsId });
    }

    // -------------------------------------------------------------
    // 7. MEDIA (Photos & Videos)
    // -------------------------------------------------------------
    if (pathname === '/api/media' && method === 'GET') {
      const fieldId = urlObj.searchParams.get('fieldId');
      const photos = db.find('photos');
      const videos = db.find('videos');
      let combined = [...photos, ...videos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (fieldId) combined = combined.filter(m => m.fieldId === fieldId);
      return sendJson(res, 200, combined);
    }

    
    if (pathname === '/api/media/upload' && method === 'POST') {
      const body = await parseBody(req);
      const uploadsDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const ext = body.filename ? path.extname(body.filename) : (body.mediaType === 'video' ? '.mp4' : '.jpg');
      const filename = `media_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      if (body.dataBase64) {
        const buffer = Buffer.from(body.dataBase64, 'base64');
        fs.writeFileSync(filePath, buffer);
      } else if (body.content) {
        fs.writeFileSync(filePath, body.content);
      } else {
        fs.writeFileSync(filePath, Buffer.from('AgroVision media placeholder'));
      }

      const fileUrl = `/uploads/${filename}`;
      return sendJson(res, 201, {
        success: true,
        url: fileUrl,
        filename,
        sizeBytes: fs.statSync(filePath).size
      });
    }

    if (pathname === '/api/media' && method === 'POST') {
      const body = await parseBody(req);
      const mediaSource = body.source || source;
      const collection = body.type === 'video' ? 'videos' : 'photos';
      const media = db.insert(collection, {
        userId,
        farmId: body.farmId || 'farm-gv-01',
        fieldId: body.fieldId || 'field-mango-01',
        cropId: body.cropId || null,
        type: body.type || 'photo',
        url: body.url || body.localFilePath || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&auto=format&fit=crop&q=80',
        thumbnailUrl: body.thumbnailUrl || body.url || null,
        caption: body.caption || body.description || 'Field imagery capture',
        latitude: (body.latitude !== undefined && body.latitude !== null) ? body.latitude : (mediaSource === 'raspberry_pi' ? null : 13.2985),
        longitude: (body.longitude !== undefined && body.longitude !== null) ? body.longitude : (mediaSource === 'raspberry_pi' ? null : 77.5350),
        timestamp: body.timestamp || new Date().toISOString(),
        durationSeconds: body.durationSeconds || null,
        source: mediaSource
      });

      const field = db.findById('fields', media.fieldId);
      db.logActivity({
        action: media.type === 'video' ? 'Video Recorded' : 'Photo Captured',
        details: media.caption,
        fieldName: field?.name || 'Farm',
        type: 'media',
        source: mediaSource,
        userId
      });

      broadcastEvent(media.type === 'video' ? 'VIDEO_CREATED' : 'PHOTO_CREATED', media);
      return sendJson(res, 201, { success: true, media });
    }

    if (pathname.startsWith('/api/media/') && method === 'DELETE') {
      const mediaId = pathname.split('/')[3];
      db.delete('photos', mediaId);
      db.delete('videos', mediaId);
      broadcastEvent('MEDIA_DELETED', { id: mediaId });
      return sendJson(res, 200, { success: true, id: mediaId });
    }

    // -------------------------------------------------------------
    // 8. TASKS & WORK ORDERS
    // -------------------------------------------------------------
    if (pathname === '/api/tasks' && method === 'GET') {
      const fieldId = urlObj.searchParams.get('fieldId');
      const status = urlObj.searchParams.get('status');
      let tasks = db.find('tasks');
      if (fieldId) tasks = tasks.filter(t => t.fieldId === fieldId);
      if (status) tasks = tasks.filter(t => t.status === status);
      return sendJson(res, 200, tasks);
    }

    if (pathname === '/api/tasks' && method === 'POST') {
      const body = await parseBody(req);
      const taskSource = body.source || source;
      const task = db.insert('tasks', {
        userId,
        farmId: body.farmId || 'farm-gv-01',
        fieldId: body.fieldId || null,
        title: body.title || 'New Task',
        description: body.description || '',
        dueDate: body.dueDate || 'Today',
        status: body.status || 'Pending',
        voiceCreated: !!body.voiceCreated,
        source: taskSource
      });

      const field = task.fieldId ? db.findById('fields', task.fieldId) : null;
      db.logActivity({
        action: 'Task Created',
        details: task.title,
        fieldName: field?.name || 'General Farm',
        type: 'task',
        source: taskSource,
        userId
      });

      broadcastEvent('TASK_CREATED', task);
      return sendJson(res, 201, { success: true, task });
    }

    if (pathname.startsWith('/api/tasks/') && (method === 'PATCH' || method === 'PUT')) {
      const taskId = pathname.split('/')[3];
      const body = await parseBody(req);
      const taskSource = body.source || source;
      const existing = db.findById('tasks', taskId);
      const updated = db.update('tasks', taskId, body);
      if (!updated) return sendJson(res, 404, { error: 'Task not found' });

      if (body.status === 'Completed' && existing?.status !== 'Completed') {
        db.logActivity({
          action: 'Task Completed',
          details: updated.title,
          fieldName: 'Farm',
          type: 'task',
          source: taskSource,
          userId
        });
      }

      broadcastEvent('TASK_UPDATED', updated);
      return sendJson(res, 200, { success: true, task: updated });
    }

    if (pathname.startsWith('/api/tasks/') && method === 'DELETE') {
      const taskId = pathname.split('/')[3];
      const existing = db.findById('tasks', taskId);
      const deleted = db.delete('tasks', taskId);
      if (!deleted) return sendJson(res, 404, { error: 'Task not found' });

      db.logActivity({
        action: 'Task Removed',
        details: existing?.title || 'Task removed',
        fieldName: 'Farm',
        type: 'task',
        source,
        userId
      });

      broadcastEvent('TASK_DELETED', { id: taskId });
      return sendJson(res, 200, { success: true, id: taskId });
    }

    // -------------------------------------------------------------
    // 9. REMINDERS
    // -------------------------------------------------------------
    if (pathname === '/api/reminders' && method === 'GET') {
      return sendJson(res, 200, db.find('reminders'));
    }

    if (pathname === '/api/reminders' && method === 'POST') {
      const body = await parseBody(req);
      const rem = db.insert('reminders', {
        userId,
        farmId: body.farmId || 'farm-gv-01',
        fieldId: body.fieldId || null,
        title: body.title,
        timeStr: body.timeStr || 'Today • 04:00 PM',
        dueDateTime: body.dueDateTime || new Date().toISOString(),
        completed: false,
        status: 'Scheduled',
        source: body.source || source
      });
      broadcastEvent('REMINDER_CREATED', rem);
      return sendJson(res, 201, rem);
    }

    if (pathname.startsWith('/api/reminders/') && method === 'DELETE') {
      const remId = pathname.split('/')[3];
      db.delete('reminders', remId);
      broadcastEvent('REMINDER_DELETED', { id: remId });
      return sendJson(res, 200, { success: true, id: remId });
    }

    // -------------------------------------------------------------
    // 10. PROBLEMS / PEST REPORTS
    // -------------------------------------------------------------
    if (pathname === '/api/problems' && method === 'GET') {
      return sendJson(res, 200, db.find('problems'));
    }

    if (pathname === '/api/problems' && method === 'POST') {
      const body = await parseBody(req);
      const prob = db.insert('problems', {
        userId,
        farmId: body.farmId || 'farm-gv-01',
        fieldId: body.fieldId || 'field-mango-01',
        crop: body.crop || 'Crop',
        issueType: body.issueType || 'Disease',
        severity: body.severity || 'Medium',
        dateReported: body.dateReported || 'Today',
        farmerNote: body.farmerNote || '',
        status: body.status || 'Reported',
        aiAnalysis: body.aiAnalysis || null,
        source: body.source || source
      });
      broadcastEvent('PROBLEM_CREATED', prob);
      return sendJson(res, 201, prob);
    }

    if (pathname.startsWith('/api/problems/') && (method === 'PATCH' || method === 'PUT')) {
      const probId = pathname.split('/')[3];
      const body = await parseBody(req);
      const updated = db.update('problems', probId, body);
      broadcastEvent('PROBLEM_UPDATED', updated);
      return sendJson(res, 200, updated);
    }

    // -------------------------------------------------------------
    // 11. WEATHER
    // -------------------------------------------------------------
    if (pathname.startsWith('/api/weather/') && method === 'GET') {
      const fieldId = pathname.split('/')[3];
      const weather = db.getWeather(fieldId);
      return sendJson(res, 200, weather || { message: 'No cached weather' });
    }

    if (pathname.startsWith('/api/weather/') && method === 'POST') {
      const fieldId = pathname.split('/')[3];
      const body = await parseBody(req);
      const saved = db.saveWeather(fieldId, body);
      broadcastEvent('WEATHER_UPDATED', { fieldId, weather: saved });
      return sendJson(res, 200, saved);
    }

    // -------------------------------------------------------------
    // 12. DEVICE REGISTRATION & RASPBERRY PI
    // -------------------------------------------------------------
    if (pathname === '/api/devices' && method === 'GET') {
      return sendJson(res, 200, db.find('devices'));
    }

    if (pathname === '/api/devices/register' && method === 'POST') {
      const body = await parseBody(req);
      const deviceId = body.deviceId || `device-${Date.now()}`;
      const existing = db.findById('devices', deviceId);

      const deviceData = {
        deviceId,
        userId: body.userId || userId,
        deviceType: body.deviceType || 'raspberry_pi',
        name: body.name || 'AgroVision Device',
        status: body.status || 'online',
        batteryLevel: body.batteryLevel ?? 100,
        firmwareVersion: body.firmwareVersion || 'v1.0.0',
        ipAddress: body.ipAddress || req.socket.remoteAddress || '127.0.0.1',
        lastSeen: new Date().toISOString()
      };

      const result = existing
        ? db.update('devices', deviceId, deviceData)
        : db.insert('devices', deviceData);

      broadcastEvent('DEVICE_STATUS_CHANGED', result);
      return sendJson(res, 200, { success: true, device: result });
    }

    if (pathname.startsWith('/api/devices/') && pathname.endsWith('/heartbeat') && method === 'POST') {
      const parts = pathname.split('/');
      const deviceId = parts[3];
      const body = await parseBody(req);

      const updated = db.update('devices', deviceId, {
        status: body.status || 'online',
        batteryLevel: body.batteryLevel,
        lastSeen: new Date().toISOString()
      });

      if (!updated) {
        // Auto-register if not present
        const newDev = db.insert('devices', {
          deviceId,
          userId,
          deviceType: body.deviceType || 'raspberry_pi',
          name: body.name || `Device ${deviceId}`,
          status: 'online',
          batteryLevel: body.batteryLevel ?? 100,
          lastSeen: new Date().toISOString()
        });
        broadcastEvent('DEVICE_STATUS_CHANGED', newDev);
        return sendJson(res, 200, { success: true, device: newDev });
      }

      broadcastEvent('DEVICE_STATUS_CHANGED', updated);
      return sendJson(res, 200, { success: true, device: updated });
    }


    // -------------------------------------------------------------
    // 14. DEVICE PAIRING SYSTEM
    // -------------------------------------------------------------
    // In-memory pairing codes map
    if (!global.pairingCodes) global.pairingCodes = new Map();

    if (pathname === '/api/devices/pairing/code' && method === 'POST') {
      const body = await parseBody(req);
      const deviceId = body.deviceId || 'AGRO_PI_001';
      const code = 'AGRO-' + Math.floor(1000 + Math.random() * 9000);
      
      global.pairingCodes.set(code, {
        code,
        deviceId,
        status: 'pending',
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
      });

      return sendJson(res, 200, {
        success: true,
        pairingCode: code,
        expiresIn: 600,
        deviceId
      });
    }

    if (pathname === '/api/devices/pairing/claim' && method === 'POST') {
      const body = await parseBody(req);
      const code = (body.pairingCode || body.code || '').toUpperCase().trim();
      const pairEntry = global.pairingCodes.get(code);

      if (!pairEntry || pairEntry.expiresAt < Date.now()) {
        return sendJson(res, 400, { error: 'Invalid or expired pairing code' });
      }

      const deviceId = pairEntry.deviceId;
      const farmId = body.farmId || 'farm-gv-01';
      const fieldId = body.fieldId || 'field-mango-01';
      const token = 'token-' + Buffer.from(deviceId + '-' + Date.now()).toString('base64');

      const existingDev = db.findById('devices', deviceId);
      const updatedDev = {
        deviceId,
        userId: body.userId || userId,
        farmId,
        fieldId,
        deviceType: 'raspberry_pi',
        name: body.name || 'AgroVision Field Hub',
        status: 'online',
        paired: true,
        authToken: token,
        lastSeen: new Date().toISOString()
      };

      const saved = existingDev ? db.update('devices', deviceId, updatedDev) : db.insert('devices', updatedDev);

      pairEntry.status = 'claimed';
      pairEntry.token = token;
      pairEntry.farmId = farmId;
      pairEntry.fieldId = fieldId;
      pairEntry.device = saved;

      broadcastEvent('DEVICE_STATUS_CHANGED', saved);
      return sendJson(res, 200, { success: true, device: saved, token });
    }

    if (pathname.startsWith('/api/devices/pairing/status/') && method === 'GET') {
      const code = pathname.split('/')[5]?.toUpperCase().trim();
      const pairEntry = global.pairingCodes.get(code);
      if (!pairEntry) {
        return sendJson(res, 404, { error: 'Pairing code not found' });
      }
      return sendJson(res, 200, pairEntry);
    }

    // -------------------------------------------------------------
    // 15. AI BRAIN & VOICE CONVERSATION DISPATCHER
    // -------------------------------------------------------------
    if (pathname === '/api/ai/converse' && method === 'POST') {
      const body = await parseBody(req);
      const rawText = (body.text || body.query || '').trim();
      const deviceId = body.deviceId || req.headers['x-device-id'] || 'AGRO_PI_001';
      
      // Resolve device settings
      const device = db.findById('devices', deviceId) || {};
      const devFarmId = body.farmId || device.farmId || 'farm-gv-01';
      const devFieldId = body.fieldId || device.fieldId || 'field-mango-01';
      const field = db.findById('fields', devFieldId) || db.getCollection('fields')[0];
      const farm = db.findById('farms', devFarmId) || db.getCollection('farms')[0];

      const lower = rawText.toLowerCase();

      // Rule & Intent Evaluation
      // A. Today's tasks
      if (
        lower.includes('task') &&
        (lower.includes('today') || lower.includes('what are') || lower.includes('my tasks') || lower.includes('list') || lower.includes('have to do'))
      ) {
        const allTasks = db.find('tasks', t => t.status === 'Pending' || t.status === 'pending');
        const count = allTasks.length;
        let speakText = '';
        let oledText = '';

        if (count === 0) {
          speakText = `You have zero open tasks for ${field?.name || 'the farm'}.`;
          oledText = 'TASKS TODAY\n0 open tasks';
        } else {
          const listStr = allTasks.slice(0, 2).map(t => t.title).join(', and ');
          speakText = `You have ${count} open task${count > 1 ? 's' : ''} today: ${listStr}.`;
          oledText = `TASKS: ${count} OPEN\n1. ${allTasks[0].title.slice(0, 16)}${allTasks[1] ? '\n2. ' + allTasks[1].title.slice(0, 16) : ''}`;
        }

        return sendJson(res, 200, {
          success: true,
          intent: 'GET_TODAYS_TASKS',
          text: speakText,
          oledText,
          speak: true,
          data: { tasks: allTasks }
        });
      }

      // B. Complete task
      if (lower.startsWith('complete') || lower.startsWith('finish') || lower.includes('done with') || lower.includes('mark') && lower.includes('complete')) {
        const pending = db.find('tasks', t => t.status === 'Pending' || t.status === 'pending');
        // match keywords
        const keywords = lower.replace(/^(complete|finish|mark as completed|mark)s+/i, '').trim();
        const matched = pending.find(t => t.title.toLowerCase().includes(keywords)) || pending[0];

        if (matched) {
          const updated = db.update('tasks', matched.id, {
            status: 'Completed',
            completedAt: new Date().toISOString()
          });

          db.logActivity({
            action: 'Task Completed',
            details: updated.title,
            fieldName: field?.name || 'Farm',
            type: 'task',
            source: 'raspberry_pi',
            userId
          });

          broadcastEvent('TASK_UPDATED', updated);

          return sendJson(res, 200, {
            success: true,
            intent: 'COMPLETE_TASK',
            text: `Completed task: ${updated.title}.`,
            oledText: `COMPLETED\n${updated.title.slice(0, 20)}`,
            speak: true,
            data: { task: updated }
          });
        } else {
          return sendJson(res, 200, {
            success: true,
            intent: 'COMPLETE_TASK',
            text: 'I could not find a pending task matching that description.',
            oledText: 'TASK NOT FOUND\nNo match',
            speak: true
          });
        }
      }

      // C. Create Task
      if (lower.startsWith('create a task') || lower.startsWith('create task') || lower.startsWith('add a task') || lower.startsWith('add task') || lower.startsWith('new task')) {
        const taskTitle = rawText.replace(/^(create a task to|create a task|create task to|create task|add a task to|add a task|add task to|add task|new task to|new task)[:s]+/i, '').trim() || 'Inspect Field';
        
        const newTask = db.insert('tasks', {
          userId,
          farmId: devFarmId,
          fieldId: devFieldId,
          title: taskTitle,
          description: 'Created via Raspberry Pi physical voice assistant',
          dueDate: 'Today',
          status: 'Pending',
          voiceCreated: true,
          source: 'raspberry_pi',
          deviceId
        });

        db.logActivity({
          action: 'Task Created',
          details: newTask.title,
          fieldName: field?.name || 'Farm',
          type: 'task',
          source: 'raspberry_pi',
          userId
        });

        broadcastEvent('TASK_CREATED', newTask);

        return sendJson(res, 201, {
          success: true,
          intent: 'CREATE_TASK',
          text: `Created task: ${newTask.title}.`,
          oledText: `TASK CREATED\n${newTask.title.slice(0, 20)}`,
          speak: true,
          data: { task: newTask }
        });
      }

      // D. Observations / Notes
      if (lower.startsWith('take a note') || lower.startsWith('note:') || lower.startsWith('observe:') || lower.startsWith('note that') || lower.startsWith('take note') || lower.includes('observation')) {
        const noteContent = rawText.replace(/^(take a note that|take a note:|take a note|take note that|take note|note that|note:|note|observe:|observe|observation:)[:s]+/i, '').trim() || rawText;

        const newObs = db.insert('observations', {
          userId,
          farmId: devFarmId,
          fieldId: devFieldId,
          cropId: null,
          crop: field?.crop || 'Farm Crop',
          title: noteContent.slice(0, 60),
          notes: noteContent,
          content: noteContent,
          latitude: field?.center?.lat || 13.2985,
          longitude: field?.center?.lng || 77.5350,
          timestamp: new Date().toISOString(),
          source: 'raspberry_pi',
          deviceId,
          status: 'Needs Attention'
        });

        db.logActivity({
          action: 'Observation Recorded',
          details: newObs.title,
          fieldName: field?.name || 'Farm',
          type: 'observation',
          source: 'raspberry_pi',
          userId
        });

        broadcastEvent('OBSERVATION_CREATED', newObs);

        return sendJson(res, 201, {
          success: true,
          intent: 'CREATE_OBSERVATION',
          text: `Observation saved to ${field?.name || 'field'}.`,
          oledText: `NOTE SAVED\n${field?.name?.slice(0, 16) || 'Field'}`,
          speak: true,
          data: { observation: newObs }
        });
      }

      // E. Reminders
      if (lower.includes('remind me')) {
        const remTitle = rawText.replace(/^remind me (to |that )?/i, '').trim() || 'Check field';
        const rem = db.insert('reminders', {
          userId,
          farmId: devFarmId,
          fieldId: devFieldId,
          title: remTitle,
          timeStr: 'Tomorrow • 08:00 AM',
          dueDateTime: new Date(Date.now() + 86400000).toISOString(),
          completed: false,
          status: 'Scheduled',
          source: 'raspberry_pi',
          deviceId
        });

        broadcastEvent('REMINDER_CREATED', rem);

        return sendJson(res, 201, {
          success: true,
          intent: 'CREATE_REMINDER',
          text: `Reminder scheduled: ${rem.title}.`,
          oledText: `REMINDER SET\n${rem.title.slice(0, 20)}`,
          speak: true,
          data: { reminder: rem }
        });
      }

      // F. Weather inquiries
      if (lower.includes('weather') || lower.includes('rain') || lower.includes('temperature') || lower.includes('forecast')) {
        const weather = db.getWeather(devFieldId);
        const temp = weather?.current?.temperature || 28;
        const condition = weather?.current?.weatherDescription || 'Partly cloudy';
        const rainProb = weather?.current?.rainProbability ?? 20;

        let speakText = '';
        let oledText = '';

        if (lower.includes('tomorrow')) {
          speakText = `Tomorrow in ${field?.name || 'field'}: ${condition} with a high of ${temp} degrees and ${rainProb}% chance of rain.`;
          oledText = `TOMORROW\n${temp}°C ${condition.slice(0, 10)}\nRain: ${rainProb}%`;
        } else if (lower.includes('7 day') || lower.includes('seven day') || lower.includes('week')) {
          speakText = `7-day forecast for ${field?.name || 'field'}: Expect sunny to partly cloudy conditions with highs averaging ${temp} degrees.`;
          oledText = `7-DAY FORECAST\nAvg ${temp}°C\nRain: Low`;
        } else if (lower.includes('will it rain')) {
          speakText = rainProb > 40
            ? `Rain is possible today with a ${rainProb}% probability in ${field?.name || 'your field'}.`
            : `Rain is unlikely today. Rain chance is only ${rainProb}% in ${field?.name || 'your field'}.`;
          oledText = `RAIN CHANCE\n${rainProb}%\n${rainProb > 40 ? 'Rain Likely' : 'Unlikely'}`;
        } else {
          speakText = `Current weather in ${field?.name || 'field'} is ${temp} degrees Celsius, ${condition.toLowerCase()}, with ${rainProb}% rain chance.`;
          oledText = `WEATHER\n${temp}°C ${condition.slice(0, 10)}\nRain: ${rainProb}%`;
        }

        return sendJson(res, 200, {
          success: true,
          intent: 'GET_WEATHER',
          text: speakText,
          oledText,
          speak: true,
          data: { temperature: temp, condition, rainProb }
        });
      }

      // Camera - Take Photo
      if (
        lower.includes('take a photo') ||
        lower.includes('take a picture') ||
        lower.includes('capture this') ||
        lower.includes('take photo') ||
        lower.includes('take picture') ||
        lower.includes('capture photo') ||
        lower.includes('capture image')
      ) {
        return sendJson(res, 200, {
          success: true,
          intent: 'TAKE_PHOTO',
          text: `Taking photo of ${field?.name || 'the field'}.`,
          oledText: 'TAKING PHOTO\nPlease hold still',
          speak: true,
          data: { farmId: devFarmId, fieldId: devFieldId }
        });
      }

      // Camera - Start Video
      if (
        lower.includes('start recording') ||
        lower.includes('start a video') ||
        lower.includes('start video') ||
        lower.includes('record video') ||
        lower.includes('begin recording')
      ) {
        return sendJson(res, 200, {
          success: true,
          intent: 'START_VIDEO',
          text: `Starting video recording in ${field?.name || 'the field'}.`,
          oledText: 'RECORDING...\nVideo active',
          speak: true,
          data: { farmId: devFarmId, fieldId: devFieldId }
        });
      }

      // Camera - Stop Video
      if (
        lower.includes('stop recording') ||
        lower.includes('stop the video') ||
        lower.includes('stop video') ||
        lower.includes('finish recording') ||
        lower.includes('end video')
      ) {
        return sendJson(res, 200, {
          success: true,
          intent: 'STOP_VIDEO',
          text: 'Stopping recording and saving video.',
          oledText: 'STOPPING...\nSaving video',
          speak: true,
          data: { farmId: devFarmId, fieldId: devFieldId }
        });
      }

      // G. Morning briefing
      if (lower.includes('briefing') || lower.includes('good morning')) {
        const tasks = db.find('tasks', t => t.status === 'Pending' || t.status === 'pending');
        const weather = db.getWeather(devFieldId);
        const temp = weather?.current?.temperature || 28;
        const rainProb = weather?.current?.rainProbability ?? 20;

        const speakText = `Good morning! Current temperature is ${temp} degrees Celsius. You have ${tasks.length} pending task${tasks.length === 1 ? '' : 's'}. Rain probability is ${rainProb}%. Ready for field operations.`;
        const oledText = `BRIEFING\n${temp}°C • ${tasks.length} Tasks\nRain: ${rainProb}%`;

        return sendJson(res, 200, {
          success: true,
          intent: 'GET_MORNING_BRIEFING',
          text: speakText,
          oledText,
          speak: true,
          data: { tasksCount: tasks.length, temp, rainProb }
        });
      }

      // H. Farm memory / recent logs
      if ((lower.includes('memory') || lower.includes('history') || lower.includes('past record') || lower.includes('what did i observe')) && !lower.includes('video')) {
        const obs = db.find('observations').slice(-3).reverse();
        let speakText = '';
        let oledText = '';

        if (obs.length === 0) {
          speakText = 'No recent observations logged.';
          oledText = 'FARM MEMORY\n0 observations';
        } else {
          speakText = `Recent observation: ${obs[0].title || obs[0].content} recorded in ${field?.name || 'the field'}.`;
          oledText = `FARM MEMORY\n${(obs[0].title || obs[0].content).slice(0, 20)}`;
        }

        return sendJson(res, 200, {
          success: true,
          intent: 'GET_FARM_MEMORY',
          text: speakText,
          oledText,
          speak: true,
          data: { observations: obs }
        });
      }

      

      // I. General conversation fallback
      const replyText = `AgroVision active in ${field?.name || 'field'}. I can check tasks, weather, record field notes, or give your morning briefing.`;
      return sendJson(res, 200, {
        success: true,
        intent: 'GENERAL_CONVERSATION',
        text: replyText,
        oledText: 'AGROVISION\nReady for voice',
        speak: true
      });
    }

    // -------------------------------------------------------------
    // 13. ACTIVITY LOG
    // -------------------------------------------------------------
    if (pathname === '/api/activity' && method === 'GET') {
      return sendJson(res, 200, db.find('activity'));
    }

    // 404 Route Not Found
    return sendJson(res, 404, { error: 'Endpoint not found', path: pathname });

  } catch (err) {
    console.error('[API Error]:', err);
    return sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🌿 AgroVision Central Backend Server Active`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚡ Real-time SSE Stream: http://localhost:${PORT}/api/sync/events`);
  console.log(`🌐 Ready for Website, Mobile App & Raspberry Pi`);
  console.log(`======================================================\n`);
});
