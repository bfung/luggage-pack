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
- Permanent interior objects (handle tubes, wheel housings) are defined per luggage profile with nominal length, width, height, and coordinates `(x, y, z)` within the container interior.
- Packing layout engine uses extended Extreme Points with boundary coordinate intersections and obstacle-aware wall projections, supporting placement on elevated fixture platforms, channels, and floor recesses.
- Vertical support checks distinguish between soft deformable cube stacks (20% contact) and rigid permanent obstacles (5% contact ratio allows bridging across narrow rails).
- Preserve backwards-compatible defaults when loading older local-storage or imported JSON data (e.g. empty `permanentObjects` arrays).
- Keep packing and recommendation calculations deterministic, client-side, and free of external AI/runtime services unless explicitly requested.
- Keep state coordination in `src/App.tsx`, shared models in `src/types.ts`, and use Tailwind utilities for styling with accessible contrast.

## Session summary (September 2026)

- Added persisted fabric-thickness state with backwards-compatible storage/import defaults and Settings choices for common materials.
- Updated packing, collision, support, wasted-space, and recommendation calculations to account for effective fabric-inclusive footprints while retaining nominal dimensions.
- Enhanced the 3D visualizer with thickness display modes, hover details, and repaired the interrupted JSX/yaw-aware face rendering.
- Added luggage-associated permanent interior objects with position in container (`x, y, z`) and dimensions (`length, width, height`) via a dedicated dialog in the Luggage Manager.
- Integrated interior obstacles into collision checking, layer bounds, usable volume calculations, 3D visualization with interactive hover inspection, and space audit reporting.
- Improved the 3D bin-packing layout engine for obstacles: extended Extreme Point candidate generation with cross-boundary coordinate planes and obstacle-height wall projections, allowing cubes to pack across elevated fixture platforms (e.g. handle rails) and recessed channels.
- Calibrated support stability check to support rigid fixtures bridging across narrow rails (lowered threshold from 20% to 5% when supported by permanent obstacles).
- Added comprehensive regression suite in `scratch/test_thickness.ts` covering zero-clearance, 70D fabric allowance, container sizing tolerances, interior obstacle collision/deduction, and twin handle rails bridging with a 14x10x3 in cube.

## AI Studio Environment Requirements

The following configurations and files are specifically required for the Google AI Studio cloud development and preview environment:

- **`vite.config.ts` (`server` & `preview` settings)**:
  - `server.host = '0.0.0.0'` and `server.port = 3000`: AI Studio's reverse proxy exclusively routes external traffic to container port 3000.
  - `server.allowedHosts = true` (and in `preview`): Vite 6+ blocks incoming requests from non-localhost hostnames by default. Setting `allowedHosts: true` allows requests from AI Studio's Cloud Run domains (`*.run.app`) to avoid HTTP 403 Forbidden errors.
  - `server.hmr` and `server.watch`: Checked against `DISABLE_HMR` (`process.env.DISABLE_HMR !== 'true'`) to disable file-watching and HMR during automated agent editing turns, preventing UI flickering and high CPU usage.
- **`metadata.json`**:
  - AI Studio platform configuration file storing application title, description, frame permissions, and major capabilities (`MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`). Required by the AI Studio workspace and deployment pipeline.
- **`.env.example`**:
  - Documents platform-injected environment variables like `GEMINI_API_KEY` and `APP_URL` injected by AI Studio.
- **`public/assets/aistudio/`**:
  - Workspace directory and `.gitignore` reserved for assets and artifacts generated within AI Studio.
- **SPA Deployment model**:
  - AI Studio automatically serves static files from `dist/` for client-side SPAs. A separate `start` script in `package.json` is omitted intentionally so the platform's static file server handles production preview and deployment.
- **Package tooling**:
  - AI Studio runs on Linux Node 22 with standard `npm`. Local development tools like `mise.toml`, `.nvmrc`, `.node-version`, and `bun.lock` are kept for maintainers working outside AI Studio, but within AI Studio, `npm` is used.
