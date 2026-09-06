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
  Sparkles,
  Info,
  Layers,
  X,
  Compass,
  Maximize2
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { LatLng, Field } from '../types/agro';
import { calculatePolygonAreaAcres } from '../services/geofence';

export const MapPage: React.FC = () => {
  const {
    currentFarm,
    currentField,
    currentGps,
    setCurrentGps,
    updateFieldBoundary,
    locateMe,
    selectField,
    showToast
  } = useFarm();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const farmerMarkerRef = useRef<L.Marker | null>(null);
  const polygonLayersRef = useRef<Record<string, L.Polygon>>({});
  const vertexMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const activeDrawPolygonRef = useRef<L.Polygon | null>(null);

  // Editing & Drawing State
  const [editorMode, setEditorMode] = useState<'view' | 'draw' | 'edit'>('view');
  const [selectedFieldId, setSelectedFieldId] = useState<string>(
    currentField?.id || currentFarm.fields[0]?.id || ''
  );
  const [areaUnit, setAreaUnit] = useState<'acres' | 'hectares' | 'sqm'>('acres');

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

  // Initialize Map
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

    // High quality CartoDB Voyager tiles
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20
      }
    ).addTo(map);

    const vertexGroup = L.layerGroup().addTo(map);
    vertexMarkersGroupRef.current = vertexGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [currentFarm]);

  // Render Polygons for all fields in currentFarm
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing field polygons
    Object.values(polygonLayersRef.current).forEach(layer => layer.remove());
    polygonLayersRef.current = {};

    currentFarm.fields.forEach(field => {
      if (!field.boundary || field.boundary.length < 3) return;

      // In edit mode, do not render static polygon for field being edited
      if (editorMode === 'edit' && field.id === selectedFieldId) return;

      const latlngs: L.LatLngExpression[] = field.boundary.map(p => [p.lat, p.lng]);
      const color =
        field.status === 'Healthy'
          ? '#10B981'
          : field.status === 'At Risk'
          ? '#F59E0B'
          : field.status === 'Critical'
          ? '#EF4444'
          : '#64748B';

      const polygon = L.polygon(latlngs, {
        color: color,
        weight: field.id === currentField?.id ? 4 : 2,
        fillColor: color,
        fillOpacity: field.id === currentField?.id ? 0.35 : 0.2,
        dashArray: field.id === currentField?.id ? '0' : '4, 4'
      }).addTo(map);

      // Section 34: Click polygon to view details & open field
      polygon.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 4px; min-width: 170px;">
          <div style="font-size: 10px; font-weight: 800; color: ${color}; text-transform: uppercase;">
            ${field.status} • ${field.healthPercentage !== null ? `${field.healthPercentage}% Health` : 'No health data'}
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
            style="background: #047857; color: white; border: none; border-radius: 8px; padding: 5px 10px; font-size: 11px; font-weight: bold; cursor: pointer; width: 100%;"
          >
            Select Field
          </button>
        </div>
      `, { className: 'custom-farm-popup' });

      polygon.on('popupopen', () => {
        const btn = document.getElementById(`popup-select-${field.id}`);
        if (btn) {
          btn.onclick = () => {
            selectField(field.id);
            setSelectedFieldId(field.id);
            showToast('Field Selected', `${field.name} is now the active focus.`, 'info');
          };
        }
      });

      polygonLayersRef.current[field.id] = polygon;
    });
  }, [currentFarm.fields, currentField, editorMode, selectedFieldId, selectField, showToast]);

  // Render Farmer GPS pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (farmerMarkerRef.current) {
      farmerMarkerRef.current.setLatLng([currentGps.lat, currentGps.lng]);
    } else {
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
        title: 'Drag me to test real-time geo-fencing!'
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; font-size: 12px; font-weight: bold; color: #047857;">
          🌾 Farmer Location<br/>
          <span style="font-size: 10px; color: #64748B; font-weight: normal;">
            Drag to simulate movement between fields!
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

  // Interactive Polygon Editor: Render active polygon & vertex markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear active polygon
    if (activeDrawPolygonRef.current) {
      activeDrawPolygonRef.current.remove();
      activeDrawPolygonRef.current = null;
    }

    // Clear vertex markers
    if (vertexMarkersGroupRef.current) {
      vertexMarkersGroupRef.current.clearLayers();
    }

    if (editorMode === 'view' || activePoints.length === 0) return;

    // Render active preview polygon
    if (activePoints.length >= 3) {
      const poly = L.polygon(
        activePoints.map(p => [p.lat, p.lng]),
        {
          color: '#2563EB',
          weight: 3,
          dashArray: '6, 6',
          fillColor: '#3B82F6',
          fillOpacity: 0.3
        }
      ).addTo(map);
      activeDrawPolygonRef.current = poly;
    } else if (activePoints.length === 2) {
      const poly = L.polyline(
        activePoints.map(p => [p.lat, p.lng]),
        { color: '#2563EB', weight: 3, dashArray: '4, 4' }
      ).addTo(map) as unknown as L.Polygon;
      activeDrawPolygonRef.current = poly;
    }

    // Render Draggable Vertex Markers on EVERY point (Sections 5, 6, 7, 8)
    activePoints.forEach((point, index) => {
      const isSelected = selectedVertexIndex === index;

      const vertexIcon = L.divIcon({
        className: `vertex-handle-${index}`,
        html: `
          <div style="
            width: ${isSelected ? '22px' : '16px'};
            height: ${isSelected ? '22px' : '16px'};
            background: ${isSelected ? '#EF4444' : '#2563EB'};
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            cursor: grab;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 8px;
            font-weight: 800;
          ">
            ${index + 1}
          </div>
        `,
        iconSize: [isSelected ? 22 : 16, isSelected ? 22 : 16],
        iconAnchor: [isSelected ? 11 : 8, isSelected ? 11 : 8]
      });

      const vertexMarker = L.marker([point.lat, point.lng], {
        icon: vertexIcon,
        draggable: true
      }).addTo(vertexMarkersGroupRef.current!);

      // Click vertex to select & inspect (Section 6)
      vertexMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setSelectedVertexIndex(index);
      });

      // Real-time dragging of vertex (Section 8)
      vertexMarker.on('drag', () => {
        const newPos = vertexMarker.getLatLng();
        // Update polygon in real time
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

  // Click on map to add points during 'draw' mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (editorMode !== 'draw') return;
      const newPt: LatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
      pushHistory([...activePoints, newPt]);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [editorMode, activePoints, pushHistory]);

  // Start Editing Boundary for a Field
  const handleStartEdit = (field: Field) => {
    if (!field.boundary || field.boundary.length === 0) {
      showToast('No Boundary', `Field ${field.name} has no boundary. Switching to Draw mode.`, 'info');
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

    // Zoom to field
    if (mapInstanceRef.current && field.center) {
      mapInstanceRef.current.flyTo([field.center.lat, field.center.lng], 18);
    }
  };

  // Start Drawing from Scratch
  const handleStartDraw = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setActivePoints([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setSelectedVertexIndex(null);
    setEditorMode('draw');
    setHasUnsavedChanges(false);
    showToast('Draw Mode Active', 'Click anywhere on the map to place boundary points.', 'info');
  };

  // Delete Individual Point (Section 6)
  const handleDeleteSelectedPoint = () => {
    if (selectedVertexIndex === null) return;
    if (activePoints.length <= 3) {
      showToast('Minimum Points Required', 'A field polygon boundary must have at least 3 vertices.', 'warning');
      return;
    }

    const updated = activePoints.filter((_, idx) => idx !== selectedVertexIndex);
    pushHistory(updated);
    setSelectedVertexIndex(null);
    showToast('Point Deleted', `Vertex #${selectedVertexIndex + 1} removed.`, 'info');
  };

  // Add Point between points (Section 7)
  const handleAddPointBetween = () => {
    if (activePoints.length < 2) return;
    const baseIndex = selectedVertexIndex !== null ? selectedVertexIndex : activePoints.length - 1;
    const nextIndex = (baseIndex + 1) % activePoints.length;

    const p1 = activePoints[baseIndex];
    const p2 = activePoints[nextIndex];

    // Midpoint
    const midPoint: LatLng = {
      lat: (p1.lat + p2.lat) / 2,
      lng: (p1.lng + p2.lng) / 2
    };

    const updated = [...activePoints];
    updated.splice(baseIndex + 1, 0, midPoint);
    pushHistory(updated);
    setSelectedVertexIndex(baseIndex + 1);
    showToast('Point Added', `New draggable vertex added between Point ${baseIndex + 1} and ${nextIndex + 1}.`, 'success');
  };

  // Save Boundary (Section 8)
  const handleSaveBoundary = () => {
    if (activePoints.length < 3) {
      showToast('Incomplete Boundary', 'Please create at least 3 points to save a valid field boundary.', 'warning');
      return;
    }

    updateFieldBoundary(selectedFieldId, activePoints);
    setEditorMode('view');
    setHasUnsavedChanges(false);
    showToast('Field boundary updated successfully.', `${formatArea(calculatedAcres)} geo-fence saved.`, 'success');
  };

  // Cancel Changes (Section 8)
  const handleCancel = () => {
    setEditorMode('view');
    setActivePoints([]);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedVertexIndex(null);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Header & Mode Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Interactive Farm Map & Geo-Fence Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
            Precision Field Boundaries
          </h1>
          <p className="text-xs text-slate-500">
            {editorMode === 'view'
              ? 'Select a field to inspect its geo-fence, or enter edit mode to adjust boundary points.'
              : editorMode === 'edit'
              ? 'Drag any point handle to adjust the boundary in real-time, or select a point to delete/add.'
              : 'Click on the map to drop boundary points.'}
          </p>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Toggle (Section 33) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setAreaUnit('acres')}
              className={`px-2.5 py-1 rounded-lg transition-all ${areaUnit === 'acres' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
            >
              Acres
            </button>
            <button
              onClick={() => setAreaUnit('hectares')}
              className={`px-2.5 py-1 rounded-lg transition-all ${areaUnit === 'hectares' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
            >
              Hectares
            </button>
            <button
              onClick={() => setAreaUnit('sqm')}
              className={`px-2.5 py-1 rounded-lg transition-all ${areaUnit === 'sqm' ? 'bg-white text-slate-900 shadow-xs' : ''}`}
            >
              m²
            </button>
          </div>

          {/* Locate Me Button (Section 35) */}
          <button
            onClick={locateMe}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold text-xs border border-forest-200 transition-colors"
            title="Detect your current GPS location"
          >
            <Navigation className="w-3.5 h-3.5 text-forest-600" />
            <span>Locate Me</span>
          </button>

          {editorMode === 'view' ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedFieldId}
                onChange={e => {
                  setSelectedFieldId(e.target.value);
                  selectField(e.target.value);
                }}
                className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none"
              >
                {currentFarm.fields.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.crop})
                  </option>
                ))}
              </select>

              {activeField && (
                <button
                  onClick={() => handleStartEdit(activeField)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Boundary</span>
                </button>
              )}

              {activeField && (!activeField.boundary || activeField.boundary.length === 0) && (
                <button
                  onClick={() => handleStartDraw(activeField.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Draw Boundary</span>
                </button>
              )}
            </div>
          ) : (
            /* Editing Toolbar (Section 32) */
            <div className="flex items-center flex-wrap gap-1.5 bg-blue-50 border border-blue-200 p-1.5 rounded-2xl">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                title="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <div className="h-5 w-px bg-blue-200 mx-1" />

              <button
                onClick={handleAddPointBetween}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-white text-blue-800 hover:bg-blue-100 border border-blue-200"
                title="Add vertex point on selected edge"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Point</span>
              </button>

              {selectedVertexIndex !== null && (
                <button
                  onClick={handleDeleteSelectedPoint}
                  disabled={activePoints.length <= 3}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 disabled:opacity-40"
                  title="Delete selected vertex"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Point #{selectedVertexIndex + 1}</span>
                </button>
              )}

              <div className="h-5 w-px bg-blue-200 mx-1" />

              <button
                onClick={handleSaveBoundary}
                disabled={activePoints.length < 3}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-40"
              >
                <Check className="w-3.5 h-3.5" />
                <span>SAVE</span>
              </button>

              <button
                onClick={handleCancel}
                className="px-2.5 py-1 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800"
              >
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Unsaved Changes Banner (Section 8) */}
      {hasUnsavedChanges && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span>Unsaved boundary changes ({activePoints.length} vertices • {formatArea(calculatedAcres)})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveBoundary}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              Save Boundary
            </button>
          </div>
        </div>
      )}

      {/* Map Canvas */}
      <div className="relative bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-md h-[650px]">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Live Geo-Fence Telemetry HUD (Section 35) */}
        <div className="absolute top-4 left-4 z-20 max-w-sm pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Live Geofence Telemetry
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Active GPS
              </span>
            </div>

            {currentField ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <p className="text-xs font-extrabold">You are inside {currentField.name}</p>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Crop: {currentField.crop} • {formatArea(currentField.areaAcres)}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                <p className="text-xs font-extrabold">You are outside registered fields.</p>
                <p className="text-[11px] text-amber-800">
                  No registered field found at your current location.
                </p>
              </div>
            )}

            <div className="text-[11px] text-slate-500 flex justify-between pt-1">
              <span>GPS Coordinates:</span>
              <span className="font-mono font-bold text-slate-700">
                {currentGps.lat.toFixed(5)}° N, {currentGps.lng.toFixed(5)}° E
              </span>
            </div>
          </div>
        </div>

        {/* Vertex Point Inspector Box when a vertex is selected (Section 32) */}
        {selectedVertexIndex !== null && activePoints[selectedVertexIndex] && (
          <div className="absolute top-4 right-4 z-20 max-w-xs pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-blue-200 shadow-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-blue-900 uppercase tracking-wider">
                  Vertex Point #{selectedVertexIndex + 1}
                </span>
                <button
                  onClick={() => setSelectedVertexIndex(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 font-mono text-[11px] text-slate-700 bg-slate-50 p-2 rounded-xl">
                <div>Lat: {activePoints[selectedVertexIndex].lat.toFixed(6)}°</div>
                <div>Lng: {activePoints[selectedVertexIndex].lng.toFixed(6)}°</div>
              </div>

              <p className="text-[10px] text-slate-500">
                Drag this handle directly on the map to adjust the boundary.
              </p>

              <button
                onClick={handleDeleteSelectedPoint}
                disabled={activePoints.length <= 3}
                className="w-full py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Point</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Legend */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-auto hidden sm:block">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 shadow-xl flex items-center gap-4 text-xs">
            <span className="font-bold text-slate-700">Parcel Boundaries:</span>
            {currentFarm.fields.map(f => (
              <button
                key={f.id}
                onClick={() => {
                  selectField(f.id);
                  setSelectedFieldId(f.id);
                  if (mapInstanceRef.current && f.center) {
                    mapInstanceRef.current.flyTo([f.center.lat, f.center.lng], 18);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    f.status === 'Healthy'
                      ? 'bg-emerald-500'
                      : f.status === 'At Risk'
                      ? 'bg-amber-500'
                      : f.status === 'Critical'
                      ? 'bg-rose-500'
                      : 'bg-slate-400'
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
