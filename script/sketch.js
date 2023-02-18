//TODO clean up code

let walls = [];
let vehicles = [];
let savedVehicles = [];
let showLines = false;

let start, end;

let inside = [];
let outside = [];
let checkpoints = [];

let gen = 1;

//all configurable factors of the simulation
//path configurations
let pathWidth = 50;
let randomPathScale = -50;
let checkpointNum = 100;
let difficulty = 1.5;
let autoCreateTrack = false;
let createTrack = false;
let endBarrier = true;
let createEndBarrier = true;
//car configurations
let population = 20;
let sight = pathWidth + 10;
let maxspeed = 3.7;
let maxTurningSpeed = 0.5;
let timeTillDead = 50;
let mutationRate = 0.01;
let finishingMutationRate = 0.005;
let degreeOfSight = 360;
let numOfRays = 8;

let visualization = false;

let improved;

function createPath() {
  walls = [];
  checkpoints = [];
  inside = [];
  outside = [];

  let noiseMax = difficulty;
  let startX = random(1000);
  let startY = random(1000);
  for (let i = 0; i < checkpointNum; i++) {
    let a = map(i, 0, checkpointNum, 0, TWO_PI);
    let xoff = map(cos(a), -1, 1, 0, noiseMax) + startX;
    let yoff = map(sin(a), -1, 1, 0, noiseMax) + startY;
    let r = map(noise(xoff, yoff), 0, 1, 100, height / 2 + -randomPathScale);
    let x1 = width / 2 + (r - (pathWidth / 2)) * cos(a);
    let y1 = height / 2 + (r - (pathWidth / 2)) * sin(a);
    let x2 = width / 2 + (r + (pathWidth / 2)) * cos(a);
    let y2 = height / 2 + (r + (pathWidth / 2)) * sin(a);
    checkpoints.push(new Boundary(x1, y1, x2, y2));
    inside.push(createVector(x1, y1));
    outside.push(createVector(x2, y2));
  }

  for (var i = 0; i < checkpoints.length; i++) {
    let a1 = inside[i];
    let b1 = inside[(i + 1) % checkpoints.length];
    walls.push(new Boundary(a1.x, a1.y, b1.x, b1.y));
    let a2 = outside[i];
    let b2 = outside[(i + 1) % checkpoints.length];
    walls.push(new Boundary(a2.x, a2.y, b2.x, b2.y));
  }

  start = checkpoints[0].middle();
  end = checkpoints[checkpoints.length - 1].middle();
  checkpoints[checkpoints.length - 1].end = true;

  if (createEndBarrier) {
    endBarrier = true;
  } else {
    endBarrier = false;
  }
}

function setup() {
  speedSlider = createSlider(1, 20, 1);
  speedSlider.position(20, 725);
  difficultySlider = createSlider(1, 10, 3);
  difficultySlider.position(725, 5);
  pathWidthSlider = createSlider(50, 300, 50);
  pathWidthSlider.position(900, 5);

  frameRate(60);
  tf.setBackend("cpu");
  createCanvas(700, 700);
  background(0);

  var speed = document.getElementById("speed");
  speed.style.position = "absolute";
  speed.style.left = "20px";
  speed.style.top = "740px";

  var visualization = document.getElementById("visual");
  visualization.style.position = "absolute";
  visualization.style.left = "330px";
  visualization.style.top = "735px";

  var reset = document.getElementById("reset");
  reset.style.position = "absolute";
  reset.style.left = "175px";
  reset.style.top = "735px";

  var resetBrain = document.getElementById("resetBrain");
  resetBrain.style.position = "absolute";
  resetBrain.style.left = "510px";
  resetBrain.style.top = "735px";

  var difficulty = document.getElementById("difficulty");
  difficulty.style.position = "absolute";
  difficulty.style.left = "725px";
  difficulty.style.top = "20px";

  var pathWidth = document.getElementById("pathWidth");
  pathWidth.style.position = "absolute";
  pathWidth.style.left = "900px";
  pathWidth.style.top = "20px";

  var blind = document.getElementById("blind");
  blind.style.position = "absolute";
  blind.style.left = "420px";
  blind.style.top = "735px";

  createPath();

  for (let i = 0; i < population; i++) {
    vehicles[i] = new Car();
  }
}

