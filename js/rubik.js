// Define Rubik's Cube dimensions and colors
const CUBE_SIZE = 1;
const CUBE_COLORS = [
  0xffffff, // white
  0xff8800, // orange
  0xff0000, // red
  0x00ff00, // green
  0x0000ff, // blue
  0xffff00, // yellow
];

// Create the scene
const scene = new THREE.Scene();



// Create the camera and position it
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

// Create Rubik's Cube geometry and material
const cubeGeometry = new THREE.BoxGeometry(CUBE_SIZE / 3, CUBE_SIZE / 3, CUBE_SIZE / 3);
const cubeMaterials = CUBE_COLORS.map(color => new THREE.MeshLambertMaterial({ color }));
const rubiksCubes = new THREE.Group();

// Create 27 little cubes and position them in the Rubik's Cube pattern
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
      cube.position.set(x * CUBE_SIZE / 3, y * CUBE_SIZE / 3, z * CUBE_SIZE / 3);
      rubiksCubes.add(cube);
    }
  }
}

// Position the Rubik's Cube
rubiksCubes.position.set(0, 0, 0);

// Add the Rubik's Cube to the scene
scene.add(rubiksCubes);

// Create the renderer and set its size
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Add the renderer to the page
document.body.appendChild(renderer.domElement);

// Render the scene
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

render();
