let sim;
let autonomieClr;
let gerechtigkeitClr;
let empathieClr;

const nodeAmountRange = document.querySelector("#nodeAmountRange");
const connectivityRange = document.querySelector("#connectivityRange");
const attentionRange = document.querySelector("#attentionRange");
const messageRateRange = document.querySelector("#messageRateRange");
const groupeSizeRange = document.querySelector("#groupeSizeRange");
const groupIntervalRange = document.querySelector("#groupIntervalRange");

const nodeAmountLabel = document.getElementById("nodeAmountLabel");
const connectivityLabel = document.getElementById("connectivityLabel");
const attentionLabel = document.getElementById("attentionLabel");
const messageRateLabel = document.getElementById("messageRateLabel");
const groupSizeLabel = document.getElementById("groupSizeLabel");
const groupIntervalLabel = document.getElementById("groupIntervalLabel");

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  autonomieClr = color(189, 145, 255);
  gerechtigkeitClr = color(3, 180, 9);
  empathieClr = color(242, 176, 53);
  // let cnv = createCanvas(windowWidth - simSettings.offsetWidth, windowHeight);
  sim = new Simulation();
  setupUI();
  sim.initNodes();

  currentColor = autonomieClr; //Standartfarbe

  // sim.behavior();
}

function draw() {
  background(255);
  translate(camX, camY);
  scale(zoom);
  sim.update();
  sim.draw();
}
