import React from 'react';
import { PackingResult, Dimensions, UnitSystem } from '../types';
import { formatVolume, fromBase, formatDimensions } from '../utils/units';
import { AlertTriangle, CheckCircle2, TrendingUp, Sparkles, Box, ShieldAlert, ShoppingBag } from 'lucide-react';

interface WastedSpaceAuditProps {
  luggageDimensions: Dimensions;
  packingResult: PackingResult;
  units: UnitSystem;
  onOpenSuggestions?: () => void;
}

export const WastedSpaceAudit: React.FC<WastedSpaceAuditProps> = ({
  luggageDimensions,
  packingResult,
  units,
  onOpenSuggestions,
}) => {
  const {
    totalLuggageVolume,
    usableLuggageVolume,
    permanentObjectsVolume,
    permanentObjects,
    totalPackedVolume,
    wastedVolume,
    efficiencyPercentage,
    wastedPercentage,
    wastedPockets,
    placedCubes,
    unplacedCubes,
  } = packingResult;

  const hasPermanentObjects = (permanentObjectsVolume ?? 0) > 0;
  const packedPct = totalLuggageVolume > 0 ? ((totalPackedVolume / totalLuggageVolume) * 100) : 0;
  const obstaclePct = totalLuggageVolume > 0 ? (((permanentObjectsVolume ?? 0) / totalLuggageVolume) * 100) : 0;
  const freePct = Math.max(0, 100 - packedPct - obstaclePct);

  // Efficiency classification
  let efficiencyGrade = 'Excellent';
  let gradeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (efficiencyPercentage < 50) {
    efficiencyGrade = 'Low (Lots of Free Space)';
    gradeColor = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (efficiencyPercentage < 75) {
    efficiencyGrade = 'Moderate Utilization';
    gradeColor = 'text-sky-700 bg-sky-50 border-sky-200';
  } else if (efficiencyPercentage >= 85) {
    efficiencyGrade = 'Ultra-Dense Pack';
    gradeColor = 'text-purple-700 bg-purple-50 border-purple-200';
  }

  // Calculate highest placed cube point to find exact top clearance
  const maxZ = placedCubes.reduce((acc, b) => Math.max(acc, b.z + b.placedHeight), 0);
  const topClearance = Math.max(0, luggageDimensions.height - maxZ);

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className={`grid grid-cols-1 ${hasPermanentObjects ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
        {/* Card 1: Utilized Volume */}
        <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-2xs">
          <div className="text-xs font-medium text-neutral-500 mb-1">Packed Item Volume</div>
          <div className="text-xl font-bold text-neutral-900">
            {formatVolume(totalPackedVolume, units)}
          </div>
          <div className="text-xs text-neutral-600 mt-1">
            {placedCubes.length} items successfully packed
          </div>
        </div>

        {/* Card 2: Permanent Interior Obstacles (if any) */}
        {hasPermanentObjects && (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-2xs">
            <div className="text-xs font-medium text-slate-600 mb-1">Interior Obstacles</div>
            <div className="text-xl font-bold text-slate-800">
              {formatVolume(permanentObjectsVolume ?? 0, units)}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {(permanentObjects ?? []).length} fixtures (usable: {formatVolume(usableLuggageVolume ?? totalLuggageVolume, units)})
            </div>
          </div>
        )}

        {/* Card 3: Wasted / Free Space */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-2xs">
          <div className="text-xs font-medium text-amber-700 mb-1">Unused Wasted Space</div>
          <div className="text-xl font-bold text-amber-900">
            {formatVolume(wastedVolume, units)}
          </div>
          <div className="text-xs text-amber-800 mt-1 font-medium">
            {wastedPercentage}% of usable space is empty
          </div>
        </div>

        {/* Card 4: Efficiency Rating */}
        <div className={`p-4 rounded-xl border ${gradeColor} shadow-2xs`}>
          <div className="text-xs font-medium opacity-80 mb-1">Packing Density Grade</div>
          <div className="text-xl font-bold">{efficiencyPercentage}%</div>
          <div className="text-xs font-semibold mt-1">{efficiencyGrade}</div>
        </div>
      </div>

      {/* Progress Bar of Space */}
      <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-neutral-700">Space Allocation Breakdown</span>
          <span className="text-neutral-500 font-mono">
            {hasPermanentObjects
              ? `Gross: ${formatVolume(totalLuggageVolume, units)} · Net Usable: ${formatVolume(usableLuggageVolume ?? totalLuggageVolume, units)}`
              : `Total Container Capacity: ${formatVolume(totalLuggageVolume, units)}`}
          </span>
        </div>

        <div className="h-4 w-full bg-amber-100 rounded-full overflow-hidden flex border border-neutral-200">
          <div
            className="h-full bg-emerald-600 transition-all duration-300 relative group"
            style={{ width: `${Math.min(100, packedPct)}%` }}
            title={`Packed items: ${packedPct.toFixed(1)}%`}
          />
          {hasPermanentObjects && (
            <div
              className="h-full bg-slate-600 transition-all duration-300 relative group"
              style={{ width: `${Math.min(100, obstaclePct)}%` }}
              title={`Interior Obstacles: ${obstaclePct.toFixed(1)}%`}
            />
          )}
          <div
            className="h-full bg-amber-400/80 transition-all duration-300 relative group"
            style={{ width: `${Math.max(0, freePct)}%` }}
            title={`Unused space: ${freePct.toFixed(1)}%`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-2 flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>Packed Items ({efficiencyPercentage}% of usable)</span>
            </div>
            {hasPermanentObjects && (
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                <span className="font-medium text-slate-700">
                  Interior Obstacles ({obstaclePct.toFixed(1)}% of total)
                </span>
              </div>
            )}
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              <span className="font-semibold text-amber-900">
                Unoccupied Void ({wastedPercentage}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Unplaced Items Alert if any */}
      {unplacedCubes.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 shadow-xs">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">
                Capacity Exceeded: {unplacedCubes.reduce((acc, c) => acc + c.unplacedCount, 0)} Items
                Could Not Fit
              </h4>
              <p className="text-xs text-rose-800 mt-1">
                The following cubes exceed the luggage boundaries or cannot fit into the remaining
                voids:
              </p>
              <ul className="mt-2 space-y-1 text-xs list-disc list-inside font-medium">
                {unplacedCubes.map((item) => (
                  <li key={item.cube.id}>
                    {item.unplacedCount}× {item.cube.name} (
                    {formatDimensions(item.cube.dimensions, units)})
                  </li>
                ))}
              </ul>
              <p className="text-xs text-rose-700 mt-2">
                Tip: Try switching to a larger luggage profile or reducing quantities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Identified Wasted Pockets & Filling Suggestions */}
      <div className="p-4 rounded-xl border border-neutral-200 bg-white shadow-xs">
        <div className="flex items-center space-x-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-neutral-900">
            Wasted Space Diagnostic & Filler Recommendations
          </h3>
        </div>

        <div className="space-y-2.5">
          {topClearance >= 1.5 && (
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 flex items-start justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-amber-950 block">
                  Top Headroom Clearance: {fromBase(topClearance, units)} {units} remaining
                </span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  There is vertical headroom across the top of your packed cubes.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-block px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-semibold">
                  Recommended Fillers
                </span>
                <p className="text-[11px] text-amber-900 mt-1">
                  Laptop sleeve, jackets, or folded garment
                </p>
              </div>
            </div>
          )}

          {wastedPockets
            .filter((p) => p.id !== 'pocket-top-headroom')
            .map((pocket) => (
              <div
                key={pocket.id}
                className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-semibold text-neutral-900 block">{pocket.description}</span>
                  <span className="text-neutral-500 font-mono text-[11px]">
                    Size: {fromBase(pocket.length, units)} × {fromBase(pocket.width, units)} ×{' '}
                    {fromBase(pocket.height, units)} {units}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-neutral-700 font-mono font-medium">
                    {formatVolume(pocket.volume, units)}
                  </span>
                  <p className="text-[10px] text-neutral-500">Unused boundary gap</p>
                </div>
              </div>
            ))}

          {wastedPockets.length === 0 && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Near-perfect tight fit! No large contiguous empty voids detected.
              </span>
            </div>
          )}

          {wastedVolume > 1000 && onOpenSuggestions && (
            <button
              type="button"
              onClick={onOpenSuggestions}
              className="w-full mt-1 p-2.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 transition-colors flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-semibold">
                  Want to minimize this wasted space?
                </span>
              </div>
              <span className="text-[11px] font-bold text-purple-700 underline">
                See Suggested Cube Sizes to Buy →
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
