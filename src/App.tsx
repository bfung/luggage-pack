import React, { useState, useEffect, useMemo } from 'react';
import { AppState, LuggageProfile, PackingCubeItem, UnitSystem } from './types';
import { loadStoredState, saveStateToStorage, INITIAL_STATE } from './utils/storage';
import { calculateOptimalPacking } from './utils/packingAlgorithm';
import { Header } from './components/Header';
import { LuggageManager } from './components/LuggageManager';
import { CubeManager } from './components/CubeManager';
import { PackingVisualizer } from './components/PackingVisualizer';
import { DEFAULT_CUBES_PRESETS, DEFAULT_LUGGAGE_PRESETS } from './utils/presets';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadStoredState());
  const [calcNonce, setCalcNonce] = useState(0);

  // Sync state to local storage whenever it changes
  useEffect(() => {
    saveStateToStorage(appState);
  }, [appState]);

  // Active luggage
  const activeLuggage = useMemo(() => {
    return (
      appState.luggageList.find((l) => l.id === appState.selectedLuggageId) ||
      appState.luggageList[0]
    );
  }, [appState.luggageList, appState.selectedLuggageId]);

  // Calculate 3D optimal packing arrangement
  const packingResult = useMemo(() => {
    if (!activeLuggage) {
      return {
        placedCubes: [],
        unplacedCubes: [],
        totalLuggageVolume: 0,
        totalPackedVolume: 0,
        wastedVolume: 0,
        efficiencyPercentage: 0,
        wastedPercentage: 100,
        wastedPockets: [],
        layers: [],
      };
    }
    return calculateOptimalPacking(
      activeLuggage,
      appState.cubesList,
      appState.allowRotation
    );
    // calcNonce allows manual recalculate trigger
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLuggage, appState.cubesList, appState.allowRotation, calcNonce]);

  // Handlers for Units & Settings
  const handleToggleUnits = (newUnits: UnitSystem) => {
    setAppState((prev) => ({ ...prev, units: newUnits }));
  };

  const handleToggleRotation = (allow: boolean) => {
    setAppState((prev) => ({ ...prev, allowRotation: allow }));
  };

  const handleResetPresets = () => {
    setAppState({
      ...INITIAL_STATE,
      luggageList: DEFAULT_LUGGAGE_PRESETS,
      cubesList: DEFAULT_CUBES_PRESETS,
      selectedLuggageId: DEFAULT_LUGGAGE_PRESETS[0].id,
    });
  };

  const handleImportState = (imported: AppState) => {
    setAppState(imported);
  };

  // Handlers for Luggage
  const handleSelectLuggage = (id: string) => {
    setAppState((prev) => ({ ...prev, selectedLuggageId: id }));
  };

  const handleAddLuggage = (newLuggage: LuggageProfile) => {
    setAppState((prev) => ({
      ...prev,
      luggageList: [...prev.luggageList, newLuggage],
      selectedLuggageId: newLuggage.id,
    }));
  };

  const handleUpdateLuggage = (updatedLuggage: LuggageProfile) => {
    setAppState((prev) => ({
      ...prev,
      luggageList: prev.luggageList.map((l) => (l.id === updatedLuggage.id ? updatedLuggage : l)),
    }));
  };

  const handleDeleteLuggage = (id: string) => {
    setAppState((prev) => {
      const filtered = prev.luggageList.filter((l) => l.id !== id);
      const nextSelected =
        prev.selectedLuggageId === id ? filtered[0]?.id || '' : prev.selectedLuggageId;
      return {
        ...prev,
        luggageList: filtered,
        selectedLuggageId: nextSelected,
      };
    });
  };

  // Handlers for Cubes
  const handleAddCube = (newCube: PackingCubeItem) => {
    setAppState((prev) => ({
      ...prev,
      cubesList: [...prev.cubesList, newCube],
    }));
  };

  const handleUpdateCube = (updatedCube: PackingCubeItem) => {
    setAppState((prev) => ({
      ...prev,
      cubesList: prev.cubesList.map((c) => (c.id === updatedCube.id ? updatedCube : c)),
    }));
  };

  const handleDeleteCube = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      cubesList: prev.cubesList.filter((c) => c.id !== id),
    }));
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    setAppState((prev) => ({
      ...prev,
      cubesList: prev.cubesList.map((c) => (c.id === id ? { ...c, quantity: newQty } : c)),
    }));
  };

  const handlePackSamplePreset = () => {
    setAppState((prev) => ({
      ...prev,
      cubesList: prev.cubesList.map((c, index) => {
        // Set a balanced vacation packing list
        if (c.category === 'clothing') {
          return { ...c, quantity: index === 0 ? 1 : 2 };
        }
        return { ...c, quantity: 1 };
      }),
    }));
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 font-sans flex flex-col">
      {/* Top Navigation */}
      <Header
        units={appState.units}
        onToggleUnits={handleToggleUnits}
        allowRotation={appState.allowRotation}
        onToggleRotation={handleToggleRotation}
        appState={appState}
        onResetPresets={handleResetPresets}
        onImportState={handleImportState}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Luggage & Cubes Manager (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            <LuggageManager
              units={appState.units}
              luggageList={appState.luggageList}
              selectedLuggageId={appState.selectedLuggageId}
              onSelectLuggage={handleSelectLuggage}
              onAddLuggage={handleAddLuggage}
              onUpdateLuggage={handleUpdateLuggage}
              onDeleteLuggage={handleDeleteLuggage}
            />

            <CubeManager
              units={appState.units}
              cubesList={appState.cubesList}
              onAddCube={handleAddCube}
              onUpdateCube={handleUpdateCube}
              onDeleteCube={handleDeleteCube}
              onUpdateQuantity={handleUpdateQuantity}
              onPackSamplePreset={handlePackSamplePreset}
            />
          </div>

          {/* Right Column: Visualizer & Wasted Space Analysis (7 cols on lg) */}
          <div className="lg:col-span-7">
            {activeLuggage ? (
              <PackingVisualizer
                luggage={activeLuggage}
                cubes={appState.cubesList}
                packingResult={packingResult}
                units={appState.units}
                onRecalculate={() => setCalcNonce((n) => n + 1)}
              />
            ) : (
              <div className="p-8 text-center bg-white rounded-xl border border-neutral-200">
                Please select or create a luggage profile.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
