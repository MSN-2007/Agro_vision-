import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Edit3,
  Check,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Navigation,
  Layers,
  X,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Crosshair,
  Crop,
  Search,
  Compass,
  Copy,
  CheckCheck,
  Loader2,
  Landmark,
  Building2,
  Sparkles
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { LatLng, Field } from '../types/agro';
import { calculatePolygonAreaAcres, findContainingField } from '../services/geofence';
import {
  MapLandmark,
  searchPlacesAndLandmarks,
  reverseGeocodePoint,
  calculateDistanceKm
} from '../services/geocodingService';

export const MapPage: React.FC = () => {
  const {
    currentFarm,
    currentField,
    currentGps,
    setCurrentGps,
    updateFieldBoundary,
    addField,
    locateMe,
    selectField,
    showToast
  } = useFarm();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const farmerMarkerRef = useRef<L.Marker | null>(null);
  const polygonLayersRef = useRef<Record<string, L.Polygon>>({});
  const vertexMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const activeDrawPolygonRef = useRef<L.Polygon | null>(null);
  const landmarkMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Real-device GPS States
  const [isLocatingDevice, setIsLocatingDevice] = useState<boolean>(false);
  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(false);
  const [deviceGpsInfo, setDeviceGpsInfo] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    altitude?: number | null;
    speed?: number | null;
    heading?: number | null;
    timestamp: number;
    address?: string;
    containingFieldName?: string | null;
  } | null>(null);
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null);

  // Landmark & Geocoding Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MapLandmark[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeLandmark, setActiveLandmark] = useState<MapLandmark | null>(null);
  const [hasCopiedCoords, setHasCopiedCoords] = useState(false);

  // Map and View Mode States
  const [mapLayerType, setMapLayerType] = useState<'satellite' | 'streets'>('satellite');
  const [editorMode, setEditorMode] = useState<'view' | 'draw' | 'edit'>('view');
  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    currentField?.id || currentFarm.fields[0]?.id || ''
  );
  const [areaUnit, setAreaUnit] = useState<'acres' | 'hectares' | 'sqm'>('acres');
  const [isHudCollapsed, setIsHudCollapsed] = useState(false);

  // Add Field Modal State
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldCrop, setNewFieldCrop] = useState('Mango');

  // Active Points for Edit / Draw with History for Undo/Redo
  const [activePoints, setActivePoints] = useState<LatLng[]>([]);
  const [history, setHistory] = useState<LatLng[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [selectedVertexIndex, setSelectedVertexIndex] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const activeField = currentFarm.fields.find(f => f.id === selectedFieldId) || currentFarm.fields[0];

  // Helper to push history state
  const pushHistory = useCallback((newPoints: LatLng[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newPoints];
    });
    setHistoryIndex(prev => prev + 1);
    setActivePoints(newPoints);
    setHasUnsavedChanges(true);
  }, [historyIndex]);

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setActivePoints(prev);
      setSelectedVertexIndex(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setActivePoints(next);
      setSelectedVertexIndex(null);
    }
  };

  // Convert Acres to Selected Unit
  const formatArea = (acres: number) => {
    if (areaUnit === 'hectares') {
      const ha = acres * 0.404686;
      return `${ha.toFixed(2)} ha`;
    }
    if (areaUnit === 'sqm') {
      const sqm = acres * 4046.86;
      return `${Math.round(sqm).toLocaleString()} m²`;
    }
    return `${acres.toFixed(2)} acres`;
  };

  const calculatedAcres = calculatePolygonAreaAcres(activePoints);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter = currentField?.center || currentFarm.center;

    const map = L.map(mapContainerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: 17,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const vertexGroup = L.layerGroup().addTo(map);
    vertexMarkersGroupRef.current = vertexGroup;

    mapInstanceRef.current = map;

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [currentFarm]);

  // 2. Manage Tile Layer (Satellite vs Streets with Zero Watermarks/No API key)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      baseTileLayerRef.current.remove();
    }

    if (mapLayerType === 'satellite') {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USDA, USGS',
          maxZoom: 19
        }
      ).addTo(map);
    } else {
      baseTileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19
        }
      ).addTo(map);
    }
  }, [mapLayerType]);

  // 3. Render Field Polygons
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(polygonLayersRef.current).forEach(layer => layer.remove());
    polygonLayersRef.current = {};

    currentFarm.fields.forEach(field => {
      if (!field.boundary || field.boundary.length < 3) return;
      if (editorMode === 'edit' && field.id === selectedFieldId) return;

      const latlngs: L.LatLngExpression[] = field.boundary.map(p => [p.lat, p.lng]);
      const color =
        field.status === 'Healthy'
          ? '#10B981'
          : field.status === 'At Risk'
          ? '#F59E0B'
          : field.status === 'Critical'
          ? '#EF4444'
          : '#3B82F6';

      const isCurrent = field.id === selectedFieldId;

      const polygon = L.polygon(latlngs, {
        color: isCurrent ? '#FFFFFF' : color,
        weight: isCurrent ? 4 : 2,
        fillColor: color,
        fillOpacity: isCurrent ? 0.45 : 0.25,
        dashArray: isCurrent ? '0' : '4, 4'
      }).addTo(map);

      polygon.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 170px;">
          <div style="font-size: 10px; font-weight: 800; color: ${color}; text-transform: uppercase;">
            ${field.status} • ${field.healthPercentage !== null ? `${field.healthPercentage}% Health` : 'Active'}
          </div>
          <h4 style="font-size: 14px; font-weight: 800; margin: 3px 0; color: #0F172A;">
            ${field.name}
          </h4>
          <p style="font-size: 11px; margin: 0 0 6px 0; color: #475569;">
            <strong>Crop:</strong> ${field.crop}<br />
            <strong>Area:</strong> ${field.areaAcres} acres
          </p>
          <button
            id="popup-select-${field.id}"
            style="background: #047857; color: white; border: none; border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: bold; cursor: pointer; width: 100%;"
          >
            Select & Inspect
          </button>
        </div>
      `);

      polygon.on('popupopen', () => {
        const btn = document.getElementById(`popup-select-${field.id}`);
        if (btn) {
          btn.onclick = () => {
            selectField(field.id);
            setSelectedFieldId(field.id);
            showToast('Field Selected', `${field.name} (${field.crop})`, 'info');
          };
        }
      });

      polygonLayersRef.current[field.id] = polygon;
    });
  }, [currentFarm.fields, editorMode, selectedFieldId, selectField, showToast]);

  // 4. Render Farmer GPS Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (farmerMarkerRef.current) {
      farmerMarkerRef.current.setLatLng([currentGps.lat, currentGps.lng]);
    } else {
      const customIcon = L.divIcon({
        className: 'custom-farmer-pin',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 20px; height: 20px; border-radius: 50%; background: #047857; border: 3px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #FFFFFF;"></div>
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([currentGps.lat, currentGps.lng], {
        icon: customIcon,
        draggable: true,
        title: 'Drag to test geofencing'
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCurrentGps({ lat: pos.lat, lng: pos.lng });
      });

      farmerMarkerRef.current = marker;
    }
  }, [currentGps, setCurrentGps]);

  // 5. Interactive Vertex Handles for Edit/Draw Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeDrawPolygonRef.current) {
      activeDrawPolygonRef.current.remove();
      activeDrawPolygonRef.current = null;
    }

    if (vertexMarkersGroupRef.current) {
      vertexMarkersGroupRef.current.clearLayers();
    }

    if (editorMode === 'view' || activePoints.length === 0) return;

    if (activePoints.length >= 3) {
      const poly = L.polygon(
        activePoints.map(p => [p.lat, p.lng]),
        {
          color: '#38BDF8',
          weight: 3,
          dashArray: '6, 6',
          fillColor: '#0284C7',
          fillOpacity: 0.35
        }
      ).addTo(map);
      activeDrawPolygonRef.current = poly;
    } else if (activePoints.length === 2) {
      const poly = L.polyline(
        activePoints.map(p => [p.lat, p.lng]),
        { color: '#38BDF8', weight: 3, dashArray: '4, 4' }
      ).addTo(map) as unknown as L.Polygon;
      activeDrawPolygonRef.current = poly;
    }

    activePoints.forEach((point, index) => {
      const isSelected = selectedVertexIndex === index;

      const vertexIcon = L.divIcon({
        className: `vertex-handle-${index}`,
        html: `
          <div style="
            width: ${isSelected ? '24px' : '18px'};
            height: ${isSelected ? '24px' : '18px'};
            background: ${isSelected ? '#EF4444' : '#0284C7'};
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 3px 8px rgba(0,0,0,0.45);
            cursor: grab;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 9px;
            font-weight: 800;
          ">
            ${index + 1}
          </div>
        `,
        iconSize: [isSelected ? 24 : 18, isSelected ? 24 : 18],
        iconAnchor: [isSelected ? 12 : 9, isSelected ? 12 : 9]
      });

      const vertexMarker = L.marker([point.lat, point.lng], {
        icon: vertexIcon,
        draggable: true
      }).addTo(vertexMarkersGroupRef.current!);

      vertexMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedVertexIndex(index);
      });

      vertexMarker.on('drag', () => {
        const newPos = vertexMarker.getLatLng();
        const updated = [...activePoints];
        updated[index] = { lat: newPos.lat, lng: newPos.lng };
        if (activeDrawPolygonRef.current) {
          activeDrawPolygonRef.current.setLatLngs(updated.map(p => [p.lat, p.lng]));
        }
      });

      vertexMarker.on('dragend', () => {
        const newPos = vertexMarker.getLatLng();
        const updated = [...activePoints];
        updated[index] = { lat: newPos.lat, lng: newPos.lng };
        pushHistory(updated);
        setSelectedVertexIndex(index);
      });
    });
  }, [activePoints, editorMode, selectedVertexIndex, pushHistory]);

  // Landmark Selection Handler
  const handleSelectLandmark = useCallback((landmark: MapLandmark) => {
    setActiveLandmark(landmark);
    setIsSearchOpen(false);

    const map = mapInstanceRef.current;
    if (!map) return;

    map.flyTo([landmark.lat, landmark.lng], Math.max(map.getZoom(), 17), { duration: 1.2 });

    if (landmarkMarkerRef.current) {
      landmarkMarkerRef.current.remove();
    }

    const landmarkIcon = L.divIcon({
      className: 'custom-landmark-pin',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(245, 158, 11, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 32px; height: 32px; border-radius: 50%; background: #D97706; border: 3px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold; cursor: pointer;">
            📍
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const marker = L.marker([landmark.lat, landmark.lng], { icon: landmarkIcon }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 170px;">
        <div style="font-size: 10px; font-weight: 800; color: #D97706; text-transform: uppercase;">
          ${landmark.category === 'coords' ? 'Exact Coordinates' : 'Landmark Location'}
        </div>
        <h4 style="font-size: 13px; font-weight: 800; margin: 2px 0; color: #0F172A;">
          ${landmark.name}
        </h4>
        <p style="font-size: 11px; margin: 0 0 6px 0; color: #475569;">
          ${landmark.address}<br />
          <strong style="color: #047857; font-family: monospace;">${landmark.lat.toFixed(5)}°, ${landmark.lng.toFixed(5)}°</strong>
        </p>
      </div>
    `);

    landmarkMarkerRef.current = marker;
  }, []);

  const handleClearLandmark = () => {
    setActiveLandmark(null);
    if (landmarkMarkerRef.current) {
      landmarkMarkerRef.current.remove();
      landmarkMarkerRef.current = null;
    }
  };

  const handleCopyCoords = (lat: number, lng: number) => {
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setHasCopiedCoords(true);
    showToast('Coordinates Copied', `${text} copied to clipboard`, 'success');
    setTimeout(() => setHasCopiedCoords(false), 2500);
  };

  const handleStartFieldAtLandmark = (landmark: MapLandmark) => {
    const center: LatLng = { lat: landmark.lat, lng: landmark.lng };
    const delta = 0.0006;
    const defaultBoundary: LatLng[] = [
      { lat: center.lat + delta, lng: center.lng - delta },
      { lat: center.lat + delta, lng: center.lng + delta },
      { lat: center.lat - delta, lng: center.lng + delta },
      { lat: center.lat - delta, lng: center.lng - delta }
    ];

    const cleanName = landmark.name.replace(/^GPS Point:\s*/i, '').slice(0, 16);
    const created = addField(currentFarm.id, {
      name: `${cleanName || 'New'} Plot`,
      crop: 'Mango',
      areaAcres: 1.0,
      plantingDate: new Date().toISOString().split('T')[0],
      healthPercentage: 92,
      healthBreakdown: { healthy: 92, atRisk: 8, critical: 0 },
      status: 'Healthy',
      center,
      boundary: defaultBoundary
    });

    handleClearLandmark();
    setSelectedFieldId(created.id);
    selectField(created.id);
    handleStartEdit(created);
    showToast('Field Initialized', `Created parcel "${created.name}". Drag vertices to match exact parcel boundary.`, 'success');
  };

  const handleSetGpsAtLandmark = (landmark: MapLandmark) => {
    setCurrentGps({ lat: landmark.lat, lng: landmark.lng });
    showToast('GPS Telemetry Updated', `Farmer location set to ${landmark.name} (${landmark.lat.toFixed(5)}, ${landmark.lng.toFixed(5)})`, 'info');
  };

  // Real Hardware/Device GPS Location Detection with Leaflet Auto-Centering
  const handleLocateDevice = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('GPS Unsupported', 'Geolocation hardware is not supported by your browser.', 'error');
      setGpsErrorMessage('Your browser does not support GPS location.');
      return;
    }

    setIsLocatingDevice(true);
    setGpsErrorMessage(null);
    showToast('Acquiring GPS Position...', 'Connecting to device hardware sensors...', 'info');

    const onLocationSuccess = async (pos: GeolocationPosition) => {
      setIsLocatingDevice(false);
      const { latitude, longitude, accuracy, altitude, speed, heading } = pos.coords;

      const coords: LatLng = { lat: latitude, lng: longitude };
      setCurrentGps(coords);

      // Check if inside any existing field
      const containingField = findContainingField(coords, currentFarm.fields);
      if (containingField) {
        selectField(containingField.id);
        setSelectedFieldId(containingField.id);
      }

      // Smoothly fly Leaflet map to device coordinates
      const map = mapInstanceRef.current;
      if (map) {
        map.flyTo([latitude, longitude], 18, {
          duration: 1.4,
          easeLinearity: 0.25
        });

        // Update or draw accuracy circle
        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.remove();
        }
        const circle = L.circle([latitude, longitude], {
          radius: Math.max(accuracy, 8),
          color: '#059669', // emerald-600
          weight: 1.5,
          fillColor: '#10B981',
          fillOpacity: 0.16,
          dashArray: '4, 4'
        }).addTo(map);

        circle.bindTooltip(`Device GPS Accuracy: ±${Math.round(accuracy)}m`, {
          permanent: false,
          direction: 'top'
        });

        accuracyCircleRef.current = circle;
      }

      const info = {
        lat: latitude,
        lng: longitude,
        accuracy: Math.round(accuracy),
        altitude: altitude ? Math.round(altitude) : null,
        speed: speed !== null ? Math.round(speed * 3.6) : null,
        heading: heading ? Math.round(heading) : null,
        timestamp: pos.timestamp,
        containingFieldName: containingField ? containingField.name : null,
        address: `Locating address (${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E)...`
      };
      setDeviceGpsInfo(info);

      showToast(
        'Device Located',
        `GPS locked (±${Math.round(accuracy)}m accuracy)${containingField ? ` inside ${containingField.name}` : ''}`,
        'success'
      );

      // Reverse geocode device position asynchronously
      try {
        const geo = await reverseGeocodePoint(latitude, longitude);
        setDeviceGpsInfo(prev => (prev ? { ...prev, address: geo.address } : null));
      } catch {
        setDeviceGpsInfo(prev =>
          prev ? { ...prev, address: `${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E` } : null
        );
      }
    };

    const onLocationError = (err: GeolocationPositionError) => {
      setIsLocatingDevice(false);
      let msg = 'Failed to retrieve hardware GPS location.';
      if (err.code === 1) {
        msg = 'Location permission denied. Please allow location access in your browser bar.';
      } else if (err.code === 2) {
        msg = 'Position unavailable. Check your device GPS/WiFi positioning settings.';
      } else if (err.code === 3) {
        msg = 'GPS request timed out. Retrying with network location fallback...';
        navigator.geolocation.getCurrentPosition(
          onLocationSuccess,
          () => {
            setIsLocatingDevice(false);
            setGpsErrorMessage('GPS request timed out. Please check your signal and permissions.');
            showToast('GPS Timeout', 'Could not lock GPS position. Try again in an open area.', 'error');
          },
          { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
        );
        return;
      }
      setGpsErrorMessage(msg);
      showToast('GPS Error', msg, 'error');
    };

    navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    });
  }, [currentFarm.fields, selectField, setCurrentGps, showToast]);

  // Live Walk Tracking Mode (auto-follows farmer as they walk perimeter)
  const handleToggleLiveTracking = useCallback(() => {
    if (isLiveTracking) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsLiveTracking(false);
      showToast('Live Tracking Paused', 'Real-time GPS following disabled.', 'info');
    } else {
      if (!navigator.geolocation) {
        showToast('GPS Unsupported', 'Browser does not support geolocation.', 'error');
        return;
      }

      setIsLiveTracking(true);
      showToast('Live Walk GPS Active', 'Following device location in real time as you walk...', 'success');

      // Center immediately on start
      handleLocateDevice();

      const id = navigator.geolocation.watchPosition(
        pos => {
          const { latitude, longitude, accuracy } = pos.coords;
          const coords = { lat: latitude, lng: longitude };
          setCurrentGps(coords);

          const map = mapInstanceRef.current;
          if (map) {
            map.panTo([latitude, longitude], { animate: true, duration: 0.8 });
            if (accuracyCircleRef.current) {
              accuracyCircleRef.current.setLatLng([latitude, longitude]);
              accuracyCircleRef.current.setRadius(Math.max(accuracy, 8));
            }
          }

          setDeviceGpsInfo(prev =>
            prev
              ? {
                  ...prev,
                  lat: latitude,
                  lng: longitude,
                  accuracy: Math.round(accuracy),
                  timestamp: pos.timestamp
                }
              : null
          );
        },
        () => {
          setIsLiveTracking(false);
          showToast('Tracking Lost', 'Lost GPS hardware connection.', 'warning');
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 15000
        }
      );
      watchIdRef.current = id;
    }
  }, [isLiveTracking, handleLocateDevice, setCurrentGps, showToast]);

  // Start creating parcel around current physical device location
  const handleStartFieldAtDevice = (info: { lat: number; lng: number }) => {
    const center: LatLng = { lat: info.lat, lng: info.lng };
    const delta = 0.0006;
    const defaultBoundary: LatLng[] = [
      { lat: center.lat + delta, lng: center.lng - delta },
      { lat: center.lat + delta, lng: center.lng + delta },
      { lat: center.lat - delta, lng: center.lng + delta },
      { lat: center.lat - delta, lng: center.lng - delta }
    ];

    const created = addField(currentFarm.id, {
      name: 'My New Plot',
      crop: 'Mango',
      areaAcres: 1.0,
      plantingDate: new Date().toISOString().split('T')[0],
      healthPercentage: 90,
      healthBreakdown: { healthy: 90, atRisk: 10, critical: 0 },
      status: 'Healthy',
      center,
      boundary: defaultBoundary
    });

    setSelectedFieldId(created.id);
    selectField(created.id);
    handleStartEdit(created);
    showToast('Field Created at GPS', `New parcel centered at your device. Adjust perimeter handles to fit boundary.`, 'success');
  };

  // Debounced search for places, landmarks, fields, and coordinates
  useEffect(() => {
    if (!searchQuery.trim()) {
      searchPlacesAndLandmarks('', currentFarm.center, currentFarm.fields).then(res => {
        setSearchResults(res.slice(0, 6));
      });
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      searchPlacesAndLandmarks(searchQuery, currentFarm.center, currentFarm.fields)
        .then(res => {
          setSearchResults(res);
          setIsSearching(false);
        })
        .catch(() => {
          setIsSearching(false);
        });
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, currentFarm]);

  // 6. Map Click in Draw Mode or View Mode (Click to Inspect)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      if (editorMode === 'draw') {
        const newPt: LatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
        pushHistory([...activePoints, newPt]);
        return;
      }

      if (editorMode === 'view') {
        const pointLat = e.latlng.lat;
        const pointLng = e.latlng.lng;
        const tempLandmark: MapLandmark = {
          id: `pt-${Date.now()}`,
          name: `${pointLat.toFixed(5)}, ${pointLng.toFixed(5)}`,
          category: 'coords',
          address: `Inspecting point... (${pointLat.toFixed(5)}° N, ${pointLng.toFixed(5)}° E)`,
          lat: pointLat,
          lng: pointLng,
          distanceKm: calculateDistanceKm(currentFarm.center.lat, currentFarm.center.lng, pointLat, pointLng)
        };
        handleSelectLandmark(tempLandmark);

        try {
          const detailed = await reverseGeocodePoint(pointLat, pointLng);
          detailed.distanceKm = tempLandmark.distanceKm;
          setActiveLandmark(detailed);
        } catch {
          // Keep tempLandmark
        }
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [editorMode, activePoints, pushHistory, handleSelectLandmark, currentFarm]);

  // Start Edit Boundary
  const handleStartEdit = (field: Field) => {
    if (!field.boundary || field.boundary.length === 0) {
      showToast('No Existing Points', `Switching to Draw mode to create boundary for ${field.name}.`, 'info');
      handleStartDraw(field.id);
      return;
    }
    setSelectedFieldId(field.id);
    setActivePoints(field.boundary);
    setHistory([field.boundary]);
    setHistoryIndex(0);
    setSelectedVertexIndex(null);
    setEditorMode('edit');
    setHasUnsavedChanges(false);

    if (mapInstanceRef.current && field.center) {
      mapInstanceRef.current.flyTo([field.center.lat, field.center.lng], 18);
    }
  };

  // Start Drawing Boundary
  const handleStartDraw = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setActivePoints([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setSelectedVertexIndex(null);
    setEditorMode('draw');
    setHasUnsavedChanges(false);
    showToast('Draw Mode Active', 'Click directly on the map to place boundary corner vertices.', 'info');
  };

  // Add Vertex Midpoint
  const handleAddPointBetween = () => {
    if (activePoints.length < 2) {
      showToast('Click Map', 'Click anywhere on the map to add vertices.', 'info');
      return;
    }
    const baseIndex = selectedVertexIndex !== null ? selectedVertexIndex : activePoints.length - 1;
    const nextIndex = (baseIndex + 1) % activePoints.length;

    const p1 = activePoints[baseIndex];
    const p2 = activePoints[nextIndex];

    const midPoint: LatLng = {
      lat: (p1.lat + p2.lat) / 2,
      lng: (p1.lng + p2.lng) / 2
    };

    const updated = [...activePoints];
    updated.splice(baseIndex + 1, 0, midPoint);
    pushHistory(updated);
    setSelectedVertexIndex(baseIndex + 1);
    showToast('Point Added', `Added vertex between #${baseIndex + 1} and #${nextIndex + 1}. Drag to adjust.`, 'success');
  };

  // Delete Vertex
  const handleDeleteSelectedPoint = () => {
    if (selectedVertexIndex === null) return;
    if (activePoints.length <= 3) {
      showToast('Minimum 3 Points', 'A polygon boundary requires at least 3 vertices.', 'warning');
      return;
    }

    const updated = activePoints.filter((_, idx) => idx !== selectedVertexIndex);
    pushHistory(updated);
    setSelectedVertexIndex(null);
    showToast('Point Deleted', `Vertex removed.`, 'info');
  };

  // Save Boundary
  const handleSaveBoundary = () => {
    if (activePoints.length < 3) {
      showToast('Incomplete Polygon', 'Please place at least 3 points to enclose a parcel.', 'warning');
      return;
    }

    updateFieldBoundary(selectedFieldId, activePoints);
    setEditorMode('view');
    setHasUnsavedChanges(false);
    showToast('Boundary Saved', `${activeField?.name}: ${formatArea(calculatedAcres)} geofence updated.`, 'success');
  };

  // Cancel Editing
  const handleCancel = () => {
    setEditorMode('view');
    setActivePoints([]);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedVertexIndex(null);
    setHasUnsavedChanges(false);
  };

  // FlyTo field
  const handleFlyToField = (field: Field) => {
    selectField(field.id);
    setSelectedFieldId(field.id);
    if (mapInstanceRef.current && field.center) {
      mapInstanceRef.current.flyTo([field.center.lat, field.center.lng], 18);
    }
  };

  // Add New Field Submission
  const handleCreateFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    const centerPoint = currentGps || currentFarm.center;

    const created = addField(currentFarm.id, {
      name: newFieldName.trim(),
      crop: newFieldCrop,
      areaAcres: 0,
      plantingDate: new Date().toISOString().split('T')[0],
      healthPercentage: null,
      healthBreakdown: null,
      status: 'Unanalyzed',
      boundary: [],
      center: centerPoint
    });

    setIsAddFieldModalOpen(false);
    setNewFieldName('');
    setSelectedFieldId(created.id);
    selectField(created.id);
    handleStartDraw(created.id);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-slate-900">
      {/* 1. TOP DOCKED COMMAND BAR - Always Visible, Zero Document Scrolling */}
      <div className="shrink-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Parcel Switcher & Status */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 bg-forest-50 border border-forest-200/80 px-2.5 py-1.5 rounded-xl shrink-0">
            <MapPin className="w-4 h-4 text-forest-700" />
            <span className="text-xs font-black text-forest-900 hidden sm:inline">Parcel:</span>
          </div>

          <div className="relative shrink-0">
            <select
              value={selectedFieldId}
              onChange={e => {
                const target = currentFarm.fields.find(f => f.id === e.target.value);
                if (target) handleFlyToField(target);
              }}
              className="text-xs font-bold pl-2.5 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-500 shadow-xs cursor-pointer appearance-none"
            >
              {currentFarm.fields.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.crop} • {f.areaAcres} ac)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <span
              className={`w-2 h-2 rounded-full ${
                activeField?.status === 'Healthy'
                  ? 'bg-emerald-500'
                  : activeField?.status === 'At Risk'
                  ? 'bg-amber-500'
                  : activeField?.status === 'Critical'
                  ? 'bg-rose-500'
                  : 'bg-blue-500'
              }`}
            />
            {activeField?.status || 'Active'}
          </span>
        </div>

        {/* Center/Action CTA Buttons - Prominent, High-Contrast */}
        <div className="flex items-center gap-2">
          {editorMode === 'view' ? (
            <>
              {/* PRIMARY CTA: Edit Boundary */}
              {activeField && activeField.boundary && activeField.boundary.length >= 3 ? (
                <button
                  onClick={() => handleStartEdit(activeField)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-black shadow-sm transition-all hover:scale-[1.02]"
                  title="Modify vertex points for this parcel"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Boundary</span>
                </button>
              ) : (
                <button
                  onClick={() => activeField && handleStartDraw(activeField.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-black shadow-sm transition-all hover:scale-[1.02]"
                  title="Draw perimeter boundary for this field"
                >
                  <Plus className="w-4 h-4" />
                  <span>Draw Boundary</span>
                </button>
              )}

              {/* SECONDARY CTA: + Add Field */}
              <button
                onClick={() => setIsAddFieldModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-200 text-xs font-bold transition-colors"
                title="Register a new field on this farm"
              >
                <Plus className="w-3.5 h-3.5 text-forest-700" />
                <span>+ Add Field</span>
              </button>
            </>
          ) : (
            /* Editing State Indicator Pill */
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold animate-pulse">
              <Crosshair className="w-3.5 h-3.5 text-blue-600" />
              <span>{editorMode === 'edit' ? 'Editing Boundary' : 'Drawing New Boundary'}</span>
            </div>
          )}
        </div>

        {/* Right Utility Toggles: Map Layer, Units, Locate Me */}
        <div className="flex items-center gap-2">
          {/* Satellite vs Streets Toggle (Zero Watermark) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-600">
            <button
              onClick={() => setMapLayerType('satellite')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapLayerType === 'satellite'
                  ? 'bg-white text-forest-800 shadow-xs font-black'
                  : 'hover:text-slate-900'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapLayerType('streets')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapLayerType === 'streets'
                  ? 'bg-white text-forest-800 shadow-xs font-black'
                  : 'hover:text-slate-900'
              }`}
            >
              Street
            </button>
          </div>

          {/* Area Units */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600">
            <button
              onClick={() => setAreaUnit('acres')}
              className={`px-2 py-1 rounded-lg transition-all ${
                areaUnit === 'acres' ? 'bg-white text-slate-900 font-bold shadow-xs' : ''
              }`}
            >
              Acres
            </button>
            <button
              onClick={() => setAreaUnit('hectares')}
              className={`px-2 py-1 rounded-lg transition-all ${
                areaUnit === 'hectares' ? 'bg-white text-slate-900 font-bold shadow-xs' : ''
              }`}
            >
              Ha
            </button>
          </div>

          {/* Real-device GPS Locate Button */}
          <button
            onClick={() => handleLocateDevice()}
            disabled={isLocatingDevice}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border shadow-xs transition-all ${
              isLocatingDevice
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400'
                : deviceGpsInfo
                ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Auto-detect current device location using real GPS"
          >
            {isLocatingDevice ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
            ) : (
              <Crosshair className={`w-3.5 h-3.5 ${deviceGpsInfo ? 'text-white' : 'text-emerald-700'}`} />
            )}
            <span className="hidden md:inline">
              {isLocatingDevice ? 'Locating...' : deviceGpsInfo ? 'Device GPS' : 'Find My Location'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. FLOATING EDITING COMMAND DOCK - Appears at Top-Center When in Edit/Draw Mode */}
      {editorMode !== 'view' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
            {/* Live Stats */}
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-sky-400">
                {activePoints.length} Vertices
              </span>
              <span className="text-slate-500">•</span>
              <span className="font-bold text-emerald-400">
                {formatArea(calculatedAcres)}
              </span>
              {hasUnsavedChanges && (
                <span className="hidden sm:inline-block text-[10px] text-amber-300 font-semibold bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/40">
                  Unsaved
                </span>
              )}
            </div>

            {/* In-Editor Controls */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Undo / Redo */}
              <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30"
                  title="Undo point adjustment"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30"
                  title="Redo point adjustment"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>

              {/* Add Point */}
              <button
                onClick={handleAddPointBetween}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors"
                title="Insert a midpoint vertex between selected point"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Point</span>
              </button>

              {/* Add Vertex at Current Physical Device GPS */}
              <button
                onClick={() => {
                  if (deviceGpsInfo) {
                    pushHistory([...activePoints, { lat: deviceGpsInfo.lat, lng: deviceGpsInfo.lng }]);
                    showToast('Corner Added', `Added vertex at current GPS coordinates.`, 'success');
                  } else {
                    handleLocateDevice();
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors"
                title="Stamp vertex at current physical device GPS location"
              >
                <Crosshair className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden sm:inline">Add GPS Point</span>
              </button>

              {/* Delete Point (When a vertex is clicked) */}
              {selectedVertexIndex !== null && (
                <button
                  onClick={handleDeleteSelectedPoint}
                  disabled={activePoints.length <= 3}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-40"
                  title="Remove selected vertex"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Point #{selectedVertexIndex + 1}</span>
                </button>
              )}

              {/* Save Boundary Button */}
              <button
                onClick={handleSaveBoundary}
                disabled={activePoints.length < 3}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs shadow-md transition-all disabled:opacity-40"
              >
                <Check className="w-4 h-4" />
                <span>SAVE</span>
              </button>

              {/* Cancel Button */}
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. FULL MAP CANVAS - Fills Viewport */}
      <div className="flex-1 w-full h-full relative min-h-0">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* FLOATING LANDMARK & PLACE SEARCH BAR (In View Mode) */}
        {editorMode === 'view' && (
          <div className="absolute top-3 left-3 z-30 w-[92%] sm:w-[380px] md:w-[440px] pointer-events-auto">
            <div className="relative">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl flex items-center px-3.5 py-2.5 gap-2.5 transition-all focus-within:ring-2 focus-within:ring-forest-500 focus-within:border-forest-500">
                <Search className="w-4 h-4 text-forest-700 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search place, landmark, or lat, lng..."
                  className="flex-1 bg-transparent text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />

                {isSearching && <Loader2 className="w-4 h-4 text-forest-600 animate-spin shrink-0" />}

                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {isSearchOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white/98 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-40 animate-in fade-in duration-150 divide-y divide-slate-100">
                  <div className="p-2 bg-slate-50/80 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>
                      {searchQuery.trim() ? 'Matching Locations & Landmarks' : 'Nearby Agro Landmarks & Parcels'}
                    </span>
                    <button
                      onClick={() => setIsSearchOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-[10px] font-semibold"
                    >
                      Close
                    </button>
                  </div>

                  {searchResults.length > 0 ? (
                    searchResults.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectLandmark(item)}
                        className="w-full text-left p-3 hover:bg-forest-50/80 transition-colors flex items-start gap-2.5 group"
                      >
                        <div className="mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 group-hover:bg-forest-100 text-slate-600 group-hover:text-forest-700 transition-colors">
                          {item.category === 'coords' ? (
                            <Compass className="w-4 h-4 text-emerald-600" />
                          ) : item.isField ? (
                            <Crop className="w-4 h-4 text-forest-700" />
                          ) : item.category === 'market' ? (
                            <Building2 className="w-4 h-4 text-amber-600" />
                          ) : item.category === 'water' ? (
                            <span className="text-xs">💧</span>
                          ) : (
                            <Landmark className="w-4 h-4 text-amber-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h5 className="font-bold text-slate-900 text-xs truncate group-hover:text-forest-900">
                              {item.name}
                            </h5>
                            {item.distanceKm !== undefined && (
                              <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                                {item.distanceKm} km
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {item.address}
                          </p>

                          <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                              {item.lat.toFixed(5)}°, {item.lng.toFixed(5)}°
                            </span>
                            {item.category === 'coords' && (
                              <span className="text-emerald-700 font-bold">Direct GPS</span>
                            )}
                            {item.isField && (
                              <span className="text-forest-700 font-bold">Farm Parcel</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      {isSearching ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 text-forest-600 animate-spin" />
                          <span>Searching geographic database...</span>
                        </div>
                      ) : (
                        <p>No matching place or coordinates found. Try typing coordinates like <code>13.298, 77.535</code>.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active Landmark / Inspected Location Card */}
            {activeLandmark && (
              <div className="mt-2 bg-white/95 backdrop-blur-md rounded-2xl border border-amber-200/80 shadow-2xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      {activeLandmark.category === 'coords' ? (
                        <Compass className="w-4 h-4 text-amber-700" />
                      ) : (
                        <Landmark className="w-4 h-4 text-amber-700" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                          {activeLandmark.category === 'coords' ? 'GPS Coordinates' : 'Selected Landmark'}
                        </span>
                        {activeLandmark.distanceKm !== undefined && (
                          <span className="text-[10px] text-slate-400">
                            • {activeLandmark.distanceKm} km from farm
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-sm truncate mt-0.5">
                        {activeLandmark.name}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={handleClearLandmark}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0"
                    title="Dismiss landmark pin"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {activeLandmark.address}
                </p>

                {/* Geodetic Coordinates Box */}
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Geodetic Position:</span>
                    <span className="font-bold text-slate-800">
                      {activeLandmark.lat.toFixed(6)}° N, {activeLandmark.lng.toFixed(6)}° E
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCoords(activeLandmark.lat, activeLandmark.lng)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-sans font-semibold text-slate-700 transition-colors shadow-2xs"
                    title="Copy latitude and longitude"
                  >
                    {hasCopiedCoords ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Actions: Start Field Boundary Here or Set As GPS */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleStartFieldAtLandmark(activeLandmark)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                    title="Create a new parcel centered at this location and start editing boundary"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Map Field Here</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetGpsAtLandmark(activeLandmark)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
                    title="Teleport simulated farmer position to this coordinate"
                  >
                    <Navigation className="w-3.5 h-3.5 text-forest-700" />
                    <span>Set GPS Position</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FLOATING HUD: Live Geofence Telemetry (Collapsible - Top Right) */}
        {editorMode === 'view' && (
          <div className="absolute top-3 right-3 z-20 max-w-xs sm:max-w-sm pointer-events-auto transition-all">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
              <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  GPS Geofence Status
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                  <button
                    onClick={() => setIsHudCollapsed(!isHudCollapsed)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                    title={isHudCollapsed ? 'Expand HUD' : 'Collapse HUD'}
                  >
                    {isHudCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {!isHudCollapsed && (
                <div className="p-3.5 space-y-2.5">
                  {currentField ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-950">
                      <p className="text-xs font-black">Inside {currentField.name}</p>
                      <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                        {currentField.crop} • {formatArea(currentField.areaAcres)}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-950">
                      <p className="text-xs font-black">Outside Defined Parcel Boundaries</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Farmer pin is not inside registered parcel coordinates.
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 flex items-center justify-between font-mono pt-1 border-t border-slate-100">
                    <span>Coordinates:</span>
                    <span className="font-bold text-slate-800">
                      {currentGps.lat.toFixed(4)}° N, {currentGps.lng.toFixed(4)}° E
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FLOATING VERTEX INSPECTOR (When a Point is Selected in Edit Mode) */}
        {selectedVertexIndex !== null && activePoints[selectedVertexIndex] && (
          <div className="absolute top-3 right-3 z-20 max-w-xs pointer-events-auto">
            <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 border border-slate-700 shadow-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-sky-400">
                  Vertex Point #{selectedVertexIndex + 1}
                </span>
                <button
                  onClick={() => setSelectedVertexIndex(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="font-mono text-[11px] text-slate-300 bg-slate-800/80 p-2 rounded-xl space-y-0.5">
                <div>Lat: {activePoints[selectedVertexIndex].lat.toFixed(6)}°</div>
                <div>Lng: {activePoints[selectedVertexIndex].lng.toFixed(6)}°</div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                Drag point handle directly on map to reshape field perimeter.
              </p>

              <button
                onClick={handleDeleteSelectedPoint}
                disabled={activePoints.length <= 3}
                className="w-full py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Point</span>
              </button>
            </div>
          </div>
        )}

        {/* FLOATING DEVICE LOCATION INSPECTOR CARD (When Device GPS is locked & in View Mode) */}
        {deviceGpsInfo && editorMode === 'view' && !activeLandmark && (
          <div className="absolute top-16 right-3 z-25 max-w-xs sm:max-w-sm w-[92%] pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-emerald-300 shadow-2xl p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Crosshair className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                        Device GPS Locked
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        ±{deviceGpsInfo.accuracy}m
                      </span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-xs truncate mt-0.5">
                      {deviceGpsInfo.containingFieldName
                        ? `Inside ${deviceGpsInfo.containingFieldName}`
                        : 'Current Physical Location'}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => setDeviceGpsInfo(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0"
                  title="Dismiss location card"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {deviceGpsInfo.address || 'Locating address...'}
              </p>

              {/* Coordinates Box */}
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Hardware Coordinates:</span>
                  <span className="font-bold text-slate-800">
                    {deviceGpsInfo.lat.toFixed(6)}° N, {deviceGpsInfo.lng.toFixed(6)}° E
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCoords(deviceGpsInfo.lat, deviceGpsInfo.lng)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-sans font-semibold text-slate-700 transition-colors shadow-2xs"
                  title="Copy coordinates"
                >
                  {hasCopiedCoords ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleStartFieldAtDevice(deviceGpsInfo)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
                  title="Create a new parcel starting at your physical location"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Map Field Here</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([deviceGpsInfo.lat, deviceGpsInfo.lng], 18, {
                        duration: 1.2
                      });
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
                  title="Re-center map on device position"
                >
                  <Navigation className="w-3.5 h-3.5 text-forest-700" />
                  <span>Re-Center</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GPS ERROR TOAST / BANNER */}
        {gpsErrorMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-35 max-w-md w-[90%] pointer-events-auto animate-in fade-in slide-in-from-top-2">
            <div className="bg-rose-50 border border-rose-200 text-rose-900 px-3.5 py-2 rounded-2xl shadow-xl flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold">{gpsErrorMessage}</span>
              <button
                onClick={() => setGpsErrorMessage(null)}
                className="p-1 rounded-lg text-rose-500 hover:text-rose-800 hover:bg-rose-100 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* FLOATING CANVAS LOCATION ACTION BUTTON (Bottom Right - Above Quick Focus) */}
        <div className="absolute bottom-20 right-3.5 z-30 flex flex-col items-end gap-2.5 pointer-events-auto">
          {/* Live Walking Tracking Indicator */}
          {isLiveTracking && (
            <div className="bg-slate-900/90 text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-500/50 shadow-xl flex items-center gap-2 backdrop-blur-md animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Live Walk GPS Active</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Live Walk Follow Toggle */}
            <button
              onClick={handleToggleLiveTracking}
              className={`h-11 px-3 rounded-2xl backdrop-blur-md shadow-xl border text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 ${
                isLiveTracking
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
                  : 'bg-white/95 text-slate-700 hover:text-emerald-700 border-slate-200/90 hover:bg-slate-50'
              }`}
              title={isLiveTracking ? 'Pause live walk GPS following' : 'Auto-follow my physical device movement as I walk the farm'}
            >
              <Navigation className={`w-4 h-4 ${isLiveTracking ? 'text-white' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{isLiveTracking ? 'Tracking Live' : 'Walk Follow'}</span>
            </button>

            {/* Dedicated Primary Device GPS Locate Button */}
            <button
              onClick={() => handleLocateDevice()}
              disabled={isLocatingDevice}
              className={`w-12 h-12 rounded-2xl backdrop-blur-md shadow-2xl border transition-all flex items-center justify-center group active:scale-95 ${
                isLocatingDevice
                  ? 'bg-emerald-50 border-emerald-400 ring-4 ring-emerald-300/40 text-emerald-700'
                  : deviceGpsInfo
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30 hover:bg-emerald-700'
                  : 'bg-white/95 hover:bg-white text-slate-700 hover:text-emerald-700 border-slate-200/90 hover:shadow-2xl'
              }`}
              title="Find Current Device Location (Auto-center Leaflet GPS on My Device)"
            >
              {isLocatingDevice ? (
                <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
              ) : (
                <Crosshair
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    deviceGpsInfo ? 'text-white' : 'text-emerald-700'
                  }`}
                />
              )}
            </button>
          </div>
        </div>

        {/* FLOATING BOTTOM BAR: Quick Field Selector Pills */}
        <div className="absolute bottom-3 left-3 right-14 z-20 pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-2 border border-slate-200 shadow-lg flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-black uppercase text-slate-400 px-2 shrink-0">
              Quick Focus:
            </span>
            {currentFarm.fields.map(f => {
              const isCurrent = f.id === selectedFieldId;
              return (
                <button
                  key={f.id}
                  onClick={() => handleFlyToField(f)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-forest-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      f.status === 'Healthy'
                        ? 'bg-emerald-400'
                        : f.status === 'At Risk'
                        ? 'bg-amber-400'
                        : f.status === 'Critical'
                        ? 'bg-rose-400'
                        : 'bg-blue-400'
                    }`}
                  />
                  <span>{f.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. MODAL: REGISTER NEW FIELD & DRAW BOUNDARY */}
      {isAddFieldModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Create New Parcel</h3>
              </div>
              <button
                onClick={() => setIsAddFieldModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFieldSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Field / Parcel Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Guava Block"
                  value={newFieldName}
                  onChange={e => setNewFieldName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Crop
                </label>
                <select
                  value={newFieldCrop}
                  onChange={e => setNewFieldCrop(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                >
                  <option value="Mango">Mango</option>
                  <option value="Guava">Guava</option>
                  <option value="Pomegranate">Pomegranate</option>
                  <option value="Sapota">Sapota</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Maize">Maize</option>
                  <option value="Coconut">Coconut</option>
                  <option value="Arecanut">Arecanut</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFieldModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start Drawing Boundary</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
