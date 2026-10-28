/* MathCanvas.js by Tobi Lehman 2019

   This is a pure javascript library that works with HTML5 canvas objects.
   I wrote it to make blogging about mathematics easier. It can be used as
   a plotting library, but it may take some elbow-grease. I originally wrote
   this for myself.

   The model I introduce in this library revolves around canvas elements.
   We call any canvas element like:

     <canvas class="plot-2d" data-min="-3" data-max="3"></canvas>

   a "plot". Each plot responds to 'onclick' with a function that updates it's
   dataset attribute.
   https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset

   After the dataset is updated, that element is re-rendered. That's it. Super
   simple. My way of using this is in a Hugo static blog where math-canvas.js
   is shared, and then each post can have additional javascript code that
   adds plots and custom javascript that updates those plots' datasets.

   The primitive objects that one can put on a plot's dataset are:
       - points
       - lines
       - vectors

   Geometric considerations:
      Each plot has a data-min and data-max, which define an interval in 1D
      or a square in 2D. That abstract space [-3, 3]x[-3, 3] maps to a canvas
      element that addresses everything using a space like [0, 860]x[0, 860]

      Because of this, MathCanvas introduces transform() and untransform(),
      which transform the abstract coordinates of your plot to the concrete
      coordinates of your browser's canvas object.
 */

// Store DOM elements globally to avoid having to query them multiple times.
var plots1D = document.getElementsByClassName("plot-1d");
var plots2D = document.getElementsByClassName("plot-2d");
var polarPlots = document.getElementsByClassName('polar-plot');

// By default all canvas elements are rendered at maximum width inside an article.
var articles = document.getElementsByTagName("article");
var defaultWidth = 200;
var canvasWidth = articles[0].offsetWidth || defaultWidth;
var min, max, w;
var rmax; // max radius on a polar plot

function render() {
    renderPlots1D();
    renderPlots2D();
}
window.requestAnimationFrame(render);
window.onresize = function() {
  canvasWidth = articles[0].offsetWidth || defaultWidth;
  render();
}

// Given a point x transform it from
// [min, max] to [0, w]
function transform(x) {
  return  w * (x - min) / (max - min);
}

function untransform(tx) {
  return (tx / w) * (max - min) + min;
}

function transformPoint(p) {
  return {x: transform(p.x, min, max, w), y: transform(-  p.y, min, max,w)};
}

function polarToCartesian(polarPoint) {
  var r = polarPoint.r;
  var theta = polarPoint.theta;
  return {x: r * Math.cos(theta), y: r * Math.sin(theta) };
}

function pointFromComplex(z) {
  var regexComplex = /(-?\d+(\.\d+)?) ([\+|\-]) (\d(\.\d+)?)i/;
  var m = z.match(regexComplex);
  var re = parseFloat(m[1]);
  var im = parseFloat(m[4]);
  var op = m[3];
  if(op == '-') { im = -im; }
  return {x: re, y: im};
}

function isCartesian(point) {
  return !!(point.x && point.y);
}
function isPolar(point) {
  return !!(point.r && point.theta);
}

function pointToComplex(p) {
  if(isPolar(p)) {
    var r = Math.round(p.r * 10)/10;
    var theta = Math.round(p.theta * 10)/10;
    var z = r.toString() + "e";
    z += "<sup>i" + theta + "</sup>";
    return z;
  } else {
    z = "";
    var re = Math.round(p.x * 10)/10;
    var im = Math.round(p.y * 10)/10;
    if(re == 0) {
      z += (im > 0) ? "" : "-"; // only show if im is negative and re is zero
    } else {
      z += re.toString();
      z += (im < 0) ? " - " : " + "; // operation
    }
    
    if(Math.abs(im) == 1) {
      z += "i";
    } else {
      z += Math.abs(im).toString() + "i";
    }
    return z;
  }
}

function add(a, b) {
  return {x: a.x + b.x, y: a.y + b.y};
}

