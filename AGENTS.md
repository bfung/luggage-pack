# Agent Guidelines for Luggage Pack

## Project overview

Luggage Pack is a client-side React/TypeScript app for arranging packing cubes in luggage. It supports luggage and cube profiles, rotation-aware packing, 3D visualization, wasted-space analysis, purchase suggestions, local persistence, and JSON import/export.

## Development workflow

```bash
npm install
npm run dev       # http://localhost:3000
npm run lint      # TypeScript check
npm run build     # Production build
npm run preview   # Preview dist/
```

On the maintainer’s laptop, run commands through `mise exec -- ...` because the system Node installation has a missing library dependency. In every other development environment, use whatever working Node/package-manager tooling that environment provides; do not assume `mise` is installed or required.

Before handing off a change, run the type check and production build. For packing-clearance changes, also run `npx tsx scratch/test_thickness.ts`.

Keep README.md updates concise and focused on actionable information for end users; avoid implementation details.

## Product conventions

- Keep user-entered cube dimensions unchanged in forms, inventory, manifests, and displayed measurements.
- Geometry uses centimeters internally; convert only at input/output boundaries.
- Fabric thickness is a placement allowance, not a mutation of nominal dimensions. The default is `0.024` cm for 70D ripstop nylon, with selectable alternatives in Settings.
- Preserve backwards-compatible defaults when loading older local-storage or imported JSON data.
- Keep packing and recommendation calculations deterministic, client-side, and free of external AI/runtime services unless explicitly requested.
- Keep state coordination in `src/App.tsx`, shared models in `src/types.ts`, and use Tailwind utilities for styling with accessible contrast.

## Session summary (September 2026)

- Added persisted fabric-thickness state with backwards-compatible storage/import defaults and Settings choices for common materials.
- Updated packing, collision, support, wasted-space, and recommendation calculations to account for effective fabric-inclusive footprints while retaining nominal dimensions.
- Enhanced the 3D visualizer with thickness display modes, hover details, and repaired the interrupted JSX/yaw-aware face rendering.
- Added and verified the 6-inch/3-inch regression scenario in `scratch/test_thickness.ts`.
