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

console.log('\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