// multiple a and b as complex numbers
function mult(a, b) {
  return {r: a.r * b.r, theta: a.theta + b.theta};
}

function renderPlot2D(canvas) {
  var ctx = canvas.getContext("2d");
  var w = canvas.width = canvasWidth;
  var h = canvas.height = canvasWidth;

  min = parseInt(canvas.dataset.min);
  max = parseInt(canvas.dataset.max);

  // Axes
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w/2, 0);
  ctx.lineTo(w/2, h);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, h/2);
  ctx.lineTo(w, h/2);
  ctx.closePath();
  ctx.stroke();

  // Grid
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 1;
  for(var x = min; x <= max; x++) {
    var tx1 = transform(x, min, max, w);
    var tx2 = transform(max, min, max, w);
    // label the ticks on the axes
    var sx = x.toString();
    ctx.fillText(sx, tx1 - 10, transform(0) + 10);
    ctx.beginPath();
    ctx.moveTo(tx1, 0);
    ctx.lineTo(tx1, h);
    ctx.closePath();
    ctx.stroke();
  }

  for(var y = min; y <= max; y += 1) {
    var ty1 = transform(-y, min, max, w);
    // label the ticks on the axes
    var sy = "";
    if(y == 0) {
      sy = "";
    } else if(y == -1) {
      sy = "-i";
    } else if(y == 1) {
      sy = "i";
    } else {
      sy = y.toString() + "i";
    }
    ctx.fillText(sy, transform(0) - 15, ty1 + 10);
    ctx.beginPath();
    ctx.moveTo(0, ty1);
    ctx.lineTo(w, ty1);
    ctx.closePath();
    ctx.stroke();
  }

  // Points
  var p = transformPoint(JSON.parse(canvas.dataset.pointBlue));
  drawPoint(canvas, p.x, p.y, 4, 'blue');
  // If there is a red point, plot it
  if(canvas.dataset.pointRed) {
    var pRed = transformPoint(JSON.parse(canvas.dataset.pointRed));
    drawPoint(canvas, pRed.x, pRed.y, 4, 'red');
  }
  if(canvas.dataset.pointPurple) {
    var pPurple = transformPoint(JSON.parse (canvas.dataset.pointPurple));
    drawPoint(canvas, pPurple.x, pPurple.y, 4, 'purple');
  }
}

function renderPlots2D() {
  for(var i = 0; i < plots2D.length; i++) {
    canvas = plots2D[i];
    renderPlot2D(canvas);
  }
  for(var i = 0; i < polarPlots.length; i++) {
    canvas = polarPlots[i];
    renderPolarPlot(canvas);
  }
}

