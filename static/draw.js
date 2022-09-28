const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');

var lastPoint = null;
var lineWidth = 3;

function randomColor() {
    let r = Math.random() * 255;
    let g = Math.random() * 255;
    let b = Math.random() * 255;
    return `rgb(${r}, ${g}, ${b})`;
}

var color = randomColor();

function draw(data) {
    context.beginPath();
    context.moveTo(data.lastPoint.x, data.lastPoint.y);
    context.lineTo(data.x, data.y);
    context.strokeStyle = data.color;
    context.lineWidth = data.lineWidth;
    context.lineCap = 'round';
    context.stroke();
}

function onPeerData(id, data) {
    console.log(`peer data from ${id}`, data);
    console.log(`peer data from ${id} parsed`, JSON.parse(data))
    draw(JSON.parse(data));
}


function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function resizeWithoutClear() {
    let img = context.getImageData(0, 0, context.width, context.height);
    resize();
    context.putImageData(img);
}

function move(e) {
    if (e.buttons) {
        if (!lastPoint) {
            lastPoint = { x: e.offsetX, y: e.offsetY };
        }

        draw({
            lastPoint,
            x: e.offsetX,
            y: e.offsetY,
            lineWidth: lineWidth,
            color: color
        });

        broadcast(JSON.stringify({
            lastPoint,
            x: e.offsetX,
            y: e.offsetY,
            color: color,
            lineWidth: lineWidth
        }));

        lastPoint = { x: e.offsetX, y: e.offsetY };
    }
}

function up(e) {
    lastPoint = null;
}

function key(e) {
    if (e.key === 'Backspace') {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
}

window.onresize = resizeWithoutClear;
window.onmousemove = move;
window.onkeydown = key;
window.onmouseup = up;

resize();