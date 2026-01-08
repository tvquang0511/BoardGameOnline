import { deepCopy, randomInt } from "../utils";

export function createTicTacToeState() {
  return {
    size: 3,
    board: Array.from({ length: 9 }, () => null), // "X" | "O" | null
    cursor: 0,
    turn: "HUMAN", // HUMAN then CPU
    winner: null, // "X"|"O"|"DRAW"|null
    score: 0,
    moves: 0,
  };
}

function lines3() {
  return [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];
}

function checkWinner(board) {
  for (const [a,b,c] of lines3()) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(Boolean)) return "DRAW";
  return null;
}

export function reduceTicTacToe(state, action) {
  const s = deepCopy(state);

  if (action.type === "MOVE_CURSOR") {
    const dir = action.dir; // -1 or +1
    s.cursor = (s.cursor + dir + s.board.length) % s.board.length;
    return s;
  }

  if (action.type === "ENTER") {
    if (s.winner) return s;
    if (s.turn !== "HUMAN") return s;
    if (s.board[s.cursor]) return s;

    s.board[s.cursor] = "X";
    s.moves += 1;
    s.winner = checkWinner(s.board);
    if (s.winner) {
      if (s.winner === "X") s.score += 100;
      return s;
    }

    // CPU move: random empty
    s.turn = "CPU";
    const empties = s.board.map((v, i) => (v ? null : i)).filter((x) => x !== null);
    if (empties.length) {
      const idx = empties[randomInt(empties.length)];
      s.board[idx] = "O";
      s.moves += 1;
      s.winner = checkWinner(s.board);
      if (s.winner === "O") s.score -= 10;
      if (s.winner === "DRAW") s.score += 20;
    }
    s.turn = "HUMAN";
    return s;
  }

  if (action.type === "RESET") return createTicTacToeState();

  return s;
}