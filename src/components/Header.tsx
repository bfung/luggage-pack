import React, { useState, useRef } from 'react';
import { UnitSystem, AppState } from '../types';
import { Luggage, Rotate3d, Settings2, Download, Upload, RotateCcw } from 'lucide-react';
import { exportStateAsJson, importStateFromJson } from '../utils/storage';

interface HeaderProps {
  units: UnitSystem;
  onToggleUnits: (newUnits: UnitSystem) => void;
  allowRotation: boolean;
  onToggleRotation: (allow: boolean) => void;
  appState: AppState;
  onResetPresets: () => void;
  onImportState: (imported: AppState) => void;
}

export const Header: React.FC<HeaderProps> = ({
  units,
  onToggleUnits,
  allowRotation,
  onToggleRotation,
  appState,
  onResetPresets,
  onImportState,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const jsonStr = exportStateAsJson(appState);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `luggage-packing-setup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowSettings(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = importStateFromJson(content);
        if (parsed) {
          onImportState(parsed);
          alert('Configuration imported successfully!');
        } else {
          alert('Failed to import: invalid file format.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowSettings(false);
  };

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center shadow-xs">
            <Luggage className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
                Luggage Packing Optimizer
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-md">
                3D Bin Packing
              </span>
            </div>
            <p className="text-xs text-neutral-500 hidden sm:block">
              Calculate optimal cube arrangements and highlight wasted luggage space
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Unit Toggle */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-neutral-100 border border-neutral-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => onToggleUnits('cm')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                units === 'cm'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Metric (cm)
            </button>
            <button
              type="button"
              onClick={() => onToggleUnits('in')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                units === 'in'
                  ? 'bg-white text-neutral-900 shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Imperial (in)
            </button>
          </div>

          {/* 3D Rotation Toggle */}
          <button
            type="button"
            onClick={() => onToggleRotation(!allowRotation)}
            title={allowRotation ? '3D Rotation enabled (6 orientations)' : 'Flat only (2 orientations)'}
            className={`hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              allowRotation
                ? 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100'
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Rotate3d className="w-3.5 h-3.5" />
            <span>{allowRotation ? '3D Rotation: On' : '3D Rotation: Flat Only'}</span>
          </button>

          {/* Settings / Actions Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
              title="Preferences and Backup"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {showSettings && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSettings(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1.5 font-medium text-neutral-400 uppercase tracking-wider text-[10px]">
                    Data & Preferences
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onToggleRotation(!allowRotation);
                      setShowSettings(false);
                    }}
                    className="w-full text-left px-3 py-2 text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
                  >
                    <Rotate3d className="w-4 h-4 text-neutral-500" />
                    <span>Allow 3D Cube Rotation ({allowRotation ? 'Yes' : 'Flat only'})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExport}
                    className="w-full text-left px-3 py-2 text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4 text-neutral-500" />
                    <span>Export Data (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleImportClick}
                    className="w-full text-left px-3 py-2 text-neutral-700 hover:bg-neutral-50 flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4 text-neutral-500" />
                    <span>Import Data (JSON)</span>
                  </button>

                  <div className="border-t border-neutral-100 my-1"></div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset all luggage and packing cubes to default presets? Your custom items will be replaced.')) {
                        onResetPresets();
                        setShowSettings(false);
                      }
                    }}
                    className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                    <span>Reset to Defaults</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/json"
        className="hidden"
      />
    </header>
  );
};
