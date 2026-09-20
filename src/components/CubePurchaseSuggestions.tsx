import React, { useState, useMemo } from 'react';
import {
  LuggageProfile,
  PackingCubeItem,
  PackingResult,
  SuggestedCubeRecommendation,
  UnitSystem,
} from '../types';
import { generateCubePurchaseSuggestions } from '../utils/suggestionEngine';
import { fromBase, formatDimensions, formatVolume } from '../utils/units';
import {
  Sparkles,
  ShoppingBag,
  Plus,
  Check,
  TrendingUp,
  Maximize2,
  Box,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface CubePurchaseSuggestionsProps {
  luggage: LuggageProfile;
  cubes: PackingCubeItem[];
  packingResult: PackingResult;
  allowRotation: boolean;
  fabricThickness?: number;
  units: UnitSystem;
  onAddSuggestedCube: (cube: SuggestedCubeRecommendation) => void;
  onAddBundle: (cubes: SuggestedCubeRecommendation[]) => void;
}

export const CubePurchaseSuggestions: React.FC<CubePurchaseSuggestionsProps> = ({
  luggage,
  cubes,
  packingResult,
  allowRotation,
  fabricThickness,
  units,
  onAddSuggestedCube,
  onAddBundle,
}) => {
  const [filterArea, setFilterArea] = useState<string>('all');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Generate recommendations based on current luggage, cubes, and result
  const recommendations = useMemo(() => {
    return generateCubePurchaseSuggestions(luggage, cubes, packingResult, allowRotation, fabricThickness);
  }, [luggage, cubes, packingResult, allowRotation, fabricThickness]);

  const filteredRecommendations = useMemo(() => {
    if (filterArea === 'all') return recommendations;
    return recommendations.filter((r) => r.targetArea === filterArea);
  }, [recommendations, filterArea]);

  // Top 2 complementary cubes for the bundle recommendation
  const topBundle = useMemo(() => {
    if (recommendations.length < 2) return [];
    return [recommendations[0], recommendations[1]];
  }, [recommendations]);

  const bundleEfficiencyGain = useMemo(() => {
    if (topBundle.length === 0) return 0;
    return Number((topBundle.reduce((sum, r) => sum + r.projectedEfficiencyGain, 0) * 0.85).toFixed(1));
  }, [topBundle]);

  const bundleVolumeRecovery = useMemo(() => {
    if (topBundle.length === 0) return 0;
    return Number(topBundle.reduce((sum, r) => sum + r.recoveredVolumeLiters, 0).toFixed(1));
  }, [topBundle]);

  const handleAddOne = (rec: SuggestedCubeRecommendation) => {
    onAddSuggestedCube(rec);
    setAddedIds((prev) => new Set(prev).add(rec.id));
  };

  const handleAddBundleClick = () => {
    if (topBundle.length === 0) return;
    onAddBundle(topBundle);
    setAddedIds((prev) => {
      const next = new Set(prev);
      topBundle.forEach((r) => next.add(r.id));
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-neutral-900">
                Recommended Cube Sizes to Buy
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                AI Void Optimization
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Sizes calculated to fit specifically into the remaining empty voids of {luggage.name}
            </p>
          </div>
        </div>

        {/* Current Available Space to Optimize */}
        <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl text-xs shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <div>
            <span className="text-neutral-500 text-[10px] block">Wasted Space Available</span>
            <span className="font-bold text-amber-900 font-mono">
              {formatVolume(packingResult.wastedVolume, units)} ({packingResult.wastedPercentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* Recommended Bundle Card (if at least 2 recommendations available) */}
      {topBundle.length >= 2 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Recommended Ideal 2-Piece Expansion Set</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Recover ~{bundleVolumeRecovery} L of Wasted Space (+{bundleEfficiencyGain}% Efficiency)
            </h3>
            <p className="text-xs text-purple-200 leading-relaxed">
              Pairing{' '}
              <strong>
                {topBundle[0].name} ({formatDimensions(topBundle[0].dimensions, units)})
              </strong>{' '}
              with{' '}
              <strong>
                {topBundle[1].name} ({formatDimensions(topBundle[1].dimensions, units)})
              </strong>{' '}
              simultaneously locks in both your vertical headroom and lateral margins.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddBundleClick}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-neutral-900 text-xs font-bold hover:bg-purple-50 transition-colors shadow-xs shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4 text-purple-700" />
            <span>Add Both to My Cubes</span>
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setFilterArea('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterArea === 'all'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          All Sizes ({recommendations.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterArea('headroom')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterArea === 'headroom'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Top Headroom Slices (
          {recommendations.filter((r) => r.targetArea === 'headroom').length})
        </button>

        <button
          type="button"
          onClick={() => setFilterArea('side-margin')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterArea === 'side-margin'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Side Margin & Tubes (
          {recommendations.filter((r) => r.targetArea === 'side-margin').length})
        </button>

        <button
          type="button"
          onClick={() => setFilterArea('corner-void')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterArea === 'corner-void'
              ? 'bg-neutral-900 text-white shadow-2xs'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
        >
          Corner & Compact Pouches (
          {recommendations.filter((r) => r.targetArea === 'corner-void').length})
        </button>
      </div>

      {/* Recommendations Grid */}
      {filteredRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredRecommendations.map((rec) => {
            const isAdded = addedIds.has(rec.id);
            const dispL = fromBase(rec.dimensions.length, units);
            const dispW = fromBase(rec.dimensions.width, units);
            const dispH = fromBase(rec.dimensions.height, units);

            let targetBadge = 'Top Headroom';
            let targetColor = 'bg-sky-50 text-sky-700 border-sky-200';
            if (rec.targetArea === 'side-margin') {
              targetBadge = 'Side Margin Tube';
              targetColor = 'bg-purple-50 text-purple-700 border-purple-200';
            } else if (rec.targetArea === 'corner-void') {
              targetBadge = 'Corner Void';
              targetColor = 'bg-amber-50 text-amber-700 border-amber-200';
            } else if (rec.targetArea === 'modular-gap') {
              targetBadge = 'Modular Gap';
              targetColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            }

            return (
              <div
                key={rec.id}
                className="p-4 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all flex flex-col justify-between space-y-3 relative group shadow-2xs"
              >
                {/* Top Info */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-md shrink-0 shadow-2xs"
                        style={{ backgroundColor: rec.color }}
                      />
                      <h4 className="text-sm font-bold text-neutral-900 truncate">{rec.name}</h4>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0 ${targetColor}`}
                    >
                      {targetBadge}
                    </span>
                  </div>

                  {/* Dimensions & Capacity */}
                  <div className="flex items-center space-x-3 text-xs font-mono text-neutral-600 mt-2">
                    <span className="font-semibold text-neutral-900">
                      {dispL} × {dispW} × {dispH} {units}
                    </span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-neutral-500">{rec.volumeLiters} L Capacity</span>
                  </div>

                  {/* Impact metrics pills */}
                  <div className="flex items-center space-x-2 mt-2.5">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      <span>+{rec.projectedEfficiencyGain}% Space</span>
                    </span>

                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px] font-mono font-medium">
                      <span>Fills ~{rec.recoveredVolumeLiters} L void</span>
                    </span>

                    <span className="text-[10px] text-neutral-400 font-medium ml-auto">
                      Fit Score: {rec.idealFitScore}/100
                    </span>
                  </div>

                  {/* Contextual Reason */}
                  <p className="text-xs text-neutral-600 mt-2.5 leading-relaxed bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                    {rec.reason}
                  </p>
                </div>

                {/* Bottom Action */}
                <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400 capitalize">
                    Category: {rec.category}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleAddOne(rec)}
                    disabled={isAdded}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isAdded
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-2xs active:scale-95'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Added to My Cubes</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add & Test Fit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
          <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-900">
            Near Optimal Density Reached!
          </h4>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Your luggage currently has {packingResult.efficiencyPercentage}% space utilization. There
            are no large contiguous voids remaining to fit additional packing cube sizes.
          </p>
        </div>
      )}
    </div>
  );
};
