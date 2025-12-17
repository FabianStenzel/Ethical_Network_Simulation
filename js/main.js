let sim;

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  // let cnv = createCanvas(windowWidth - simSettings.offsetWidth, windowHeight);
  sim = new Simulation();
  setupUI();
  sim.initNodes();
  sim.behavior();
}

function draw() {
  background(255);
  sim.update();
  sim.draw();
}
