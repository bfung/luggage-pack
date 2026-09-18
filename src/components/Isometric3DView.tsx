import React, { useState, useRef, useEffect } from 'react';
import { Dimensions, PlacedCube, PackingResult, UnitSystem } from '../types';
import { fromBase, formatDimensions, formatVolume } from '../utils/units';
import { Rotate3d, ZoomIn, ZoomOut, Eye, Layers, Sparkles } from 'lucide-react';

interface Isometric3DViewProps {
  luggageDimensions: Dimensions;
  packingResult: PackingResult;
  units: UnitSystem;
}

export const Isometric3DView: React.FC<Isometric3DViewProps> = ({
  luggageDimensions,
  packingResult,
  units,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // View state
  const [yaw, setYaw] = useState<number>(45); // degrees
  const [pitch, setPitch] = useState<number>(30); // degrees
  const [zoom, setZoom] = useState<number>(1.0);
  const [explode, setExplode] = useState<number>(0); // 0 to 40 cm lift
  const [showWastedVoid, setShowWastedVoid] = useState<boolean>(true);
  const [hoveredCube, setHoveredCube] = useState<PlacedCube | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Drag tracking refs
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    startYaw: number;
    startPitch: number;
    startDistance?: number;
    startZoom?: number;
  }>({ startX: 0, startY: 0, startYaw: 45, startPitch: 30 });

  const { placedCubes, wastedVolume, efficiencyPercentage, wastedPockets } = packingResult;

  // Mouse interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startYaw: yaw,
      startPitch: pitch,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;

      // Horizontal drag rotates Yaw (azimuth)
      let newYaw = (dragStartRef.current.startYaw + dx * 0.6) % 360;
      if (newYaw < 0) newYaw += 360;

      // Vertical drag rotates Pitch (elevation), clamped between 10° and 85°
      const newPitch = Math.min(85, Math.max(10, dragStartRef.current.startPitch - dy * 0.5));

      setYaw(Math.round(newYaw));
      setPitch(Math.round(newPitch));
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Touch interaction handlers (single-finger rotate, two-finger pinch zoom)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startYaw: yaw,
        startPitch: pitch,
      };
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      dragStartRef.current = {
        ...dragStartRef.current,
        startDistance: distance,
        startZoom: zoom,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStartRef.current.startX;
      const dy = e.touches[0].clientY - dragStartRef.current.startY;

      let newYaw = (dragStartRef.current.startYaw + dx * 0.6) % 360;
      if (newYaw < 0) newYaw += 360;

      const newPitch = Math.min(85, Math.max(10, dragStartRef.current.startPitch - dy * 0.5));

      setYaw(Math.round(newYaw));
      setPitch(Math.round(newPitch));
    } else if (e.touches.length === 2 && dragStartRef.current.startDistance && dragStartRef.current.startZoom) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const ratio = currentDistance / dragStartRef.current.startDistance;
      const newZoom = Math.min(2.2, Math.max(0.6, dragStartRef.current.startZoom * ratio));
      setZoom(Number(newZoom.toFixed(2)));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current.startDistance = undefined;
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(2.5, Math.max(0.6, Number((prev + delta).toFixed(2)))));
  };

  // 3D projection helper
  // Transforms (x, y, z) into 2D canvas coordinates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Center of container
    const cX = luggageDimensions.length / 2;
    const cY = luggageDimensions.width / 2;
    const cZ = luggageDimensions.height / 2;

    // Angle radians
    const radYaw = (yaw * Math.PI) / 180;
    const radPitch = (pitch * Math.PI) / 180;

    // Scale factor to fit inside canvas
    const maxDim = Math.max(luggageDimensions.length, luggageDimensions.width, luggageDimensions.height);
    const baseScale = (Math.min(width, height) / (maxDim * 1.8)) * zoom;

    const originX = width / 2;
    const originY = height / 2 + (luggageDimensions.height * baseScale * 0.2);

    const project = (x: number, y: number, z: number): { x2d: number; y2d: number; depth: number } => {
      // Offset from luggage center
      const dx = x - cX;
      const dy = y - cY;
      const dz = z - cZ;

      // Rotate around Z (yaw)
      const rx = dx * Math.cos(radYaw) - dy * Math.sin(radYaw);
      const ry = dx * Math.sin(radYaw) + dy * Math.cos(radYaw);

      // Rotate around X (pitch)
      const rz = dz * Math.cos(radPitch) - ry * Math.sin(radPitch);
      const finalY = ry * Math.cos(radPitch) + dz * Math.sin(radPitch);

      return {
        x2d: originX + rx * baseScale,
        y2d: originY - finalY * baseScale,
        depth: rz, // for depth sorting
      };
    };

    // Draw Luggage Wireframe Container Floor & Edges
    const L = luggageDimensions.length;
    const W = luggageDimensions.width;
    const H = luggageDimensions.height;

    // 8 bounding vertices of luggage
    const p000 = project(0, 0, 0);
    const pL00 = project(L, 0, 0);
    const p0W0 = project(0, W, 0);
    const pLW0 = project(L, W, 0);

    const p00H = project(0, 0, H);
    const pL0H = project(L, 0, H);
    const p0WH = project(0, W, H);
    const pLWH = project(L, W, H);

    // Draw bottom floor plate
    ctx.beginPath();
    ctx.moveTo(p000.x2d, p000.y2d);
    ctx.lineTo(pL00.x2d, pL00.y2d);
    ctx.lineTo(pLW0.x2d, pLW0.y2d);
    ctx.lineTo(p0W0.x2d, p0W0.y2d);
    ctx.closePath();
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Collect all items to render with painter's algorithm
    interface RenderableBlock {
      type: 'cube' | 'wasted';
      cube?: PlacedCube;
      pocket?: (typeof wastedPockets)[0];
      centerDepth: number;
      x: number;
      y: number;
      z: number;
      dx: number;
      dy: number;
      dz: number;
      color: string;
    }

    const blocks: RenderableBlock[] = [];

    // Add cubes
    placedCubes.forEach((c) => {
      // apply explode offset along Z if stacked
      const explodeOffset = c.z > 0 ? (c.z / Math.max(1, H)) * explode : 0;
      const effectiveZ = c.z + explodeOffset;

      const center = project(
        c.x + c.placedLength / 2,
        c.y + c.placedWidth / 2,
        effectiveZ + c.placedHeight / 2
      );
      blocks.push({
        type: 'cube',
        cube: c,
        centerDepth: center.depth,
        x: c.x,
        y: c.y,
        z: effectiveZ,
        dx: c.placedLength,
        dy: c.placedWidth,
        dz: c.placedHeight,
        color: c.color,
      });
    });

    // Add Wasted Void representation if enabled
    if (showWastedVoid && wastedPockets.length > 0) {
      wastedPockets.forEach((wp) => {
        const center = project(
          wp.x + wp.length / 2,
          wp.y + wp.width / 2,
          wp.z + wp.height / 2
        );
        blocks.push({
          type: 'wasted',
          pocket: wp,
          centerDepth: center.depth,
          x: wp.x,
          y: wp.y,
          z: wp.z,
          dx: wp.length,
          dy: wp.width,
          dz: wp.height,
          color: '#f59e0b',
        });
      });
    }

    // Sort by depth (farthest first)
    blocks.sort((a, b) => a.centerDepth - b.centerDepth);

    // Color lighting helper
    const adjustColor = (hex: string, factor: number) => {
      let c = hex.replace('#', '');
      if (c.length === 3) c = c.split('').map(x => x + x).join('');
      const num = parseInt(c, 16);
      let r = (num >> 16) * factor;
      let g = ((num >> 8) & 0x00ff) * factor;
      let b = (num & 0x0000ff) * factor;
      r = Math.min(255, Math.max(0, Math.round(r)));
      g = Math.min(255, Math.max(0, Math.round(g)));
      b = Math.min(255, Math.max(0, Math.round(b)));
      return `rgb(${r}, ${g}, ${b})`;
    };

    // Render blocks
    blocks.forEach((block) => {
      const { x, y, z, dx, dy, dz, color, type } = block;

      // 8 corners
      const v000 = project(x, y, z);
      const v100 = project(x + dx, y, z);
      const v010 = project(x, y + dy, z);
      const v110 = project(x + dx, y + dy, z);

      const v001 = project(x, y, z + dz);
      const v101 = project(x + dx, y, z + dz);
      const v011 = project(x, y + dy, z + dz);
      const v111 = project(x + dx, y + dy, z + dz);

      if (type === 'wasted') {
        // Draw translucent amber ghost box
        ctx.save();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);

        // Top face
        ctx.beginPath();
        ctx.moveTo(v001.x2d, v001.y2d);
        ctx.lineTo(v101.x2d, v101.y2d);
        ctx.lineTo(v111.x2d, v111.y2d);
        ctx.lineTo(v011.x2d, v011.y2d);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Front Face
        ctx.beginPath();
        ctx.moveTo(v100.x2d, v100.y2d);
        ctx.lineTo(v110.x2d, v110.y2d);
        ctx.lineTo(v111.x2d, v111.y2d);
        ctx.lineTo(v101.x2d, v101.y2d);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
        return;
      }

      // Normal Packing Cube
      const topColor = adjustColor(color, 1.15); // bright top
      const sideColor1 = adjustColor(color, 0.95);
      const sideColor2 = adjustColor(color, 0.78);

      // 1. Top Face
      ctx.beginPath();
      ctx.moveTo(v001.x2d, v001.y2d);
      ctx.lineTo(v101.x2d, v101.y2d);
      ctx.lineTo(v111.x2d, v111.y2d);
      ctx.lineTo(v011.x2d, v011.y2d);
      ctx.closePath();
      ctx.fillStyle = topColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 2. Front X face (x+dx)
      ctx.beginPath();
      ctx.moveTo(v100.x2d, v100.y2d);
      ctx.lineTo(v110.x2d, v110.y2d);
      ctx.lineTo(v111.x2d, v111.y2d);
      ctx.lineTo(v101.x2d, v101.y2d);
      ctx.closePath();
      ctx.fillStyle = sideColor1;
      ctx.fill();
      ctx.stroke();

      // 3. Front Y face (y+dy)
      ctx.beginPath();
      ctx.moveTo(v010.x2d, v010.y2d);
      ctx.lineTo(v110.x2d, v110.y2d);
      ctx.lineTo(v111.x2d, v111.y2d);
      ctx.lineTo(v011.x2d, v011.y2d);
      ctx.closePath();
      ctx.fillStyle = sideColor2;
      ctx.fill();
      ctx.stroke();

      // Top label if block is large enough
      if (block.cube && (v101.x2d - v001.x2d) > 25) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        const labelX = (v001.x2d + v101.x2d + v111.x2d + v011.x2d) / 4;
        const labelY = (v001.y2d + v101.y2d + v111.y2d + v011.y2d) / 4;
        ctx.fillText(block.cube.name.slice(0, 10), labelX, labelY);
      }
    });

    // Draw Suitcase Acrylic Wireframe Outer Shell (Front Edges)
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);

    // 4 vertical posts
    const drawLine = (p1: { x2d: number; y2d: number }, p2: { x2d: number; y2d: number }) => {
      ctx.beginPath();
      ctx.moveTo(p1.x2d, p1.y2d);
      ctx.lineTo(p2.x2d, p2.y2d);
      ctx.stroke();
    };

    drawLine(p000, p00H);
    drawLine(pL00, pL0H);
    drawLine(pLW0, pLWH);
    drawLine(p0W0, p0WH);

    // Top rim
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p00H.x2d, p00H.y2d);
    ctx.lineTo(pL0H.x2d, pL0H.y2d);
    ctx.lineTo(pLWH.x2d, pLWH.y2d);
    ctx.lineTo(p0WH.x2d, p0WH.y2d);
    ctx.closePath();
    ctx.stroke();
  }, [luggageDimensions, placedCubes, yaw, pitch, zoom, explode, showWastedVoid, wastedPockets]);

  return (
    <div className="space-y-3">
      {/* 3D Viewport Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
        {/* Rotation Preset Buttons */}
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold text-neutral-600 flex items-center space-x-1">
            <Rotate3d className="w-3.5 h-3.5 text-neutral-500" />
            <span>Angle:</span>
          </span>
          <button
            type="button"
            onClick={() => { setYaw(45); setPitch(30); }}
            className={`px-2 py-1 rounded-md border font-medium ${
              yaw === 45 && pitch === 30
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Isometric
          </button>
          <button
            type="button"
            onClick={() => { setYaw(135); setPitch(30); }}
            className={`px-2 py-1 rounded-md border font-medium ${
              yaw === 135
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Rear View
          </button>
          <button
            type="button"
            onClick={() => { setYaw(0); setPitch(75); }}
            className={`px-2 py-1 rounded-md border font-medium ${
              pitch === 75
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
            }`}
          >
            Top-Down
          </button>
        </div>

        {/* Orbit Sliders & Explode Slider */}
        <div className="flex items-center space-x-3 flex-wrap">
          {/* Zoom Buttons */}
          <div className="flex items-center space-x-1 border border-neutral-200 bg-white rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, Number((z - 0.15).toFixed(2))))}
              className="p-1 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 text-neutral-600">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))}
              className="p-1 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Explode View Slider */}
          <div className="flex items-center space-x-1.5">
            <span className="text-neutral-700 font-medium flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-neutral-500" />
              <span>Explode:</span>
            </span>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={explode}
              onChange={(e) => setExplode(parseFloat(e.target.value))}
              className="w-16 accent-sky-600 h-1.5 cursor-pointer"
              title="Lifts upper layers for inspection"
            />
          </div>

          {/* Wasted Void Toggle */}
          <button
            type="button"
            onClick={() => setShowWastedVoid(!showWastedVoid)}
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md border transition-colors ${
              showWastedVoid
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>{showWastedVoid ? 'Wasted Space: On' : 'Wasted Space: Off'}</span>
          </button>
        </div>
      </div>

      {/* Canvas Box */}
      <div className="relative border border-neutral-300 rounded-xl bg-gradient-to-b from-neutral-50 to-white p-3 shadow-xs">
        {/* Interaction Hint Overlay */}
        <div className="absolute top-5 left-5 z-10 pointer-events-none flex items-center space-x-2 bg-neutral-900/80 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-full shadow-xs">
          <Rotate3d className="w-3 h-3 text-sky-400 animate-spin-slow" />
          <span>Click & drag (or touch) to rotate · Scroll to zoom</span>
        </div>

        {/* Current Orientation Readout */}
        <div className="absolute top-5 right-5 z-10 pointer-events-none font-mono text-[10px] text-neutral-500 bg-white/90 border border-neutral-200 px-2 py-0.5 rounded-md shadow-2xs">
          Yaw: {yaw}° · Pitch: {pitch}°
        </div>

        <div className="w-full h-96 relative flex items-center justify-center select-none">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onWheel={handleWheel}
            style={{ touchAction: 'none' }}
            className={`w-full h-full block ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          />
        </div>

        {/* Legend / Overlay info */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-xs text-neutral-600">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs border border-sky-500 bg-sky-100 inline-block" />
              <span>Suitcase Acrylic Frame</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs border border-amber-500 bg-amber-200/50 inline-block" />
              <span className="font-semibold text-amber-800">Unoccupied Wasted Volume</span>
            </span>
          </div>

          <div className="text-right font-mono text-neutral-500">
            Efficiency: <span className="font-bold text-neutral-900">{efficiencyPercentage}%</span> ·
            Wasted: <span className="font-bold text-amber-700">{formatVolume(wastedVolume, units)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
