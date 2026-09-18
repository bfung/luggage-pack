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
}
