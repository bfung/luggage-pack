import React, { useState, useMemo } from 'react';
import { Dimensions, PlacedCube, PackingResult, UnitSystem } from '../types';
import { fromBase, formatDimensions, formatVolume } from '../utils/units';
import { Layers, AlertTriangle, Info, Eye, CheckCircle2 } from 'lucide-react';

interface GridLayerViewProps {
  luggageDimensions: Dimensions;
  packingResult: PackingResult;
  units: UnitSystem;
}

export const GridLayerView: React.FC<GridLayerViewProps> = ({
  luggageDimensions,
  packingResult,
  units,
}) => {
  const [selectedLayerIndex, setSelectedLayerIndex] = useState<number>(-1); // -1 = Composite/All Layers
  const [hoveredCube, setHoveredCube] = useState<PlacedCube | null>(null);
  const [showGridRuler, setShowGridRuler] = useState(true);

  const { placedCubes, layers, wastedVolume, totalLuggageVolume, efficiencyPercentage } = packingResult;

  // Determine which cubes to show based on selected layer
  const activeCubes = useMemo(() => {
    if (selectedLayerIndex === -1) {
      return placedCubes;
    }
    const layer = layers[selectedLayerIndex];
    if (!layer) return placedCubes;
    return placedCubes.filter(
      (b) => b.z < layer.zTop - 0.001 && b.z + b.placedHeight > layer.zBottom + 0.001
    );
  }, [placedCubes, layers, selectedLayerIndex]);

  // Dimensions in active units
  const dispL = fromBase(luggageDimensions.length, units);
  const dispW = fromBase(luggageDimensions.width, units);
  const dispH = fromBase(luggageDimensions.height, units);

  // SVG viewBox settings
  const svgWidth = 700;
  // Aspect ratio preserving
  const aspectRatio = luggageDimensions.width / luggageDimensions.length;
  const svgHeight = Math.max(300, Math.min(600, svgWidth * aspectRatio));

  const scaleX = svgWidth / luggageDimensions.length;
  const scaleY = svgHeight / luggageDimensions.width;

  // Compute active layer height range
  const activeLayerInfo = useMemo(() => {
    if (selectedLayerIndex === -1) {
      return {
        label: 'All Heights (Composite View)',
        zRange: `0 – ${dispH} ${units}`,
        depthCm: luggageDimensions.height,
      };
    }
    const layer = layers[selectedLayerIndex];
    if (!layer) return { label: 'All Heights', zRange: '', depthCm: luggageDimensions.height };
    return {
      label: `Layer Tier ${selectedLayerIndex + 1} of ${layers.length}`,
      zRange: `${fromBase(layer.zBottom, units)} – ${fromBase(layer.zTop, units)} ${units}`,
      depthCm: layer.zTop - layer.zBottom,
    };
  }, [selectedLayerIndex, layers, dispH, units, luggageDimensions.height]);

  return (
    <div className="space-y-4">
      {/* Controls & Layer Slices Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
        {/* Layer Selector Pills */}
        <div className="flex items-center space-x-1.5 flex-wrap">
          <span className="text-xs font-semibold text-neutral-600 mr-1 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-neutral-500" />
            <span>Layer Slice:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedLayerIndex(-1)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedLayerIndex === -1
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Composite (All)
          </button>

          {layers.map((layer, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedLayerIndex(idx)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedLayerIndex === idx
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              Tier {idx + 1} ({fromBase(layer.zBottom, units)}–{fromBase(layer.zTop, units)} {units})
            </button>
          ))}
        </div>

        {/* Ruler Toggle */}
        <button
          type="button"
          onClick={() => setShowGridRuler(!showGridRuler)}
          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
            showGridRuler
              ? 'bg-white text-neutral-800 border-neutral-300'
              : 'bg-neutral-100 text-neutral-500 border-neutral-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{showGridRuler ? 'Grid Gridlines: On' : 'Grid Gridlines: Off'}</span>
        </button>
      </div>

      {/* Grid Canvas Container */}
      <div className="relative border border-neutral-300 rounded-xl bg-white p-4 shadow-xs overflow-hidden">
        {/* Top bar with dimensions */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-neutral-900">{activeLayerInfo.label}</span>
            <span className="text-neutral-500 font-mono">({activeLayerInfo.zRange})</span>
          </div>
          <div className="flex items-center space-x-4 text-neutral-600">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-xs bg-amber-100 border border-amber-300 inline-block" />
              <span className="font-medium text-amber-900">Highlighted Wasted / Void Space</span>
            </span>
            <span className="font-mono text-neutral-500">
              Floor Size: {dispL} × {dispW} {units}
            </span>
          </div>
        </div>

        {/* SVG Visualization */}
        <div className="w-full flex justify-center bg-neutral-900/5 rounded-lg p-2 border border-neutral-200">
          <svg
            viewBox={`-30 -30 ${svgWidth + 60} ${svgHeight + 60}`}
            className="w-full max-w-3xl h-auto select-none font-sans"
          >
            <defs>
              {/* Distinct Diagonal Hatch Pattern for Wasted Space */}
              <pattern
                id="wastedSpaceHatch"
                width="14"
                height="14"
                patternTransform="rotate(45 0 0)"
                patternUnits="userSpaceOnUse"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="14"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  opacity="0.45"
                />
              </pattern>

              {/* Grid dots pattern */}
              <pattern
                id="rulerGrid"
                width={scaleX * (units === 'in' ? 2.54 : 5)}
                height={scaleY * (units === 'in' ? 2.54 : 5)}
                patternUnits="userSpaceOnUse"
              >
                <path
                  d={`M ${scaleX * (units === 'in' ? 2.54 : 5)} 0 L 0 0 0 ${scaleY * (units === 'in' ? 2.54 : 5)}`}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="0.8"
                />
              </pattern>

              {/* Shadow filter for cubes */}
              <filter id="cubeDropShadow" x="-5%" y="-5%" width="110%" height="110%">
                <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Suitcase Outer Wall Bounding Box */}
            <rect
              x={0}
              y={0}
              width={svgWidth}
              height={svgHeight}
              rx={12}
              fill="#fffbeb" // warm amber tint for the background (wasted space)
              stroke="#78716c"
              strokeWidth="4"
            />

            {/* Wasted Space Hatch Overlay covering entire floor */}
            <rect
              x={0}
              y={0}
              width={svgWidth}
              height={svgHeight}
              rx={12}
              fill="url(#wastedSpaceHatch)"
            />

            {/* Grid Ruler overlay if enabled */}
            {showGridRuler && (
              <rect
                x={0}
                y={0}
                width={svgWidth}
                height={svgHeight}
                rx={12}
                fill="url(#rulerGrid)"
                pointerEvents="none"
              />
            )}

            {/* Placed Packing Cubes */}
            {activeCubes.map((cube) => {
              const x = cube.x * scaleX;
              const y = cube.y * scaleY;
              const w = cube.placedLength * scaleX;
              const h = cube.placedWidth * scaleY;

              const isHovered = hoveredCube?.instanceId === cube.instanceId;

              // Text sizing based on cube dimensions
              const showText = w > 45 && h > 28;
              const showSubText = w > 70 && h > 45;

              return (
                <g
                  key={cube.instanceId}
                  transform={`translate(${x}, ${y})`}
                  onMouseEnter={() => setHoveredCube(cube)}
                  onMouseLeave={() => setHoveredCube(null)}
                  className="cursor-pointer transition-all duration-150"
                >
                  {/* Cube Body */}
                  <rect
                    width={w}
                    height={h}
                    rx={6}
                    fill={cube.color}
                    fillOpacity={isHovered ? 0.95 : 0.88}
                    stroke={isHovered ? '#18181b' : '#334155'}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    filter="url(#cubeDropShadow)"
                  />

                  {/* Top Gloss highlight */}
                  <rect
                    x={2}
                    y={2}
                    width={Math.max(0, w - 4)}
                    height={Math.max(0, h * 0.35)}
                    rx={4}
                    fill="#ffffff"
                    fillOpacity={0.18}
                    pointerEvents="none"
                  />

                  {/* Cube Label */}
                  {showText && (
                    <text
                      x={w / 2}
                      y={showSubText ? h / 2 - 4 : h / 2 + 4}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize={Math.min(13, Math.max(9, w / 8))}
                      fontWeight="bold"
                      className="pointer-events-none drop-shadow-xs"
                    >
                      {cube.name.length > 14 && w < 100 ? `${cube.name.slice(0, 11)}…` : cube.name}
                    </text>
                  )}

                  {/* Dimensions & Height Subtext */}
                  {showSubText && (
                    <text
                      x={w / 2}
                      y={h / 2 + 12}
                      textAnchor="middle"
                      fill="#ffffff"
                      fillOpacity={0.9}
                      fontSize="9"
                      fontFamily="monospace"
                      className="pointer-events-none"
                    >
                      {fromBase(cube.placedLength, units)}×{fromBase(cube.placedWidth, units)} (z:
                      {fromBase(cube.z, units)})
                    </text>
                  )}
                </g>
              );
            })}

            {/* Dimension Rulers along Top and Left Axes */}
            {/* Top axis length */}
            <line x1={0} y1={-12} x2={svgWidth} y2={-12} stroke="#525252" strokeWidth="1.5" />
            <line x1={0} y1={-18} x2={0} y2={-6} stroke="#525252" strokeWidth="1.5" />
            <line x1={svgWidth} y1={-18} x2={svgWidth} y2={-6} stroke="#525252" strokeWidth="1.5" />
            <text
              x={svgWidth / 2}
              y={-18}
              textAnchor="middle"
              fontSize="11"
              fill="#525252"
              fontWeight="600"
            >
              Length: {dispL} {units}
            </text>

            {/* Left axis width */}
            <line x1={-12} y1={0} x2={-12} y2={svgHeight} stroke="#525252" strokeWidth="1.5" />
            <line x1={-18} y1={0} x2={-6} y2={0} stroke="#525252" strokeWidth="1.5" />
            <line x1={-18} y1={svgHeight} x2={-6} y2={svgHeight} stroke="#525252" strokeWidth="1.5" />
            <text
              x={-18}
              y={svgHeight / 2}
              textAnchor="middle"
              fontSize="11"
              fill="#525252"
              fontWeight="600"
              transform={`rotate(-90, -18, ${svgHeight / 2})`}
            >
              Width: {dispW} {units}
            </text>
          </svg>
        </div>

        {/* Hover Inspector Tooltip / Info Card */}
        {hoveredCube ? (
          <div className="mt-3 p-3 bg-neutral-900 text-white rounded-lg flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center space-x-2.5">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: hoveredCube.color }}
              />
              <div>
                <span className="font-bold text-white mr-2">{hoveredCube.name}</span>
                <span className="text-neutral-400 capitalize bg-neutral-800 px-2 py-0.5 rounded-full text-[11px]">
                  {hoveredCube.category}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4 font-mono text-neutral-300">
              <span>
                Footprint: {fromBase(hoveredCube.placedLength, units)} × {fromBase(hoveredCube.placedWidth, units)} {units}
              </span>
              <span>Height: {fromBase(hoveredCube.placedHeight, units)} {units}</span>
              <span className="text-sky-300">
                Pos (X, Y, Z): ({fromBase(hoveredCube.x, units)}, {fromBase(hoveredCube.y, units)}, {fromBase(hoveredCube.z, units)})
              </span>
              <span className="text-neutral-400 font-sans italic text-[11px]">
                {hoveredCube.rotationName}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-3 p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Wasted Space Zones:</strong> Areas with yellow diagonal stripes represent
                unoccupied void space in this layer.
              </span>
            </div>
            <span className="font-mono font-semibold">
              Wasted Volume: {formatVolume(wastedVolume, units)} ({100 - efficiencyPercentage}%)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
