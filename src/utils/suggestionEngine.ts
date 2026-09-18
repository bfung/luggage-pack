import { Dimensions, LuggageProfile, PackingCubeItem, PackingResult, SuggestedCubeRecommendation } from '../types';
import { calculateOptimalPacking } from './packingAlgorithm';
import { computeVolumeLiters } from './units';

// Library of standard commercially available packing cubes on the market
const COMMERCIAL_CUBE_TEMPLATES: Array<{
  name: string;
  dimensions: Dimensions;
  category: PackingCubeItem['category'];
  color: string;
  targetArea: SuggestedCubeRecommendation['targetArea'];
  baseReason: string;
}> = [
  {
    name: 'Slim Cable & Tech Pouch',
    dimensions: { length: 20, width: 12, height: 6 },
    category: 'tech',
    color: '#06b6d4',
    targetArea: 'corner-void',
    baseReason: 'Compact flat pouch ideal for charger cords and small electronics in corner voids.',
  },
  {
    name: 'Long Tube / Roll Organizer',
    dimensions: { length: 33, width: 11, height: 8 },
    category: 'clothing',
    color: '#8b5cf6',
    targetArea: 'side-margin',
    baseReason: 'Elongated tube shape designed to fill long lateral margins along suitcase edges.',
  },
  {
    name: 'Compact Half Cube',
    dimensions: { length: 25, width: 18, height: 8 },
    category: 'clothing',
    color: '#10b981',
    targetArea: 'modular-gap',
    baseReason: 'Versatile half-modular cube for t-shirts and undergarments.',
  },
  {
    name: 'Quarter Accessory Cube',
    dimensions: { length: 18, width: 13, height: 6 },
    category: 'accessories',
    color: '#f59e0b',
    targetArea: 'corner-void',
    baseReason: 'Fills small residual gaps with jewelry, adapters, or medicine.',
  },
  {
    name: 'Slim Garment / Shirt Folder',
    dimensions: { length: 36, width: 25, height: 6 },
    category: 'clothing',
    color: '#3b82f6',
    targetArea: 'headroom',
    baseReason: 'Shallow wide profile designed to rest across the top clearance layer.',
  },
  {
    name: 'Compact Hanging Toiletry Bag',
    dimensions: { length: 22, width: 14, height: 8 },
    category: 'toiletries',
    color: '#d97706',
    targetArea: 'side-margin',
    baseReason: 'Efficient hygiene organizer that slots upright or flat into open borders.',
  },
  {
    name: 'Slim Footwear / Shoe Pouch',
    dimensions: { length: 32, width: 18, height: 9 },
    category: 'shoes',
    color: '#ec4899',
    targetArea: 'side-margin',
    baseReason: 'Streamlined shoe or sandal sleeve fitting tight lengthwise gaps.',
  },
  {
    name: 'Mini Compression Cube',
    dimensions: { length: 22, width: 16, height: 7 },
    category: 'clothing',
    color: '#6366f1',
    targetArea: 'modular-gap',
    baseReason: 'High-density compression pouch for socks, ties, or activewear.',
  },
  {
    name: 'Ultra-Thin Document & Tech Sleeve',
    dimensions: { length: 32, width: 22, height: 4 },
    category: 'tech',
    color: '#64748b',
    targetArea: 'headroom',
    baseReason: 'Ultra-slim 4cm height profile fits shallow headroom clearances.',
  },
  {
    name: 'Narrow Side Tube Pouch',
    dimensions: { length: 28, width: 9, height: 7 },
    category: 'accessories',
    color: '#14b8a6',
    targetArea: 'side-margin',
    baseReason: 'Narrow 9cm profile engineered for edge margins next to large garment cubes.',
  },
];

/**
 * Evaluates the existing packing result and generates high-impact cube size recommendations to buy.
 * Each recommendation is mathematically simulated to ensure it fits into the remaining wasted space.
 */
