// --------- NODE
class Node {
  constructor(id, x, y) {
    this.id = id;
    this.pos = createVector(x, y);
    this.vel = createVector();
    this.acc = createVector();
    this.radius = 10; // Basisradius
    this.attention = 0; // neue Variable
    this.targetAttention = 0; // zum Smoothen
  }

  updateRadius() {
    // smooth interpolation: linear oder eased
    const eased = easeOutCubic(constrain(this.targetAttention / 20, 0, 1)); // 20 = max scaling factor
    this.attention = lerp(this.attention, eased * 20, 0.002); // 0.02 = sehr langsames Lerp
  }

  get displayRadius() {
    return this.radius + this.attention; // Basis + Aufmerksamkeit
  }
}
// --------- Message
class Message {
  constructor(from, to, createdAt, lifetime) {
    this.from = from;
    this.to = to;
    this.createdAt = createdAt;
    this.lifetime = lifetime;
    this.flyDuration = 0.2; // Sekunden für den Flug zum Ziel (kurz)
  }
  alive(simTime) {
    return simTime - this.createdAt < this.lifetime;
  }
  getProgress(simTime) {
    return constrain((simTime - this.createdAt) / this.lifetime, 0, 1);
  }

  getFlyProgress(simTime) {
    return constrain((simTime - this.createdAt) / this.flyDuration, 0, 1);
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

    this.hoverNode = null;
  }
  initNodes() {
    // this.switchMode();
    this.nodes = [];
    for (let i = 0; i < nodeAmountRange.value; i++) {
      this.nodes.push(new Node(i, random(width), random(height)));
    }
    this.messages = [];
  }
  updateHover() {
    this.hoverNode = null;
    for (let n of this.nodes) {
      const d = dist(mouseX, mouseY, n.pos.x, n.pos.y);
      if (d < n.displayRadius) {
        this.hoverNode = n;
        break;
      }
    }
  }

  updateAttention() {
    // reset
    for (let n of this.nodes) n.targetAttention = 0;

    // alle Messages zählen: wie viele von dieser Node gesendet
    for (let m of this.messages) {
      this.nodes[m.from].targetAttention += 1; // 1 pro Message, kann skaliert werden
    }

    // Nodes langsam aktualisieren
    for (let n of this.nodes) n.updateRadius();
  }

  cleanupMessages() {
    this.messages = this.messages.filter(
      (msg) => this.simTime < msg.createdAt + msg.lifetime
    );
  }
  behavior() {
    if (this.mode !== this.runningMode) {
      this.initNodes();
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
    }, "5000");
  }

  startModeB() {
    //Autonomie
    fill(15, 150, 25);
    this.messages = [];
    let id = floor(random(this.nodes.length));

    for (
      let i = 0;
      i <
      floor(
        random(this.nodes.length / map(connectivityRange.value, 1, 40, 4, 1))
      );
      i++
    ) {
      this.messages.push(
        new Message(
          id,
          [floor(random(this.nodes.length))],
          this.simTime,
          floor(random(attentionRange.value))
        )
      );
    }

    this.intervalId = setInterval(() => {
      let id = floor(random(this.nodes.length));

      for (
        let i = 0;
        i <
        floor(
          random(this.nodes.length / map(connectivityRange.value, 1, 40, 4, 1))
        );
        i++
      ) {
        this.messages.push(
          new Message(
            id,
            [floor(random(this.nodes.length))],
            this.simTime,
            floor(random(attentionRange.value))
          )
        );
      }
    }, map(messageRateRange.value, 1, 20000, 20000, 1));
  }

  startModeC() {
    //Empathie
    fill(10, 15, 25);
    this.messages = [];
    let id = floor(random(this.nodes.length));

    for (
      let i = 0;
      i <
      floor(
        random(this.nodes.length / map(connectivityRange.value, 1, 40, 4, 1))
      );
      i++
    ) {
      let id2 = floor(random(this.nodes.length));
      let lifetime = floor(random(attentionRange.value));
      this.messages.push(new Message(id, [id2], this.simTime, lifetime));

      if (floor(random(2)) == floor(random(2))) {
        setTimeout(() => {
          this.messages.push(new Message(id2, [id], this.simTime, lifetime));
        }, map(messageRateRange.value, 1, 20000, 20000, 1));
      }
    }

    this.intervalId = setInterval(() => {
      let id = floor(random(this.nodes.length));
      for (
        let i = 0;
        i <
        floor(
          random(this.nodes.length / map(connectivityRange.value, 1, 40, 4, 1))
        );
        i++
      ) {
        let id2 = floor(random(this.nodes.length));
        let lifetime = floor(random(attentionRange.value));
        this.messages.push(new Message(id, [id2], this.simTime, lifetime));

        if (floor(random(2)) == floor(random(2))) {
          setTimeout(() => {
            this.messages.push(new Message(id2, [id], this.simTime, lifetime));
          }, map(messageRateRange.value, 1, 20000, 20000, 1));
        }
      }
    }, map(messageRateRange.value, 1, 20000, 20000, 1));
  }

  update() {
    this.behavior();
    this.physics();
    this.cleanupMessages();
    sim.updateAttention();

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
    const repulsionRadius = 100;
    const repulsionStrength = 1.2;
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
    sim.updateHover();
    for (let m of this.messages) {
      // if (0 <= m.createdAt + m.lifetime - this.simTime <= 1) {
      //   console.log(m.createdAt + m.lifetime - this.simTime);
      //   stroke(
      //     floor(map(m.createdAt + m.lifetime - this.simTime, 0, 3, 255, 100))
      //   );
      // } else {
      //   stroke(100);
      // }
      const a = messageAlpha(m, this.simTime);
      const alpha = floor(a * 255);
      push();
      stroke(100, alpha);
      fill(100, alpha);

      for (let t of m.to) {
        const from = this.nodes[m.from];
        const to = this.nodes[t];

        // --- Flugposition am Anfang
        const p = easeOutQuad(m.getFlyProgress(this.simTime));
        const x = lerp(from.pos.x, to.pos.x, p);
        const y = lerp(from.pos.y, to.pos.y, p);
        line(from.pos.x, from.pos.y, x, y);

        //verblassen animation zum Ende
        //Visuell greifbarer machen
        //Pfeil in die richtung bewegen

        //start new drawing state

        let offset = 16;
        const angle = atan2(from.pos.y - y, from.pos.x - x);
        translate(x, y);
        rotate(angle - HALF_PI);
        triangle(-offset * 0.5, offset, offset * 0.5, offset, 0, -offset / 2);
        pop();
      }
    }

    noStroke();
    for (let n of this.nodes) {
      ellipse(n.pos.x, n.pos.y, n.displayRadius * 2);
    }
  }
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
}

function messageAlpha(msg, simTime) {
  const age = simTime - msg.createdAt;
  const t = constrain(age / msg.lifetime, 0, 1); // 0..1

  const fadePortion = 0.1; // 10 %

  // fade in
  if (t < fadePortion) {
    const n = t / fadePortion; // 0..1
    return easeInOutCubic(n);
  }

  // fade out
  if (t > 1 - fadePortion) {
    const n = (1 - t) / fadePortion; // 1..0
    return easeInOutCubic(n);
  }

  return 1;
}

function easeOutCubic(t) {
  return 1 - pow(1 - t, 3);
}

function easeOutQuad(t) {
  return t * (2 - t); // schneller Start, langsames Abbremsen
}
