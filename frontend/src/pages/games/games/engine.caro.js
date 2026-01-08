import { deepCopy, randomInt } from "../utils";

export function createCaroState({ size, winLen }) {
  return {
    size,
    winLen,
    board: Array.from({ length: size * size }, () => null), // "X"|"O"|null
    cursor: 0,
    turn: "HUMAN",
    winner: null, // "X"|"O"|"DRAW"|null
    score: 0,
    moves: 0,
  };
}

function idx(size, r, c) {
  return r * size + c;
}

function inBounds(size, r, c) {
  return r >= 0 && c >= 0 && r < size && c < size;
}

function checkWinFrom(board, size, r, c, dr, dc, len) {
  const v = board[idx(size, r, c)];
  if (!v) return false;
  for (let k = 1; k < len; k += 1) {
    const rr = r + dr * k;
    const cc = c + dc * k;
    if (!inBounds(size, rr, cc)) return false;
    if (board[idx(size, rr, cc)] !== v) return false;
  }
  return true;
}

function checkWinner(board, size, winLen) {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      for (const [dr, dc] of dirs) {
        if (checkWinFrom(board, size, r, c, dr, dc, winLen)) {
          return board[idx(size, r, c)];
        }
      }
    }
  }

  if (board.every(Boolean)) return "DRAW";
  return null;
}

export function reduceCaro(state, action) {
  const s = deepCopy(state);

  if (action.type === "MOVE_CURSOR") {
    const dir = action.dir; // -1 or +1 linear
    s.cursor = (s.cursor + dir + s.board.length) % s.board.length;
    return s;
  }

  if (action.type === "ENTER") {
    if (s.winner) return s;
    if (s.turn !== "HUMAN") return s;
    if (s.board[s.cursor]) return s;

    s.board[s.cursor] = "X";
    s.moves += 1;

    s.winner = checkWinner(s.board, s.size, s.winLen);
    if (s.winner) {
      if (s.winner === "X") s.score += 200;
      if (s.winner === "DRAW") s.score += 30;
      return s;
    }

    // CPU: random empty
    s.turn = "CPU";
    const empties = s.board.map((v, i) => (v ? null : i)).filter((x) => x !== null);
    if (empties.length) {
      const cpuIdx = empties[randomInt(empties.length)];
      s.board[cpuIdx] = "O";
      s.moves += 1;
      s.winner = checkWinner(s.board, s.size, s.winLen);
      if (s.winner === "O") s.score -= 20;
      if (s.winner === "DRAW") s.score += 30;
    }
    s.turn = "HUMAN";
    return s;
  }

  if (action.type === "RESET") return createCaroState({ size: s.size, winLen: s.winLen });

  return s;
}