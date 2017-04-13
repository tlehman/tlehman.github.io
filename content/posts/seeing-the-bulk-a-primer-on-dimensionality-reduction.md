+++
title = "Seeing the bulk: a primer on dimensionality reduction"
tags = ["datavis", "machine-learning", "math"]
date = "2017-04-12"

+++

If you haven't seen Interstellar, you might not get the reference in the title. Don't sweat it, [the bulk beings](http://interstellarfilm.wikia.com/wiki/Bulk_Beings) are some advanced civilization that is able to move outside the familiar 3D space that we are stuck in. A similar plot device was used in Edwin Abbott's book Flatland.

Outside of entertainment, there is a lot of value in attempting to understand high dimensional spaces. Physics, machine learning, and engineering control systems all make use of higher-dimensional spaces in one way or another.

In this post we will learn how datasets can be thought of as sets of points in a high dimensional space, and then we will learn how to map those sets into low (2 or 3)-dimensional spaces so that we can see them. The goal will be to preserve as much structure as possible, but still fit everything into a space we can see and feel.

Let's start with 1D, real numbers are points on a line, easy. In 2D, we can use a pair (x,y) to name any point in a plane. For 3D, we can use triplets (x,y,z) to name points in a space like the one we physically live in.

If we wanted to name the four corners of a tetrahedron, we could list out a table of data like this:

|  x |  y |  z |
|----|----|----|
|  1 |  1 |  1 |
| -1 | -1 |  1 |
| -1 |  1 | -1 |
|  1 | -1 | -1 |

But it's not clear what that data looks like until we visualize it in 3D space:


<script src="/js/three.min.js"></script>
<div id="cube"></div>
<script>
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( 300, 300 );
document.getElementById("cube").appendChild( renderer.domElement );

var geometry = new THREE.Geometry();
geometry.vertices.push(new THREE.Vector3(  1 ,  1 ,  1 ));
geometry.vertices.push(new THREE.Vector3( -1 , -1 ,  1 ));
geometry.vertices.push(new THREE.Vector3( -1 ,  1 , -1 ));
geometry.vertices.push(new THREE.Vector3(  1 , -1 , -1 ));

var material = new THREE.LineBasicMaterial( { color: 0x00ff00 } );
var line = new THREE.Line(geometry, material);

scene.add( line );

camera.position.z = 5;

function render() {
	requestAnimationFrame( render );
    line.rotation.x += 0.01;
    line.rotation.y += 0.01;
	renderer.render( scene, camera );
}
render();
</script>



```
def sum(a, b):
    return a+b
```
