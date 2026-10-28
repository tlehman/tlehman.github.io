// Conway's Game of Life
// Borrowed from math-canvas.js
// By default all canvas elements are rendered at maximum width inside an article.
var articles = document.getElementsByTagName("article");
var defaultWidth = 200;
var canvasWidth = articles[0].offsetWidth || defaultWidth;

var gol1 = document.getElementById("game-of-life1");
gol1.width = canvasWidth;
gol1.height = canvasWidth;
var cellsWide = parseInt(gol1.dataset.cellsWide);
var cellsHigh = parseInt(gol1.dataset.cellsHigh);
// evolution will proceed by updating next, then swapping
var grid1 = new Int8Array(cellsHigh * cellsWide);
var grid1Next = new Int8Array(cellsHigh * cellsWide);

function randomlyInitialize() {
  for(var i = 0; i < cellsWide; i++) {
    for(var j = 0; j < cellsHigh; j++) {
      var randomBitP20 = (Math.random() < 0.2) ? 1 : 0;
      grid1[i + j*cellsWide] = randomBitP20;
    }
  }
}

function randomize() {
  randomlyInitialize();
  render();
}

randomize();
console.log(grid1);

// Evolve game one time step
//
//   O 1 0       0 1 0
//   1 0 1  -->  1 1 0
//   0 0 0       0 0 0
//
function evolve() {
  for(var i = 0; i < cellsWide; i++) {
    for(var j = 0; j < cellsHigh; j++) {
      var state = grid1[i + j*cellsWide];
      // using compass directions (north, south, etc.), we define the eight neighbors
      // NOTE: in JS, indexes that are out of bounds return undefined values.
      var n = grid1[i + (j-1)*cellsWide];
      var s = grid1[i + (j+1)*cellsWide];
      var e = grid1[i+1 + j*cellsWide];
      var w = grid1[i-1 + j*cellsWide];

      var nw = grid1[i-1 + (j-1)*cellsWide];
      var ne = grid1[i+1 + (j-1)*cellsWide];
      var sw = grid1[i-1 + (j+1)*cellsWide];
      var se = grid1[i+1 + (j+1)*cellsWide];

      var neighbors = [n,s,e,w,nw,ne,sw,se];
      var alive = 0;
      for(var k = 0; k < 8; k++) {
        if(neighbors[k] === 1) {
          alive++;
        }
      }
      var nextState;
      if(alive == 3 && state == 0) {
        nextState = 1;
      } else if((state == 1) && (alive == 2 || alive == 3)) {
        nextState = 1;
      } else {
        nextState = 0;
      }
      // Update state
      grid1Next[i + j*cellsWide] = nextState;
    }
  }
  // swap grid1 state for grid1Next
  var tmp = grid1;
  grid1 = grid1Next;
  grid1Next = tmp;
}

function render() {
    renderCAs();
}
window.requestAnimationFrame(render);
window.onresize = function() {
  canvasWidth = articles[0].offsetWidth || defaultWidth;
  gol1.width = canvasWidth;
  gol1.height = canvasWidth;
  render();
}

// The mapping is from grid index   (i + j*cellsWide) ---> (i * canvasWidth/cellsWide, (i+1)*canvasWidth/cellsWide)
function renderCAs() {
  // render grid1 cellular automaton state in gol1 element
  var ctx = gol1.getContext("2d");
  var w = (canvasWidth/cellsWide);
  var h = (canvasWidth/cellsHigh);
  for(var i = 0; i < cellsWide; i++) {
    for(var j = 0; j < cellsHigh; j++) {
      var state = grid1[i + j*cellsWide];
      var x = i * w;
      var y = j * h;
      ctx.fillStyle = (state == 1) ? "#000" : "#fff";
      ctx.beginPath();
      ctx.fillRect(x, y, w, h)
      ctx.stroke();
    }
  }
}

var evolving = false;

var interval = 100;
setInterval(function() {
  if(evolving == true) {
    evolve();
    render();
  }
}, interval);

function start() {
  evolving = true;
}

function stop() {
  evolving = false;
}
