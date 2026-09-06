import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  Edit3,
  Check,
  RotateCcw,
  Navigation,
  Sparkles,
  Info,
  ShieldAlert,
  Eye
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { LatLng } from '../types/agro';
import { calculatePolygonAreaAcres } from '../services/geofence';

export const MapPage: React.FC = () => {
  const {
    currentFarm,
    currentField,
    currentGps,
    setCurrentGps,
    updateFieldBoundary,
    observations,
    problems,
    showToast
  } = useFarm();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const farmerMarkerRef = useRef<L.Marker | null>(null);
  const polygonLayersRef = useRef<Record<string, L.Polygon>>({});
  const drawLayerRef = useRef<L.LayerGroup | null>(null);

  // Drawing state
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [selectedFieldForEdit, setSelectedFieldForEdit] = useState<string>(
    currentFarm.fields[0]?.id || ''
  );
  const [drawnPoints, setDrawnPoints] = useState<LatLng[]>([]);
  const [activeLayerType, setActiveLayerType] = useState<'street' | 'satellite'>('satellite');

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center on current farm
    const map = L.map(mapContainerRef.current, {
      center: [currentFarm.center.lat, currentFarm.center.lng],
      zoom: 17,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // CartoDB / OSM tiles
    const tileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
      }
    ).addTo(map);

    // Layer for drawing new boundary
    const drawGroup = L.layerGroup().addTo(map);
    drawLayerRef.current = drawGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [currentFarm]);

  // Render Fields Polygons on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old field polygons
    Object.values(polygonLayersRef.current).forEach(layer => layer.remove());
    polygonLayersRef.current = {};

    currentFarm.fields.forEach(field => {
      const latlngs: L.LatLngExpression[] = field.boundary.map(p => [p.lat, p.lng]);

      const color =
        field.status === 'Healthy'
          ? '#10B981'
          : field.status === 'At Risk'
          ? '#F59E0B'
          : '#EF4444';

      const polygon = L.polygon(latlngs, {
        color: color,
        weight: 3,
        fillColor: color,
        fillOpacity: 0.25,
        dashArray: field.id === currentField?.id ? '0' : '4, 4'
      }).addTo(map);

      // Popup
      polygon.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 4px;">
          <div style="font-size: 11px; font-weight: 800; color: ${color}; text-transform: uppercase;">
            ${field.status} • ${field.healthPercentage}% Health
          </div>
          <h4 style="font-size: 15px; font-weight: 800; margin: 4px 0 2px 0; color: #0F172A;">
            ${field.name}
          </h4>
          <p style="font-size: 12px; margin: 0; color: #475569;">
            <strong>Crop:</strong> ${field.crop}<br />
            <strong>Area:</strong> ${field.areaAcres} Acres<br />
            <strong>Planted:</strong> ${field.plantingDate}
          </p>
        </div>
      `, { className: 'custom-farm-popup' });

      polygonLayersRef.current[field.id] = polygon;
    });
  }, [currentFarm, currentField]);

  // Render Farmer GPS marker with interactive dragging
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (farmerMarkerRef.current) {
      farmerMarkerRef.current.setLatLng([currentGps.lat, currentGps.lng]);
    } else {
      // Create custom SVG farmer icon
      const customIcon = L.divIcon({
        className: 'custom-farmer-pin',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(16, 185, 129, 0.35); animation: agro-pulse 2s infinite;"></div>
            <div style="width: 22px; height: 22px; border-radius: 50%; background: #047857; border: 3px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              <div style="width: 6px; height: 6px; border-radius: 50%; background: #FFFFFF;"></div>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([currentGps.lat, currentGps.lng], {
        icon: customIcon,
        draggable: true,
        title: 'Drag me to test geo-fencing!'
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; font-size: 12px; font-weight: 700; color: #047857;">
          🌾 Ravi Kumar (AgroVision Smart Glasses Active)<br/>
          <span style="font-size: 10px; color: #64748B; font-weight: normal;">
            Drag this pin anywhere to test real-time geo-fence boundary detection!
          </span>
        </div>
      `);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCurrentGps({ lat: pos.lat, lng: pos.lng });
      });

      farmerMarkerRef.current = marker;
    }
  }, [currentGps, setCurrentGps]);

  // Render Observation & Problem markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const markersGroup = L.layerGroup().addTo(map);

    observations.forEach(obs => {
      if (!obs.location) return;
      const obsIcon = L.divIcon({
        className: 'obs-pin',
        html: `
          <div style="background: #D97706; color: white; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
            👁
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const m = L.marker([obs.location.lat, obs.location.lng], { icon: obsIcon }).addTo(markersGroup);
      m.bindPopup(`
        <div style="font-family: Inter, sans-serif; font-size: 12px;">
          <strong style="color: #B45309;">Observation (${obs.crop})</strong><br/>
          <strong>${obs.title}</strong><br/>
          <span style="color: #64748B; font-size: 11px;">${obs.timestamp}</span>
        </div>
      `);
    });

    return () => {
      markersGroup.remove();
    };
  }, [observations]);

  // Click on map to add points during Boundary Drawing Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!isDrawingMode) return;
      const newPt: LatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
      setDrawnPoints(prev => [...prev, newPt]);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isDrawingMode]);

  // Render drawing preview polygon
  useEffect(() => {
    if (!drawLayerRef.current) return;
    drawLayerRef.current.clearLayers();

    if (drawnPoints.length > 0) {
      // Draw point markers
      drawnPoints.forEach((pt, i) => {
        const marker = L.circleMarker([pt.lat, pt.lng], {
          radius: 6,
          color: '#3B82F6',
          fillColor: '#FFFFFF',
          fillOpacity: 1,
          weight: 2
        }).addTo(drawLayerRef.current!);
        marker.bindTooltip(`Point #${i + 1}`, { permanent: true, direction: 'top' });
      });

      if (drawnPoints.length >= 3) {
        L.polygon(
          drawnPoints.map(p => [p.lat, p.lng]),
          {
            color: '#3B82F6',
            weight: 2,
            dashArray: '5, 5',
            fillColor: '#60A5FA',
            fillOpacity: 0.35
          }
        ).addTo(drawLayerRef.current);
      }
    }
  }, [drawnPoints]);

  const handleSaveBoundary = () => {
    if (drawnPoints.length < 3) {
      showToast('Incomplete Polygon', 'Please drop at least 3 points to form a closed field boundary.', 'warning');
      return;
    }
    updateFieldBoundary(selectedFieldForEdit, drawnPoints);
    setIsDrawingMode(false);
    setDrawnPoints([]);
  };

  const handleCancelDrawing = () => {
    setIsDrawingMode(false);
    setDrawnPoints([]);
  };

  const calculatedAcres = calculatePolygonAreaAcres(drawnPoints);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Banner / Controls */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-4 h-4" />
            <span>Geo-Fencing & Precision Farm Map</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
            Interactive Farm Boundary Manager
          </h1>
          <p className="text-xs text-slate-500">
            Drag the green farmer pin on the map to test automatic field recognition in real-time.
          </p>
        </div>

        {/* Boundary Editor Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {!isDrawingMode ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedFieldForEdit}
                onChange={e => setSelectedFieldForEdit(e.target.value)}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none"
              >
                {currentFarm.fields.map(f => (
                  <option key={f.id} value={f.id}>
                    Edit: {f.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setIsDrawingMode(true);
                  setDrawnPoints([]);
                  showToast('Drawing Mode Active', 'Click anywhere on the map to drop new polygon boundary points.', 'info');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white text-xs font-bold shadow-md transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>Draw New Boundary</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 p-1.5 rounded-2xl">
              <span className="text-xs font-extrabold text-blue-900 px-2">
                {drawnPoints.length} Points ({calculatedAcres} ac)
              </span>
              <button
                onClick={() => setDrawnPoints(prev => prev.slice(0, -1))}
                disabled={drawnPoints.length === 0}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Undo Point
              </button>
              <button
                onClick={handleSaveBoundary}
                disabled={drawnPoints.length < 3}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Geo-Fence</span>
              </button>
              <button
                onClick={handleCancelDrawing}
                className="px-2.5 py-1 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Card */}
      <div className="relative bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md h-[680px]">
        {/* Leaflet container */}
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Floating Geo-Fence Status HUD (Master Prompt Section 6) */}
        <div className="absolute top-4 left-4 z-20 max-w-sm pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200/90 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Live Glasses Telemetry
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                GPS Active
              </span>
            </div>

            {currentField ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold">Currently inside {currentField.name}</p>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Crop: {currentField.crop} • {currentField.areaAcres} Acres
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                <p className="text-xs font-extrabold">Outside Registered Field Boundary</p>
                <p className="text-[11px] text-amber-800">
                  Location detected, but no registered field was found.
                </p>
              </div>
            )}

            <div className="text-[11px] text-slate-500 flex justify-between pt-1">
              <span>Coordinates:</span>
              <span className="font-mono font-bold text-slate-700">
                {currentGps.lat.toFixed(5)}° N, {currentGps.lng.toFixed(5)}° E
              </span>
            </div>
          </div>
        </div>

        {/* Floating Legend / Quick Field Jump */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-auto hidden sm:block">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-xl flex items-center gap-4 text-xs">
            <span className="font-bold text-slate-700">Field Boundaries:</span>
            {currentFarm.fields.map(f => (
              <button
                key={f.id}
                onClick={() => {
                  setCurrentGps(f.center);
                  mapInstanceRef.current?.flyTo([f.center.lat, f.center.lng], 18);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    f.status === 'Healthy'
                      ? 'bg-emerald-500'
                      : f.status === 'At Risk'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                <span>{f.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