function draw() {
  background(0);

  document.getElementById("speed").innerHTML = "Speed: " + speedSlider.value();
  document.getElementById("difficulty").innerHTML = "Difficulty: " + map(difficultySlider.value(), 1, 10, 0.5, 5);
  document.getElementById("pathWidth").innerHTML = "Path Width: " + pathWidthSlider.value();

  const cylces = speedSlider.value();
  difficulty = map(difficultySlider.value(), 1, 10, 0.5, 5);
  pathWidth = pathWidthSlider.value();

  if (!showLines) {
    ellipse(end.x, end.y, 10);
    ellipse(start.x, start.y, 10);
  }

  for (let car of vehicles) {
    if (car) {
      car.show(walls);
    }
  }

  for (let wall of walls) {
    if (!showLines) {
      wall.show();
    }
  }

  for (n = 0; n < cylces; n++) {

    if (vehicles.length == 0) {
      if (autoCreateTrack || createTrack) {
        createPath();
        createTrack = false;
      }

      improved = calculateImprovement();
      numFinished = calculateFinished();
      nextGeneration();
    }

    if (vehicles.length > 0) {
      for (let car of vehicles) {
        if (car) {
          car.check(checkpoints, walls);
          car.look(walls);
          car.update();
        }
      }
    }

    //some bugs i had to fix ¯\_(ツ)_/¯
    if (vehicles.length > 0) {
      if (vehicles[0].dead) {
        let finished = false;
        finish = vehicles[0].finished;
        savedVehicles.push(vehicles.splice(0, 1)[0]);
        if (finished) {
          savedVehicles[0].finished = true;
        }
      }
    }
    if (vehicles.length == 2) {
      if (vehicles[1].dead) {
        let finished = false;
        finish = vehicles[1].finished;
        savedVehicles.push(vehicles.splice(1, 1)[0]);
        if (finished) {
          savedVehicles[1].finished = true;
        }
      }
    }

    if (vehicles.length > 2) {
      for (let i = vehicles.length - 1; i > 0; i--) {
        if (vehicles[i].dead) {
          let finished = false;
          finish = vehicles[i].finished;
          savedVehicles.push(vehicles.splice(i, 1)[0]);
          if (finished) {
            savedVehicles[i].finished = true;
          }
        }
      }
    }
  }
  drawStats();
}

function drawStats() {
  push();
  fill(255, 255, 255);
  textSize(20);
  text("Generation: " + gen, 20, 30);
  text("Still Alive: " + vehicles.length, 20, 55);
  textSize(15);
  text("Last Gen Stats", 20, height - 100);
  if (vehicles.length > 0) {
    if (gen > 1) {
      text("Average Fitness: " + calculateAverage(), 20, height - 75);
    } else {
      text("Average Fitness: Not Applicable", 20, height - 75);
    }
  }
  if (gen > 1) {
    text("Improved: " + improved, 20, height - 25);
    text("Finished: " + numFinished, 20, height - 50);
  } else {
    text("Improved: Not Applicable", 20, height - 25);
    text("Finished: Not Applicable", 20, height - 50);
  }
  pop();
}

function blind() {
  if (!showLines) {
    showLines = true;
  } else {
    showLines = false;
  }
}

function createPathButton() {
  createTrack = true;
}

function endBarrierTF() {
  if (createEndBarrier) {
    createEndBarrier = false;
  } else {
    createEndBarrier = true;
  }
}

function reset() {
  for (let car of vehicles) {
    car.dead = true;
  }
}

function resetBrain() {
  reset();
  for (let i = 0; i < population; i++) {
    vehicles[i] = new Car();
  }
  gen = 1;
}

function visualize() {
  if (!visualization) {
    visualization = true;
  } else {
    visualization = false;
  }
}
