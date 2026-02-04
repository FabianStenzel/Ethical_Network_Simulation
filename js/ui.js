function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function setupUI() {
  // document.getElementById("btnA").onclick = () => (sim.mode = "A");
  // document.getElementById("btnF").onclick = () => (sim.mode = "B");
  // document.getElementById("btnE").onclick = () => (sim.mode = "C");

  document.getElementById("btnA").onclick = () => setMode("A");
  document.getElementById("btnF").onclick = () => setMode("B");
  document.getElementById("btnE").onclick = () => setMode("C");

  // document.getElementById("btnA").onclick = () => {
  //   sim.mode = "A";
  //   applyModeSync();
  // };

  // document.getElementById("btnF").onclick = () => {
  //   sim.mode = "B";
  //   applyModeSync();
  // };

  // document.getElementById("btnE").onclick = () => {
  //   sim.mode = "C";
  //   applyModeSync();
  // };

  // const timeRatioButton = document.getElementById("timeRatio");
  // let timeRatio = 1;
  // timeRatioButton.addEventListener("click", function (e) {
  //   timeRatio = timeRatio * 2;
  //   if (timeRatio > 10) {
  //     timeRatio = 0.25;
  //   }
  //   timeRatioButton.innerHTML = `${timeRatio}x`;
  //   // sim.timeRatio = timeRatio;
  //   sim.switchMode(sim.mode);
  // });

  const timeToggleButton = document.getElementById("simClock");

  timeToggleButton.addEventListener("click", function (e) {
    timeToggleButton.classList.toggle("button-active");
    if (!sim.play) {
      sim.play = true;
      console.log(sim.play);
    } else {
      sim.play = false;
      console.log(`else${sim.play}`);
    }
  });

  // nodeAmountRange.oninput = () => updateUI();
  // connectivityRange.oninput = () => updateUI();
  // attentionRange.oninput = () => updateUI();
  // messageRateRange.oninput = () => updateUI();
  // groupSizeRange.oninput = () => updateUI();
  // groupIntervalRange.oninput = () => updateUI();
  ranges.forEach((range) => {
    range.oninput = () => {
      syncRanges(range);
      updateUI();
    };
  });

  function applyModeSync() {
    if (sim.mode === "B") {
      const masterValue = nodeAmountRange.value;

      ranges.forEach((range) => {
        range.value = masterValue;
      });
    }

    updateUI();
  }
  // updateUI();

  strokeWeight(1);

  //setup Interactions
  const radioBtns = document.querySelectorAll(".radioBtn");
  radioBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      radioBtns.forEach((b) => b.classList.remove("button-active_simColor"));
      btn.classList.add("button-active_simColor");
    });
  });
  const minMaxBtn = document.querySelector("#minMax");
  const simSettings = document.querySelector("#simSettings");
  minMaxBtn.addEventListener("click", function (e) {
    minMaxBtn.classList.toggle("button-active");
    simSettings.classList.toggle("simSettings-close");
    windowResized();
  });
  updateUI();
}

function setMode(mode) {
  sim.mode = mode;

  applyModeDefaults(mode);

  if (mode === "B") {
    syncRanges(nodeAmountRange);
  }

  updateUI();
}

function applyModeDefaults(mode) {
  const d = modeDefaults[mode];

  nodeAmountRange.value = d.nodeAmount;
  connectivityRange.value = d.connectivity;
  attentionRange.value = d.attention;
  messageRateRange.value = d.messageRate;
  groupSizeRange.value = d.groupSize;
  groupIntervalRange.value = d.groupInterval;
}

function syncRanges(source) {
  if (sim.mode !== "B") return;

  const value = source.value;

  ranges.forEach((range) => {
    if (range !== source) {
      range.value = value;
    }
  });
}

function updateUI() {
  // groupSizeRange.value = nodeAmountRange.value;
  // if (sim.mode === "A") {
  //   // groupIntervalRange.style.display = "none";
  // } else if (sim.mode === "B") {
  //   groupSizeRange.value = nodeAmountRange.value;
  //   connectivityRange.value = nodeAmountRange.value;
  //   attentionRange.value = nodeAmountRange.value;
  //   messageRateRange.value = nodeAmountRange.value;
  //   nodeAmountRange.value = connectivityRange.value;
  //   // groupIntervalRange.style.display = "none";
  // } else {
  //   // groupIntervalRange.style.display = "block";
  // }
  nodeAmountLabel.innerHTML = nodeAmountRange.value;
  connectivityLabel.innerHTML = `je ⌀ ${connectivityRange.value} Nachrichten `;
  attentionLabel.innerHTML = `⌀ ${attentionRange.value} s`;
  messageRateLabel.innerHTML = `⌀ ${Math.round(map(messageRateRange.value, 0, 100, 3000, 10))} ms`;
  groupSizeLabel.innerHTML = groupSizeRange.value;
  groupIntervalLabel.innerHTML = `${groupIntervalRange.value} s`;

  sim.initNodes();
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
  if (event.target.closest("aside")) {
    return true; // Scroll erlauben
  }
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
