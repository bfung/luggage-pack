# Luggage Pack 🧳

Pack your suitcase with packing cubes using optimal 3D bin-packing calculations.

Luggage Pack computes the most efficient 3D arrangements of packing cubes inside your luggage, provides interactive 3D layer-by-layer visualization, calculates wasted volume pockets, and recommends commercial cube sizes to purchase to maximize unused space.

---

## Features

- **3D Bin Packing Engine**: Calculates arrangement based on length, width, and height constraints with rotation support.
- **Interactive Visualization**: Isometric 3D rendering and layer breakdown showing packed cubes and remaining space.
- **Luggage Profiles & Presets**: Includes standard carry-on and checked luggage sizes or custom dimensions.
- **Cube Inventory Management**: Customize dimensions, colors, categories, and counts.
- **Smart Purchase Suggestions**: Suggests standard commercial packing cube sizes that best fit residual voids.
- **Client-Side Persistence**: Saves luggage configurations and cubes in `localStorage` with JSON export/import.
- **Metric & Imperial Support**: Toggle seamlessly between centimeters (cm) / liters (L) and inches (in) / cubic inches.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Dev Server**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animation**: Motion

---

## Getting Started

### Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10+`

> [!TIP]
> If you use [mise](https://mise.jdx.dev/), [nvm](https://github.com/nvm-sh/nvm), or [fnm](https://github.com/Schniz/fnm), run:
> ```bash
> mise install
> # or: nvm use
> # or: fnm use
> ```
> The repository includes `mise.toml`, `.nvmrc`, and `.node-version` pinned to Node LTS (22).

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/luggage-pack.git
cd luggage-pack
npm install
```

### Running the Development Server

Start Vite's local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be accessible at:
```
http://localhost:3000
```

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the local dev server on port `3000` (`--host=0.0.0.0`) |
| `npm run build` | Compiles TypeScript and builds production-ready static assets in `dist/` |
| `npm run preview` | Runs a local web server to preview the production build in `dist/` |
| `npm run lint` | Runs the TypeScript compiler check (`tsc --noEmit`) |
| `npm run clean` | Deletes build artifacts (`dist/`) |

---

## Project Structure

```text
luggage-pack/
├── src/
│   ├── components/         # React UI components (Visualizer, Managers, Suggestions)
│   ├── utils/              # 3D bin packing algorithm, units conversion, storage
│   ├── types.ts            # TypeScript definitions (Luggage, Cubes, Results)
│   ├── App.tsx             # Root application component and state management
│   ├── main.tsx            # Vite React entry point
│   └── index.css           # Global stylesheet and Tailwind imports
├── .node-version           # Pinned Node version (asdf, fnm, nodenv)
├── .nvmrc                  # Pinned Node version (nvm)
├── AGENTS.md               # Architecture and guidelines for AI coding agents
├── metadata.json           # Applet metadata
├── package.json            # Scripts and dependencies
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build configuration
```

---

## License

Private / MIT (or as specified by project maintainer).
