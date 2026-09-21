import React, { useState } from 'react';
import { LuggageProfile, UnitSystem, Dimensions, PermanentObject } from '../types';
import { fromBase, toBase, formatDimensions, computeVolumeLiters, formatVolume } from '../utils/units';
import { Luggage, Plus, Trash2, Edit3, Check, X, Box, Shield } from 'lucide-react';
import { PermanentObjectsDialog } from './PermanentObjectsDialog';

interface LuggageManagerProps {
  units: UnitSystem;
  luggageList: LuggageProfile[];
  selectedLuggageId: string;
  onSelectLuggage: (id: string) => void;
  onAddLuggage: (luggage: LuggageProfile) => void;
  onUpdateLuggage: (luggage: LuggageProfile) => void;
  onDeleteLuggage: (id: string) => void;
}

const COLOR_OPTIONS = [
  '#0284c7', // sky/blue
  '#2563eb', // royal blue
  '#4f46e5', // indigo
  '#7c3aed', // purple
  '#0d9488', // teal
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // red
  '#475569', // slate
];

export const LuggageManager: React.FC<LuggageManagerProps> = ({
  units,
  luggageList,
  selectedLuggageId,
  onSelectLuggage,
  onAddLuggage,
  onUpdateLuggage,
  onDeleteLuggage,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formLength, setFormLength] = useState<number>(55);
  const [formWidth, setFormWidth] = useState<number>(40);
  const [formHeight, setFormHeight] = useState<number>(20);
  const [formColor, setFormColor] = useState<string>('#0284c7');

  // Obstacles Dialog state
  const [isObstaclesDialogOpen, setIsObstaclesDialogOpen] = useState(false);
  const [managingObstaclesLuggage, setManagingObstaclesLuggage] = useState<LuggageProfile | null>(null);

  const activeLuggage = luggageList.find((l) => l.id === selectedLuggageId) || luggageList[0];

  const handleUpdatePermanentObjects = (luggageId: string, objects: PermanentObject[]) => {
    const target = luggageList.find((l) => l.id === luggageId);
    if (target) {
      const updated = { ...target, permanentObjects: objects };
      onUpdateLuggage(updated);
      if (managingObstaclesLuggage?.id === luggageId) {
        setManagingObstaclesLuggage(updated);
      }
    }
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormName('My Custom Suitcase');
    setFormLength(units === 'in' ? 22 : 55);
    setFormWidth(units === 'in' ? 14 : 40);
    setFormHeight(units === 'in' ? 9 : 20);
    setFormColor('#0284c7');
  };

  const startEdit = (luggage: LuggageProfile) => {
    setEditingId(luggage.id);
    setIsCreating(false);
    setFormName(luggage.name);
    setFormLength(fromBase(luggage.dimensions.length, units));
    setFormWidth(fromBase(luggage.dimensions.width, units));
    setFormHeight(fromBase(luggage.dimensions.height, units));
    setFormColor(luggage.color || '#0284c7');
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const baseDimensions: Dimensions = {
      length: Math.max(5, toBase(formLength, units)),
      width: Math.max(5, toBase(formWidth, units)),
      height: Math.max(5, toBase(formHeight, units)),
    };

    if (isCreating) {
      const newLuggage: LuggageProfile = {
        id: `luggage-custom-${Date.now()}`,
        name: formName.trim(),
        dimensions: baseDimensions,
        color: formColor,
        isPreset: false,
      };
      onAddLuggage(newLuggage);
      onSelectLuggage(newLuggage.id);
    } else if (editingId) {
      const updated: LuggageProfile = {
        id: editingId,
        name: formName.trim(),
        dimensions: baseDimensions,
        color: formColor,
      };
      onUpdateLuggage(updated);
    }

    cancelForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (luggageList.length <= 1) {
      alert('You must keep at least one luggage profile.');
      return;
    }
    if (window.confirm(`Delete luggage profile "${name}"?`)) {
      onDeleteLuggage(id);
    }
  };

  // Calculate preview volume for form
  const previewBaseDim: Dimensions = {
    length: toBase(formLength, units),
    width: toBase(formWidth, units),
    height: toBase(formHeight, units),
  };
  const previewVolCm3 = previewBaseDim.length * previewBaseDim.width * previewBaseDim.height;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-700">
            <Luggage className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Luggage Box Specification</h2>
            <p className="text-xs text-neutral-500">
              Select or customize your container dimensions
            </p>
          </div>
        </div>

        {!isCreating && !editingId && (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Luggage</span>
          </button>
        )}
      </div>

      {/* Creation / Editing Form */}
      {(isCreating || editingId) && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
              {isCreating ? 'Create New Luggage Profile' : 'Edit Luggage Dimensions'}
            </h3>
            <button
              type="button"
              onClick={cancelForm}
              className="text-neutral-400 hover:text-neutral-600 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Luggage Name / Model
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Samsonite Carry-on or Rimowa Cabin"
                className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Length ({units})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="200"
                  required
                  value={formLength}
                  onChange={(e) => setFormLength(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Width ({units})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="200"
                  required
                  value={formWidth}
                  onChange={(e) => setFormWidth(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Depth / Height ({units})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="200"
                  required
                  value={formHeight}
                  onChange={(e) => setFormHeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Live Volume Feedback */}
            <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-neutral-200 text-xs">
              <span className="text-neutral-500">Calculated Capacity:</span>
              <span className="font-semibold text-neutral-900">
                {formatVolume(previewVolCm3, units)}
              </span>
            </div>

            {/* Color Accent Picker */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center space-x-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      formColor === c ? 'scale-115 border-neutral-900' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={cancelForm}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-medium hover:bg-sky-500 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isCreating ? 'Save Luggage' : 'Update Dimensions'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Active Luggage Showcase Card */}
      {activeLuggage && (
        <div className="p-4 rounded-xl border-2 border-neutral-900 bg-neutral-900 text-white mb-4 shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activeLuggage.color || '#38bdf8' }}
                />
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Active Luggage
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">{activeLuggage.name}</h3>
              <p className="text-sm text-neutral-300 font-mono">
                {formatDimensions(activeLuggage.dimensions, units)}
              </p>
            </div>

            <div className="text-right">
              <div className="text-xs text-neutral-400">Total Volume</div>
              <div className="text-xl font-bold text-sky-400">
                {computeVolumeLiters(activeLuggage.dimensions)} L
              </div>
              <div className="text-[11px] text-neutral-400">
                {units === 'in'
                  ? `${Math.round(
                      (activeLuggage.dimensions.length *
                        activeLuggage.dimensions.width *
                        activeLuggage.dimensions.height) /
                        Math.pow(2.54, 3)
                    ).toLocaleString()} in³`
                  : `${Math.round(
                      activeLuggage.dimensions.length *
                        activeLuggage.dimensions.width *
                        activeLuggage.dimensions.height
                    ).toLocaleString()} cm³`}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-neutral-400">
              Box Aspect: {fromBase(activeLuggage.dimensions.length, units)}L × {fromBase(activeLuggage.dimensions.width, units)}W × {fromBase(activeLuggage.dimensions.height, units)}H
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setManagingObstaclesLuggage(activeLuggage);
                  setIsObstaclesDialogOpen(true);
                }}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700 shadow-2xs cursor-pointer"
                title="Configure handle tubes, casings, and internal obstacles"
              >
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                <span>Interior Obstacles ({activeLuggage.permanentObjects?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => startEdit(activeLuggage)}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-700 transition-colors"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
              {luggageList.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDelete(activeLuggage.id, activeLuggage.name)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-rose-900/40 text-rose-300 hover:bg-rose-800/60 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Luggage Switcher Carousel / List */}
      <div>
        <div className="text-xs font-medium text-neutral-500 mb-2">Switch Saved Luggage:</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {luggageList.map((lug) => {
            const isSelected = lug.id === selectedLuggageId;
            const obstacleCount = lug.permanentObjects?.length || 0;
            return (
              <div
                key={lug.id}
                onClick={() => onSelectLuggage(lug.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/50 shadow-xs'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: lug.color || '#0284c7' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-semibold text-neutral-900 truncate">
                        {lug.name}
                      </span>
                      {obstacleCount > 0 && (
                        <span
                          className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-medium shrink-0"
                          title={`${obstacleCount} interior obstacle(s)`}
                        >
                          <Shield className="w-2.5 h-2.5 text-slate-600" />
                          <span>{obstacleCount}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {formatDimensions(lug.dimensions, units)}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center space-x-1">
                  <span className="text-xs font-medium text-neutral-600 mr-1">
                    {computeVolumeLiters(lug.dimensions)}L
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setManagingObstaclesLuggage(lug);
                      setIsObstaclesDialogOpen(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-slate-700 rounded-md transition-opacity"
                    title="Configure interior obstacles"
                  >
                    <Shield className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(lug);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-700 rounded-md transition-opacity"
                    title="Edit dimensions"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {luggageList.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(lug.id, lug.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-600 rounded-md transition-opacity"
                      title="Delete profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permanent Interior Objects Dialog */}
      {isObstaclesDialogOpen && managingObstaclesLuggage && (
        <PermanentObjectsDialog
          isOpen={isObstaclesDialogOpen}
          onClose={() => {
            setIsObstaclesDialogOpen(false);
            setManagingObstaclesLuggage(null);
          }}
          luggage={
            luggageList.find((l) => l.id === managingObstaclesLuggage.id) || managingObstaclesLuggage
          }
          units={units}
          onUpdatePermanentObjects={handleUpdatePermanentObjects}
        />
      )}
    </div>
  );
};
