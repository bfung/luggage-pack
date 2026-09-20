export type UnitSystem = 'cm' | 'in';

export interface Dimensions {
  length: number; // X axis
  width: number;  // Y axis
  height: number; // Z axis (depth)
}

export interface LuggageProfile {
  id: string;
  name: string;
  dimensions: Dimensions; // stored in base units (cm)
  color?: string;
  isPreset?: boolean;
}

export interface PackingCubeItem {
  id: string;
  name: string;
  dimensions: Dimensions; // stored in base units (cm)
  color: string;
  category: 'clothing' | 'toiletries' | 'tech' | 'shoes' | 'accessories' | 'other';
  quantity: number;
  allowRotation?: boolean;
}

export interface PlacedCube {
  instanceId: string;
  cubeId: string;
  name: string;
  color: string;
  category: string;
  // Position in container (lower-left-bottom corner)
  x: number;
  y: number;
  z: number;
  // Dimensions as placed (accounting for 3D rotation)
  placedLength: number; // dx
  placedWidth: number;  // dy
  placedHeight: number; // dz
  originalDimensions: Dimensions;
  volume: number;
  rotationName: string;
  fabricThickness?: number;
  effectiveDimensions?: Dimensions;
}

export interface WastedSpacePocket {
  id: string;
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
  volume: number;
  description: string;
}

export interface SuggestedCubeRecommendation {
  id: string;
  name: string;
  dimensions: Dimensions; // in base cm
  category: 'clothing' | 'toiletries' | 'tech' | 'shoes' | 'accessories' | 'other';
  color: string;
  volumeLiters: number;
  reason: string;
  targetArea: 'headroom' | 'side-margin' | 'corner-void' | 'modular-gap' | 'all-purpose';
  projectedEfficiencyGain: number; // e.g. +12.4%
  recoveredVolumeLiters: number; // e.g. 3.2 L
  idealFitScore: number; // 0 to 100 match score
  suggestedQuantity: number;
  fitsWithExisting: boolean;
}

export interface PackingResult {
  placedCubes: PlacedCube[];
  unplacedCubes: {
    cube: PackingCubeItem;
    unplacedCount: number;
  }[];
  totalLuggageVolume: number;
  totalPackedVolume: number;
  wastedVolume: number;
  efficiencyPercentage: number;
  wastedPercentage: number;
  wastedPockets: WastedSpacePocket[];
  layers: {
    zBottom: number;
    zTop: number;
    cubeCount: number;
  }[];
}

export interface AppState {
  units: UnitSystem;
  selectedLuggageId: string;
  luggageList: LuggageProfile[];
  cubesList: PackingCubeItem[];
  allowRotation: boolean;
  fabricThickness?: number; // stored in base units (cm), e.g. 0.024 for 70D nylon ripstop
}
