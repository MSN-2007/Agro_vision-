import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  Navigation,
  Compass,
  Maximize2,
  Minimize2,
  Crosshair,
  Sparkles,
  Info
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { Field, LatLng } from '../types/agro';

interface FarmMapNotchBoxProps {
  onSelectField?: (field: Field) => void;
}

export const FarmMapNotchBox: React.FC<FarmMapNotchBoxProps> = ({ onSelectField }) => {
  const {
    currentFarm,
    currentField,
    currentGps,
    selectField,
    locateMe,
    showToast
  } = useFarm();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayersRef = useRef<Record<string, L.Polygon>>({});
  const farmerMarkerRef = useRef<L.Marker | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [selectedFieldId, setSelectedFieldId] = useState<string>(currentField?.id || 'all');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [currentFarm.center.lat, currentFarm.center.lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    const streetUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const tile = L.tileLayer(mapType === 'satellite' ? satelliteUrl : streetUrl, {
      maxZoom: 19
    }).addTo(map);

    baseTileLayerRef.current = tile;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [currentFarm.id]);

  // Update Tile Layer on mapType toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
    }

    const streetUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    baseTileLayerRef.current = L.tileLayer(mapType === 'satellite' ? satelliteUrl : streetUrl, {
      maxZoom: 19
    }).addTo(map);
  }, [mapType]);

  // Render Polygons for all fields
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old polygons
    Object.values(polygonLayersRef.current).forEach(layer => layer.remove());
    polygonLayersRef.current = {};

    const bounds = L.latLngBounds([]);

    currentFarm.fields.forEach(field => {
      if (!field.boundary || field.boundary.length < 3) return;

      const latlngs: L.LatLngExpression[] = field.boundary.map(p => [p.lat, p.lng]);
      latlngs.forEach(ll => bounds.extend(ll as [number, number]));

      const isFocused = selectedFieldId === field.id;
      const isHealthy = field.status === 'Healthy';
      const isCritical = field.status === 'Critical';
      const isAtRisk = field.status === 'At Risk';

      const color = isHealthy
        ? '#10B981'
        : isAtRisk
        ? '#F59E0B'
        : isCritical
        ? '#EF4444'
        : '#64748B';

      const polygon = L.polygon(latlngs, {
        color: isFocused ? '#047857' : color,
        weight: isFocused ? 4 : 2.5,
        fillColor: color,
        fillOpacity: isFocused ? 0.45 : 0.25,
        dashArray: isFocused ? '0' : '3, 4'
      }).addTo(map);

      // Popup content
      polygon.bindPopup(`
        <div style="font-family: inherit; padding: 4px; min-width: 160px;">
          <div style="font-size: 10px; font-weight: 800; color: ${color}; text-transform: uppercase;">
            ${field.status} • ${field.areaAcres} Acres
          </div>
          <h4 style="font-size: 13px; font-weight: 800; margin: 2px 0 4px 0; color: #0F172A;">
            ${field.name}
          </h4>
          <p style="font-size: 11px; margin: 0; color: #475569;">
            <strong>Crop:</strong> ${field.crop}
          </p>
        </div>
      `, { className: 'custom-farm-popup' });

      polygon.on('click', () => {
        setSelectedFieldId(field.id);
        selectField(field.id);
        if (onSelectField) onSelectField(field);
      });

      polygonLayersRef.current[field.id] = polygon;
    });

    if (bounds.isValid() && selectedFieldId === 'all') {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 17 });
    }
  }, [currentFarm.fields, selectedFieldId, selectField, onSelectField]);

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
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: rgba(16, 185, 129, 0.4); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #059669; border: 2.5px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.35);"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      farmerMarkerRef.current = L.marker([currentGps.lat, currentGps.lng], { icon: customIcon }).addTo(map);
      farmerMarkerRef.current.bindTooltip('Farmer Position (GPS)', { direction: 'top', offset: [0, -10] });
    }
  }, [currentGps]);

  // Handle focusing a specific parcel
  const handleFocusField = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (fieldId === 'all') {
      const bounds = L.latLngBounds([]);
      currentFarm.fields.forEach(f => {
        f.boundary?.forEach(p => bounds.extend([p.lat, p.lng]));
      });
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
      }
      selectField(null);
    } else {
      const field = currentFarm.fields.find(f => f.id === fieldId);
      if (field) {
        selectField(field.id);
        if (field.boundary && field.boundary.length > 0) {
          const bounds = L.latLngBounds(field.boundary.map(p => [p.lat, p.lng]));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
        } else {
          map.flyTo([field.center.lat, field.center.lng], 17);
        }
      }
    }
  };

  const handleLocateMe = () => {
    locateMe();
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([currentGps.lat, currentGps.lng], 18, { animate: true });
    }
    showToast('GPS Centered', 'Map centered to your live location on the farm.', 'info');
  };

  const handleResetBounds = () => {
    handleFocusField('all');
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden transition-all">
      {/* Box Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-forest-50 text-forest-700 border border-forest-100">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Farm Map & Geo-Fence Boundaries
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Live HUD
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive satellite & parcel boundary viewer for {currentFarm.name}.
            </p>
          </div>
        </div>

        {/* Parcel Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => handleFocusField('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedFieldId === 'all'
                ? 'bg-forest-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            All Parcels ({currentFarm.fields.length})
          </button>
          {currentFarm.fields.map(field => (
            <button
              key={field.id}
              onClick={() => handleFocusField(field.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 ${
                selectedFieldId === field.id
                  ? 'bg-forest-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    field.status === 'Healthy'
                      ? '#10B981'
                      : field.status === 'At Risk'
                      ? '#F59E0B'
                      : '#EF4444'
                }}
              />
              <span>{field.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* The Map Container with Distinctive Top Island "Notch Box" */}
      <div
        className={`w-full rounded-2xl overflow-hidden relative border border-slate-200/80 shadow-inner transition-all duration-300 ${
          isExpanded ? 'h-[540px]' : 'h-[360px] sm:h-[400px]'
        }`}
      >
        {/* Sleek Floating Island Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full shadow-lg border border-slate-700/80 flex items-center gap-3 text-xs font-semibold pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold tracking-wide">{currentFarm.name}</span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-200">{currentFarm.fields.length} Parcels</span>
          <span className="text-slate-400">•</span>
          <span className="text-emerald-400 font-bold">{currentFarm.totalAreaAcres} Acres</span>
        </div>

        {/* Map Control HUD (Top Right) */}
        <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-slate-200/80">
          <button
            onClick={() => setMapType(prev => (prev === 'streets' ? 'satellite' : 'streets'))}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              mapType === 'satellite'
                ? 'bg-forest-700 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Toggle Satellite / Streets view"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{mapType === 'satellite' ? 'Satellite' : 'Street'}</span>
          </button>

          <button
            onClick={handleLocateMe}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-all hover:text-forest-700"
            title="Locate farmer position"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleResetBounds}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-all"
            title="Reset view to whole farm"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-all"
            title={isExpanded ? 'Collapse map height' : 'Expand map height'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Bottom GPS & Parcel HUD (Bottom Left) */}
        <div className="absolute bottom-3 left-3 z-[400] max-w-xs bg-white/92 backdrop-blur-md p-2.5 rounded-2xl shadow-md border border-slate-200/80 text-xs flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-forest-100 text-forest-800 shrink-0">
            <MapPin className="w-4 h-4 text-forest-700" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-extrabold text-slate-900">
              <span>{currentField ? currentField.name : 'Estate Grounds'}</span>
              {currentField && (
                <span className="text-[10px] text-forest-700 font-semibold bg-forest-50 px-1.5 rounded">
                  {currentField.crop}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              GPS: {currentGps.lat.toFixed(4)}° N, {currentGps.lng.toFixed(4)}° E
            </p>
          </div>
        </div>

        {/* Actual Map Target */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      {/* Parcel Footnote Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 px-1">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Healthy Plot</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>At Risk</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>Critical</span>
          </span>
        </div>
        <div className="text-[11px] text-slate-400">
          Click any polygon on map to inspect crop status & bounds
        </div>
      </div>
    </div>
  );
};
