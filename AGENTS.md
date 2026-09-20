# Agent Guidelines for Luggage Pack

## Project Overview
**Luggage Pack** is an interactive web application that calculates optimal 3D packing cube arrangements inside luggage. It features:
- 3D isometric and layer-by-layer spatial packing visualization
- Heuristic 3D bin-packing algorithm with orientation and rotation support
- Wasted volume and modular gap minimization
- Smart purchase recommendations for complementary packing cubes
- Local storage persistence and import/export capabilities

## Tech Stack
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: `lucide-react`
- **Animation**: `motion`

## Code Structure
- `src/App.tsx`: Top-level application component and state coordinator.
- `src/types.ts`: Core data structures (`Dimensions`, `LuggageProfile`, `PackingCubeItem`, `PackingResult`, etc.).
- `src/components/`: Modular React components:
  - `PackingVisualizer.tsx`: Isometric 3D rendering and layer breakdown visualization.
  - `LuggageManager.tsx`: Luggage dimensions and profile configuration.
  - `CubeManager.tsx`: Cube inventory and quantity management.
  - `CubePurchaseSuggestions.tsx`: Commercial cube size recommendations.
  - `Header.tsx`: Navigation, units switch, import/export controls.
- `src/utils/`:
  - `packingAlgorithm.ts`: 3D packing calculation logic.
  - `units.ts`: Imperial / metric conversions and volume calculations.
  - `storage.ts`: `localStorage` persistence and serialization.
  - `presets.ts`: Default luggage and cube presets.
  - `suggestionEngine.ts`: Logic matching voids/margins to commercially available cube sizes.

## Development Commands
```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Run TypeScript type check
npm run lint

# Create production build in dist/
npm run build

# Preview production build locally
npm run preview

# Clean build artifacts
npm run clean
```

## Architectural Conventions & Rules
1. **Zero External AI Requirement at Runtime**:
   - The core packing algorithms and recommendation engine are implemented in pure client-side TypeScript (`packingAlgorithm.ts` and `suggestionEngine.ts`). Do not add external LLM dependencies unless explicitly requested by the user.
2. **Deterministic & Pure Geometry**:
   - Keep packing calculations fast and free of side effects.
   - All spatial calculations assume dimensions in centimeters (`cm`) and liters (`L`) internally as the canonical base unit.
3. **State Management**:
   - State is centralized in `App.tsx` and mirrored to `localStorage`.
   - When modifying data models, ensure backwards-compatible defaults in `src/utils/storage.ts`.
4. **Styling**:
   - Use Tailwind utility classes.
   - Maintain clean visual hierarchy, responsive layouts, and accessible contrast.
