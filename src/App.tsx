import React, { useState, useEffect, useMemo } from 'react';
import { AppState, LuggageProfile, PackingCubeItem, SuggestedCubeRecommendation, UnitSystem } from './types';
import { loadStoredState, saveStateToStorage, INITIAL_STATE } from './utils/storage';
import { calculateOptimalPacking } from './utils/packingAlgorithm';
import { Header } from './components/Header';
import { LuggageManager } from './components/LuggageManager';
import { CubeManager } from './components/CubeManager';
import { PackingVisualizer } from './components/PackingVisualizer';
import { CubePurchaseSuggestions } from './components/CubePurchaseSuggestions';
import { DEFAULT_CUBES_PRESETS, DEFAULT_LUGGAGE_PRESETS } from './utils/presets';
import { Box, ShoppingBag, Sparkles, ArrowRight, Check } from 'lucide-react';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadStoredState());
  const [calcNonce, setCalcNonce] = useState(0);
  const [activeSection, setActiveSection] = useState<'workspace' | 'suggestions'>('workspace');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Handlers for Suggested Cubes to Buy
  const handleAddSuggestedCube = (rec: SuggestedCubeRecommendation) => {
    const newCube: PackingCubeItem = {
      id: `suggested-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: rec.name,
      dimensions: rec.dimensions,
      color: rec.color,
      category: rec.category,
      quantity: 1,
      allowRotation: true,
    };

    setAppState((prev) => ({
      ...prev,
      cubesList: [...prev.cubesList, newCube],
    }));

    setToastMessage(`Added "${rec.name}" to your cubes list! You can now test it in your 3D layout.`);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleAddBundle = (bundle: SuggestedCubeRecommendation[]) => {
    const newCubes: PackingCubeItem[] = bundle.map((rec, i) => ({
      id: `suggested-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      name: rec.name,
      dimensions: rec.dimensions,
      color: rec.color,
      category: rec.category,
      quantity: 1,
      allowRotation: true,
    }));

    setAppState((prev) => ({
      ...prev,
      cubesList: [...prev.cubesList, ...newCubes],
    }));

    setToastMessage(`Added recommended 2-piece cube set to your cubes list!`);
    setTimeout(() => setToastMessage(null), 4500);
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Section Navigation Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveSection('workspace')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSection === 'workspace'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>3D Packing & Arrangement</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('suggestions')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSection === 'suggestions'
                  ? 'bg-purple-900 text-white shadow-2xs'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-purple-400" />
              <span>Suggested Sizes to Buy</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold">
                Optimize Voids
              </span>
            </button>
          </div>

          {/* Quick Context Readout */}
          <div className="flex items-center space-x-3 text-xs text-neutral-500 pr-2">
            <span>
              Luggage:{' '}
              <strong className="text-neutral-800 font-medium">{activeLuggage?.name}</strong>
            </span>
            <span>·</span>
            <span>
              Wasted:{' '}
              <strong className="text-amber-700 font-mono font-medium">
                {packingResult.wastedPercentage}%
              </strong>
            </span>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-3 bg-emerald-900 text-white rounded-xl shadow-md flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveSection('workspace')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-md font-semibold shrink-0 cursor-pointer"
            >
              <span>View in 3D Layout</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Section 1: Main Workspace */}
        {activeSection === 'workspace' && (
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
                onOpenSuggestions={() => setActiveSection('suggestions')}
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
                  onOpenSuggestions={() => setActiveSection('suggestions')}
                />
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-neutral-200">
                  Please select or create a luggage profile.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 2: Dedicated Suggested Cube Sizes to Buy */}
        {activeSection === 'suggestions' && activeLuggage && (
          <div className="space-y-6">
            <CubePurchaseSuggestions
              luggage={activeLuggage}
              cubes={appState.cubesList}
              packingResult={packingResult}
              allowRotation={appState.allowRotation}
              units={appState.units}
              onAddSuggestedCube={handleAddSuggestedCube}
              onAddBundle={handleAddBundle}
            />

            {/* Bottom Navigation CTA */}
            <div className="p-4 bg-white rounded-xl border border-neutral-200 flex items-center justify-between">
              <span className="text-xs text-neutral-600">
                Want to view your updated packing layout with your existing and added cubes?
              </span>
              <button
                type="button"
                onClick={() => setActiveSection('workspace')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Back to 3D Packing Layout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
