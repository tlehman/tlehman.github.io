const scale = 32;
const width = 256/scale; // 16
const height = 256/scale; // 16
const pi = Math.PI;
// the DCT is a mapping A -> CAC' (magic numbers?! no, MAGIC MATRICES)
const C = [[0.353553,0.490393,0.461940,0.415735,0.353553,0.277785,0.191342,0.097545],
           [0.353553,0.415735,0.191342,-0.097545,-0.353553,-0.490393,-0.461940,-0.277785],
           [0.353553,0.277785,-0.191342,-0.490393,-0.353553,0.097545,0.461940,0.415735],
           [0.353553,0.097545,-0.461940,-0.277785,0.353553,0.415735,-0.191342,-0.490393],
           [0.353553,-0.097545,-0.461940,0.277785,0.353553,-0.415735,-0.191342,0.490393],
           [0.353553,-0.277785,-0.191342,0.490393,-0.353553,-0.097545,0.461940,-0.415735],
           [0.353553,-0.415735,0.191342,0.097545,-0.353553,0.490393,-0.461940,0.277785],
           [0.353553,-0.490393,0.461940,-0.415735,0.353553,-0.277785,0.191342,-0.097545]];

const C_inv = [[0.353553,0.353553,0.353553,0.353553,0.353553,0.353553,0.353553,0.353553],
               [0.490393,0.415735,0.277785,0.097545,-0.097545,-0.277785,-0.415735,-0.490393],
               [0.461940,0.191342,-0.191342,-0.461940,-0.461940,-0.191342,0.191342,0.461940],
               [0.415735,-0.097545,-0.490393,-0.277785,0.277785,0.490393,0.097545,-0.415735],
               [0.353553,-0.353553,-0.353553,0.353553,0.353553,-0.353553,-0.353553,0.353553],
               [0.277785,-0.490393,0.097545,0.415735,-0.415735,-0.097545,0.490393,-0.277785],
               [0.191342,-0.461940,0.461940,-0.191342,-0.191342,0.461940,-0.461940,0.191342],
               [0.097545,-0.277785,0.415735,-0.490393,0.490393,-0.415735,0.277785,-0.097545]];

function zeros() {
    return [[0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],
            [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],
            [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],
            [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],
            [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],
            [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],
            [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0],
            [0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0]];
}

var imgData = zeros();
imgData[1][0] = 1;
var imgDataDCT = normalize(dct(imgData));
const N = imgData.length;

// assumes matrices are 2D arrays and that B.length = A[0].length
// A is n*m, B is m*p, AB is n*p
// but in this example all the values are 8
function matmul(A, B) {
    var AB = zeros();
    for(var i = 0; i < 8; i++) {
        for(var j = 0; j < 8; j++) {
            for(var k = 0; k < 8; k++) {
                AB[i][j] += A[i][k]*B[k][j];
            }
        }
    }
    return AB;
}


var dct1 = document.getElementById("dct1");
var dct2 = document.getElementById("dct2");
var ctx1 = dct1.getContext("2d");
var ctx2 = dct2.getContext("2d");

function drawPixel(ctx,x,y,data) {
    var v = (1-data[x][y]) * 255;
    var color = "rgb(" + v + "," + v + "," + v + ")";
    ctx.fillStyle = color;
    ctx.fillRect(x * scale, y * scale, scale, scale);
}

function draw(ctx) {
    // clear canvas
    ctx.canvas.width = ctx.canvas.width;

    for(var x = 0; x < width; x++) {
        for(var y = 0; y < height; y++) {
            if(imgData[x][y] == 1) {
                drawPixel(ctx1,x,y,imgData);
            }
            drawPixel(ctx2,x,y,imgDataDCT);
        }
    }
}

function normalize(A) {
    var max = -1000000;
    var min = 1000000;
    for(var i = 0; i < 8; i++) {
        for(var j = 0; j < 8; j++) {
            if(A[i][j] > max) {
                max = A[i][j];
            }
            if(A[i][j] < min) {
                min = A[i][j];
            }
        }
    }
    for(i = 0; i < 8; i++) {
        for(j = 0; j < 8; j++) {
            A[i][j] = (A[i][j] - min) / (max - min);
        }
    }
    return A;
}

function handleClick1(e) {
    var x = Math.floor(e.offsetX / scale);
    var y = Math.floor(e.offsetY / scale);

    if(imgData[x][y] == 0) {
        imgData[x][y] = 1;
    } else {
        imgData[x][y] = 0;
    }
    imgDataDCT = normalize(dct(imgData));
    draw(ctx1);
}

function dct(A) {
    return matmul(C, matmul(A, C_inv));
}

dct1.addEventListener('click', handleClick1);

draw(ctx1);

