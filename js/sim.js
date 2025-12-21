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

    this.mode = "A"; // gewünschter Modus (A, B, C)
    this.runningMode = null; // aktuell laufender Modus
    this.intervalId = null; // aktives Intervall
  }

  initNodes() {
    this.simTime = 0;
    this.messages = [];
    this.nodes = [];
    this.switchMode();
    for (let i = 0; i < nodeAmountRange.value; i++) {
      this.nodes.push(new Node(i, random(width), random(height)));
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
  // –––––––––––––––––––––– MODE A    //Fairness
  startModeA() {
    this.messages = [];

    fill(100, 150, 255);
    // INITIAL MESSAGE
    let postingCycle = floor(map(this.nodes.length, 0, 500, 10, 1));

    for (let i = 0; i < this.nodes.length; i++) {
      if (i === 1) continue;
      this.messages.push(new Message(1, [i], this.simTime, postingCycle));
    }

    // MESSAGE INTERVAL
    this.intervalId = setInterval(() => {
      let id = floor(random(this.nodes.length));
      for (let i = 0; i < this.nodes.length; i++) {
        if (i === id) continue;
        this.messages.push(new Message(id, [i], this.simTime, postingCycle));
      }
    }, postingCycle * 1000);
  }
  // –––––––––––––––––––––– MODE B    //Autonomie
  startModeB() {
    fill(15, 150, 25);
    let id = floor(random(this.nodes.length));
    let msgPerNode = floor(
      random(1, map(connectivityRange.value, 1, 40, 1, this.nodes.length))
    );
    let postingCycle = map(messageRateRange.value, 0, 100, 3000, 10);

    // INITIAL MESSAGE
    for (let i = 0; i < msgPerNode; i++) {
      let msgLifeTime = floor(random(attentionRange.value));

      this.messages.push(
        new Message(
          id,
          [floor(random(this.nodes.length))],
          this.simTime,
          msgLifeTime
        )
      );
    }
    // MESSAGE INTERVAL
    this.intervalId = setInterval(() => {
      let id = floor(random(this.nodes.length));
      for (let i = 0; i < msgPerNode; i++) {
        let msgLifeTime = floor(random(1, attentionRange.value));
        this.messages.push(
          new Message(
            id,
            [floor(random(this.nodes.length))],
            this.simTime,
            msgLifeTime
          )
        );
      }
    }, postingCycle);
  }
  // –––––––––––––––––––––– MODE C //Empathie
  startModeC() {
    fill(10, 15, 25);
    let id = floor(random(this.nodes.length));
    let msgPerNode = floor(
      random(1, map(connectivityRange.value, 1, 40, 1, this.nodes.length))
    );
    let postingCycle = map(messageRateRange.value, 0, 100, 3000, 100);

    // INITIAL MESSAGE
    for (let i = 0; i < msgPerNode; i++) {
      let id2 = floor(random(this.nodes.length));
      let msgLifeTime = floor(random(1, attentionRange.value));

      this.messages.push(new Message(id, [id2], this.simTime, msgLifeTime));

      if (floor(random(2)) == floor(random(2))) {
        setTimeout(() => {
          this.messages.push(new Message(id2, [id], this.simTime, msgLifeTime));
        }, postingCycle);
      }
    }
    // MESSAGE INTERVAL

    this.intervalId = setInterval(() => {
      let id = floor(random(this.nodes.length));

      for (let i = 0; i < msgPerNode; i++) {
        let id2 = floor(random(this.nodes.length));
        let msgLifeTime = floor(1, random(attentionRange.value));
        this.messages.push(new Message(id, [id2], this.simTime, msgLifeTime));

        if (floor(random(2)) == floor(random(2))) {
          setTimeout(() => {
            // for (let i = 0; i < msgPerNode; i++) {
            this.messages.push(
              new Message(id2, [i], this.simTime, msgLifeTime)
            );
            // }
          }, postingCycle);
        }
      }
    }, postingCycle);
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
    const repulsionRadius = 60;
    const repulsionStrength = 1.08;
    const messageAttraction = 0.02;
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

      n.pos.x = constrain(n.pos.x, n.displayRadius, width - n.displayRadius);
      n.pos.y = constrain(n.pos.y, n.displayRadius, height - n.displayRadius);
    }
  }

  // draw() {
  //   for (let m of this.messages) {
  //     // if (0 <= m.createdAt + m.lifetime - this.simTime <= 1) {
  //     //   stroke(
  //     //     floor(map(m.createdAt + m.lifetime - this.simTime, 0, 3, 255, 100))
  //     //   );
  //     // } else {
  //     //   stroke(100);
  //     // }
  //     const a = messageAlpha(m, this.simTime);
  //     const alpha = floor(a * 255);
  //     push();
  //     stroke(130, alpha);
  //     fill(130, alpha);

  //     for (let t of m.to) {
  //       const from = this.nodes[m.from];
  //       const to = this.nodes[t];

  //       // --- Flugposition am Anfang
  //       const p = easeOutQuad(m.getFlyProgress(this.simTime));
  //       const x = lerp(from.pos.x, to.pos.x, p);
  //       const y = lerp(from.pos.y, to.pos.y, p);
  //       line(from.pos.x, from.pos.y, x, y);

  //       //verblassen animation zum Ende
  //       //Visuell greifbarer machen
  //       //Pfeil in die richtung bewegen

  //       //start new drawing state

  //       let offset = 14;
  //       let wing = 8;

  //       const angle = atan2(from.pos.y - y, from.pos.x - x);

  //       translate(x, y);
  //       rotate(angle - PI);

  //       // Chevron ">"
  //       stroke(130, alpha);
  //       strokeWeight(2);
  //       noFill();

  //       line(0, 0, -offset, -wing);
  //       line(0, 0, -offset, wing);

  //       pop();
  //     }
  //   }

  //   noStroke();
  //   for (let n of this.nodes) {
  //     ellipse(n.pos.x, n.pos.y, n.displayRadius * 2);
  //   }
  // }
  draw() {
    for (let m of this.messages) {
      const a = messageAlpha(m, this.simTime);
      const alpha = floor(a * 255);

      for (let t of m.to) {
        const from = this.nodes[m.from];
        const to = this.nodes[t];

        const p = easeOutQuad(m.getFlyProgress(this.simTime));

        // Richtung from → to
        const dx = to.pos.x - from.pos.x;
        const dy = to.pos.y - from.pos.y;
        const dist = sqrt(dx * dx + dy * dy);

        const nx = dx / dist;
        const ny = dy / dist;

        // Flugposition
        const tx = lerp(from.pos.x, to.pos.x, p);
        const ty = lerp(from.pos.y, to.pos.y, p);

        // Abstand zur Zielnode
        const padding = to.displayRadius + 2;

        // Linie nur bis kurz vor den Pfeil
        const lx = tx - nx * padding;
        const ly = ty - ny * padding;

        stroke(100, alpha);
        line(from.pos.x, from.pos.y, lx, ly);

        // ---------- Pfeil ----------
        let offset = 4;
        let wing = 4;

        push();
        translate(lx, ly);
        rotate(atan2(dy, dx));

        strokeWeight(2);
        noFill();

        // Chevron ">"
        line(0, 0, -offset, -wing);
        line(0, 0, -offset, wing);

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

  const fadePortion = 0.01; // 10 %

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
