var lc1 = document.getElementById("light-cone-1");

function drawCone(canvas) {
    var ctx = canvas.getContext("2d");
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
}

drawCone(lc1);