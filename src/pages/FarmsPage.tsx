import React, { useState } from 'react';
import {
  Trees,
  MapPin,
  Plus,
  ChevronRight,
  HeartPulse,
  AlertTriangle,
  CheckSquare,
  Eye,
  Layers,
  X
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { Field } from '../types/agro';
import { PageId } from '../components/Sidebar';

interface FarmsPageProps {
  onSelectField: (field: Field) => void;
  onNavigate: (page: PageId) => void;
}

export const FarmsPage: React.FC<FarmsPageProps> = ({ onSelectField, onNavigate }) => {
  const {
    farms,
    currentFarm,
    selectFarm,
    addFarm,
    addField,
    observations,
    problems,
    tasks
  } = useFarm();

  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmLocation, setNewFarmLocation] = useState('');

  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldCrop, setNewFieldCrop] = useState('');
  const [newFieldAcres, setNewFieldAcres] = useState('2.5');

  const handleCreateFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmName.trim()) return;
    addFarm(newFarmName, newFarmLocation || 'Karnataka, India');
    setNewFarmName('');
    setNewFarmLocation('');
    setIsAddFarmOpen(false);
  };

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !newFieldCrop.trim()) return;
    const acres = parseFloat(newFieldAcres) || 2.0;

    // Field starts with NO fake health, NO fake observations (Section 1 & 26)
    addField(currentFarm.id, {
      name: newFieldName,
      crop: newFieldCrop,
      areaAcres: acres,
      plantingDate: new Date().toISOString().split('T')[0],
      healthPercentage: null,
      healthBreakdown: null,
      status: 'Unanalyzed',
      center: { lat: currentFarm.center.lat + 0.002, lng: currentFarm.center.lng + 0.002 },
      boundary: [],
      notes: 'Newly registered field parcel. Boundary required.'
    });

    setNewFieldName('');
    setNewFieldCrop('');
    setIsAddFieldOpen(false);
  };

  const farmObs = observations.filter(o => o.farmId === currentFarm.id);
  const farmProblems = problems.filter(p => p.farmId === currentFarm.id && p.status !== 'Resolved');
  const farmTasks = tasks.filter(t => currentFarm.fields.some(f => f.id === t.fieldId));

  // Avg health across analyzed fields only
  const analyzedFields = currentFarm.fields.filter(f => f.healthPercentage !== null);
  const avgHealth = analyzedFields.length > 0
    ? Math.round(analyzedFields.reduce((acc, f) => acc + (f.healthPercentage || 0), 0) / analyzedFields.length)
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-forest-700 text-xs font-bold uppercase tracking-wider">
            <Trees className="w-4 h-4" />
            <span>Farm Estate Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            My Farms & Fields
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your registered farmland, field parcels, geo-fenced boundaries, and agricultural profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddFieldOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold text-xs border border-forest-200 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4 text-forest-600" />
            <span>Add Field</span>
          </button>
          <button
            onClick={() => setIsAddFarmOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Farm</span>
          </button>
        </div>
      </div>

      {/* Farm Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {farms.map(f => (
          <button
            key={f.id}
            onClick={() => selectFarm(f.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 ${
              currentFarm.id === f.id
                ? 'bg-forest-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Trees className="w-4 h-4" />
            <span>{f.name}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${
              currentFarm.id === f.id ? 'bg-forest-800 text-forest-100' : 'bg-slate-100 text-slate-600'
            }`}>
              {f.fields.length} fields
            </span>
          </button>
        ))}
      </div>

      {/* Selected Farm Summary Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Active Farm Profile
              </span>
              <span className="text-xs text-slate-400">Registered {currentFarm.createdAt}</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">{currentFarm.name}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-forest-600" />
              <span>{currentFarm.locationName}</span>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-left">
              <span className="text-2xl font-extrabold text-slate-900">
                {currentFarm.totalAreaAcres}
              </span>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Total Acres</p>
            </div>
            <div className="text-left">
              <span className="text-2xl font-extrabold text-slate-900">
                {currentFarm.fields.length}
              </span>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Registered Fields</p>
            </div>
            <div className="text-left">
              <span className="text-2xl font-extrabold text-amber-600">
                {farmProblems.length}
              </span>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Active Alerts</p>
            </div>
          </div>
        </div>

        {/* Farm Stats Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100">
            <div className="flex items-center gap-2 text-xs font-bold text-forest-800">
              <HeartPulse className="w-4 h-4 text-forest-600" />
              <span>Avg Crop Health</span>
            </div>
            <p className="text-2xl font-black text-forest-950 mt-1">
              {avgHealth !== null ? `${avgHealth}%` : 'Unanalyzed'}
            </p>
            <p className="text-[10px] text-forest-700 mt-0.5">Across analyzed parcels</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Eye className="w-4 h-4 text-slate-600" />
              <span>Observations</span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{farmObs.length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Scouted across this farm</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Issues Reported</span>
            </div>
            <p className="text-2xl font-black text-amber-900 mt-1">{farmProblems.length}</p>
            <p className="text-[10px] text-amber-700 mt-0.5">Active pathologies</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <CheckSquare className="w-4 h-4 text-slate-600" />
              <span>Tasks Scheduled</span>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">{farmTasks.length}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Scheduled operations</p>
          </div>
        </div>
      </div>

      {/* Fields List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-forest-700" />
            <h3 className="font-extrabold text-slate-900 text-lg">Fields in {currentFarm.name}</h3>
          </div>
          <span className="text-xs text-slate-500">Click any field to view deep 7-tab profile</span>
        </div>

        {currentFarm.fields.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200 space-y-3">
            <Layers className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700">This farm has no fields yet.</p>
            <p className="text-xs">Click "Add Field" to register your first plot.</p>
            <button
              onClick={() => setIsAddFieldOpen(true)}
              className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Add First Field
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentFarm.fields.map(field => {
              const fieldObsCount = observations.filter(o => o.fieldId === field.id).length;
              const fieldProbsCount = problems.filter(p => p.fieldId === field.id && p.status !== 'Resolved').length;

              return (
                <div
                  key={field.id}
                  onClick={() => onSelectField(field)}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-forest-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-forest-100 text-forest-800">
                          {field.crop}
                        </span>
                        <h4 className="text-lg font-extrabold text-slate-900 group-hover:text-forest-700 transition-colors mt-1">
                          {field.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {field.areaAcres} Acres • Planted {field.plantingDate}
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-extrabold ${
                          field.status === 'Healthy'
                            ? 'bg-emerald-100 text-emerald-800'
                            : field.status === 'At Risk'
                            ? 'bg-amber-100 text-amber-800'
                            : field.status === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {field.status}
                      </span>
                    </div>

                    {/* Health Bar or No Health Data */}
                    <div className="mt-4">
                      {field.healthPercentage !== null && field.healthBreakdown ? (
                        <>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-500">Overall Health</span>
                            <span className="text-slate-900 font-bold">{field.healthPercentage}%</span>
                          </div>
                          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${field.healthBreakdown.healthy}%` }}
                              className="bg-emerald-500 h-full"
                            />
                            <div
                              style={{ width: `${field.healthBreakdown.atRisk}%` }}
                              className="bg-amber-400 h-full"
                            />
                            <div
                              style={{ width: `${field.healthBreakdown.critical}%` }}
                              className="bg-rose-500 h-full"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-50 text-[11px] text-slate-500 text-center">
                          No crop health data available yet.
                        </div>
                      )}
                    </div>

                    {/* Field Meta Chips (Strictly field isolated) */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
                        <span className="text-slate-400 block text-[10px]">Observations</span>
                        <strong className="text-slate-900">{fieldObsCount} records</strong>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
                        <span className="text-slate-400 block text-[10px]">Active Issues</span>
                        <strong className="text-slate-900">{fieldProbsCount} reported</strong>
                      </div>
                    </div>

                    {field.notes && (
                      <p className="text-[11px] text-slate-500 mt-3 line-clamp-2 italic">
                        "{field.notes}"
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-forest-700 group-hover:text-forest-900">
                    <span>Open Field Profile</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add Farm */}
      {isAddFarmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-lg">Create New Farm</h3>
              <button
                onClick={() => setIsAddFarmOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFarm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Farm Name
                </label>
                <input
                  type="text"
                  required
                  value={newFarmName}
                  onChange={e => setNewFarmName(e.target.value)}
                  placeholder="e.g. Sunrise Organic Estate"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Location / Region
                </label>
                <input
                  type="text"
                  value={newFarmLocation}
                  onChange={e => setNewFarmLocation(e.target.value)}
                  placeholder="e.g. Hassan District, Karnataka"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                Save Farm
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Field */}
      {isAddFieldOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-lg">
                Add Field to {currentFarm.name}
              </h3>
              <button
                onClick={() => setIsAddFieldOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateField} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Field Name
                </label>
                <input
                  type="text"
                  required
                  value={newFieldName}
                  onChange={e => setNewFieldName(e.target.value)}
                  placeholder="e.g. New Potato Field"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Crop Type
                </label>
                <input
                  type="text"
                  required
                  value={newFieldCrop}
                  onChange={e => setNewFieldCrop(e.target.value)}
                  placeholder="e.g. Potato (Kufri Jyoti)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Area (Acres)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newFieldAcres}
                  onChange={e => setNewFieldAcres(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-forest-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                Save Field Parcel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
