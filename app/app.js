const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const startButton = document.getElementById('start');
const resetButton = document.getElementById('reset');
const scoreElement = document.getElementById('score');
const bestElement = document.getElementById('best');

const tileSize = 24;
const tileCount = canvas.width / tileSize;
const tickSpeed = 300;
const mazeWalls = [
  { x: 4, y: 4, width: 7, height: 1 },
  { x: 16, y: 4, width: 5, height: 1 },
  { x: 4, y: 15, width: 5, height: 1 },
  { x: 15, y: 15, width: 6, height: 1 },
  { x: 6, y: 7, width: 1, height: 5 },
  { x: 17, y: 7, width: 1, height: 5 },
  { x: 10, y: 18, width: 1, height: 4 },
  { x: 13, y: 2, width: 1, height: 4 }
];
const collectibleTypes = [
  { name: 'apple', points: 10, color: '#e85d5d' },
  { name: 'carrot', points: 15, color: '#f2a33a' },
  { name: 'berry', points: 20, color: '#bc6ee6' }
];
let snake;
let food;
let direction;
let nextDirection;
let score = 0;
let best = Number(localStorage.getItem('snake-best') || 0);
let timer;
let running = false;
let paused = false;

bestElement.textContent = best;

function resetGame() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  direction = { x: 1, y: 0 };
  nextDirection = direction;
  score = 0;
  paused = false;
  scoreElement.textContent = score;
  placeFood();
  draw();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount),
      type: collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)]
    };
  } while (isBlocked(food.x, food.y) || snake.some((segment) => segment.x === food.x && segment.y === food.y));
}

function isBlocked(x, y) {
  return mazeWalls.some((wall) => x >= wall.x && x < wall.x + wall.width && y >= wall.y && y < wall.y + wall.height);
}

function startGame() {
  resetGame();
  running = true;
  overlay.classList.add('hidden');
  clearInterval(timer);
  timer = setInterval(tick, tickSpeed);
}

function endGame() {
  running = false;
  clearInterval(timer);
  overlayTitle.textContent = `Run over: ${score} points`;
  startButton.textContent = 'Try again';
  overlay.classList.remove('hidden');
}

function tick() {
  if (paused) return;
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const hitWall = head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount;
  const hitMaze = isBlocked(head.x, head.y);
  const hitSelf = snake.some((segment) => segment.x === head.x && segment.y === head.y);
  if (hitWall || hitMaze || hitSelf) {
    endGame();
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += food.type.points;
    scoreElement.textContent = score;
    if (score > best) {
      best = score;
      bestElement.textContent = best;
      localStorage.setItem('snake-best', best);
    }
    placeFood();
  } else {
    snake.pop();
  }
  draw();
}

function draw() {
  const gardenGradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gardenGradient.addColorStop(0, '#2f6d3d');
  gardenGradient.addColorStop(1, '#173d2a');
  context.fillStyle = gardenGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(196, 244, 122, 0.09)';
  for (let index = 0; index < 80; index += 1) {
    const x = (index * 73) % canvas.width;
    const y = (index * 47) % canvas.height;
    context.fillRect(x, y, 2, 5);
  }
  context.strokeStyle = 'rgba(223, 255, 185, 0.08)';
  for (let index = 1; index < tileCount; index += 1) {
    context.beginPath();
    context.moveTo(index * tileSize, 0);
    context.lineTo(index * tileSize, canvas.height);
    context.moveTo(0, index * tileSize);
    context.lineTo(canvas.width, index * tileSize);
    context.stroke();
  }
  mazeWalls.forEach((wall) => drawMazeWall(wall));
  drawCollectible(food);
  snake.forEach((segment, index) => {
    drawSnakeSegment(segment, index === 0);
  });
}

function drawMazeWall(wall) {
  const x = wall.x * tileSize + 2;
  const y = wall.y * tileSize + 2;
  const width = wall.width * tileSize - 4;
  const height = wall.height * tileSize - 4;
  const wallGradient = context.createLinearGradient(x, y, x, y + height);
  wallGradient.addColorStop(0, '#9b633f');
  wallGradient.addColorStop(1, '#57372b');
  context.fillStyle = wallGradient;
  context.shadowColor = 'rgba(8, 29, 17, 0.55)';
  context.shadowBlur = 7;
  context.shadowOffsetY = 4;
  context.fillRect(x, y, width, height);
  context.shadowColor = 'transparent';
  context.fillStyle = '#d2a36b';
  context.fillRect(x, y, width, 3);
}

function drawCollectible(item) {
  const centerX = item.x * tileSize + tileSize / 2;
  const centerY = item.y * tileSize + tileSize / 2;
  context.save();
  context.shadowColor = item.type.color;
  context.shadowBlur = 12;
  context.fillStyle = item.type.color;
  context.beginPath();
  context.arc(centerX, centerY + 2, 7, 0, Math.PI * 2);
  context.fill();
  context.shadowColor = 'transparent';
  context.fillStyle = '#f4f0cf';
  context.beginPath();
  context.arc(centerX - 2, centerY - 1, 2, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#5ea64f';
  context.fillRect(centerX + 2, centerY - 9, 5, 3);
  context.restore();
}

function drawSnakeSegment(segment, isHead) {
  const x = segment.x * tileSize + 3;
  const y = segment.y * tileSize + 3;
  const segmentGradient = context.createLinearGradient(x, y, x, y + tileSize);
  segmentGradient.addColorStop(0, isHead ? '#efff9b' : '#a5dc5f');
  segmentGradient.addColorStop(1, isHead ? '#5c9f45' : '#397d42');
  context.fillStyle = segmentGradient;
  context.shadowColor = 'rgba(11, 42, 20, 0.65)';
  context.shadowBlur = 5;
  context.shadowOffsetY = 3;
  context.beginPath();
  context.roundRect(x, y, tileSize - 6, tileSize - 6, 7);
  context.fill();
  context.shadowColor = 'transparent';
  if (isHead) {
    context.fillStyle = '#173d2a';
    context.fillRect(x + 6, y + 5, 3, 3);
    context.fillRect(x + 13, y + 5, 3, 3);
  }
}

function setDirection(newDirection) {
  if (newDirection.x + direction.x === 0 && newDirection.y + direction.y === 0) return;
  nextDirection = newDirection;
}

document.addEventListener('keydown', (event) => {
  const controls = {
    ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }
  };
  if (controls[event.key]) {
    event.preventDefault();
    setDirection(controls[event.key]);
  }
  if (event.code === 'Space' && running) {
    paused = !paused;
    overlayTitle.textContent = paused ? 'Paused' : 'Ready when you are';
    overlay.classList.toggle('hidden', !paused);
  }
});

startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', () => {
  running = false;
  clearInterval(timer);
  overlayTitle.textContent = 'Ready when you are';
  startButton.textContent = 'Start game';
  overlay.classList.remove('hidden');
  resetGame();
});

resetGame();
