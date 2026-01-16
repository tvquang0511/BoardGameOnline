import { deepCopy, randInt, wrap } from "../utils";

function spawnFood(size, snake) {
  const used = new Set(snake.map((p) => `${p.r},${p.c}`));
  for (let tries = 0; tries < 2000; tries += 1) {
    const p = { r: randInt(size), c: randInt(size) };
    if (!used.has(`${p.r},${p.c}`)) return p;
  }
  return { r: 0, c: 0 };
}

export function createSnake({ boardSize }) {
  const mid = Math.floor(boardSize / 2);
  const snake = [
    { r: mid, c: mid },
    { r: mid, c: mid - 1 },
    { r: mid, c: mid - 2 },
  ];
  return { boardSize, snake, dir: "RIGHT", food: spawnFood(boardSize, snake), score: 0, dead: false, paused: false, tickMs: 160 };
}

function step(head, dir, size) {
  let r = head.r, c = head.c;
  if (dir === "UP") r -= 1;
  if (dir === "DOWN") r += 1;
  if (dir === "LEFT") c -= 1;
  if (dir === "RIGHT") c += 1;
  return { r: wrap(r, size), c: wrap(c, size) };
}

export function stepSnake(state, action) {
  const s = deepCopy(state);

  if (action.type === "SET_DIR") {
    const opposite = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
    if (!action.dir) return s;
    if (opposite[action.dir] === s.dir) return s;
    s.dir = action.dir;
    return s;
  }

  if (action.type === "TOGGLE_PAUSE") {
    s.paused = !s.paused;
    return s;
  }

  if (action.type === "TICK") {
    if (s.dead || s.paused) return s;

    const head = s.snake[0];
    const next = step(head, s.dir, s.boardSize);

    if (s.snake.some((p) => p.r === next.r && p.c === next.c)) {
      s.dead = true;
      return s;
    }

    s.snake.unshift(next);

    if (next.r === s.food.r && next.c === s.food.c) {
      // use configured winScore if present, fallback to 10 for compatibility
      const add = s.winScore ?? 10;
      s.score += add;
      s.food = spawnFood(s.boardSize, s.snake);
    } else {
      s.snake.pop();
    }

    return s;
  }

  if (action.type === "RESET") return createSnake({ boardSize: s.boardSize });
  return s;
}

export function viewSnake({ state, r, c }) {
  if (state.food.r === r && state.food.c === c) return { bgClass: "bg-red-500", text: "" };
  for (let i = 0; i < state.snake.length; i += 1) {
    const p = state.snake[i];
    if (p.r === r && p.c === c) return { bgClass: i === 0 ? "bg-green-600" : "bg-green-500", text: "" };
  }
  return null;
}