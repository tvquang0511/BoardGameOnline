import { deepCopy, randomInt } from "../utils";

const COLORS = ["R", "G", "B", "Y", "P"]; // 5 colors

export function createMatch3State({ size = 8 }) {
  const board = Array.from({ length: size * size }, () => COLORS[randomInt(COLORS.length)]);
  return {
    size,
    board,
    cursor: 0,
    selected: null,
    score: 0,
  };
}

function pos(size, i) {
  return { r: Math.floor(i / size), c: i % size };
}

function index(size, r, c) {
  return r * size + c;
}

function neighbors(size, i) {
  const { r, c } = pos(size, i);
  const res = [];
  if (c - 1 >= 0) res.push(index(size, r, c - 1));
  if (c + 1 < size) res.push(index(size, r, c + 1));
  if (r - 1 >= 0) res.push(index(size, r - 1, c));
  if (r + 1 < size) res.push(index(size, r + 1, c));
  return res;
}

function findMatches(board, size) {
  const matched = new Set();

  // rows
  for (let r = 0; r < size; r += 1) {
    let run = 1;
    for (let c = 1; c < size; c += 1) {
      const cur = board[index(size, r, c)];
      const prev = board[index(size, r, c - 1)];
      if (cur && cur === prev) run += 1;
      else {
        if (run >= 3) {
          for (let k = 0; k < run; k += 1) matched.add(index(size, r, c - 1 - k));
        }
        run = 1;
      }
    }
    if (run >= 3) {
      for (let k = 0; k < run; k += 1) matched.add(index(size, r, size - 1 - k));
    }
  }

  // cols
  for (let c = 0; c < size; c += 1) {
    let run = 1;
    for (let r = 1; r < size; r += 1) {
      const cur = board[index(size, r, c)];
      const prev = board[index(size, r - 1, c)];
      if (cur && cur === prev) run += 1;
      else {
        if (run >= 3) {
          for (let k = 0; k < run; k += 1) matched.add(index(size, r - 1 - k, c));
        }
        run = 1;
      }
    }
    if (run >= 3) {
      for (let k = 0; k < run; k += 1) matched.add(index(size, size - 1 - k, c));
    }
  }

  return matched;
}

function collapse(board, size) {
  const b = [...board];
  for (let c = 0; c < size; c += 1) {
    const col = [];
    for (let r = size - 1; r >= 0; r -= 1) {
      const v = b[index(size, r, c)];
      if (v) col.push(v);
    }
    // refill
    for (let r = size - 1; r >= 0; r -= 1) {
      const v = col[size - 1 - r];
      b[index(size, r, c)] = v || COLORS[randomInt(COLORS.length)];
    }
  }
  return b;
}

export function reduceMatch3(state, action) {
  const s = deepCopy(state);

  if (action.type === "MOVE_CURSOR") {
    const dir = action.dir; // -1 or +1 linear
    s.cursor = (s.cursor + dir + s.board.length) % s.board.length;
    return s;
  }

  if (action.type === "ENTER") {
    if (s.selected == null) {
      s.selected = s.cursor;
      return s;
    }

    const a = s.selected;
    const b = s.cursor;
    s.selected = null;

    if (a === b) return s;
    if (!neighbors(s.size, a).includes(b)) return s;

    // swap
    [s.board[a], s.board[b]] = [s.board[b], s.board[a]];

    // resolve matches
    let matched = findMatches(s.board, s.size);
    if (matched.size === 0) {
      // invalid swap -> revert
      [s.board[a], s.board[b]] = [s.board[b], s.board[a]];
      return s;
    }

    while (matched.size > 0) {
      matched.forEach((i) => { s.board[i] = null; });
      s.score += matched.size * 5;
      s.board = collapse(s.board, s.size);
      matched = findMatches(s.board, s.size);
    }

    return s;
  }

  if (action.type === "RESET") return createMatch3State({ size: s.size });

  return s;
}

export function colorToClass(v) {
  if (v === "R") return "bg-red-400";
  if (v === "G") return "bg-green-400";
  if (v === "B") return "bg-blue-400";
  if (v === "Y") return "bg-yellow-400";
  return "bg-purple-400";
}