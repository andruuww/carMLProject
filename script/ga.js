let sum = 0;
let lastAverage = 0;

function nextGeneration() {
  gen++;
  calculateFitness();
  for (let i = 0; i < population; i++) {
    vehicles[i] = gimmeBaby();
  }
  for (let i = 0; i < population; i++) {
    savedVehicles[i].dispose();
  }
  savedVehicles = [];
}

function gimmeBaby() {
  let index = 0;
  let r = random(1);
  while (r > 0) {
    r = r - savedVehicles[index].fitness;
    index++;
  }
  index--;
  let car = savedVehicles[index];
  let child = new Car(car.brain, car.colorGene);
  if (savedVehicles[index].finished) {
    child.finished = true;
  }
  child.mutateDemBabies();
  child.finished = false;
  return child;
}

function calculateFitness() {
  // Normalize all values
  sum = 0;
  for (let car of savedVehicles) {
    sum += car.fitness;
  }
  for (let car of savedVehicles) {
    car.fitness = car.fitness / sum;
  }
}

function calculateAverage() {
  return sum / population;
}

function calculateImprovement() {
  let averageSum = 0;
  for (let car of savedVehicles) {
    averageSum += car.fitness;
  }
  if (averageSum / population > lastAverage) {
    lastAverage = averageSum / population;
    return "True";
  } else {
    lastAverage = averageSum / population;
    return "False";
  }
}

function calculateFinished() {
  let num = 0;
  for (let car of savedVehicles) {
    if (car.finished == true) {
      num++;
    }
  }
  return num;
}
