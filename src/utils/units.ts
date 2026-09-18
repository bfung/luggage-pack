import { UnitSystem, Dimensions } from '../types';

export const CM_PER_INCH = 2.54;

/**
 * Converts value in base cm to active unit system
 */
export function fromBase(cmValue: number, unit: UnitSystem): number {
  if (unit === 'in') {
    return Number((cmValue / CM_PER_INCH).toFixed(1));
  }
  return Number(cmValue.toFixed(1));
}

/**
 * Converts user input in active unit to base cm
 */
export function toBase(val: number, unit: UnitSystem): number {
  if (unit === 'in') {
    return Number((val * CM_PER_INCH).toFixed(2));
  }
  return Number(val.toFixed(2));
}

export function formatDimension(cmValue: number, unit: UnitSystem): string {
  const converted = fromBase(cmValue, unit);
  return `${converted} ${unit}`;
}

export function formatDimensions(dim: Dimensions, unit: UnitSystem): string {
  const l = fromBase(dim.length, unit);
  const w = fromBase(dim.width, unit);
  const h = fromBase(dim.height, unit);
  return `${l} × ${w} × ${h} ${unit}`;
}

/**
 * Computes volume in Liters from cm dimensions
 */
export function computeVolumeLiters(dim: Dimensions): number {
  return Number(((dim.length * dim.width * dim.height) / 1000).toFixed(1));
}

/**
 * Formats volume depending on unit
 */
export function formatVolume(cm3Volume: number, unit: UnitSystem): string {
  const liters = cm3Volume / 1000;
  if (unit === 'in') {
    const cuIn = cm3Volume / Math.pow(CM_PER_INCH, 3);
    return `${liters.toFixed(1)} L (${Math.round(cuIn).toLocaleString()} in³)`;
  }
  return `${liters.toFixed(1)} L (${Math.round(cm3Volume).toLocaleString()} cm³)`;
}
