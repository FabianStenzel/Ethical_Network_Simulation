function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function setupUI() {
  document.getElementById("btnA").onclick = () => (sim.mode = "A");
  btnF.onclick = () => (sim.mode = "B");
  btnE.onclick = () => (sim.mode = "C");

  const nodeAmountRange = document.querySelector("#nodeAmountRange");
  const connectivityRange = document.querySelector("#connectivityRange");
  const attentionRange = document.querySelector("#attentionRange");
  const messageRateRange = document.querySelector("#messageRateRange");
  strokeWeight(1);

  //setup Interactions
  const radioBtns = document.querySelectorAll(".radioBtn");
  radioBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      radioBtns.forEach((b) => b.classList.remove("button-active"));
      btn.classList.add("button-active");
    });
  });
  const minMaxBtn = document.querySelector("#minMax");
  const simSettings = document.querySelector("#simSettings");
  minMaxBtn.addEventListener("click", function (e) {
    simSettings.classList.toggle("simSettings-close");
    windowResized();
  });
}

let camX = 0;
let camY = 0;
let zoom = 1;

let isPanning = false;
let lastMouse;

function mousePressed() {
  if (mouseButton === LEFT) {
    isPanning = true;
    lastMouse = createVector(mouseX, mouseY);
  }
}

function mouseDragged() {
  if (!isPanning) return;

  let dx = mouseX - lastMouse.x;
  let dy = mouseY - lastMouse.y;

  camX += dx;
  camY += dy;

  lastMouse.set(mouseX, mouseY);
}

function mouseReleased() {
  isPanning = false;
}

function mouseWheel(event) {
  const zoomSpeed = 0.001;

  let newZoom = zoom * (1 - event.delta * zoomSpeed);
  newZoom = constrain(newZoom, 0.2, 5);

  // world position under mouse BEFORE zoom
  let wx = (mouseX - camX) / zoom;
  let wy = (mouseY - camY) / zoom;

  // adjust camera so mouse stays anchored
  camX = mouseX - wx * newZoom;
  camY = mouseY - wy * newZoom;

  zoom = newZoom;

  return false; // prevent page scroll
}
