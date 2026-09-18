import { LuggageProfile, PackingCubeItem } from '../types';

export const DEFAULT_LUGGAGE_PRESETS: LuggageProfile[] = [
  {
    id: 'luggage-carry-on-intl',
    name: 'Standard International Carry-On',
    dimensions: { length: 55, width: 40, height: 20 },
    color: '#0284c7',
    isPreset: true,
  },
  {
    id: 'luggage-carry-on-us',
    name: 'Domestic Carry-On (22" × 14" × 9")',
    dimensions: { length: 56, width: 36, height: 23 },
    color: '#2563eb',
    isPreset: true,
  },
  {
    id: 'luggage-checked-med',
    name: 'Medium Checked Bag (26")',
    dimensions: { length: 66, width: 45, height: 26 },
    color: '#4f46e5',
    isPreset: true,
  },
  {
    id: 'luggage-checked-large',
    name: 'Large Checked Spinner (30")',
    dimensions: { length: 75, width: 50, height: 30 },
    color: '#7c3aed',
    isPreset: true,
  },
  {
    id: 'luggage-weekender-duffle',
    name: 'Weekender Duffle Bag',
    dimensions: { length: 50, width: 30, height: 25 },
    color: '#0d9488',
    isPreset: true,
  },
];

export const DEFAULT_CUBES_PRESETS: PackingCubeItem[] = [
  {
    id: 'cube-large-garment',
    name: 'Large Garment Cube',
    dimensions: { length: 35, width: 26, height: 10 },
    color: '#3b82f6', // blue
    category: 'clothing',
    quantity: 1,
    allowRotation: true,
  },
  {
    id: 'cube-medium-clothes',
    name: 'Medium Clothes Cube',
    dimensions: { length: 28, width: 18, height: 9 },
    color: '#10b981', // emerald
    category: 'clothing',
    quantity: 1,
    allowRotation: true,
  },
  {
    id: 'cube-small-underwear',
    name: 'Small Essentials Cube',
    dimensions: { length: 22, width: 15, height: 8 },
    color: '#8b5cf6', // violet
    category: 'clothing',
    quantity: 1,
    allowRotation: true,
  },
  {
    id: 'cube-toiletry-bag',
    name: 'Hanging Toiletry Kit',
    dimensions: { length: 24, width: 14, height: 10 },
    color: '#f59e0b', // amber
    category: 'toiletries',
    quantity: 1,
    allowRotation: true,
  },
  {
    id: 'cube-tech-pouch',
    name: 'Electronics & Cables Pouch',
    dimensions: { length: 20, width: 12, height: 7 },
    color: '#06b6d4', // cyan
    category: 'tech',
    quantity: 1,
    allowRotation: true,
  },
  {
    id: 'cube-shoe-bag',
    name: 'Footwear Shoe Bag',
    dimensions: { length: 33, width: 20, height: 11 },
    color: '#ec4899', // rose
    category: 'shoes',
    quantity: 1,
    allowRotation: true,
  },
];
