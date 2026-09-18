import { Dimensions, LuggageProfile, PackingCubeItem, PlacedCube, PackingResult, WastedSpacePocket } from '../types';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface BoxOrientation {
  dx: number;
  dy: number;
  dz: number;
  name: string;
}

interface CandidatePlacement {
  point: Point3D;
  orientation: BoxOrientation;
  score: number;
}

/**
 * Checks if two 3D Axis-Aligned Bounding Boxes (AABB) overlap.
 * Touching faces (<= 0.001 overlap) is not an intersection.
 */
function boxesOverlap(
  p1: Point3D,
  s1: { dx: number; dy: number; dz: number },
  p2: Point3D,
  s2: { dx: number; dy: number; dz: number },
  epsilon = 0.001
): boolean {
  if (p1.x + s1.dx - epsilon <= p2.x || p2.x + s2.dx - epsilon <= p1.x) return false;
  if (p1.y + s1.dy - epsilon <= p2.y || p2.y + s2.dy - epsilon <= p1.y) return false;
  if (p1.z + s1.dz - epsilon <= p2.z || p2.z + s2.dz - epsilon <= p1.z) return false;
  return true;
}

/**
 * Generates valid 3D rotations for a given packing cube
 */
function getOrientations(dim: Dimensions, allowFullRotation: boolean, locked = false, preferTransposed = false): BoxOrientation[] {
  const { length: l, width: w, height: h } = dim;

  if (locked) {
    return [{ dx: l, dy: w, dz: h, name: 'Locked (0°)' }];
  }

  if (!allowFullRotation) {
    // Only allow rotation on the XY plane (keep z as height)
    const list: BoxOrientation[] = preferTransposed
      ? [
          { dx: w, dy: l, dz: h, name: 'Rotated (90°)' },
          { dx: l, dy: w, dz: h, name: 'Normal (0°)' },
        ]
      : [
          { dx: l, dy: w, dz: h, name: 'Normal (0°)' },
          { dx: w, dy: l, dz: h, name: 'Rotated (90°)' },
        ];
    const unique = new Map<string, BoxOrientation>();
    list.forEach(o => unique.set(`${o.dx}x${o.dy}x${o.dz}`, o));
    return Array.from(unique.values());
  }

  // Orthogonal permutations: prefer flat orientations (Flat and Flat Rotated)
  // before considering standing on edge or upright
  const perms: BoxOrientation[] = preferTransposed
    ? [
        { dx: w, dy: l, dz: h, name: 'Flat Rotated (W×L×H)' },
        { dx: l, dy: w, dz: h, name: 'Flat (L×W×H)' },
        { dx: w, dy: h, dz: l, name: 'On Edge (W×H×L)' },
        { dx: l, dy: h, dz: w, name: 'On Side (L×H×W)' },
        { dx: h, dy: l, dz: w, name: 'Upright (H×L×W)' },
        { dx: h, dy: w, dz: l, name: 'Upright Rotated (H×W×L)' },
      ]
    : [
        { dx: l, dy: w, dz: h, name: 'Flat (L×W×H)' },
        { dx: w, dy: l, dz: h, name: 'Flat Rotated (W×L×H)' },
        { dx: l, dy: h, dz: w, name: 'On Side (L×H×W)' },
        { dx: w, dy: h, dz: l, name: 'On Edge (W×H×L)' },
        { dx: h, dy: l, dz: w, name: 'Upright (H×L×W)' },
        { dx: h, dy: w, dz: l, name: 'Upright Rotated (H×W×L)' },
      ];

  const unique = new Map<string, BoxOrientation>();
  perms.forEach(o => {
    unique.set(`${o.dx}x${o.dy}x${o.dz}`, o);
  });
  return Array.from(unique.values());
}

/**
 * Calculates contact area of candidate with luggage walls and already placed boxes.
 * Maximizing contact area produces tighter, more realistic packing with less fragmented voids.
 */
