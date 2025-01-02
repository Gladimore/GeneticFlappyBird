// Customizable Game Variables
const birdSize = 15;          // Size of the bird (radius)
const pipeSpeed = 3;          // Speed of the pipes
const pipeDistance = 250;     // Distance between pipes
const gravity = 0.5;
const flapPower = -10;
const pipeWidth = 60;
const pipeGap = 150;
const populationSize = 500;
const mutationRate = 0.1;       // Initial mutation rate
const elitismCount = 5;         // Number of elite birds retained
let generation = 0;
let previousBestScore = 0;
let currentBestScore = 0;

let pipes = [];
let birds = [];
let savedBirds = [];
let bestBird = null;

// DOM Elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const generationDisplay = document.getElementById("generation");
const bestScoreDisplay = document.getElementById("bestScore");
const prevBestScoreDisplay = document.getElementById("prevBestScore");
const killAllBtn = document.getElementById('killAllBtn');
const exportButton = document.getElementById("exportBtn");
const importButton = document.getElementById("importBtn");
const loadPremadeBtn = document.getElementById("loadPremade");

// Set up event listeners
loadPremadeBtn.addEventListener("click", loadPremadeBot)
killAllBtn.addEventListener('click', killAllBirds);

// Bird Class
class Bird {
  constructor(brain) {
    this.x = 100;
    this.y = canvas.height / 2;
    this.radius = birdSize;    // Use customizable bird size
    this.velocity = 0;
    this.score = 0;
    this.alive = true;
    this.brain = brain || new NeuralNetwork(3, 8, 1); // Inputs: delta_x, delta_y_top, delta_y_bottom
  }

  update(pipes) {
    if (!this.alive) return;

    this.velocity += gravity;
    this.y += this.velocity;

    if (this.y + this.radius >= canvas.height || this.y - this.radius <= 0) {
      this.alive = false;
      return;
    }

    let closestPipe = pipes.find(pipe => pipe.x + pipeWidth > this.x);

    if (closestPipe) {
      if (this.checkCollision(closestPipe)) {
        this.alive = false;
        return;
      }

      // Compute inputs for the neural network
      let delta_x = (closestPipe.x - this.x) / canvas.width;
      let delta_y_top = (this.y - closestPipe.top) / canvas.height;
      let delta_y_bottom = (closestPipe.bottom - this.y) / canvas.height;

      let inputs = [delta_x, delta_y_top, delta_y_bottom];

      let output = this.brain.predict(inputs);
      if (output[0] > 0.5) this.flap();
    }

    this.score++;
    if (this.score > currentBestScore) {
      currentBestScore = this.score;
      bestBird = this; // Update best bird of the current generation
    }
  }

  flap() {
    this.velocity = flapPower;
  }

  checkCollision(pipe) {
    return (
      this.x + this.radius > pipe.x &&
      this.x - this.radius < pipe.x + pipeWidth &&
      (this.y - this.radius < pipe.top || this.y + this.radius > pipe.bottom)
    );
  }

  draw() {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Pipe Class
class Pipe {
  constructor(x) {
    this.x = x;
    this.top = Math.random() * (canvas.height - pipeGap);
    this.bottom = this.top + pipeGap;
  }

  update() {
    this.x -= pipeSpeed;  // Use customizable pipe speed
  }

  draw() {
    ctx.fillStyle = "green";
    ctx.fillRect(this.x, 0, pipeWidth, this.top);
    ctx.fillRect(this.x, this.bottom, pipeWidth, canvas.height - this.bottom);
  }
}

// Genetic Algorithm Functions
function nextGeneration() {
  generation++;
  updateDisplay();
  if (currentBestScore > previousBestScore) {
    previousBestScore = currentBestScore; // Update overall best score
  }

  currentBestScore = 0; // Reset for next generation
  calculateFitness();

  let eliteBirds = getTopBirds(elitismCount);
  birds = [...eliteBirds];

  while (birds.length < populationSize) {
    let parentA = selectOne(savedBirds);
    let parentB = selectOne(savedBirds);
    let childBrain = NeuralNetwork.crossover(parentA.brain, parentB.brain);
    childBrain.mutate(mutationRate);
    birds.push(new Bird(childBrain));
  }

  savedBirds = [];
  resetGame();
}

function calculateFitness() {
  let sum = savedBirds.reduce((sum, bird) => sum + bird.score, 0);
  savedBirds.forEach(bird => {
    bird.fitness = bird.score / sum;
  });
}

function selectOne(savedBirds) {
  let index = 0;
  let r = Math.random();

  while (r > 0) {
    r -= savedBirds[index].fitness;
    index++;
  }
  return savedBirds[index - 1];
}

function getTopBirds(count) {
  return savedBirds
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(b => new Bird(b.brain));
}

function killAllBirds() {
  isGameOver = true;
  birds = []; // Clear the birds array
}

function loadBird(brainData) {
  const importedBrain = NeuralNetwork.deserialize(brainData);

  // Half of the birds will use the imported brain, the other half remain the same
  const halfPopulation = Math.floor(birds.length / 2);

  for (let i = 0; i < halfPopulation; i++) {
    birds[i] = new Bird(importedBrain); // Set first half to the imported brain
  }

  // Remaining birds retain their existing brains
  for (let i = halfPopulation; i < birds.length; i++) {
    birds[i] = new Bird(); // Keep the original brain for the other half
  }

  resetGame();
}

function loadPremadeBot() {
  fetch("data/bestBirdGen16.json")
    .then((res) => res.json())
    .then(data => {
      loadBird(data)
    })
}

// Import a saved bird's brain from JSON file
function importBestBird(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const brainData = JSON.parse(e.target.result);
    loadBird(brainData)
  };

  reader.readAsText(file);
}

// Save current best bird's brain as JSON
function exportBestBird() {
  if (bestBird) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bestBird.brain.serialize()));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bestBirdGen${generation}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } else {
    alert("No best bird to save yet!");
  }
}

// Utility Functions
function resetGame() {
  pipes = [new Pipe(canvas.width), new Pipe(canvas.width + pipeDistance)]; // Use customizable pipe distance
}

function updateDisplay() {
  generationDisplay.innerText = generation;
  bestScoreDisplay.innerText = currentBestScore;
  prevBestScoreDisplay.innerText = previousBestScore;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  pipes.forEach(pipe => {
    pipe.update();
    pipe.draw();
  });

  if (pipes[0].x + pipeWidth < 0) pipes.shift();
  if (pipes[pipes.length - 1].x < canvas.width - pipeDistance) pipes.push(new Pipe(canvas.width));

  birds.forEach(bird => {
    bird.update(pipes);
    bird.draw();
    if (!bird.alive) savedBirds.push(bird);
  });

  birds = birds.filter(bird => bird.alive);

  if (birds.length === 0) nextGeneration();

  requestAnimationFrame(gameLoop);
}

function setup() {
  updateDisplay();
  birds = Array.from({ length: populationSize }, () => new Bird());
  resetGame();
  gameLoop();
}

// Initialize the game
setup();

// Attach event listeners
exportButton.addEventListener("click", exportBestBird);
importButton.addEventListener("change", importBestBird);