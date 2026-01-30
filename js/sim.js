// const { text } = require("express");

// --------- NODE
class Node {
  constructor(id, x, y) {
    this.id = id;
    this.pos = createVector(x, y);
    this.vel = createVector();
    this.acc = createVector();
    this.radius = 4; // Basisradius
    this.attention = 0; // neue Variable
    this.targetAttention = 0; // zum Smoothen
  }

  updateRadius() {
    // smooth interpolation: linear oder eased
    const eased = easeOutCubic(constrain(this.targetAttention / 4, 0, 1)); // 10 = max scaling factor
    this.attention = lerp(this.attention, eased * 10, 0.002); // 0.02 = sehr langsames Lerp
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
    this.flyDuration = 0.4; // Sekunden für den Flug zum Ziel (kurz)
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
    this.play = true;

    this.groups = []; // Array von Gruppen (Arrays von Node-IDs)
    this.groupIntervalId = null;
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
      (msg) => this.simTime < msg.createdAt + msg.lifetime,
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
    if (this.groupIntervalId) {
      clearInterval(this.groupIntervalId);
      this.groupIntervalId = null;
    }

    if (mode === "A") this.startModeA();
    if (mode === "B") this.startModeB();
    if (mode === "C") this.startModeC();
    this.runningMode = mode;
  }
  // –––––––––––––––––––––– MODE A    //Autonomie
  startModeA() {
    this.messages = [];
    // connectivityRange.classList.remove("range-deactive");
    // document
    //   .querySelector('label[for="connectivityRange"]')
    //   .classList.remove("range-deactive");
    // attentionRange.classList.remove("range-deactive");
    // document
    //   .querySelector('label[for="attentionRange"]')
    //   .classList.remove("range-deactive");
    // messageRateRange.classList.remove("range-deactive");
    // document
    //   .querySelector('label[for="messageRateRange"]')
    //   .classList.remove("range-deactive");
    // fill(15, 150, 25);

    currentColor = autonomieClr;
    document.documentElement.style.setProperty("--sim-color", currentColor);
    fill(currentColor);
    stroke(currentColor);
    let id = floor(random(this.nodes.length));
    let msgPerNode = floor(
      random(1, map(connectivityRange.value, 1, 40, 1, this.nodes.length)),
    );
    let postingCycle = Math.round(
      map(messageRateRange.value, 0, 100, 3000, 10),
    );

    // INITIAL MESSAGE
    for (let i = 0; i < msgPerNode; i++) {
      let msgLifeTime = floor(random(attentionRange.value));

      this.messages.push(
        new Message(
          id,
          [floor(random(this.nodes.length))],
          this.simTime,
          msgLifeTime,
        ),
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
            msgLifeTime,
          ),
        );
      }
    }, postingCycle);
  }
  // –––––––––––––––––––––– MODE B    //Fairness
  startModeB() {
    this.messages = [];
    // connectivityRange.classList.add("range-deactive");
    // document
    //   .querySelector('label[for="connectivityRange"]')
    //   .classList.add("range-deactive");
    // attentionRange.classList.add("range-deactive");
    // document
    //   .querySelector('label[for="attentionRange"]')
    //   .classList.add("range-deactive");
    // messageRateRange.classList.add("range-deactive");
    // document
    //   .querySelector('label[for="messageRateRange"]')
    //   .classList.add("range-deactive");
    currentColor = gerechtigkeitClr;
    document.documentElement.style.setProperty("--sim-color", currentColor);
    fill(currentColor);
    stroke(currentColor);
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
  // –––––––––––––––––––––– MODE C //Empathie
  startModeC() {
    this.messages = [];
    // connectivityRange.classList.remove("range-deactive");
    // document
    //   .querySelector('label[for="connectivityRange"]')
    //   .classList.remove("range-deactive");
    // attentionRange.classList.remove("range-deactive");
    // document
    //   .querySelector('label[for="attentionRange"]')
    //   .classList.remove("range-deactive");
    // messageRateRange.classList.remove("range-deactive");
    // document
    //   .querySelector('label[for="messageRateRange"]')
    //   .classList.remove("range-deactive");

    //Groupes
    this.createRandomGroups(8);

    // bestehendes Intervall stoppen
    if (this.groupIntervalId) clearInterval(this.groupIntervalId);

    // alle 20 Sekunden neu mischen
    this.groupIntervalId = setInterval(() => {
      this.messages = [];
      this.createRandomGroups(8);
    }, 40000);

    // fill(10, 15, 25);
    currentColor = empathieClr;
    document.documentElement.style.setProperty("--sim-color", currentColor);
    fill(currentColor);
    stroke(currentColor);
    let id = floor(random(this.nodes.length));
    let msgPerNode = floor(
      random(1, map(connectivityRange.value, 1, 40, 1, 7)),
    );
    let postingCycle = map(messageRateRange.value, 0, 100, 1000, 1);

    // INITIAL MESSAGE
    let target = this.getRandomTargetFromGroup(id);
    // let id2 = floor(random(this.nodes.length));

    let msgLifeTime = floor(random(1, attentionRange.value));
    console.log(msgLifeTime);
    if (target !== null) {
      this.messages.push(new Message(id, [target], this.simTime, msgLifeTime));
    }
    if (floor(random(2)) == floor(random(2))) {
      setTimeout(() => {
        for (let i = 0; i < msgPerNode; i++) {
          let msgLifeTime = floor(random(1, attentionRange.value));
          let target = this.getRandomTargetFromGroup(id);
          if (target !== null) {
            this.messages.push(
              new Message(target, [id], this.simTime, msgLifeTime),
            );
          }
        }
      }, postingCycle);
    }

    // MESSAGE INTERVAL

    this.intervalId = setInterval(() => {
      let id = floor(random(1, this.nodes.length));

      // let id2 = floor(random(1, this.nodes.length));
      let target = this.getRandomTargetFromGroup(id);
      let msgLifeTime = floor(random(1, attentionRange.value));
      if (target !== null) {
        this.messages.push(
          new Message(id, [target], this.simTime, msgLifeTime),
        );
      }

      if (floor(random(2)) == floor(random(2))) {
        setTimeout(() => {
          for (let i = 0; i < msgPerNode; i++) {
            let msgLifeTime = floor(random(1, attentionRange.value));
            let target = this.getRandomTargetFromGroup(id);
            if (target !== null) {
              this.messages.push(
                new Message(target, [id], this.simTime, msgLifeTime),
              );
            }
          }
        }, postingCycle);
      }
    }, postingCycle);
  }

  createRandomGroups(maxSize = 8) {
    const ids = this.nodes.map((n) => n.id);

    // Shuffle (Fisher–Yates)
    for (let i = ids.length - 1; i > 0; i--) {
      const j = floor(random(i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }

    // In Gruppen schneiden
    this.groups = [];
    for (let i = 0; i < ids.length; i += maxSize) {
      this.groups.push(ids.slice(i, i + maxSize));
    }
  }
  getGroupOfNode(nodeId) {
    return this.groups.find((g) => g.includes(nodeId));
  }
  getRandomTargetFromGroup(fromId) {
    const group = this.getGroupOfNode(fromId);
    if (!group || group.length <= 1) return null;

    let target;
    do {
      target = random(group);
    } while (target === fromId);

    return target;
  }

  update() {
    //update Clock
    if (this.play == true) {
      this.behavior();
      this.physics();
      this.cleanupMessages();
      sim.updateAttention();
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
      document.getElementById("simClock").innerText = `${pad(h)}:${pad(
        m,
      )}:${pad(s)}`;
    }
  }

  physics() {
    const damping = 0.05;
    // const repulsionRadius = 250;
    // const repulsionStrength = 400;
    const messageAttraction = 10;
    const maxSpeed = 10;

    // reset acceleration
    for (let n of this.nodes) {
      n.acc.set(0, 0);
    }

    // node–node repulsion
    // for (let i = 0; i < this.nodes.length; i++) {
    //   for (let j = i + 1; j < this.nodes.length; j++) {
    //     const a = this.nodes[i];
    //     const b = this.nodes[j];

    //     const dir = p5.Vector.sub(a.pos, b.pos);
    //     const d = dir.mag();

    //     if (d > 0 && d < repulsionRadius) {
    //       dir.normalize();
    //       const f = (1 - d / repulsionRadius) * repulsionStrength;

    //       dir.mult(f);

    //       a.acc.add(dir);
    //       b.acc.sub(dir);
    //     }
    //   }
    // }
    // const minNodeDistance = 25; // gewünschter minimaler Abstand
    // const repulsionRadius = 100; // Radius für "leichte" Abstoßung
    // const repulsionStrength = 300; // Basisstärke

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];

        const dx = a.pos.x - b.pos.x;
        const dy = a.pos.y - b.pos.y;
        const dist = sqrt(dx * dx + dy * dy);

        if (dist > 0) {
          const nx = dx / dist;
          const ny = dy / dist;

          // Dynamischer Mindestabstand basierend auf der Node-Größe
          const minDist = a.displayRadius + b.displayRadius + 50; // +10 als extra padding
          const repulsionRadius = 100; // Radius für leichte Abstoßung
          const repulsionStrength = 10;

          let f = 0;

          // starke Abstoßung bei Unterschreitung des Mindestabstands
          if (dist < minDist) {
            const overlap = minDist - dist;
            f += repulsionStrength * pow((overlap / minDist) * 8, 2); // quadratische Steigerung
          }

          // leichte Abstoßung innerhalb des repulsionRadius
          if (dist < repulsionRadius && dist > minDist) {
            f += repulsionStrength * (1 - dist / repulsionRadius) * 0.1; // sanft
          }

          a.acc.x += nx * f;
          a.acc.y += ny * f;
          b.acc.x -= nx * f;
          b.acc.y -= ny * f;
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

  draw() {
    // background(255);

    for (let m of this.messages) {
      for (let t of m.to) {
        const from = this.nodes[m.from];
        const to = this.nodes[t];

        // Flugfortschritt
        const p = easeOutQuad(m.getFlyProgress(this.simTime));

        // Richtung from → to
        const dx = to.pos.x - from.pos.x;
        const dy = to.pos.y - from.pos.y;
        const dist = sqrt(dx * dx + dy * dy);

        const nx = dx / dist;
        const ny = dy / dist;

        // Padding für from- und to-Node
        const fromPadding = 4 + (from.displayRadius + from.attention) / 2;
        const toPadding = 4 + (to.displayRadius + to.attention) / 2;

        // Flugposition entlang Linie
        const tx = lerp(from.pos.x, to.pos.x, p);
        const ty = lerp(from.pos.y, to.pos.y, p);

        // Linie mit Padding
        const sx = from.pos.x + nx * fromPadding; // gekürzter Start
        const sy = from.pos.y + ny * fromPadding;
        const ex = tx - nx * toPadding; // gekürztes Ende
        const ey = ty - ny * toPadding;

        push();
        strokeWeight(2); // Linienstärke
        stroke(messageAlpha(m, this.simTime));
        line(sx, sy, ex, ey);
        pop();

        // ---------- Pfeil ----------
        let offset = 4;
        let wing = 4;

        push();
        // Chevron ">"
        translate(ex, ey);
        rotate(atan2(dy, dx));
        stroke(messageAlpha(m, this.simTime));
        strokeWeight(2);
        line(0, 0, -offset, -wing);
        line(0, 0, -offset, wing);
        pop();
      }
    }

    for (let n of this.nodes) {
      push();

      stroke(255);
      strokeWeight(2);
      ellipse(n.pos.x, n.pos.y, n.displayRadius * 2);
      pop();
    }
  }
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
}

function messageAlpha(msg, simTime) {
  const age = simTime - msg.createdAt;
  const t = constrain(age / msg.lifetime, 0, 1); // 0..1

  const fadeOutPortion = 0.15;
  const fadeInPortion = 0.01;

  // Fade-in (Weiß → currentColor)
  if (t < fadeInPortion) {
    const n = t / fadeInPortion; // 0..1
    return lerpColor(color(255, 255, 255), currentColor, n);
  }

  // Fade-out (currentColor → Weiß)
  if (t > 1 - fadeOutPortion) {
    const n = (t - (1 - fadeOutPortion)) / fadeOutPortion; // 0..1
    return lerpColor(currentColor, color(255, 255, 255), n);
  }

  // Mitte der Lebenszeit: volle currentColor
  return currentColor;
}

function easeOutCubic(t) {
  return 1 - pow(1 - t, 3);
}

function easeOutQuad(t) {
  return t * (2 - t); // schneller Start, langsames Abbremsen
}
