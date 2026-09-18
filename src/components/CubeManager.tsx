import React, { useState } from 'react';
import { PackingCubeItem, UnitSystem, Dimensions } from '../types';
import { fromBase, toBase, formatDimensions, computeVolumeLiters } from '../utils/units';
import { Layers, Plus, Trash2, Edit3, Check, X, Minus, Sparkles, ShoppingBag, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CubeManagerProps {
  units: UnitSystem;
  cubesList: PackingCubeItem[];
  placedCounts?: Record<string, number>;
  onAddCube: (cube: PackingCubeItem) => void;
  onUpdateCube: (cube: PackingCubeItem) => void;
  onDeleteCube: (id: string) => void;
  onUpdateQuantity: (id: string, newQty: number) => void;
  onPackSamplePreset: () => void;
  onOpenSuggestions?: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // rose
  '#84cc16', // lime
  '#6366f1', // indigo
  '#f97316', // orange
];

const CATEGORIES: PackingCubeItem['category'][] = [
  'clothing',
  'toiletries',
  'tech',
  'shoes',
  'accessories',
  'other',
];

export const CubeManager: React.FC<CubeManagerProps> = ({
  units,
  cubesList,
  placedCounts,
  onAddCube,
  onUpdateCube,
  onDeleteCube,
  onUpdateQuantity,
  onPackSamplePreset,
  onOpenSuggestions,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formLength, setFormLength] = useState<number>(28);
  const [formWidth, setFormWidth] = useState<number>(18);
  const [formHeight, setFormHeight] = useState<number>(9);
  const [formColor, setFormColor] = useState<string>('#3b82f6');
  const [formCategory, setFormCategory] = useState<PackingCubeItem['category']>('clothing');
  const [formQuantity, setFormQuantity] = useState<number>(1);

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormName('Custom Packing Cube');
    setFormLength(units === 'in' ? 11 : 28);
    setFormWidth(units === 'in' ? 7 : 18);
    setFormHeight(units === 'in' ? 3.5 : 9);
    setFormColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setFormCategory('clothing');
    setFormQuantity(1);
  };

  const startEdit = (cube: PackingCubeItem) => {
    setEditingId(cube.id);
    setIsCreating(false);
    setFormName(cube.name);
    setFormLength(fromBase(cube.dimensions.length, units));
    setFormWidth(fromBase(cube.dimensions.width, units));
    setFormHeight(fromBase(cube.dimensions.height, units));
    setFormColor(cube.color);
    setFormCategory(cube.category);
    setFormQuantity(cube.quantity);
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const baseDimensions: Dimensions = {
      length: Math.max(2, toBase(formLength, units)),
      width: Math.max(2, toBase(formWidth, units)),
      height: Math.max(2, toBase(formHeight, units)),
    };

    if (isCreating) {
      const newCube: PackingCubeItem = {
        id: `cube-custom-${Date.now()}`,
        name: formName.trim(),
        dimensions: baseDimensions,
        color: formColor,
        category: formCategory,
        quantity: Math.max(1, formQuantity),
        allowRotation: true,
      };
      onAddCube(newCube);
    } else if (editingId) {
      const updated: PackingCubeItem = {
        id: editingId,
        name: formName.trim(),
        dimensions: baseDimensions,
        color: formColor,
        category: formCategory,
        quantity: Math.max(0, formQuantity),
        allowRotation: true,
      };
      onUpdateCube(updated);
    }

    cancelForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (cubesList.length <= 1) {
      alert('You must have at least one packing cube in your list.');
      return;
    }
    if (window.confirm(`Delete "${name}"?`)) {
      onDeleteCube(id);
    }
  };

  const totalQuantity = cubesList.reduce((acc, c) => acc + c.quantity, 0);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Packing Cubes & Items</h2>
            <p className="text-xs text-neutral-500">
              Customize dimensions, colors, and pack counts
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isCreating && !editingId && (
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Cube</span>
            </button>
          )}
        </div>
      </div>

      {/* Creation / Editing Form */}
      {(isCreating || editingId) && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
              {isCreating ? 'Add New Packing Cube' : 'Edit Packing Cube'}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Cube Label / Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Medium Shirts Cube"
                  className="w-full px-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as PackingCubeItem['category'])}
                  className="w-full px-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 capitalize"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Length ({units})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="150"
                  required
                  value={formLength}
                  onChange={(e) => setFormLength(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Width ({units})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="150"
                  required
                  value={formWidth}
                  onChange={(e) => setFormWidth(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Height ({units})
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="150"
                  required
                  value={formHeight}
                  onChange={(e) => setFormHeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quantity and Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Initial Quantity to Pack
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-24 px-2.5 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Color Tag
                </label>
                <div className="flex items-center space-x-1.5 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        formColor === c ? 'scale-120 border-neutral-900' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
                className="inline-flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isCreating ? 'Add Cube' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Cubes List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-neutral-500 pb-1">
          <span>
            {cubesList.length} Cube Types ({totalQuantity} Total Items queued for packing)
          </span>
          <button
            type="button"
            onClick={onPackSamplePreset}
            className="text-xs text-sky-600 hover:text-sky-700 font-medium inline-flex items-center space-x-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Load Typical Vacation Pack</span>
          </button>
        </div>

        <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
          {cubesList.map((cube) => {
            const vol = computeVolumeLiters(cube.dimensions);
            return (
              <div
                key={cube.id}
                className="p-3 bg-white hover:bg-neutral-50/70 transition-colors flex items-center justify-between group gap-2"
              >
                {/* Left info */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className="w-4 h-4 rounded-md shrink-0 shadow-2xs"
                    style={{ backgroundColor: cube.color }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-neutral-900 truncate">
                        {cube.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 capitalize">
                        {cube.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono flex items-center space-x-2 flex-wrap">
                      <span>{formatDimensions(cube.dimensions, units)} · {vol} L</span>
                      {cube.quantity > 0 && placedCounts && (
                        <span>
                          {(placedCounts[cube.id] || 0) === cube.quantity ? (
                            <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                              <span>{(placedCounts[cube.id] || 0)} of {cube.quantity} packed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              <span>{(placedCounts[cube.id] || 0)} of {cube.quantity} packed</span>
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Quantity Controls & Actions */}
                <div className="flex items-center space-x-3 shrink-0">
                  {/* Quantity Stepper */}
                  <div className="flex items-center space-x-1 bg-neutral-100 p-1 rounded-lg border border-neutral-200">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(cube.id, Math.max(0, cube.quantity - 1))}
                      className="w-6 h-6 rounded flex items-center justify-center bg-white text-neutral-700 hover:bg-neutral-50 shadow-2xs active:scale-95 transition-transform"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold font-mono text-neutral-900">
                      {cube.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(cube.id, cube.quantity + 1)}
                      className="w-6 h-6 rounded flex items-center justify-center bg-white text-neutral-700 hover:bg-neutral-50 shadow-2xs active:scale-95 transition-transform"
                      title="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => startEdit(cube)}
                      className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors"
                      title="Edit dimensions"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {cubesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDelete(cube.id, cube.name)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                        title="Delete cube"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Suggestion Callout CTA */}
        {onOpenSuggestions && (
          <button
            type="button"
            onClick={onOpenSuggestions}
            className="w-full mt-2 p-3 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/60 text-purple-900 transition-colors flex items-center justify-between text-xs group text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg bg-purple-200/70 text-purple-800">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold block">Suggest Cube Sizes to Buy</span>
                <span className="text-[11px] text-purple-700">
                  Target & minimize remaining luggage void space
                </span>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-purple-700 group-hover:translate-x-0.5 transition-transform">
              View Suggestions →
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
