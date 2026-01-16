import { deepCopy, randInt } from "../utils";

function centerTopLeft(size) {
  const mid = Math.floor(size / 2);
  return { top: mid - 1, left: mid - 1 };
}

function in3(size, r, c) {
  const { top, left } = centerTopLeft(size);
  return r >= top && r < top + 3 && c >= left && c < left + 3;
}

function toIdx(size, r, c) {
  const { top, left } = centerTopLeft(size);
  return (r - top) * 3 + (c - left);
}

function checkWinner(b) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
  for (const [a,b1,c] of lines) if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
  if (b.every(Boolean)) return "DRAW";
  return null;
}

export function createTtt({ boardSize }) {
  return { boardSize, cells: Array.from({ length: 9 }, () => null), winner: null, turn: "HUMAN", score: 0 };
}

export function stepTtt(state, action) {
  const s = deepCopy(state);

  if (action.type === "SELECT") {
    const { r, c } = action;
    if (!in3(s.boardSize, r, c)) return s;
    if (s.winner) return s;
    if (s.turn !== "HUMAN") return s;

    const i = toIdx(s.boardSize, r, c);
    if (s.cells[i]) return s;

    s.cells[i] = "X";
    s.winner = checkWinner(s.cells);
    if (s.winner === "X") {
      const add = s.winScore ?? s.win_score ?? 100;
      s.score += add;
    }

    if (!s.winner) {
      s.turn = "CPU";
      const empties = s.cells.map((v, ii) => (v ? null : ii)).filter((x) => x !== null);
      if (empties.length) {
        const pick = empties[randInt(empties.length)];
        s.cells[pick] = "O";
      }
      s.winner = checkWinner(s.cells);
      if (s.winner === "O") s.score -= 10;
      if (s.winner === "DRAW") s.score += 20;
      s.turn = "HUMAN";
    }
    return s;
  }

  if (action.type === "RESET") return createTtt({ boardSize: s.boardSize });
  return s;
}

export function viewTtt({ state, r, c }) {
  const { top, left } = centerTopLeft(state.boardSize);

  const in5 =
    r >= top - 1 && r <= top + 3 &&
    c >= left - 1 && c <= left + 3;

  const in3x3 = in3(state.boardSize, r, c);

  if (in5 && !in3x3) {
    return { bgClass: "bg-blue-200", text: "" }; // 16 ô xung quanh
  }

  if (in3x3) {
    const i = toIdx(state.boardSize, r, c);
    const v = state.cells[i];
    if (v === "X") return { bgClass: "bg-green-500 text-white", text: "X" };
    if (v === "O") return { bgClass: "bg-red-500 text-white", text: "O" };
    return { bgClass: "bg-background", text: "" };
  }

  return null;
}