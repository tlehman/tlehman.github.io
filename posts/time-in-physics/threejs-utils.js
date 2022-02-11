const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const canvas = document.getElementById("newtonian-spacetime");
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: false
});

// By default all canvas elements are rendered at maximum width inside an article.
var articles = document.getElementsByTagName("article");
var defaultWidth = 200;
var articleWidth = articles[0].offsetWidth || defaultWidth;
var min, max, w;
var rmax; // max radius on a polar plot
renderer.setSize(articleWidth, articleWidth * 0.66);

window.onresize = function() {
  articleWidth = articles[0].offsetWidth || defaultWidth;
  renderer.setSize( articleWidth, articleWidth * 0.66 );
}

// add the cube, we need a mesh, 
// and mesh needs geometry and material
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh(geometry, material);

scene.add(cube);
camera.position.z = 5;

const animate = function () {
    requestAnimationFrame( animate );

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render( scene, camera );
};

animate();