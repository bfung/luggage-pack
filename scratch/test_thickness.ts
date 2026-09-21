import { calculateOptimalPacking } from '../src/utils/packingAlgorithm';
import { LuggageProfile, PackingCubeItem } from '../src/types';
import { DEFAULT_FABRIC_THICKNESS } from '../src/utils/storage';

// In inches: 6in = 15.24cm, 3in = 7.62cm, 4.5in = 11.43cm
const container6in: LuggageProfile = {
  id: 'test-luggage-6in',
  name: '6in Test Container',
  dimensions: { length: 15.24, width: 11.43, height: 11.43 }, // 6in x 4.5in x 4.5in
};

const cube3in: PackingCubeItem = {
  id: 'cube-3in',
  name: '3in Cube',
  dimensions: { length: 7.62, width: 7.62, height: 7.62 }, // 3in x 3in x 3in
  color: '#3b82f6',
  category: 'clothing',
  quantity: 2,
  allowRotation: false, // keep along length axis to test 3in + 3in along 6in
};

console.log('--- TEST 1: Theoretical Zero Clearance (thickness = 0) ---');
const resultZero = calculateOptimalPacking(container6in, [cube3in], false, 0);
console.log(`Placed cubes count: ${resultZero.placedCubes.length} of 2`);
console.log(`Unplaced count: ${resultZero.unplacedCubes.reduce((s, u) => s + u.unplacedCount, 0)}`);

console.log('\n--- TEST 2: Real-world 70D Ripstop Nylon (thickness = 0.024 cm = 0.24 mm) ---');
const result70D = calculateOptimalPacking(container6in, [cube3in], false, DEFAULT_FABRIC_THICKNESS);
console.log(`Placed cubes count: ${result70D.placedCubes.length} of 2`);
console.log(`Unplaced count: ${result70D.unplacedCubes.reduce((s, u) => s + u.unplacedCount, 0)}`);
result70D.placedCubes.forEach((p, idx) => {
  console.log(`Cube ${idx + 1} at (${p.x}, ${p.y}, ${p.z}), user dims: ${p.placedLength}x${p.placedWidth}x${p.placedHeight}, effective dims: ${p.effectiveDimensions?.length}x${p.effectiveDimensions?.width}x${p.effectiveDimensions?.height}`);
});

console.log('\n--- TEST 3: Container with 6.1in (15.494 cm) with 70D thickness ---');
const container6_1in: LuggageProfile = {
  id: 'test-luggage-6.1in',
  name: '6.1in Test Container',
  dimensions: { length: 15.494, width: 11.43, height: 11.43 },
};
const result6_1 = calculateOptimalPacking(container6_1in, [cube3in], false, DEFAULT_FABRIC_THICKNESS);
console.log(`Placed cubes count: ${result6_1.placedCubes.length} of 2`);
console.log(`Unplaced count: ${result6_1.unplacedCubes.reduce((s, u) => s + u.unplacedCount, 0)}`);

// Assertions
if (resultZero.placedCubes.length !== 2) {
  console.error('FAILED: Zero clearance should place 2 cubes in 6in container');
  process.exit(1);
}
if (result70D.placedCubes.length !== 1) {
  console.error('FAILED: 70D fabric thickness should prevent 2 cubes from fitting in 6in container');
  process.exit(1);
}
if (result70D.placedCubes.some((cube) =>
  cube.placedLength !== cube3in.dimensions.length ||
  cube.placedWidth !== cube3in.dimensions.width ||
  cube.placedHeight !== cube3in.dimensions.height
)) {
  console.error('FAILED: placement must preserve the user-specified cube dimensions');
  process.exit(1);
}
if (result6_1.placedCubes.length !== 2) {
  console.error('FAILED: 6.1in container should accommodate both cubes with 70D fabric thickness');
  process.exit(1);
}

console.log('\n--- TEST 4: Luggage with Permanent Interior Obstacle (Handle Casing) ---');
const containerWithObstacle: LuggageProfile = {
  ...container6_1in,
  id: 'test-luggage-with-obstacle',
  name: '6.1in Container with Handle Rods',
  permanentObjects: [
    {
      id: 'handle-rod-1',
      name: 'Interior Handle Rod',
      dimensions: { length: 15.494, width: 4.0, height: 3.0 },
      x: 0,
      y: 0,
      z: 0,
    },
  ],
};

