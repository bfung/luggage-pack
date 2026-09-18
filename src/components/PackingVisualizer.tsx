import React, { useState } from 'react';
import { Dimensions, LuggageProfile, PackingCubeItem, PackingResult, UnitSystem } from '../types';
import { fromBase, formatDimensions, formatVolume } from '../utils/units';
import { Isometric3DView } from './Isometric3DView';
import { WastedSpaceAudit } from './WastedSpaceAudit';
import { Box, PieChart, AlertTriangle, CheckCircle2, RotateCw } from 'lucide-react';

interface PackingVisualizerProps {
  luggage: LuggageProfile;
  cubes: PackingCubeItem[];
  packingResult: PackingResult;
  units: UnitSystem;
  onRecalculate?: () => void;
  onOpenSuggestions?: () => void;
}

export const PackingVisualizer: React.FC<PackingVisualizerProps> = ({
  luggage,
  cubes,
  packingResult,
  units,
  onRecalculate,
  onOpenSuggestions,
}) => {
  const [activeTab, setActiveTab] = useState<'3d' | 'audit'>('3d');

  const {
    placedCubes,
    unplacedCubes,
    totalLuggageVolume,
    totalPackedVolume,
    wastedVolume,
    efficiencyPercentage,
    wastedPercentage,
  } = packingResult;

  const totalQueuedItems = cubes.reduce((sum, c) => sum + (c.quantity || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-5">
      {/* Top Banner: Status & Efficiency */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-neutral-900">
              Arrangement & Wasted Space Visualizer
            </h2>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                efficiencyPercentage >= 70
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {efficiencyPercentage}% Utilized
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Optimized layout inside {luggage.name} ({formatDimensions(luggage.dimensions, units)})
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-neutral-50 border border-neutral-200">
            <span className="text-neutral-500 block text-[10px]">Packed Items</span>
            <span className="font-bold text-neutral-900">
              {placedCubes.length} of {totalQueuedItems}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
            <span className="text-amber-700 block text-[10px]">Wasted Space</span>
            <span className="font-bold text-amber-900">
              {formatVolume(wastedVolume, units)} ({wastedPercentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* Unplaced Items Alert Banner (if any cubes could not fit) */}
      {unplacedCubes.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-amber-950">
              {unplacedCubes.reduce((sum, u) => sum + u.unplacedCount, 0)} item(s) could not fit inside {luggage.name}
            </div>
            <p className="text-amber-800 text-[11px] mt-0.5">
              The luggage volume is fully packed or remaining void pockets cannot accommodate these items:
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {unplacedCubes.map((u) => (
                <span
                  key={u.cube.id}
                  className="px-2 py-0.5 bg-white border border-amber-300 rounded text-[11px] font-medium text-amber-900 shadow-2xs"
                >
                  {u.unplacedCount}× {u.cube.name} ({formatDimensions(u.cube.dimensions, units)})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs for Views */}
      <div className="flex items-center justify-between">
        <div className="inline-flex p-1 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('3d')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === '3d'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Box className="w-4 h-4 text-purple-600" />
            <span>3D Isometric Model</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'audit'
                ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <PieChart className="w-4 h-4 text-amber-600" />
            <span>Wasted Space Audit</span>
          </button>
        </div>

        {onRecalculate && (
          <button
            type="button"
            onClick={onRecalculate}
            className="inline-flex items-center space-x-1 text-xs text-neutral-600 hover:text-neutral-900 p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
            title="Recalculate packing"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Recalculate</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === '3d' && (
        <Isometric3DView
          luggageDimensions={luggage.dimensions}
          packingResult={packingResult}
          units={units}
        />
      )}

      {activeTab === 'audit' && (
        <WastedSpaceAudit
          luggageDimensions={luggage.dimensions}
          packingResult={packingResult}
          units={units}
          onOpenSuggestions={onOpenSuggestions}
        />
      )}

      {/* Placed Items Manifest List */}
      {placedCubes.length > 0 && (
        <div className="pt-3 border-t border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              Packing Manifest ({placedCubes.length} Placed Elements)
            </h3>
            <span className="text-xs text-neutral-400">Coordinates in {units}</span>
          </div>

          <div className="max-h-48 overflow-y-auto border border-neutral-200 rounded-lg divide-y divide-neutral-100 text-xs">
            {placedCubes.map((c, i) => (
              <div
                key={c.instanceId}
                className="px-3 py-2 flex items-center justify-between bg-white hover:bg-neutral-50"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono text-neutral-400 text-[11px] w-4">#{i + 1}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="font-medium text-neutral-800">{c.name}</span>
                  <span className="text-[10px] text-neutral-400 italic">({c.rotationName})</span>
                </div>

                <div className="flex items-center space-x-4 font-mono text-neutral-500 text-[11px]">
                  <span>
                    Dim: {fromBase(c.placedLength, units)}×{fromBase(c.placedWidth, units)}×
                    {fromBase(c.placedHeight, units)}
                  </span>
                  <span className="text-neutral-700">
                    Pos: ({fromBase(c.x, units)}, {fromBase(c.y, units)}, {fromBase(c.z, units)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
