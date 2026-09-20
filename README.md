# Luggage Pack

Luggage Pack helps you arrange packing cubes inside a suitcase, understand unused space, and identify cube sizes that may fit the remaining gaps.

## For users

1. Start with a luggage preset or create a profile with your interior length, width, and height.
2. Add packing cubes, set their dimensions and quantities, and choose whether rotation is allowed.
3. Review the arrangement, packed volume, unplaced items, layer breakdown, and wasted-space audit.
4. Use purchase suggestions to explore cube sizes that may fit the remaining voids.
5. Under **Settings**, choose a material allowance when physical fabric thickness matters. The default is 70D ripstop nylon (0.24 mm per axis allowance); zero clearance is available for purely geometric comparisons.
6. Switch between metric and imperial units. Use **Export Data** to back up a setup and **Import Data** to restore it.

All calculations run in the browser. Your setup is saved locally in the browser; no account is required.

## For developers

### Requirements

- Node.js 20 or newer (Node 22 LTS recommended)
- npm 10 or newer

### Install and run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### Checks and build

```bash
npm run lint    # TypeScript check
npm run build   # Production build
npm run preview # Preview dist/
```

For the fabric-clearance regression check:

```bash
npx tsx scratch/test_thickness.ts
```

The test covers zero-clearance packing, the 70D 0.024 cm allowance, a slightly larger container, and preservation of user-entered dimensions.

Use the package manager and Node-version tooling available in your environment. On the maintainer’s laptop, `mise exec -- <command>` is the supported way to run project commands because the system Node installation is not reliable; this is not required on other machines.

## License

Private / MIT (or as specified by the project maintainer).
