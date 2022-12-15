// Initialization
const scene = new THREE.Scene()
const w = postWidth();
const a = 1; // aspect ratio 1
const h = w/a;
const fov = 75; // Field of View (degrees)
const camera = new THREE.PerspectiveCamera(fov, w/h, 0.1, 1000);

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

const dir = new THREE.Vector3(1.1,1.1,1.1);
const origin = new THREE.Vector3(1, 1, 1);
const length = 2;
const hex = 0xffff00;

const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
scene.add( arrowHelper );


var axisHelper = new THREE.AxisHelper( 15 );
scene.add(axisHelper);
camera.position.x = 1;
camera.position.y = 2;
camera.position.z = 4;


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



// controls
controls = new THREE.TrackballControls(camera);//sets up controls

function animate() {
	requestAnimationFrame( animate );
    controls.update();
	renderer.render(scene, camera);
}
animate();