function calculateContactScore(
  pt: Point3D,
  ori: BoxOrientation,
  luggage: Dimensions,
  placed: PlacedCube[]
): number {
  let contactArea = 0;

  // Base contact with luggage floor (highest priority for physical stability)
  if (Math.abs(pt.z) < 0.001) contactArea += ori.dx * ori.dy * 1.5;

  // Contact with luggage boundary walls
  if (Math.abs(pt.x) < 0.001) contactArea += ori.dy * ori.dz;
  if (Math.abs(pt.x + ori.dx - luggage.length) < 0.001) contactArea += ori.dy * ori.dz;

  if (Math.abs(pt.y) < 0.001) contactArea += ori.dx * ori.dz;
  if (Math.abs(pt.y + ori.dy - luggage.width) < 0.001) contactArea += ori.dx * ori.dz;

  // Ceiling contact is minor boundary alignment (do not artificially favor premature lid stacking)
  if (Math.abs(pt.z + ori.dz - luggage.height) < 0.001) contactArea += (ori.dx * ori.dy) * 0.1;

  // Contact with other placed boxes
  for (const b of placed) {
    // Check X touch
    if (Math.abs(pt.x + ori.dx - b.x) < 0.001 || Math.abs(b.x + b.placedLength - pt.x) < 0.001) {
      const yOverlap = Math.max(0, Math.min(pt.y + ori.dy, b.y + b.placedWidth) - Math.max(pt.y, b.y));
      const zOverlap = Math.max(0, Math.min(pt.z + ori.dz, b.z + b.placedHeight) - Math.max(pt.z, b.z));
      contactArea += yOverlap * zOverlap;
    }
    // Check Y touch
    if (Math.abs(pt.y + ori.dy - b.y) < 0.001 || Math.abs(b.y + b.placedWidth - pt.y) < 0.001) {
      const xOverlap = Math.max(0, Math.min(pt.x + ori.dx, b.x + b.placedLength) - Math.max(pt.x, b.x));
      const zOverlap = Math.max(0, Math.min(pt.z + ori.dz, b.z + b.placedHeight) - Math.max(pt.z, b.z));
      contactArea += xOverlap * zOverlap;
    }
    // Check Z touch (stacking support from box underneath)
    if (Math.abs(pt.z - (b.z + b.placedHeight)) < 0.001) {
      const xOverlap = Math.max(0, Math.min(pt.x + ori.dx, b.x + b.placedLength) - Math.max(pt.x, b.x));
      const yOverlap = Math.max(0, Math.min(pt.y + ori.dy, b.y + b.placedWidth) - Math.max(pt.y, b.y));
      contactArea += xOverlap * yOverlap * 1.2;
    }
  }

  return contactArea;
}

/**
 * Evaluates candidate points using Extreme Points (EP) algorithm
 */