function renderPolarPlot(canvas) {
  var ctx = canvas.getContext("2d");
  var w = canvas.width = canvasWidth;
  var h = canvas.height = canvasWidth;

  rmax = parseInt(canvas.dataset.rmax);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;

  // Concentric circles
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 1;
  var o = transform(0);
  for(var r = 0; r <= rmax; r += 0.5) {
    var r1 = transform(r) - w/2;
    // label the ticks on the axes
    var sx = r.toString();
    ctx.beginPath();
    ctx.arc(o, o, r1, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // Radial lines
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 1;
  var o = transform(0);
  for(var theta = 0; theta <= 2 * Math.PI; theta += Math.PI/6) {
    ctx.beginPath();
    ctx.moveTo(o,o);
    ctx.lineTo(transform(rmax * Math.cos(theta)), transform(rmax * Math.sin(theta)));
    ctx.stroke();
  }

  // Polar points

  var blue = JSON.parse(canvas.dataset.pointBlue);
  var red = JSON.parse(canvas.dataset.pointRed);
  var purple = JSON.parse(canvas.dataset.pointPurple);
  var blueFinal = transformPoint(polarToCartesian(blue));
  var redFinal = transformPoint(polarToCartesian(red));
  var purpleFinal = transformPoint(polarToCartesian(purple));
  drawPoint(canvas, blueFinal.x, blueFinal.y, 4, 'blue');
  drawPoint(canvas, redFinal.x, redFinal.y, 4, 'red');
  drawPoint(canvas, purpleFinal.x, purpleFinal.y, 4, 'purple');
}

function renderPlots1D() {
  var arrowHeight = 8;
  var plots = document.getElementsByClassName("plot-1d");
  for(var i = 0; i < plots.length; i++) {
    canvas = plots[i];
    var ctx = canvas.getContext("2d");
    w = canvas.width = canvasWidth;
    var h = canvas.height = 50;

    min = parseInt(canvas.dataset.min);
    max = parseInt(canvas.dataset.max);
    var startRightArrowPoint = {x: w-arrowHeight/2, y: h/2};
    var endRightArrowPoint = {x: w-arrowHeight, y: h/2};
    var startLeftArrowPoint = {x: arrowHeight, y: h/2};
    var endLeftArrowPoint = {x: arrowHeight/2, y: h/2};

    if(canvas.dataset.discrete) {
      drawArrow(canvas, startRightArrowPoint, endRightArrowPoint, '#000000');
    } else {
      // Draw the Real line
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      // Main line
      if(canvas.dataset.discrete) {
        ctx.strokeStyle = '#FFFFFF';
      }
      drawArrow(canvas, startLeftArrowPoint, endLeftArrowPoint, '#000000', -1);
      drawArrow(canvas, startRightArrowPoint, endRightArrowPoint, '#000000', 1);
    }

    // draw tick marks
    var zero = w / 2;
    for(var r = min; r < max; r++) {
      // r is the abstract real number, but rx is the pixel location in the canvas
      var rx = (r - min + 0.5) * (w / (max - min));

      if(canvas.dataset.discrete) {
        drawPoint(canvas, rx, h/2, 5, '#000000');
      } else {
        ctx.fillStyle = '#000000';
        ctx.lineTo(rx, h/2);
        ctx.lineTo(rx, h/2 + arrowHeight);
        ctx.lineTo(rx, h/2 - arrowHeight);
        ctx.lineTo(rx, h/2);
        ctx.lineTo(0, h/2);
        ctx.stroke();
      }
      ctx.font = '15px serif';
      ctx.fillStyle = "#000000";
      ctx.fillText(r, rx, h/2 + arrowHeight + 16);
    }

  }
}

function drawPoint(canvas, x, y, radius, color) {
  var ctx = canvas.getContext("2d");
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.moveTo(x, y);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2*Math.PI, false);
  ctx.fill();
  ctx.closePath();
}

function drawArrow(canvas, startPoint, endPoint, color, factor) {
  var ctx = canvas.getContext("2d");
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  // tail of arrow
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(endPoint.x, endPoint.y);
  ctx.closePath();
  ctx.stroke();
  // Rotate the vector [x₂-x₁, y₂-y₁] where startPoint is 1 and endPoint is 2
  var x1 = startPoint.x; var y1 = startPoint.y;
  var x2 = endPoint.x; var y2 = endPoint.y;
  // factor is a terrible hack
  var theta = 2 * Math.PI / 6;
  var v = [factor * (x2 - x1), factor * (y2 - y1)];
  var rotatedUp = vectorRotate(v, theta);
  var rotatedDown = vectorRotate(v, -theta);
  // Translate rotated vector to endpoint

  ctx.beginPath();
  ctx.moveTo(endPoint.x, endPoint.y);
  ctx.lineTo(endPoint.x + rotatedUp.x, endPoint.y + rotatedUp.y);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(endPoint.x, endPoint.y);
  ctx.lineTo(endPoint.x + rotatedDown.x, endPoint.y + rotatedDown.y);
  ctx.closePath();
  ctx.stroke();
}

function vectorRotate(v, theta) {
  var a = v[0];
  var b = v[1];
  var scale = 2;
  return {x: scale*(a * Math.cos(theta) - b * Math.sin(theta)),
          y: scale*(a * Math.sin(theta) + b * Math.cos(theta))}
}
