import React, { useState } from 'react';
import { Dimensions, LuggageProfile, PermanentObject, UnitSystem } from '../types';
import { fromBase, toBase, formatDimensions, formatVolume, computeVolumeLiters } from '../utils/units';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Sliders,
  Shield,
  AlertTriangle,
  Info,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';

interface PermanentObjectsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  luggage: LuggageProfile;
  units: UnitSystem;
  onUpdatePermanentObjects: (luggageId: string, objects: PermanentObject[]) => void;
}

const OBSTACLE_COLOR_OPTIONS = [
  '#475569', // slate
  '#334155', // dark slate
  '#1e293b', // charcoal
  '#64748b', // steel
  '#0f766e', // dark teal
  '#b45309', // bronze/amber
  '#b91c1c', // dark red
  '#4338ca', // indigo
];

export const PermanentObjectsDialog: React.FC<PermanentObjectsDialogProps> = ({
  isOpen,
  onClose,
  luggage,
  units,
  onUpdatePermanentObjects,
}) => {
  const currentObjects = luggage.permanentObjects || [];

  // Form state
  const [isEditingOrAdding, setIsEditingOrAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formName, setFormName] = useState('');
  const [formLength, setFormLength] = useState<number>(45);
  const [formWidth, setFormWidth] = useState<number>(4);
  const [formHeight, setFormHeight] = useState<number>(3);
  const [formX, setFormX] = useState<number>(5);
  const [formY, setFormY] = useState<number>(8);
  const [formZ, setFormZ] = useState<number>(0);
  const [formColor, setFormColor] = useState<string>('#475569');

  if (!isOpen) return null;

  const luggageL = fromBase(luggage.dimensions.length, units);
  const luggageW = fromBase(luggage.dimensions.width, units);
  const luggageH = fromBase(luggage.dimensions.height, units);

  const totalLuggageVol = luggage.dimensions.length * luggage.dimensions.width * luggage.dimensions.height;
  const totalObstaclesVol = currentObjects.reduce(
    (acc, o) => acc + o.dimensions.length * o.dimensions.width * o.dimensions.height,
    0
  );
  const usableVol = Math.max(0, totalLuggageVol - totalObstaclesVol);
  const obstaclePercent = totalLuggageVol > 0 ? ((totalObstaclesVol / totalLuggageVol) * 100).toFixed(1) : '0';

  const startAdd = () => {
    setIsEditingOrAdding(true);
    setEditingId(null);
    setFormName('Handle Casing');
    // Default sensible dimensions (e.g. 80% luggage length, 4 cm wide, 3 cm deep on floor)
    const defL = Math.max(5, Math.round(fromBase(luggage.dimensions.length * 0.85, units) * 10) / 10);
    const defW = Math.max(2, Math.round(fromBase(4, units) * 10) / 10);
    const defH = Math.max(2, Math.round(fromBase(3, units) * 10) / 10);
    const defX = Math.round(fromBase((luggage.dimensions.length - luggage.dimensions.length * 0.85) / 2, units) * 10) / 10;
    const defY = Math.round(fromBase((luggage.dimensions.width - 4) / 2, units) * 10) / 10;

    setFormLength(defL);
    setFormWidth(defW);
    setFormHeight(defH);
    setFormX(defX);
    setFormY(defY);
    setFormZ(0);
    setFormColor('#475569');
  };

  const startEdit = (obj: PermanentObject) => {
    setIsEditingOrAdding(true);
    setEditingId(obj.id);
    setFormName(obj.name);
    setFormLength(fromBase(obj.dimensions.length, units));
    setFormWidth(fromBase(obj.dimensions.width, units));
    setFormHeight(fromBase(obj.dimensions.height, units));
    setFormX(fromBase(obj.x, units));
    setFormY(fromBase(obj.y, units));
    setFormZ(fromBase(obj.z, units));
    setFormColor(obj.color || '#475569');
  };

  const cancelForm = () => {
    setIsEditingOrAdding(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = currentObjects.filter((o) => o.id !== id);
    onUpdatePermanentObjects(luggage.id, updated);
    if (editingId === id) cancelForm();
  };

  const handleDuplicate = (obj: PermanentObject) => {
    const duplicated: PermanentObject = {
      ...obj,
      id: `obstacle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${obj.name} (Copy)`,
      y: Math.min(
        luggage.dimensions.width - obj.dimensions.width,
        obj.y + obj.dimensions.width + 4
      ),
    };
    onUpdatePermanentObjects(luggage.id, [...currentObjects, duplicated]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const baseDim: Dimensions = {
      length: Math.max(1, toBase(formLength, units)),
      width: Math.max(1, toBase(formWidth, units)),
      height: Math.max(1, toBase(formHeight, units)),
    };

    const baseX = Math.max(0, toBase(formX, units));
    const baseY = Math.max(0, toBase(formY, units));
    const baseZ = Math.max(0, toBase(formZ, units));

    if (editingId) {
      const updated = currentObjects.map((o) =>
        o.id === editingId
          ? {
              ...o,
              name: formName.trim(),
              dimensions: baseDim,
              x: baseX,
              y: baseY,
              z: baseZ,
              color: formColor,
            }
          : o
      );
      onUpdatePermanentObjects(luggage.id, updated);
    } else {
      const newObj: PermanentObject = {
        id: `obstacle-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: formName.trim(),
        dimensions: baseDim,
        x: baseX,
        y: baseY,
        z: baseZ,
        color: formColor,
      };
      onUpdatePermanentObjects(luggage.id, [...currentObjects, newObj]);
    }

    cancelForm();
  };

  // Quick Preset Handlers
  const handleApplyPreset = (presetType: 'dual-rails' | 'center-casing' | 'corner-wheels') => {
    const L = luggage.dimensions.length;
    const W = luggage.dimensions.width;
    const H = luggage.dimensions.height;

    let newObjects: PermanentObject[] = [];

    if (presetType === 'dual-rails') {
      // 2 parallel telescoping rods running along luggage floor
      const railLength = Math.max(10, Math.round(L * 0.88));
      const railWidth = 4; // 4 cm wide each
      const railHeight = 3.2; // 3.2 cm deep
      const startX = Math.round((L - railLength) / 2);
      // Space them symmetrically across width (e.g. at 25% and 75% width)
      const y1 = Math.max(2, Math.round(W * 0.22));
      const y2 = Math.min(W - railWidth - 2, Math.round(W * 0.68));

      newObjects = [
        {
          id: `obstacle-rail-left-${Date.now()}`,
          name: 'Handle Rail (Left)',
          dimensions: { length: railLength, width: railWidth, height: railHeight },
          x: startX,
          y: y1,
          z: 0,
          color: '#475569',
        },
        {
          id: `obstacle-rail-right-${Date.now()}`,
          name: 'Handle Rail (Right)',
          dimensions: { length: railLength, width: railWidth, height: railHeight },
          x: startX,
          y: y2,
          z: 0,
          color: '#475569',
        },
      ];
    } else if (presetType === 'center-casing') {
      // Single wide center channel housing
      const casingLength = Math.max(10, Math.round(L * 0.88));
      const casingWidth = Math.min(16, Math.max(8, Math.round(W * 0.32)));
      const casingHeight = 3.5;
      const startX = Math.round((L - casingLength) / 2);
      const startY = Math.round((W - casingWidth) / 2);

      newObjects = [
        {
          id: `obstacle-mono-casing-${Date.now()}`,
          name: 'Monorail Handle Casing',
          dimensions: { length: casingLength, width: casingWidth, height: casingHeight },
          x: startX,
          y: startY,
          z: 0,
          color: '#334155',
        },
      ];
    } else if (presetType === 'corner-wheels') {
      // Two wheel housings inside the luggage at bottom rear corners
      const wheelL = Math.min(12, Math.max(6, Math.round(L * 0.18)));
      const wheelW = Math.min(10, Math.max(6, Math.round(W * 0.22)));
      const wheelH = Math.min(12, Math.max(6, Math.round(H * 0.35)));

      newObjects = [
        {
          id: `obstacle-wheel-1-${Date.now()}`,
          name: 'Corner Wheel Housing (Left)',
          dimensions: { length: wheelL, width: wheelW, height: wheelH },
          x: 0,
          y: 0,
          z: 0,
          color: '#1e293b',
        },
        {
          id: `obstacle-wheel-2-${Date.now()}`,
          name: 'Corner Wheel Housing (Right)',
          dimensions: { length: wheelL, width: wheelW, height: wheelH },
          x: 0,
          y: Math.max(0, W - wheelW),
          z: 0,
          color: '#1e293b',
        },
      ];
    }

    onUpdatePermanentObjects(luggage.id, [...currentObjects, ...newObjects]);
  };

  // Check if active form object exceeds luggage bounds
  const exceedsX = formX + formLength > luggageL + 0.01;
  const exceedsY = formY + formWidth > luggageW + 0.01;
  const exceedsZ = formZ + formHeight > luggageH + 0.01;
  const hasBoundaryError = exceedsX || exceedsY || exceedsZ;

  // 2D Schematic Calculations for SVG
  const svgWidth = 260;
  const svgHeight = 180;
  const padding = 18;
  const maxInnerW = svgWidth - padding * 2;
  const maxInnerH = svgHeight - padding * 2;

  const scale = Math.min(
    maxInnerW / Math.max(1, luggage.dimensions.length),
    maxInnerH / Math.max(1, luggage.dimensions.width)
  );

  const rectW = luggage.dimensions.length * scale;
  const rectH = luggage.dimensions.width * scale;
  const offsetX = padding + (maxInnerW - rectW) / 2;
  const offsetY = padding + (maxInnerH - rectH) / 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl max-w-3xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-200 flex items-start justify-between bg-neutral-50/80">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-neutral-900">
                  Interior Permanent Objects & Handle Casings
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
                  {currentObjects.length} active
                </span>
              </div>
              <p className="text-xs text-neutral-600 mt-0.5">
                Luggage profile: <span className="font-semibold text-neutral-900">{luggage.name}</span> (
                {formatDimensions(luggage.dimensions, units)})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Informational Guidance Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-slate-900">
                Why define interior permanent obstacles?
              </p>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Most wheeled suitcases place telescoping handle rods or wheel wells directly inside the
                interior cavity. By specifying their size and exact position in the container, the 3D packing
                algorithm reserves that volume and accurately places packing cubes around and on top of them.
              </p>
            </div>
          </div>

          {/* Quick-Add Presets Banner */}
          {!isEditingOrAdding && (
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Quick-Add Common Suitcase Interior Fixtures:</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('dual-rails')}
                  className="px-3 py-2 rounded-lg bg-white border border-neutral-200 hover:border-slate-400 hover:bg-slate-50 text-left transition-all text-xs cursor-pointer shadow-2xs group"
                >
                  <span className="font-semibold text-neutral-900 block group-hover:text-slate-900">
                    Dual Handle Rails
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    2 floor rails spaced across bottom
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('center-casing')}
                  className="px-3 py-2 rounded-lg bg-white border border-neutral-200 hover:border-slate-400 hover:bg-slate-50 text-left transition-all text-xs cursor-pointer shadow-2xs group"
                >
                  <span className="font-semibold text-neutral-900 block group-hover:text-slate-900">
                    Mono Center Casing
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    Single central handle box along floor
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('corner-wheels')}
                  className="px-3 py-2 rounded-lg bg-white border border-neutral-200 hover:border-slate-400 hover:bg-slate-50 text-left transition-all text-xs cursor-pointer shadow-2xs group"
                >
                  <span className="font-semibold text-neutral-900 block group-hover:text-slate-900">
                    Internal Wheel Housings
                  </span>
                  <span className="text-[10px] text-neutral-500 block mt-0.5">
                    2 housings at bottom rear corners
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Form for Creating / Editing an Obstacle */}
          {isEditingOrAdding ? (
            <form
              onSubmit={handleFormSubmit}
              className="p-4 rounded-xl bg-slate-50/60 border-2 border-slate-300 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  {editingId ? 'Edit Interior Obstacle' : 'Add New Interior Obstacle'}
                </h4>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="p-1 rounded text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid with Fields on Left, Schematic on Right */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Inputs: 7 cols */}
                <div className="md:col-span-7 space-y-3">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Obstacle Name / Label
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Telescoping Handle Rod"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white"
                      required
                    />
                  </div>

                  {/* Dimensions */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-1">
                      <span>Obstacle Dimensions ({units})</span>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        Max Container: {luggageL} × {luggageW} × {luggageH} {units}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-neutral-500 font-mono block">Length (X)</span>
                        <input
                          type="number"
                          step={units === 'in' ? '0.1' : '0.5'}
                          min="0.5"
                          value={formLength}
                          onChange={(e) => setFormLength(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 font-mono block">Width (Y)</span>
                        <input
                          type="number"
                          step={units === 'in' ? '0.1' : '0.5'}
                          min="0.5"
                          value={formWidth}
                          onChange={(e) => setFormWidth(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 font-mono block">Height (Z)</span>
                        <input
                          type="number"
                          step={units === 'in' ? '0.1' : '0.5'}
                          min="0.5"
                          value={formHeight}
                          onChange={(e) => setFormHeight(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Position in Container (X, Y, Z) */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 mb-1">
                      <span>Position in Container ({units})</span>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        Offset from corner (0, 0, 0)
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-neutral-500 font-mono block">X (from left)</span>
                        <input
                          type="number"
                          step={units === 'in' ? '0.1' : '0.5'}
                          min="0"
                          value={formX}
                          onChange={(e) => setFormX(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 font-mono block">Y (from front)</span>
                        <input
                          type="number"
                          step={units === 'in' ? '0.1' : '0.5'}
                          min="0"
                          value={formY}
                          onChange={(e) => setFormY(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 font-mono block">Z (from floor)</span>
                        <input
                          type="number"
                          step={units === 'in' ? '0.1' : '0.5'}
                          min="0"
                          value={formZ}
                          onChange={(e) => setFormZ(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-xs rounded border border-neutral-300 bg-white"
                        />
                      </div>
                    </div>

                    {/* Quick Align Buttons */}
                    <div className="flex items-center flex-wrap gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setFormZ(0)}
                        className="px-2 py-0.5 rounded bg-white border border-neutral-300 hover:bg-neutral-100 text-[10px] font-medium text-neutral-700 cursor-pointer"
                      >
                        Floor (Z=0)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormX(0)}
                        className="px-2 py-0.5 rounded bg-white border border-neutral-300 hover:bg-neutral-100 text-[10px] font-medium text-neutral-700 cursor-pointer"
                      >
                        Flush Left (X=0)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormX(Math.max(0, Math.round(((luggageL - formLength) / 2) * 10) / 10))
                        }
                        className="px-2 py-0.5 rounded bg-white border border-neutral-300 hover:bg-neutral-100 text-[10px] font-medium text-neutral-700 cursor-pointer"
                      >
                        Center Length (X)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormY(Math.max(0, Math.round(((luggageW - formWidth) / 2) * 10) / 10))
                        }
                        className="px-2 py-0.5 rounded bg-white border border-neutral-300 hover:bg-neutral-100 text-[10px] font-medium text-neutral-700 cursor-pointer"
                      >
                        Center Width (Y)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormY(0)}
                        className="px-2 py-0.5 rounded bg-white border border-neutral-300 hover:bg-neutral-100 text-[10px] font-medium text-neutral-700 cursor-pointer"
                      >
                        Flush Front (Y=0)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormY(Math.max(0, Math.round((luggageW - formWidth) * 10) / 10))
                        }
                        className="px-2 py-0.5 rounded bg-white border border-neutral-300 hover:bg-neutral-100 text-[10px] font-medium text-neutral-700 cursor-pointer"
                      >
                        Flush Rear (Y=Max)
                      </button>
                    </div>
                  </div>

                  {/* Color Picker */}
                  <div>
                    <span className="block text-[10px] font-semibold text-neutral-700 mb-1">
                      Obstacle Render Color
                    </span>
                    <div className="flex items-center space-x-1.5">
                      {OBSTACLE_COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormColor(c)}
                          className={`w-5 h-5 rounded-md border-2 transition-transform cursor-pointer ${
                            formColor === c
                              ? 'scale-115 border-neutral-900 ring-2 ring-slate-400'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interactive Schematic on Right: 5 cols */}
                <div className="md:col-span-5 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200">
                  <div className="text-[11px] font-semibold text-neutral-600 mb-1.5 flex items-center justify-between w-full">
                    <span>Floor Footprint (Top View)</span>
                    <span className="font-mono text-[10px] text-neutral-400">
                      {luggageL} × {luggageW} {units}
                    </span>
                  </div>

                  <svg
                    width={svgWidth}
                    height={svgHeight}
                    className="border border-neutral-200 rounded-lg bg-neutral-50 shadow-inner"
                  >
                    {/* Luggage Interior Floor Boundary */}
                    <rect
                      x={offsetX}
                      y={offsetY}
                      width={rectW}
                      height={rectH}
                      fill="#f1f5f9"
                      stroke="#0284c7"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />

                    {/* Existing other obstacles */}
                    {currentObjects
                      .filter((o) => o.id !== editingId)
                      .map((o) => {
                        const ox = offsetX + o.x * scale;
                        const oy = offsetY + o.y * scale;
                        const ow = o.dimensions.length * scale;
                        const oh = o.dimensions.width * scale;
                        return (
                          <rect
                            key={o.id}
                            x={ox}
                            y={oy}
                            width={ow}
                            height={oh}
                            fill={o.color || '#64748b'}
                            opacity="0.4"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                        );
                      })}

                    {/* Active obstacle being configured */}
                    {(() => {
                      const curBaseL = toBase(formLength, units);
                      const curBaseW = toBase(formWidth, units);
                      const curBaseX = toBase(formX, units);
                      const curBaseY = toBase(formY, units);

                      const ox = offsetX + curBaseX * scale;
                      const oy = offsetY + curBaseY * scale;
                      const ow = curBaseL * scale;
                      const oh = curBaseW * scale;

                      return (
                        <rect
                          x={ox}
                          y={oy}
                          width={ow}
                          height={oh}
                          fill={hasBoundaryError ? '#ef4444' : formColor}
                          opacity="0.85"
                          stroke={hasBoundaryError ? '#b91c1c' : '#0f172a'}
                          strokeWidth="2"
                        />
                      );
                    })()}
                  </svg>

                  {/* Boundary validation message */}
                  {hasBoundaryError ? (
                    <div className="mt-2 text-[11px] text-rose-600 font-medium flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Warning: Obstacle extends outside luggage walls!</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Fits within luggage boundary</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-medium text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hasBoundaryError}
                  className={`inline-flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs cursor-pointer ${
                    hasBoundaryError
                      ? 'bg-neutral-400 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Save Changes' : 'Add Obstacle'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Button to add a custom obstacle */
            <div className="flex justify-end">
              <button
                type="button"
                onClick={startAdd}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Obstacle</span>
              </button>
            </div>
          )}

          {/* List of Configured Obstacles */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              Active Obstacles on this Luggage ({currentObjects.length})
            </h4>

            {currentObjects.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
                <p className="text-xs text-neutral-500 font-medium">
                  No interior obstacles defined for this luggage.
                </p>
                <p className="text-[11px] text-neutral-400 mt-1">
                  The luggage interior is currently treated as an unobstructed open box.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {currentObjects.map((obj) => {
                  const volLiters = computeVolumeLiters(obj.dimensions);
                  return (
                    <div
                      key={obj.id}
                      className="p-3 rounded-xl border border-neutral-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span
                          className="w-4 h-4 rounded-md shrink-0 border border-black/10 shadow-2xs"
                          style={{ backgroundColor: obj.color || '#475569' }}
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-neutral-900 truncate">
                            {obj.name}
                          </h5>
                          <div className="flex items-center space-x-2 text-[11px] text-neutral-500 font-mono mt-0.5">
                            <span>
                              Size: {formatDimensions(obj.dimensions, units)}
                            </span>
                            <span>•</span>
                            <span>
                              At: ({fromBase(obj.x, units)}, {fromBase(obj.y, units)}, {fromBase(obj.z, units)}) {units}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800 font-mono block">
                            {volLiters} L
                          </span>
                          <span className="text-[10px] text-neutral-400">deducted</span>
                        </div>

                        <div className="flex items-center space-x-1 border-l border-neutral-200 pl-2">
                          <button
                            type="button"
                            onClick={() => startEdit(obj)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Edit obstacle"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(obj)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Duplicate obstacle"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(obj.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete obstacle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Capacity Summary */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4 text-neutral-600">
            <div>
              <span className="text-neutral-400 block text-[10px]">Gross Container</span>
              <span className="font-bold text-neutral-800 font-mono">
                {computeVolumeLiters(luggage.dimensions)} L
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px]">Permanent Fixtures</span>
              <span className="font-bold text-slate-700 font-mono">
                -{formatVolume(totalObstaclesVol, units)} ({obstaclePercent}%)
              </span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px]">Net Usable Cavity</span>
              <span className="font-bold text-emerald-700 font-mono">
                {formatVolume(usableVol, units)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer"
          >
            Done & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