const resultObstacle = calculateOptimalPacking(containerWithObstacle, [cube3in], false, DEFAULT_FABRIC_THICKNESS);
console.log(`Placed cubes count with obstacle: ${resultObstacle.placedCubes.length}`);
console.log(`Permanent objects count: ${resultObstacle.permanentObjects?.length ?? 0}`);
console.log(`Usable luggage volume: ${(resultObstacle.usableLuggageVolume ?? 0).toFixed(2)} cm³ (deducted: ${(resultObstacle.permanentObjectsVolume ?? 0).toFixed(2)} cm³)`);

if ((resultObstacle.permanentObjectsVolume ?? 0) <= 0) {
  console.error('FAILED: permanentObjectsVolume should be greater than 0');
  process.exit(1);
}
if ((resultObstacle.usableLuggageVolume ?? 0) >= resultObstacle.totalLuggageVolume) {
  console.error('FAILED: usableLuggageVolume must be less than totalLuggageVolume');
  process.exit(1);
}
// Check that none of the placed cubes overlap with the obstacle
for (const placed of resultObstacle.placedCubes) {
  const obs = containerWithObstacle.permanentObjects![0];
  const overlapX = placed.x < obs.x + obs.dimensions.length && placed.x + placed.placedLength > obs.x;
  const overlapY = placed.y < obs.y + obs.dimensions.width && placed.y + placed.placedWidth > obs.y;
  const overlapZ = placed.z < obs.z + obs.dimensions.height && placed.z + placed.placedHeight > obs.z;
  if (overlapX && overlapY && overlapZ) {
    console.error('FAILED: Placed cube collides with permanent obstacle!');
    process.exit(1);
  }
}

console.log('\n--- TEST 5: User Scenario (Twin Handle Rails with 14x10x3 in Cube) ---');
const in2cm = (v: number) => Math.round(v * 2.54 * 1000) / 1000;
const userLuggage: LuggageProfile = {
  id: 'luggage-rails',
  name: 'Carry-On with Rails',
  dimensions: { length: in2cm(18), width: in2cm(12.5), height: in2cm(7.5) },
  permanentObjects: [
    {
      id: 'left-rail',
      name: 'Left Rail',
      dimensions: { length: in2cm(15.7), width: in2cm(1.6), height: in2cm(1.3) },
      x: 0,
      y: in2cm(2.8),
      z: 0,
    },
    {
      id: 'right-rail',
      name: 'Right Rail',
      dimensions: { length: in2cm(15.7), width: in2cm(1.6), height: in2cm(1.3) },
      x: 0,
      y: in2cm(8.7),
      z: 0,
    },
  ],
};

const userCube: PackingCubeItem = {
  id: 'user-cube',
  name: 'Medium Cube',
  dimensions: { length: in2cm(14), width: in2cm(10), height: in2cm(3) },
  color: '#3b82f6',
  category: 'clothing',
  quantity: 1,
  allowRotation: true,
};

const resultUserScenario = calculateOptimalPacking(userLuggage, [userCube], true, DEFAULT_FABRIC_THICKNESS);
console.log(`Placed cubes count: ${resultUserScenario.placedCubes.length} of 1`);
console.log(`Unplaced count: ${resultUserScenario.unplacedCubes.reduce((s, u) => s + u.unplacedCount, 0)}`);

if (resultUserScenario.placedCubes.length !== 1) {
  console.error('FAILED: 14x10x3 in cube should fit into 18x12.5x7.5 in luggage over twin rails!');
  process.exit(1);
}

// Ensure no collision with rails
for (const p of resultUserScenario.placedCubes) {
  for (const obs of userLuggage.permanentObjects!) {
    const overlapX = p.x < obs.x + obs.dimensions.length && p.x + p.placedLength > obs.x;
    const overlapY = p.y < obs.y + obs.dimensions.width && p.y + p.placedWidth > obs.y;
    const overlapZ = p.z < obs.z + obs.dimensions.height && p.z + p.placedHeight > obs.z;
    if (overlapX && overlapY && overlapZ) {
      console.error(`FAILED: Placed cube overlaps with obstacle ${obs.name}!`);
      process.exit(1);
    }
  }
}

console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