function generateExtremePoints(placed: PlacedCube[], luggage: Dimensions): Point3D[] {
  if (placed.length === 0) {
    return [{ x: 0, y: 0, z: 0 }];
  }

  const rawPoints: Point3D[] = [{ x: 0, y: 0, z: 0 }];

  for (const b of placed) {
    // Primary 3 projection points
    rawPoints.push({ x: b.x + b.placedLength, y: b.y, z: b.z });
    rawPoints.push({ x: b.x, y: b.y + b.placedWidth, z: b.z });
    rawPoints.push({ x: b.x, y: b.y, z: b.z + b.placedHeight });

    // Edge combination points
    rawPoints.push({ x: b.x + b.placedLength, y: b.y + b.placedWidth, z: b.z });
    rawPoints.push({ x: b.x + b.placedLength, y: b.y, z: b.z + b.placedHeight });
    rawPoints.push({ x: b.x, y: b.y + b.placedWidth, z: b.z + b.placedHeight });

    // Wall intersection projections
    for (const other of placed) {
      if (other.instanceId === b.instanceId) continue;
      // Along X
      if (b.x + b.placedLength <= other.x) {
        rawPoints.push({ x: b.x + b.placedLength, y: other.y, z: other.z });
      }
      // Along Y
      if (b.y + b.placedWidth <= other.y) {
        rawPoints.push({ x: other.x, y: b.y + b.placedWidth, z: other.z });
      }
      // Along Z
      if (b.z + b.placedHeight <= other.z) {
        rawPoints.push({ x: other.x, y: other.y, z: b.z + b.placedHeight });
      }
    }
  }

  // Filter valid points: must be within luggage dimensions and not inside another placed box
  const validPoints: Point3D[] = [];
  const seen = new Set<string>();

  for (const pt of rawPoints) {
    // Round to 2 decimal places to avoid floating point duplication
    const rx = Math.round(pt.x * 100) / 100;
    const ry = Math.round(pt.y * 100) / 100;
    const rz = Math.round(pt.z * 100) / 100;

    if (rx < 0 || rx >= luggage.length) continue;
    if (ry < 0 || ry >= luggage.width) continue;
    if (rz < 0 || rz >= luggage.height) continue;

    const key = `${rx},${ry},${rz}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Ensure the point itself is not strictly inside any placed box
    const insideAny = placed.some(b => 
      rx >= b.x && rx < b.x + b.placedLength - 0.001 &&
      ry >= b.y && ry < b.y + b.placedWidth - 0.001 &&
      rz >= b.z && rz < b.z + b.placedHeight - 0.001
    );

    if (!insideAny) {
      validPoints.push({ x: rx, y: ry, z: rz });
    }
  }

  // Sort candidate points: Bottom-Left-Front priority (minimize Z, then Y, then X)
  validPoints.sort((a, b) => {
    if (Math.abs(a.z - b.z) > 0.001) return a.z - b.z;
    if (Math.abs(a.y - b.y) > 0.001) return a.y - b.y;
    return a.x - b.x;
  });

  return validPoints;
}

interface ExpandedItem {
  instanceId: string;
  cube: PackingCubeItem;
}

/**
 * Runs a single packing attempt given an ordered list of items
 */
function runPackingPass(
  items: ExpandedItem[],
  luggage: Dimensions,
  allowGlobalRotation: boolean,
  options: {
    preferTransposed?: boolean;
    flatOnly?: boolean;
    floorPriority?: boolean;
  } = {}
): { placed: PlacedCube[]; unplaced: ExpandedItem[] } {
  const placed: PlacedCube[] = [];
  const unplaced: ExpandedItem[] = [];

  const { preferTransposed = false, flatOnly = false, floorPriority = true } = options;

  for (const item of items) {
    const candidatePoints = generateExtremePoints(placed, luggage);
    
    // Check item-level rotation setting
    const cubeCanRotate = item.cube.allowRotation ?? true;
    const canRotate = cubeCanRotate && allowGlobalRotation;
    const allowFull = canRotate && !flatOnly;
    const isLocked = !cubeCanRotate;

    const orientations = getOrientations(item.cube.dimensions, allowFull, isLocked, preferTransposed);

    let bestPlacement: CandidatePlacement | null = null;

    for (const pt of candidatePoints) {
      for (const ori of orientations) {
        // 1. Boundary check
        if (pt.x + ori.dx > luggage.length + 0.001) continue;
        if (pt.y + ori.dy > luggage.width + 0.001) continue;
        if (pt.z + ori.dz > luggage.height + 0.001) continue;

        // 2. Overlap check
        const collides = placed.some(b => 
          boxesOverlap(pt, ori, { x: b.x, y: b.y, z: b.z }, { dx: b.placedLength, dy: b.placedWidth, dz: b.placedHeight })
        );
        if (collides) continue;

        // 3. Support & stability check:
        // Either sitting on the luggage floor (z=0) or resting on boxes beneath
        if (pt.z > 0.001) {
          let totalSupportArea = 0;
          for (const b of placed) {
            if (Math.abs((b.z + b.placedHeight) - pt.z) < 0.001) {
              const xOvr = Math.max(0, Math.min(pt.x + ori.dx, b.x + b.placedLength) - Math.max(pt.x, b.x));
              const yOvr = Math.max(0, Math.min(pt.y + ori.dy, b.y + b.placedWidth) - Math.max(pt.y, b.y));
              totalSupportArea += (xOvr * yOvr);
            }
          }
          const footprint = ori.dx * ori.dy;
          if (totalSupportArea < 0.20 * footprint) {
            // Must have at least 20% footprint support across bottom boxes
            continue;
          }
        }

        // Contact score
        const contactScore = calculateContactScore(pt, ori, luggage, placed);

        // Floor bonus: strongly favor filling the floor before building tall stacks
        const floorBonus = Math.abs(pt.z) < 0.001 ? (floorPriority ? 30000 : 15000) : 0;

        // Residual space evaluation:
        // Placing a box should avoid leaving tiny unusable slivers (< 6cm) on the floor
        let residualBonus = 0;
        const remX = luggage.length - (pt.x + ori.dx);
        const remY = luggage.width - (pt.y + ori.dy);
        if (Math.abs(pt.z) < 0.001) {
          if (remX >= 15) residualBonus += 2500;
          else if (remX > 0 && remX < 5) residualBonus -= 3000;

          if (remY >= 15) residualBonus += 2500;
          else if (remY > 0 && remY < 5) residualBonus -= 3000;
        }

        // Position score: prefer lower z heavily, then y, then x
        const positionPenalty = (pt.z * (floorPriority ? 4000 : 2000)) + (pt.y * 12) + (pt.x * 2);
        const totalScore = floorBonus + (contactScore * 18) + residualBonus - positionPenalty;

        if (!bestPlacement || totalScore > bestPlacement.score) {
          bestPlacement = {
            point: pt,
            orientation: ori,
            score: totalScore,
          };
        }
      }
    }

    if (bestPlacement) {
      placed.push({
        instanceId: item.instanceId,
        cubeId: item.cube.id,
        name: item.cube.name,
        color: item.cube.color,
        category: item.cube.category,
        x: bestPlacement.point.x,
        y: bestPlacement.point.y,
        z: bestPlacement.point.z,
        placedLength: bestPlacement.orientation.dx,
        placedWidth: bestPlacement.orientation.dy,
        placedHeight: bestPlacement.orientation.dz,
        originalDimensions: item.cube.dimensions,
        volume: bestPlacement.orientation.dx * bestPlacement.orientation.dy * bestPlacement.orientation.dz,
        rotationName: bestPlacement.orientation.name,
      });
    } else {
      unplaced.push(item);
    }
  }

  return { placed, unplaced };
}

/**
 * Identifies significant wasted space pockets (large empty bounding voids)
 */
function analyzeWastedSpacePockets(
  luggage: Dimensions,
  placed: PlacedCube[]
): WastedSpacePocket[] {
  const pockets: WastedSpacePocket[] = [];
  if (placed.length === 0) {
    pockets.push({
      id: 'pocket-entire',
      x: 0,
      y: 0,
      z: 0,
      length: luggage.length,
      width: luggage.width,
      height: luggage.height,
      volume: luggage.length * luggage.width * luggage.height,
      description: 'Entire luggage interior is empty',
    });
    return pockets;
  }

  // 1. Check top headroom clearance across the entire suitcase
  let maxZ = 0;
  let maxX = 0;
  let maxY = 0;
  for (const b of placed) {
    maxZ = Math.max(maxZ, b.z + b.placedHeight);
    maxX = Math.max(maxX, b.x + b.placedLength);
    maxY = Math.max(maxY, b.y + b.placedWidth);
  }

  const topGap = luggage.height - maxZ;
  if (topGap >= 2) {
    pockets.push({
      id: 'pocket-top-headroom',
      x: 0,
      y: 0,
      z: Math.round(maxZ * 10) / 10,
      length: luggage.length,
      width: luggage.width,
      height: Math.round(topGap * 10) / 10,
      volume: luggage.length * luggage.width * topGap,
      description: `Top clearance layer (${Math.round(topGap)} cm deep)`,
    });
  }

  // 2. Check length side clearance
  const lengthGap = luggage.length - maxX;
  if (lengthGap >= 3) {
    pockets.push({
      id: 'pocket-side-length',
      x: Math.round(maxX * 10) / 10,
      y: 0,
      z: 0,
      length: Math.round(lengthGap * 10) / 10,
      width: luggage.width,
      height: luggage.height,
      volume: lengthGap * luggage.width * luggage.height,
      description: `Front/End margin (${Math.round(lengthGap)} cm wide)`,
    });
  }

  // 3. Check width side clearance
  const widthGap = luggage.width - maxY;
  if (widthGap >= 3) {
    pockets.push({
      id: 'pocket-side-width',
      x: 0,
      y: Math.round(maxY * 10) / 10,
      z: 0,
      length: luggage.length,
      width: Math.round(widthGap * 10) / 10,
      height: luggage.height,
      volume: luggage.length * widthGap * luggage.height,
      description: `Lateral side margin (${Math.round(widthGap)} cm wide)`,
    });
  }

  return pockets;
}

/**
 * Groups placed cubes into discrete height layers for layer-by-layer visualization
 */
function calculateLayers(placed: PlacedCube[]): { zBottom: number; zTop: number; cubeCount: number }[] {
  if (placed.length === 0) return [];

  // Collect distinct z coordinates
  const zLevels = new Set<number>();
  zLevels.add(0);
  placed.forEach(b => {
    zLevels.add(b.z);
    zLevels.add(b.z + b.placedHeight);
  });

  const sortedZ = Array.from(zLevels).sort((a, b) => a - b);
  const layers: { zBottom: number; zTop: number; cubeCount: number }[] = [];

  for (let i = 0; i < sortedZ.length - 1; i++) {
    const zBottom = sortedZ[i];
    const zTop = sortedZ[i + 1];
    if (zTop - zBottom < 1) continue;

    const cubesInLayer = placed.filter(b => b.z < zTop - 0.001 && b.z + b.placedHeight > zBottom + 0.001);
    if (cubesInLayer.length > 0) {
      layers.push({
        zBottom,
        zTop,
        cubeCount: cubesInLayer.length,
      });
    }
  }

  return layers;
}

/**
 * Main function: computes optimal packing arrangement
 */
export function calculateOptimalPacking(
  luggage: LuggageProfile,
  cubes: PackingCubeItem[],
  allowGlobalRotation = true
): PackingResult {
  const luggageDimensions = luggage.dimensions;
  const totalLuggageVolume = luggageDimensions.length * luggageDimensions.width * luggageDimensions.height;

  // Flatten quantity into individual items
  const expandedItems: ExpandedItem[] = [];
  cubes.forEach(cube => {
    const qty = Math.max(0, cube.quantity || 0);
    for (let i = 0; i < qty; i++) {
      expandedItems.push({
        instanceId: `${cube.id}-${i}`,
        cube,
      });
    }
  });

  if (expandedItems.length === 0) {
    return {
      placedCubes: [],
      unplacedCubes: [],
      totalLuggageVolume,
      totalPackedVolume: 0,
      wastedVolume: totalLuggageVolume,
      efficiencyPercentage: 0,
      wastedPercentage: 100,
      wastedPockets: analyzeWastedSpacePockets(luggageDimensions, []),
      layers: [],
    };
  }

  // Multi-heuristic search strategies
  const heuristics: Array<{
    name: string;
    sorter: (a: ExpandedItem, b: ExpandedItem) => number;
  }> = [
    {
      name: 'Volume Descending',
      sorter: (a, b) => {
        const vA = a.cube.dimensions.length * a.cube.dimensions.width * a.cube.dimensions.height;
        const vB = b.cube.dimensions.length * b.cube.dimensions.width * b.cube.dimensions.height;
        return vB - vA;
      },
    },
    {
      name: 'Footprint Area Descending',
      sorter: (a, b) => {
        const areaA = a.cube.dimensions.length * a.cube.dimensions.width;
        const areaB = b.cube.dimensions.length * b.cube.dimensions.width;
        return areaB - areaA;
      },
    },
    {
      name: 'Grouped Identical Cubes',
      sorter: (a, b) => {
        if (a.cube.id === b.cube.id) return 0;
        const vA = a.cube.dimensions.length * a.cube.dimensions.width * a.cube.dimensions.height;
        const vB = b.cube.dimensions.length * b.cube.dimensions.width * b.cube.dimensions.height;
        return vB - vA;
      },
    },
    {
      name: 'Max Dimension Descending',
      sorter: (a, b) => {
        const maxA = Math.max(a.cube.dimensions.length, a.cube.dimensions.width, a.cube.dimensions.height);
        const maxB = Math.max(b.cube.dimensions.length, b.cube.dimensions.width, b.cube.dimensions.height);
        return maxB - maxA;
      },
    },
    {
      name: 'Height Descending',
      sorter: (a, b) => {
        return b.cube.dimensions.height - a.cube.dimensions.height;
      },
    },
    {
      name: 'Perimeter Descending',
      sorter: (a, b) => {
        const pA = a.cube.dimensions.length + a.cube.dimensions.width + a.cube.dimensions.height;
        const pB = b.cube.dimensions.length + b.cube.dimensions.width + b.cube.dimensions.height;
        return pB - pA;
      },
    },
  ];

  let bestResult: { placed: PlacedCube[]; unplaced: ExpandedItem[] } | null = null;
  let bestScore = -Infinity;

  // Pass variants: try standard flat orientation, transposed flat orientation, and flat-only layers
  const passConfigs: Array<{
    preferTransposed: boolean;
    flatOnly: boolean;
    floorPriority: boolean;
  }> = [
    { preferTransposed: false, flatOnly: false, floorPriority: true },
    { preferTransposed: true, flatOnly: false, floorPriority: true },
    { preferTransposed: false, flatOnly: true, floorPriority: true },
    { preferTransposed: true, flatOnly: true, floorPriority: true },
  ];

  for (const config of passConfigs) {
    for (const heuristic of heuristics) {
      const sortedList = [...expandedItems].sort(heuristic.sorter);
      const result = runPackingPass(sortedList, luggageDimensions, allowGlobalRotation, config);

      // Score: strongly prioritize packing MORE items, then higher packed volume, then compact height
      const packedCount = result.placed.length;
      const packedVolume = result.placed.reduce((acc, b) => acc + b.volume, 0);
      const maxZ = result.placed.reduce((acc, b) => Math.max(acc, b.z + b.placedHeight), 0);

      const score = (packedCount * 1_000_000) + packedVolume - (maxZ * 50);

      if (score > bestScore) {
        bestScore = score;
        bestResult = result;
      }
    }
  }

  const finalPlaced = bestResult ? bestResult.placed : [];
  const finalUnplaced = bestResult ? bestResult.unplaced : [];

  // Compute total packed volume
  const totalPackedVolume = finalPlaced.reduce((sum, b) => sum + b.volume, 0);
  const wastedVolume = Math.max(0, totalLuggageVolume - totalPackedVolume);
  const efficiencyPercentage = Number(((totalPackedVolume / totalLuggageVolume) * 100).toFixed(1));
  const wastedPercentage = Number((100 - efficiencyPercentage).toFixed(1));

  // Count unplaced items by original cube
  const unplacedMap = new Map<string, number>();
  finalUnplaced.forEach(u => {
    unplacedMap.set(u.cube.id, (unplacedMap.get(u.cube.id) || 0) + 1);
  });

  const unplacedCubes: PackingResult['unplacedCubes'] = [];
  cubes.forEach(cube => {
    const count = unplacedMap.get(cube.id);
    if (count && count > 0) {
      unplacedCubes.push({
        cube,
        unplacedCount: count,
      });
    }
  });

  const wastedPockets = analyzeWastedSpacePockets(luggageDimensions, finalPlaced);
  const layers = calculateLayers(finalPlaced);

  return {
    placedCubes: finalPlaced,
    unplacedCubes,
    totalLuggageVolume,
    totalPackedVolume,
    wastedVolume,
    efficiencyPercentage,
    wastedPercentage,
    wastedPockets,
    layers,
  };
}
