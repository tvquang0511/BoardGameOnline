import { deepCopy, randomInt } from "../utils";

const DIRS = ["UP", "RIGHT", "DOWN", "LEFT"];

export function createSnakeState({ rows = 20, cols = 20 }) {
  const start = { r: Math.floor(rows / 2), c: Math.floor(cols / 2) };
  return {
    rows,
    cols,
    snake: [start, { r: start.r, c: start.c - 1 }, { r: start.r, c: start.c - 2 }],
    dir: "RIGHT",
    paused: false,
    food: spawnFood({ rows, cols }, [start]),
    score: 0,
    dead: false,
    tickMs: 180,
  };
}

function eq(a, b) {
  return a.r === b.r && a.c === b.c;
}

function spawnFood({ rows, cols }, snake) {
  for (let tries = 0; tries < 1000; tries += 1) {
    const p = { r: randomInt(rows), c: randomInt(cols) };
    if (!snake.some((s) => eq(s, p))) return p;
  }
  return { r: 0, c: 0 };
}

function rotateDir(cur, turn) {
  const i = DIRS.indexOf(cur);
  if (i < 0) return cur;
  const next = (i + (turn === "LEFT" ? -1 : 1) + DIRS.length) % DIRS.length;
  return DIRS[next];
}

function step(head, dir) {
  if (dir === "UP") return { r: head.r - 1, c: head.c };
  if (dir === "DOWN") return { r: head.r + 1, c: head.c };
  if (dir === "LEFT") return { r: head.r, c: head.c - 1 };
  return { r: head.r, c: head.c + 1 };
}

export function reduceSnake(state, action) {
  const s = deepCopy(state);

  if (action.type === "TURN") {
    if (s.dead) return s;
    s.dir = rotateDir(s.dir, action.turn);
    return s;
  }

  if (action.type === "TOGGLE_PAUSE") {
    s.paused = !s.paused;
    return s;
  }

  if (action.type === "TICK") {
    if (s.dead || s.paused) return s;

    const head = s.snake[0];
    const next = step(head, s.dir);

    // wall
    if (next.r < 0 || next.c < 0 || next.r >= s.rows || next.c >= s.cols) {
      s.dead = true;
      return s;
    }

    // self-collision
    if (s.snake.some((p) => eq(p, next))) {
      s.dead = true;
      return s;
    }

    s.snake.unshift(next);

    if (eq(next, s.food)) {
      s.score += 10;
      s.food = spawnFood({ rows: s.rows, cols: s.cols }, s.snake);
    } else {
      s.snake.pop();
    }

    return s;
  }

  if (action.type === "RESET") return createSnakeState({ rows: s.rows, cols: s.cols });

  return s;
}