export function generateCubePurchaseSuggestions(
  luggage: LuggageProfile,
  existingCubes: PackingCubeItem[],
  currentResult: PackingResult,
  allowRotation: boolean
): SuggestedCubeRecommendation[] {
  const currentPackedCount = currentResult.placedCubes.length;
  const currentPackedVol = currentResult.totalPackedVolume;
  const currentEfficiency = currentResult.efficiencyPercentage;
  const currentWastedVol = currentResult.wastedVolume;

  if (currentWastedVol <= 500) {
    // Suitcase is already virtually 100% full
    return [];
  }

  // Calculate current max bounds of placed cubes
  let maxZ = 0;
  let maxX = 0;
  let maxY = 0;
  currentResult.placedCubes.forEach((b) => {
    maxZ = Math.max(maxZ, b.z + b.placedHeight);
    maxX = Math.max(maxX, b.x + b.placedLength);
    maxY = Math.max(maxY, b.y + b.placedWidth);
  });

  const topHeadroom = Math.max(0, luggage.dimensions.height - maxZ);
  const lengthGap = Math.max(0, luggage.dimensions.length - maxX);
  const widthGap = Math.max(0, luggage.dimensions.width - maxY);

  // Candidate pool includes standard commercial sizes + dynamically generated void-filling sizes
  const candidates: Array<{
    name: string;
    dimensions: Dimensions;
    category: PackingCubeItem['category'];
    color: string;
    targetArea: SuggestedCubeRecommendation['targetArea'];
    reason: string;
  }> = [];

  // 1. Add commercial templates
  COMMERCIAL_CUBE_TEMPLATES.forEach((tpl) => {
    // Only consider candidates whose max dimension doesn't exceed luggage dimensions
    if (
      tpl.dimensions.length <= luggage.dimensions.length &&
      tpl.dimensions.width <= luggage.dimensions.width &&
      tpl.dimensions.height <= luggage.dimensions.height
    ) {
      candidates.push({
        name: tpl.name,
        dimensions: tpl.dimensions,
        category: tpl.category,
        color: tpl.color,
        targetArea: tpl.targetArea,
        reason: tpl.baseReason,
      });
    }
  });

  // 2. Add dynamically generated custom sizes targeted to specific detected gaps
  // A. If top headroom is significant (>= 4 cm):
  if (topHeadroom >= 4) {
    const halfL = Math.floor(luggage.dimensions.length / 2) - 1;
    const fullW = luggage.dimensions.width - 2;
    const targetH = Math.min(Math.floor(topHeadroom), 10);

    candidates.push({
      name: `Custom Top-Headroom Half-Layer Cube`,
      dimensions: { length: Math.max(15, halfL), width: Math.max(12, fullW), height: targetH },
      category: 'clothing',
      color: '#38bdf8',
      targetArea: 'headroom',
      reason: `Custom-tailored to fill the remaining ${Math.round(topHeadroom)} cm top headroom across half the luggage footprint.`,
    });

    if (luggage.dimensions.width >= 24) {
      const halfW = Math.floor(luggage.dimensions.width / 2) - 1;
      candidates.push({
        name: `Custom Shallow Quarter Cube`,
        dimensions: { length: Math.max(15, halfL), width: Math.max(12, halfW), height: targetH },
        category: 'clothing',
        color: '#818cf8',
        targetArea: 'headroom',
        reason: `Modular quarter-footprint cube matching your top headroom (${Math.round(topHeadroom)} cm depth).`,
      });
    }
  }

  // B. If length margin along X is significant (>= 6 cm):
  if (lengthGap >= 6) {
    const targetL = Math.min(Math.floor(lengthGap), 20);
    const targetW = Math.max(10, Math.floor(luggage.dimensions.width * 0.7));
    const targetH = Math.min(Math.floor(luggage.dimensions.height * 0.8), 12);

    candidates.push({
      name: `Custom Lateral Gap Filler Tube`,
      dimensions: { length: targetL, width: targetW, height: targetH },
      category: 'accessories',
      color: '#a855f7',
      targetArea: 'side-margin',
      reason: `Engineered to utilize the ${Math.round(lengthGap)} cm unused margin along the end of the suitcase.`,
    });
  }

  // C. If width margin along Y is significant (>= 6 cm):
  if (widthGap >= 6) {
    const targetW = Math.min(Math.floor(widthGap), 18);
    const targetL = Math.max(15, Math.floor(luggage.dimensions.length * 0.7));
    const targetH = Math.min(Math.floor(luggage.dimensions.height * 0.8), 12);

    candidates.push({
      name: `Custom Long Side Perimeter Pouch`,
      dimensions: { length: targetL, width: targetW, height: targetH },
      category: 'toiletries',
      color: '#f97316',
      targetArea: 'side-margin',
      reason: `Fills the ${Math.round(widthGap)} cm side gap running along the length of your luggage.`,
    });
  }

  // 3. Test each candidate through 3D bin packing simulation
  const recommendations: SuggestedCubeRecommendation[] = [];
  const testedSignatures = new Set<string>();

  candidates.forEach((cand, idx) => {
    // Deduplicate identical dimensions
    const sortedDims = [cand.dimensions.length, cand.dimensions.width, cand.dimensions.height].sort((a, b) => a - b);
    const sig = sortedDims.join('x');
    if (testedSignatures.has(sig)) return;
    testedSignatures.add(sig);

    const testItem: PackingCubeItem = {
      id: `test-candidate-${idx}`,
      name: cand.name,
      dimensions: cand.dimensions,
      color: cand.color,
      category: cand.category,
      quantity: 1,
      allowRotation: true,
    };

    // Simulate packing: existing cubes + 1 of this candidate
    const simulatedCubes = [...existingCubes, testItem];
    const simResult = calculateOptimalPacking(luggage, simulatedCubes, allowRotation);

    // Check if the candidate was placed and didn't displace existing cubes
    const wasCandidatePlaced = simResult.placedCubes.some((b) => b.cubeId === testItem.id);
    const totalSimPlaced = simResult.placedCubes.length;

    if (wasCandidatePlaced && totalSimPlaced > currentPackedCount) {
      const newPackedVol = simResult.totalPackedVolume;
      const recoveredVol = Math.max(0, newPackedVol - currentPackedVol);
      const efficiencyGain = Number((simResult.efficiencyPercentage - currentEfficiency).toFixed(1));
      const recoveredVolLiters = Number((recoveredVol / 1000).toFixed(1));

      if (efficiencyGain > 0.4 && recoveredVolLiters > 0.2) {
        // Calculate fit score (0-100)
        // Rewards higher efficiency gain, reasonable size, and targeted gap alignment
        const gainScore = Math.min(60, efficiencyGain * 4);
        const volumeScore = Math.min(30, recoveredVolLiters * 5);
        const fitScore = Math.min(100, Math.round(10 + gainScore + volumeScore));

        recommendations.push({
          id: `rec-${idx}-${sig}`,
          name: cand.name,
          dimensions: cand.dimensions,
          category: cand.category,
          color: cand.color,
          volumeLiters: computeVolumeLiters(cand.dimensions),
          reason: cand.reason,
          targetArea: cand.targetArea,
          projectedEfficiencyGain: efficiencyGain,
          recoveredVolumeLiters: recoveredVolLiters,
          idealFitScore: fitScore,
          suggestedQuantity: 1,
          fitsWithExisting: true,
        });
      }
    }
  });

  // Sort recommendations by idealFitScore descending
  recommendations.sort((a, b) => b.idealFitScore - a.idealFitScore);

  return recommendations;
}
