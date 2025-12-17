// --------- NODE
class Node {
  constructor(id, x, y) {
    this.id = id;
    this.pos = createVector(x, y);
    this.vel = createVector();
    this.acc = createVector();
    this.radius = 10;
  }
}
// --------- Message
class Message {
  constructor(from, to, createdAt, lifetime) {
    this.from = from;
    this.to = to;
    this.createdAt = createdAt;
    this.lifetime = lifetime;
  }
  alive(simTime) {
    return simTime - this.createdAt < this.lifetime;
  }
}
// --------- Simulation
class Simulation {
  constructor() {
    this.nodes = [];
    this.messages = [];
    this.simTime = 0;
    this.timeRatio = 1;
    this.lastTick = millis() / 1000;

    this.mode = null; // gewünschter Modus (A, B, C)
    this.runningMode = null; // aktuell laufender Modus
    this.intervalId = null; // aktives Intervall
  }
  initNodes() {
    this.switchMode();
    this.nodes = [];
    for (let i = 0; i < nodeAmountRange.value; i++) {
      this.nodes.push(new Node(i, random(width), random(height)));
    }
    this.messages = [];
  }

  cleanupMessages() {
    this.messages = this.messages.filter(
      (msg) => this.simTime < msg.createdAt + msg.lifetime
    );
  }
  behavior() {
    if (this.mode !== this.runningMode) {
      this.switchMode(this.mode);
    }
  }
  switchMode(mode) {
    // altes Intervall stoppen
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (mode === "A") this.startModeA();
    if (mode === "B") this.startModeB();
    if (mode === "C") this.startModeC();

    this.runningMode = mode;
  }

  startModeA() {
    //Fairness
    fill(100, 150, 255);
    this.messages = [];
    for (let i = 0; i < this.nodes.length; i++) {
      this.messages.push(new Message(1, [i], this.simTime, 5));
    }

    this.intervalId = setInterval(() => {
      let id = floor(random(this.nodes.length));
      for (let i = 0; i < this.nodes.length; i++) {
        this.messages.push(new Message(id, [i], this.simTime, 5));
      }
    }, 5000);
  }

  startModeB() {
    //Autonomie
    fill(15, 150, 25);
    this.messages = [];
    let id = floor(random(this.nodes.length));

    for (let i = 0; i < floor(random(this.nodes.length / 4)); i++) {
      this.messages.push(
        new Message(
          id,
          [floor(random(this.nodes.length))],
          this.simTime,
          floor(random(120))
        )
      );
    }

    this.intervalId = setInterval(() => {
      let id = floor(random(this.nodes.length));

      for (let i = 0; i < floor(random(this.nodes.length / 20)); i++) {
        this.messages.push(
          new Message(
            id,
            [floor(random(this.nodes.length))],
            this.simTime,
            floor(random(120))
          )
        );
      }
    }, 10000 / this.nodes.length);
  }

  startModeC() {
    //Empathie
    fill(10, 15, 25);
    this.messages = [];
    let id = floor(random(this.nodes.length));

    for (let i = 0; i < floor(random(this.nodes.length / 4)); i++) {
      let id2 = floor(random(this.nodes.length));
      let lifetime = floor(random(120));
      this.messages.push(new Message(id, [id2], this.simTime, lifetime));

      if (floor(random(2)) == floor(random(2))) {
        setTimeout(() => {
          this.messages.push(new Message(id2, [id], this.simTime, lifetime));
        }, 10000 / this.nodes.length);
      }
    }

    this.intervalId = setInterval(() => {
      let id = floor(random(this.nodes.length));
      for (let i = 0; i < floor(random(this.nodes.length / 20)); i++) {
        let id2 = floor(random(this.nodes.length));
        let lifetime = floor(random(120));
        this.messages.push(new Message(id, [id2], this.simTime, lifetime));

        if (floor(random(2)) == floor(random(2))) {
          setTimeout(() => {
            this.messages.push(new Message(id2, [id], this.simTime, lifetime));
          }, 10000 / this.nodes.length);
        }
      }
    }, 10000 / this.nodes.length);
  }

  update() {
    this.behavior();
    this.physics();
    this.cleanupMessages();

    //update Clock
    let now = millis() / 1000;
    let dt = now - this.lastTick;
    this.lastTick = now;
    dt *= this.timeRatio;
    this.simTime += dt;
    this.simTime %= 24 * 3600;

    const t = floor(this.simTime);
    const h = floor(t / 3600);
    const m = floor((t % 3600) / 60);
    const s = t % 60;
    const pad = (v) => v.toString().padStart(2, "0");
    document.getElementById("simClock").innerText = `${pad(h)}:${pad(m)}:${pad(
      s
    )}`;
  }

  physics() {
    const damping = 0.98;
    const repulsionRadius = 60;
    const repulsionStrength = 0.9;
    const messageAttraction = 0.008;
    const maxSpeed = 4;

    // reset acceleration
    for (let n of this.nodes) {
      n.acc.set(0, 0);
    }

    // node–node repulsion
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];

        const dir = p5.Vector.sub(a.pos, b.pos);
        const d = dir.mag();

        if (d > 0 && d < repulsionRadius) {
          dir.normalize();
          const f = (1 - d / repulsionRadius) * repulsionStrength;
          dir.mult(f);

          a.acc.add(dir);
          b.acc.sub(dir);
        }
      }
    }

    // message-based attraction
    for (let m of this.messages) {
      for (let t of m.to) {
        const from = this.nodes[m.from];
        const to = this.nodes[t];

        const dir = p5.Vector.sub(to.pos, from.pos);
        const d = dir.mag();
        if (d > 0) {
          dir.normalize();
          dir.mult(messageAttraction);
          from.acc.add(dir);
          to.acc.sub(dir);
        }
      }
    }

    // integrate motion
    for (let n of this.nodes) {
      n.vel.add(n.acc);
      n.vel.mult(damping);
      n.vel.limit(maxSpeed);
      n.pos.add(n.vel);

      // screen bounds (wrap)
      if (n.pos.x < 0) n.pos.x += width;
      if (n.pos.y < 0) n.pos.y += height;
      if (n.pos.x > width) n.pos.x -= width;
      if (n.pos.y > height) n.pos.y -= height;
    }
  }

  draw() {
    for (let m of this.messages) {
      stroke(100);
      for (let t of m.to) {
        line(
          this.nodes[m.from].pos.x,
          this.nodes[m.from].pos.y,
          this.nodes[t].pos.x,
          this.nodes[t].pos.y
        );

        push(); //start new drawing state
        fill(100);
        let offset = 24;
        let angle = atan2(
          this.nodes[m.from].pos.y - this.nodes[t].pos.y,
          this.nodes[m.from].pos.x - this.nodes[t].pos.x
        ); //gets the angle of the line
        translate(this.nodes[t].pos.x, this.nodes[t].pos.y); //translates to the destination vertex
        rotate(angle - HALF_PI); //rotates the arrow point
        triangle(-offset * 0.5, offset, offset * 0.5, offset, 0, -offset / 2); //draws the arrow point as a triangle
        pop();
      }
    }

    noStroke();
    for (let n of this.nodes) {
      ellipse(n.pos.x, n.pos.y, n.radius * 2);
    }
  }
}
