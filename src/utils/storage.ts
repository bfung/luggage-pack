import { AppState, LuggageProfile, PackingCubeItem, UnitSystem } from '../types';
import { DEFAULT_CUBES_PRESETS, DEFAULT_LUGGAGE_PRESETS } from './presets';

const STORAGE_KEY = 'packoptima_user_state_v1';

export const INITIAL_STATE: AppState = {
  units: 'cm',
  selectedLuggageId: DEFAULT_LUGGAGE_PRESETS[0].id,
  luggageList: DEFAULT_LUGGAGE_PRESETS,
  cubesList: DEFAULT_CUBES_PRESETS,
  allowRotation: true,
};

export function loadStoredState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.luggageList) || parsed.luggageList.length === 0) {
      return INITIAL_STATE;
    }
    return {
      units: parsed.units === 'in' ? 'in' : 'cm',
      selectedLuggageId: parsed.selectedLuggageId || parsed.luggageList[0].id,
      luggageList: parsed.luggageList,
      cubesList: Array.isArray(parsed.cubesList) ? parsed.cubesList : DEFAULT_CUBES_PRESETS,
      allowRotation: parsed.allowRotation !== undefined ? parsed.allowRotation : true,
    };
  } catch (err) {
    console.error('Failed to parse state from localStorage', err);
    return INITIAL_STATE;
  }
}

export function saveStateToStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage', err);
  }
}

export function exportStateAsJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function importStateFromJson(jsonString: string): AppState | null {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data.luggageList) || !Array.isArray(data.cubesList)) {
      throw new Error('Invalid schema structure');
    }
    return {
      units: data.units === 'in' ? 'in' : 'cm',
      selectedLuggageId: data.selectedLuggageId || data.luggageList[0]?.id || 'luggage-default',
      luggageList: data.luggageList,
      cubesList: data.cubesList,
      allowRotation: data.allowRotation !== undefined ? data.allowRotation : true,
    };
  } catch (e) {
    console.error('Import failed', e);
    return null;
  }
}
