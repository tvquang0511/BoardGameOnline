import { deepCopy, randInt } from "../utils";

const COLORS = ["R", "G", "B", "Y", "P"];

function idx(size, r, c) {
  return r * size + c;
}

function neighbors(size, r, c) {
  const res = [];
  if (c - 1 >= 0) res.push({ r, c: c - 1 });
  if (c + 1 < size) res.push({ r, c: c + 1 });
  if (r - 1 >= 0) res.push({ r: r - 1, c });
  if (r + 1 < size) res.push({ r: r + 1, c });
  return res;
}

function findMatches(board, size) {
  const matched = new Set();

  // rows
  for (let r = 0; r < size; r += 1) {
    let run = 1;
    for (let c = 1; c < size; c += 1) {
      const cur = board[idx(size, r, c)];
      const prev = board[idx(size, r, c - 1)];
      if (cur && cur === prev) run += 1;
      else {
        if (run >= 3) for (let k = 0; k < run; k += 1) matched.add(idx(size, r, c - 1 - k));
        run = 1;
      }
    }
    if (run >= 3) for (let k = 0; k < run; k += 1) matched.add(idx(size, r, size - 1 - k));
  }

  // cols
  for (let c = 0; c < size; c += 1) {
    let run = 1;
    for (let r = 1; r < size; r += 1) {
      const cur = board[idx(size, r, c)];
      const prev = board[idx(size, r - 1, c)];
      if (cur && cur === prev) run += 1;
      else {
        if (run >= 3) for (let k = 0; k < run; k += 1) matched.add(idx(size, r - 1 - k, c));
        run = 1;
      }
    }
    if (run >= 3) for (let k = 0; k < run; k += 1) matched.add(idx(size, size - 1 - k, c));
  }

  return matched;
}

function collapse(board, size) {
  const b = [...board];
  for (let c = 0; c < size; c += 1) {
    const col = [];
    for (let r = size - 1; r >= 0; r -= 1) {
      const v = b[idx(size, r, c)];
      if (v) col.push(v);
    }
    for (let r = size - 1; r >= 0; r -= 1) {
      const v = col[size - 1 - r];
      b[idx(size, r, c)] = v || COLORS[randInt(COLORS.length)];
    }
  }
  return b;
}

export function createMatch3({ boardSize }) {
  const size = boardSize; // ✅ full board
  const board = Array.from({ length: size * size }, () => COLORS[randInt(COLORS.length)]);
  return { boardSize, size, board, selected: null, score: 0 };
}

export function stepMatch3(state, action) {
  const s = deepCopy(state);

  if (action.type === "SELECT") {
    const { r, c } = action;

    if (!s.selected) {
      s.selected = { r, c };
      return s;
    }

    const a = s.selected;
    const b = { r, c };
    s.selected = null;

    const isAdj = neighbors(s.size, a.r, a.c).some((p) => p.r === b.r && p.c === b.c);
    if (!isAdj) return s;

    const ia = idx(s.size, a.r, a.c);
    const ib = idx(s.size, b.r, b.c);
    [s.board[ia], s.board[ib]] = [s.board[ib], s.board[ia]];

    let matched = findMatches(s.board, s.size);
    if (matched.size === 0) {
      [s.board[ia], s.board[ib]] = [s.board[ib], s.board[ia]];
      return s;
    }

    while (matched.size > 0) {
      matched.forEach((i) => (s.board[i] = null));
      s.score += matched.size * 5;
      s.board = collapse(s.board, s.size);
      matched = findMatches(s.board, s.size);
    }

    return s;
  }

  if (action.type === "RESET") return createMatch3({ boardSize: s.boardSize });
  return s;
}

export function viewMatch3({ state, r, c }) {
  const v = state.board[idx(state.size, r, c)];

  const color =
    v === "R" ? "bg-red-400" :
    v === "G" ? "bg-green-400" :
    v === "B" ? "bg-blue-400" :
    v === "Y" ? "bg-yellow-400" :
    "bg-purple-400";

  const ring = state.selected && state.selected.r === r && state.selected.c === c;
  return { bgClass: color, text: "", ring, title: v };
}