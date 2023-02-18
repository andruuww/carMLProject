function pldistance(p1, p2, x, y) {
  const num = abs((p2.y - p1.y) * x - (p2.x - p1.x) * y + p2.x * p1.y - p2.y * p1.x);
  const den = p5.Vector.dist(p1, p2);
  return num / den;
}

class Car {
  constructor(brain, color = [random(255), random(255), random(255)]) {
    this.colorGene = color;
    this.dead = false;
    this.finished = false;
    this.fitness = 0;
    this.rays = [];
    this.wallRays = [];
    this.degreeOfSight = degreeOfSight;
    this.degreeOfRays = degreeOfSight / (numOfRays - 1);
    if (this.degreeOfSight == 360) {
      this.degreeOfRays = degreeOfSight / numOfRays;
    }
    this.pos = createVector(start.x, start.y);
    this.vel = createVector();
    this.acc = createVector();
    this.sight = sight;
    this.maxspeed = maxspeed;
    this.maxforce = maxTurningSpeed;
    this.currentGoal = 0;
    this.timeTillDeadC = timeTillDead;
    this.timeTillDead = this.timeTillDeadC;
    this.goal;
    this.rate = mutationRate;
    if (degreeOfSight != 360) {
      for (let a = -(this.degreeOfSight / 2); a <= this.degreeOfSight / 2; a += this.degreeOfRays) {
        this.rays.push(new Ray(this.pos, radians(a)));
      }
    } else {
      for (let a = -(this.degreeOfSight / 2); a < this.degreeOfSight / 2; a += this.degreeOfRays) {
        this.rays.push(new Ray(this.pos, radians(a)));
      }
    }

    for (let a = 0; a < 360; a += 45) {
      this.wallRays.push(new Ray(this.pos, radians(a)));
    }
    if (brain) {
      this.brain = brain.copy();
    } else {
      this.brain = new NeuralNetwork(this.rays.length + 2, 16, 2);
    }
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update(x, y) {
    this.timeTillDead--;

    if (this.timeTillDead <= 0) {
      this.dead = true;
    }

    if (!this.dead || this.finished) {
      this.pos.add(this.vel);
      this.vel.add(this.acc);
      this.vel.limit(this.maxspeed);
      this.acc.set(0, 0);
    }

    for (let i = 0; i < this.rays.length; i++) {
      this.rays[i].rotate(this.vel.heading());
    }
    for (let i = 0; i < this.wallRays.length; i++) {
      this.wallRays[i].rotate(this.vel.heading());
    }
  }

  show(walls) {
    push();
    translate(this.pos.x, this.pos.y);
    if (visualization) {
      fill(this.colorGene[0], this.colorGene[1], this.colorGene[1]);
    } else {
      fill(0);
    }
    stroke(255);
    const heading = this.vel.heading();
    rotate(heading);
    rectMode(CENTER);
    rect(0, 0, 10, 5);
    pop();
    if (!this.dead) {
      checkpoints[this.currentGoal].show();
    }

    for (let i = 0; i < this.rays.length; i++) {
      let closest = null;
      let record = this.sight;
      for (let wall of walls) {
        const pt = this.rays[i].cast(wall);
        if (pt) {
          const d = p5.Vector.dist(this.pos, pt);
          if (d < record && d < this.sight) {
            record = d;
            closest = pt;
          }
        }
      }

      if (closest) {
        if (showLines) {
          ellipse(closest.x, closest.y, 4)
          stroke(255, 100)
          line(this.pos.x, this.pos.y, closest.x, closest.y);
        }
      }
    }
  }

  check(checkpoints, walls) {
    if (!this.dead) {
      this.goal = checkpoints[this.currentGoal];
      const d = pldistance(this.goal.a, this.goal.b, this.pos.x, this.pos.y);
      if (d < 5) {
        this.fitness++;
        this.currentGoal++;
        this.timeTillDead = this.timeTillDeadC;
        if (this.currentGoal == checkpoints.length) {
          this.finished = true;
          this.fitness = this.fitness * 1.5;

          if (endBarrier) {
            this.dead = true;
          } else {
            this.currentGoal = 0;
          }
        }
      }
    }

    for (let i = 0; i < this.wallRays.length; i++) {
      let closest = null;
      let record = this.sight;
      for (let wall of walls) {
        const pt = this.wallRays[i].cast(wall);
        if (pt) {
          const d = p5.Vector.dist(this.pos, pt);
          if (d < record) {
            record = d;
            closest = pt;
          }
        }
      }
      if (record < 4) {
        this.dead = true;
      }
    }
  }

  look(walls) {
    const inputs = [];
    for (let i = 0; i < this.wallRays.length; i++) {
      let closest = null;
      let record = this.sight;
      for (let wall of walls) {
        const pt = this.rays[i].cast(wall);
        if (pt) {
          const d = p5.Vector.dist(this.pos, pt);
          if (d < record && d < this.sight) {
            record = d;
            closest = pt;
          }
        }
      }
      inputs[i] = map(record, 0, 50, 1, 0);
    }
    inputs.push(end.x);
    inputs.push(end.y);
    const output = this.brain.predict(inputs);
    let angle = map(output[0], 0, 1, -PI, PI);
    let speed = map(output[1], 0, 1, -this.maxspeed, this.maxspeed);
    angle += this.vel.heading();
    const steering = p5.Vector.fromAngle(angle);
    steering.setMag(speed);
    steering.limit(this.maxforce);
    this.applyForce(steering);
  }

  mutateDemBabies() {
    if (this.finished) {
      this.rate = finishingMutationRate;
    }
    this.brain.mutate(this.rate);
    let changeColor = this.brain.mutated();

    if (changeColor) {
      for (let color of this.colorGene) {
        let r = map(random(20), 0, 20, -25, 25);
        color += r;
      }
    }

    this.rate = mutationRate;
  }

  dispose() {
    this.brain.dispose();
  }
}
