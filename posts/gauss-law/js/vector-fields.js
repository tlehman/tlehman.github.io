// Initialization
const scene = new THREE.Scene()
const w = postWidth();
const a = 1; // aspect ratio 1
const h = w/a;
const fov = 70; // Field of View (degrees)
const camera = new THREE.PerspectiveCamera(fov, w/h, 1, 100);

// returns the width of the article.post element, used in resizing
function postWidth() {
    const leftPadding = 10;
    return document.getElementsByClassName("post")[0].offsetWidth - leftPadding*2;
}
// handle resizing
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = a;
    camera.updateProjectionMatrix();// what is this?
    const w = postWidth();
    const h = w/a;
    renderer.setSize(w, h);
    controls.handleResize();
}

var axisHelper = new THREE.AxisHelper( 15 );
scene.add(axisHelper);
camera.position.x = 1;
camera.position.y = 1;
camera.position.z = 1;


const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
const vfCanvas = document.getElementById("vector-fields");
vfCanvas.appendChild(renderer.domElement);

vfCanvas.onmouseenter = function() {
    controls.enabled = true;
}
vfCanvas.onmouseleave = function() {
    controls.enabled = false;
}

function vectorField(v) {
    const x = v.x;
    const y = v.y;
    const z = v.z;
    var fv = new THREE.Vector3(x + 1/x, y + 1/y, z + 1/z);
    return fv;
}

// distance between v and vf
function d(v, vf) {
    const dx = v.x-vf.x;
    const dy = v.y-vf.y;
    const dz = v.z-vf.z;
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

const π = Math.PI;
const k = 10;
const r_max = 100;
const m = 5;
const sin = Math.sin;
const cos = Math.cos;
const hex = 0xffff00;
// Sweep around a circle, plotting k equidistant points
for(var θ = 0; θ < 2*π; θ+=2*π/k) {
  // Sweep around a circle, plotting k equidistant points
  for(var ϕ = 0; ϕ < 2*π; ϕ+=2*π/k) {
    // Radiate out from the center, plotting m points
    for(var r = 0.01; r < r_max; r += r_max/m) {
      // Compute (x,y,z) from (θ,ϕ,r)
      var x = r*sin(θ)*cos(ϕ);
      var y = r*sin(θ)*sin(ϕ);
      var z = r*cos(θ);
      // Compute E(x,y,z) at (x,y,z)
      var Ex = 1/(r*r);
      var Ey = 1/(r*r);
      var Ez = 1/(r*r);
      // Create vectors v1=(0,0,0) and v2=(Ex,Ey,Ez)
      var v1 = new THREE.Vector3(0,0,0);
      var v2 = new THREE.Vector3(Ex,Ey,Ez);
      var dir = new THREE.Vector3();
      dir.subVectors(v2, v1);
      dir.normalize();
      // Render the direction vector at (x,y,z)
      var arr = new THREE.ArrowHelper(dir, v1, 1, hex);
      scene.add(arr);
      console.log(`(x,y,z) = (${x},${y},${z}`);
      console.log(`(Ex,Ey,Ez) = (${Ex},${Ey},${Ez}`);
    }
  }
}


// controls
controls = new THREE.TrackballControls(camera);//sets up controls

function animate() {
	requestAnimationFrame( animate );
    controls.update();
	renderer.render(scene, camera);
}
animate();