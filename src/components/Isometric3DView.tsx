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
  const [thicknessDisplay, setThicknessDisplay] = useState<'enhanced' | 'true' | 'off'>('enhanced');
  const [hoveredCube, setHoveredCube] = useState<PlacedCube | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Ref for hit regions during mouse hover
  const hitRegionsRef = useRef<Array<{
    cube: PlacedCube;
    quads: Array<{ x2d: number; y2d: number }[]>;
  }>>([]);

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

  // Point in quad polygon helper for 3D face hover testing
  const isPointInQuad = (px: number, py: number, quad: { x2d: number; y2d: number }[]): boolean => {
    let inside = false;
    for (let i = 0, j = quad.length - 1; i < quad.length; j = i++) {
      const xi = quad[i].x2d;
      const yi = quad[i].y2d;
      const xj = quad[j].x2d;
      const yj = quad[j].y2d;
      const intersect = (yi > py !== yj > py) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const regions = hitRegionsRef.current;
    let found: PlacedCube | null = null;
    for (let i = regions.length - 1; i >= 0; i--) {
      const r = regions[i];
      if (r.quads.some((q) => isPointInQuad(mx, my, q))) {
        found = r.cube;
        break;
      }
    }
    setHoveredCube(found);
  };

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

    // Components of the viewing direction in the luggage's X/Y plane. They
    // select the outward side faces that are visible at the current yaw.
    const camX = Math.sin(radYaw);
    const camY = Math.cos(radYaw);

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
    hitRegionsRef.current = [];

    blocks.forEach((block) => {
      const { x, y, z, dx, dy, dz, color, type } = block;

      if (type === 'wasted') {
        // Draw translucent amber ghost box
        const v001 = project(x, y, z + dz);
        const v101 = project(x + dx, y, z + dz);
        const v111 = project(x + dx, y + dy, z + dz);
        const v011 = project(x, y + dy, z + dz);

        const v100 = project(x + dx, y, z);
        const v110 = project(x + dx, y + dy, z);

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

      // Normal Packing Cube: render real-world thickness in all 3 dimensions
      const cube = block.cube;
      const isHovered = hoveredCube?.instanceId === cube?.instanceId;
      const rawT = cube?.fabricThickness ?? 0.024;

      let visualT = 0;
      if (thicknessDisplay === 'enhanced') {
        const minDim = Math.min(dx, dy, dz);
        visualT = Math.max(rawT, Math.min(0.65, minDim * 0.1));
      } else if (thicknessDisplay === 'true') {
        visualT = rawT;
      }

      const halfTx = visualT / 2;
      const halfTy = visualT / 2;
      const halfTz = visualT / 2;

      // Outer bounds (expanded by thickness in X, Y, Z)
      const xOut0 = x - halfTx;
      const xOut1 = x + dx + halfTx;
      const yOut0 = y - halfTy;
      const yOut1 = y + dy + halfTy;
      const zOut0 = z - (z > 0.001 ? halfTz : 0);
      const zOut1 = z + dz + halfTz;

      // Inner bounds (exact user-specified dimensions)
      const xIn0 = x;
      const xIn1 = x + dx;
      const yIn0 = y;
      const yIn1 = y + dy;
      const zIn0 = z;
      const zIn1 = z + dz;

      const topColor = adjustColor(color, 1.20);
      const topCollarColor = adjustColor(color, 1.02);

      const side1Color = adjustColor(color, 0.96);
      const side1CollarColor = adjustColor(color, 0.82);

      const side2Color = adjustColor(color, 0.78);
      const side2CollarColor = adjustColor(color, 0.65);

      const quadsForHit: Array<{ x2d: number; y2d: number }[]> = [];

      // 1. Top Face (Z+) - Reveals wall thickness in X and Y
      const tOut0 = project(xOut0, yOut0, zOut1);
      const tOut1 = project(xOut1, yOut0, zOut1);
      const tOut2 = project(xOut1, yOut1, zOut1);
      const tOut3 = project(xOut0, yOut1, zOut1);

      const tIn0 = project(xIn0, yIn0, zOut1);
      const tIn1 = project(xIn1, yIn0, zOut1);
      const tIn2 = project(xIn1, yIn1, zOut1);
      const tIn3 = project(xIn0, yIn1, zOut1);

      quadsForHit.push([tOut0, tOut1, tOut2, tOut3]);

      // Draw Top Outer Shell Face
      ctx.beginPath();
      ctx.moveTo(tOut0.x2d, tOut0.y2d);
      ctx.lineTo(tOut1.x2d, tOut1.y2d);
      ctx.lineTo(tOut2.x2d, tOut2.y2d);
      ctx.lineTo(tOut3.x2d, tOut3.y2d);
      ctx.closePath();
      ctx.fillStyle = visualT > 0 ? topCollarColor : topColor;
      ctx.fill();
      ctx.strokeStyle = isHovered ? '#0284c7' : 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.stroke();

      if (visualT > 0.001) {
        // Draw Top Inner Core (showing thickness in X and Y)
        ctx.beginPath();
        ctx.moveTo(tIn0.x2d, tIn0.y2d);
        ctx.lineTo(tIn1.x2d, tIn1.y2d);
        ctx.lineTo(tIn2.x2d, tIn2.y2d);
        ctx.lineTo(tIn3.x2d, tIn3.y2d);
        ctx.closePath();
        ctx.fillStyle = topColor;
        ctx.fill();
        ctx.strokeStyle = isHovered ? '#0284c7' : 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Miter corner seams
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tOut0.x2d, tOut0.y2d); ctx.lineTo(tIn0.x2d, tIn0.y2d);
        ctx.moveTo(tOut1.x2d, tOut1.y2d); ctx.lineTo(tIn1.x2d, tIn1.y2d);
        ctx.moveTo(tOut2.x2d, tOut2.y2d); ctx.lineTo(tIn2.x2d, tIn2.y2d);
        ctx.moveTo(tOut3.x2d, tOut3.y2d); ctx.lineTo(tIn3.x2d, tIn3.y2d);
        ctx.stroke();
      }

      // 2. Visible X Face - Reveals wall thickness in Y and Z
      const isXPlus = camX >= 0;
      const xFaceOut = isXPlus ? xOut1 : xOut0;
      const xFaceIn = isXPlus ? xIn1 : xIn0;

      const xOutA = project(xFaceOut, yOut0, zOut0);
      const xOutB = project(xFaceOut, yOut1, zOut0);
      const xOutC = project(xFaceOut, yOut1, zOut1);
      const xOutD = project(xFaceOut, yOut0, zOut1);

      const xInA = project(xFaceIn, yIn0, zIn0);
      const xInB = project(xFaceIn, yIn1, zIn0);
      const xInC = project(xFaceIn, yIn1, zIn1);
      const xInD = project(xFaceIn, yIn0, zIn1);

      quadsForHit.push([xOutA, xOutB, xOutC, xOutD]);

      ctx.beginPath();
      ctx.moveTo(xOutA.x2d, xOutA.y2d);
      ctx.lineTo(xOutB.x2d, xOutB.y2d);
      ctx.lineTo(xOutC.x2d, xOutC.y2d);
      ctx.lineTo(xOutD.x2d, xOutD.y2d);
      ctx.closePath();
      ctx.fillStyle = visualT > 0 ? side1CollarColor : side1Color;
      ctx.fill();
      ctx.strokeStyle = isHovered ? '#0284c7' : 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.stroke();

      if (visualT > 0.001) {
        ctx.beginPath();
        ctx.moveTo(xInA.x2d, xInA.y2d);
        ctx.lineTo(xInB.x2d, xInB.y2d);
        ctx.lineTo(xInC.x2d, xInC.y2d);
        ctx.lineTo(xInD.x2d, xInD.y2d);
        ctx.closePath();
        ctx.fillStyle = side1Color;
        ctx.fill();
        ctx.strokeStyle = isHovered ? '#0284c7' : 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(xOutA.x2d, xOutA.y2d); ctx.lineTo(xInA.x2d, xInA.y2d);
        ctx.moveTo(xOutB.x2d, xOutB.y2d); ctx.lineTo(xInB.x2d, xInB.y2d);
        ctx.moveTo(xOutC.x2d, xOutC.y2d); ctx.lineTo(xInC.x2d, xInC.y2d);
        ctx.moveTo(xOutD.x2d, xOutD.y2d); ctx.lineTo(xInD.x2d, xInD.y2d);
        ctx.stroke();
      }

      // 3. Visible Y Face - Reveals wall thickness in X and Z
      const isYPlus = camY >= 0;
      const yFaceOut = isYPlus ? yOut1 : yOut0;
      const yFaceIn = isYPlus ? yIn1 : yIn0;

      const yOutA = project(xOut0, yFaceOut, zOut0);
      const yOutB = project(xOut1, yFaceOut, zOut0);
      const yOutC = project(xOut1, yFaceOut, zOut1);
      const yOutD = project(xOut0, yFaceOut, zOut1);

      const yInA = project(xIn0, yFaceIn, zIn0);
      const yInB = project(xIn1, yFaceIn, zIn0);
      const yInC = project(xIn1, yFaceIn, zIn1);
      const yInD = project(xIn0, yFaceIn, zIn1);

      quadsForHit.push([yOutA, yOutB, yOutC, yOutD]);

      ctx.beginPath();
      ctx.moveTo(yOutA.x2d, yOutA.y2d);
      ctx.lineTo(yOutB.x2d, yOutB.y2d);
      ctx.lineTo(yOutC.x2d, yOutC.y2d);
      ctx.lineTo(yOutD.x2d, yOutD.y2d);
      ctx.closePath();
      ctx.fillStyle = visualT > 0 ? side2CollarColor : side2Color;
      ctx.fill();
      ctx.strokeStyle = isHovered ? '#0284c7' : 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.stroke();

      if (visualT > 0.001) {
        ctx.beginPath();
        ctx.moveTo(yInA.x2d, yInA.y2d);
        ctx.lineTo(yInB.x2d, yInB.y2d);
        ctx.lineTo(yInC.x2d, yInC.y2d);
        ctx.lineTo(yInD.x2d, yInD.y2d);
        ctx.closePath();
        ctx.fillStyle = side2Color;
        ctx.fill();
        ctx.strokeStyle = isHovered ? '#0284c7' : 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(yOutA.x2d, yOutA.y2d); ctx.lineTo(yInA.x2d, yInA.y2d);
        ctx.moveTo(yOutB.x2d, yOutB.y2d); ctx.lineTo(yInB.x2d, yInB.y2d);
        ctx.moveTo(yOutC.x2d, yOutC.y2d); ctx.lineTo(yInC.x2d, yInC.y2d);
        ctx.moveTo(yOutD.x2d, yOutD.y2d); ctx.lineTo(yInD.x2d, yInD.y2d);
        ctx.stroke();
      }

      // Top label if block is large enough
      if (cube && (tIn1.x2d - tIn0.x2d) > 20) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        const labelX = (tIn0.x2d + tIn1.x2d + tIn2.x2d + tIn3.x2d) / 4;
        const labelY = (tIn0.y2d + tIn1.y2d + tIn2.y2d + tIn3.y2d) / 4;
        ctx.fillText(cube.name.slice(0, 12), labelX, labelY);
      }

      if (cube) {
        hitRegionsRef.current.push({ cube, quads: quadsForHit });
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
  }, [luggageDimensions, placedCubes, yaw, pitch, zoom, explode, showWastedVoid, wastedPockets, thicknessDisplay, hoveredCube]);

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

          {/* 3D Box Thickness View Mode */}
          <div className="flex items-center space-x-1 border-l border-neutral-200 pl-3">
            <span className="text-neutral-600 font-semibold flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span>3D Thickness:</span>
            </span>
            <div className="inline-flex rounded-lg p-0.5 bg-neutral-200/80 border border-neutral-300">
              <button
                type="button"
                onClick={() => setThicknessDisplay('enhanced')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                  thicknessDisplay === 'enhanced'
                    ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Reveals real physical thickness prominently in X, Y, and Z dimensions"
              >
                Visible Shell
              </button>
              <button
                type="button"
                onClick={() => setThicknessDisplay('true')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                  thicknessDisplay === 'true'
                    ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Shows 1:1 true scale millimeter fabric thickness"
              >
                1:1 True
              </button>
              <button
                type="button"
                onClick={() => setThicknessDisplay('off')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors ${
                  thicknessDisplay === 'off'
                    ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Hide thickness outlines"
              >
                Solid
              </button>
            </div>
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
          <span>Click & drag (or touch) to rotate · Scroll to zoom · Hover cube to inspect 3D thickness</span>
        </div>

        {/* Current Orientation Readout */}
        <div className="absolute top-5 right-5 z-10 pointer-events-none font-mono text-[10px] text-neutral-500 bg-white/90 border border-neutral-200 px-2 py-0.5 rounded-md shadow-2xs">
          Yaw: {yaw}° · Pitch: {pitch}°
        </div>

        {/* Hovered Cube Thickness HUD Card */}
        {hoveredCube && (
          <div className="absolute bottom-14 left-5 z-20 bg-white/95 backdrop-blur-md border border-sky-300 p-3 rounded-xl shadow-lg max-w-xs text-xs pointer-events-none transition-all animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center space-x-2 mb-1.5 pb-1 border-b border-neutral-100">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: hoveredCube.color }} />
              <span className="font-bold text-neutral-900 truncate">{hoveredCube.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 font-medium">
                {hoveredCube.category}
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-neutral-600">
                <span>User-Specified Inner Core:</span>
                <span className="font-mono font-semibold text-neutral-900">
                  {formatDimensions(hoveredCube.originalDimensions, units)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sky-800 bg-sky-50 px-2 py-1 rounded border border-sky-200">
                <span className="flex items-center space-x-1 font-medium">
                  <Layers className="w-3.5 h-3.5 text-sky-600" />
                  <span>Thickness (X, Y, Z):</span>
                </span>
                <span className="font-mono font-bold">
                  +{fromBase(hoveredCube.fabricThickness ?? 0.024, units)} {units} / axis
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-600">
                <span>Effective Outer Footprint:</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {hoveredCube.effectiveDimensions
                    ? formatDimensions(hoveredCube.effectiveDimensions, units)
                    : formatDimensions(hoveredCube.originalDimensions, units)}
                </span>
              </div>

              <div className="flex items-center justify-between text-neutral-500 text-[10px] pt-1 border-t border-neutral-100">
                <span>Position in Container:</span>
                <span className="font-mono">
                  ({fromBase(hoveredCube.x, units)}, {fromBase(hoveredCube.y, units)}, {fromBase(hoveredCube.z, units)})
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="w-full h-96 relative flex items-center justify-center select-none">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoveredCube(null)}
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
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200 text-xs text-neutral-600">
          <div className="flex items-center space-x-3 flex-wrap gap-y-1">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs border border-sky-500 bg-sky-100 inline-block" />
              <span>Suitcase Acrylic Frame</span>
            </span>

            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs border border-neutral-400 bg-neutral-200 inline-flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-neutral-600 rounded-2xs" />
              </span>
              <span className="font-medium text-neutral-700">Inner Core & Outer Shell (X, Y, Z Thickness)</span>
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
