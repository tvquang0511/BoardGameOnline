import { deepCopy, randInt } from "../utils";

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
    [0, 1],[1, 0],[1, 1],[1, -1],
  ];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      for (const [dr, dc] of dirs) {
        if (checkWinFrom(board, size, r, c, dr, dc, winLen)) return board[idx(size, r, c)];
      }
    }
  }
  if (board.every(Boolean)) return "DRAW";
  return null;
}

export function createCaro({ boardSize, winLen }) {
  return {
    boardSize,
    winLen,
    board: Array.from({ length: boardSize * boardSize }, () => null), // "X"|"O"|null
    winner: null,
    turn: "HUMAN",
    score: 0,
  };
}

export function stepCaro(state, action) {
  const s = deepCopy(state);

  if (action.type === "SELECT") {
    const { r, c } = action;
    const i = idx(s.boardSize, r, c);
    if (s.winner) return s;
    if (s.turn !== "HUMAN") return s;
    if (s.board[i]) return s;

    s.board[i] = "X";
    s.winner = checkWinner(s.board, s.boardSize, s.winLen);
    if (s.winner === "X") {
      // use configured winScore if present (camelCase or underscore)
      const add = s.winScore ?? s.win_score ?? 100;
      s.score += add;
    }

    if (!s.winner) {
      s.turn = "CPU";
      const empties = s.board.map((v, ii) => (v ? null : ii)).filter((x) => x !== null);
      if (empties.length) {
        const pick = empties[randInt(empties.length)];
        s.board[pick] = "O";
      }
      s.winner = checkWinner(s.board, s.boardSize, s.winLen);
      if (s.winner === "O") s.score -= 10;
      if (s.winner === "DRAW") s.score += 20;
      s.turn = "HUMAN";
    }
    return s;
  }

  if (action.type === "RESET") return createCaro({ boardSize: s.boardSize, winLen: s.winLen });
  return s;
}

export function viewCaro({ state, r, c }) {
  const i = idx(state.boardSize, r, c);
  const v = state.board[i];
  if (v === "X") return { bgClass: "bg-background", text: "X", textClass: "text-sm font-bold text-blue-600" };
  if (v === "O") return { bgClass: "bg-background", text: "O", textClass: "text-sm font-bold text-red-600" };
  return null;
}