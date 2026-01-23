let sim;

function setup() {
  let cnv = createCanvas(windowWidth, windowHeight);
  // let cnv = createCanvas(windowWidth - simSettings.offsetWidth, windowHeight);
  sim = new Simulation();
  setupUI();
  sim.initNodes();
  currentColor = color(100, 150, 255); // Standardfarbe
  // sim.behavior();
}

function draw() {
  background(255);

  translate(camX, camY);
  scale(zoom);
  sim.update();
  sim.draw();
}
