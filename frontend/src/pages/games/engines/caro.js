import { deepCopy, randInt } from "../utils";

const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

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
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      for (const [dr, dc] of DIRS) {
        if (checkWinFrom(board, size, r, c, dr, dc, winLen))
          return board[idx(size, r, c)];
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
    board: Array.from({ length: boardSize * boardSize }, () => null),
    winner: null,
    turn: "HUMAN",
    score: 0,
    aiLevel: "medium",
    useApiAI: false, // can be set by UI/state to enable remote AI
  };
}

/* ---------- helpers ---------- */
function getEmptyIndices(board) {
  const out = [];
  for (let i = 0; i < board.length; i += 1) if (!board[i]) out.push(i);
  return out;
}
function wouldWinAfterMove(board, size, winLen, idxPos, player) {
  board[idxPos] = player;
  const res = checkWinner(board, size, winLen) === player;
  board[idxPos] = null;
  return res;
}
function maxRunAfter(board, size, winLen, idxPos, player) {
  board[idxPos] = player;
  const r = Math.floor(idxPos / size);
  const c = idxPos % size;
  let best = 0;
  for (const [dr, dc] of DIRS) {
    let run = 1;
    for (let k = 1; k < winLen; k += 1) {
      const rr = r + dr * k;
      const cc = c + dc * k;
      if (!inBounds(size, rr, cc)) break;
      if (board[idx(size, rr, cc)] === player) run += 1;
      else break;
    }
    for (let k = 1; k < winLen; k += 1) {
      const rr = r - dr * k;
      const cc = c - dc * k;
      if (!inBounds(size, rr, cc)) break;
      if (board[idx(size, rr, cc)] === player) run += 1;
      else break;
    }
    if (run > best) best = run;
  }
  board[idxPos] = null;
  return best;
}
function chooseRandom(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// count how many immediate winning moves player has on current board
function countImmediateWins(board, size, winLen, player) {
  const empties = getEmptyIndices(board);
  let count = 0;
  for (let i = 0; i < empties.length; i += 1) {
    if (wouldWinAfterMove(board, size, winLen, empties[i], player)) {
      count += 1;
      if (count >= 2) return count; // we only need to know >=2 often
    }
  }
  return count;
}

// detect if placing at idxPos creates a "double threat" (fork) for player
function createsDoubleThreat(board, size, winLen, idxPos, player) {
  board[idxPos] = player;
  const cnt = countImmediateWins(board, size, winLen, player);
  board[idxPos] = null;
  return cnt >= 2;
}

// adaptive candidate generation (fast & tight), tuned by winLen and board size
function generateCandidateMoves(board, size, winLen, opts = {}) {
  // tune defaults based on winLen and board size
  const radiusDefault = winLen <= 4 ? 2 : 2;
  const maxCandidatesDefault = winLen <= 4 ? 26 : 36;
  const radius = opts.radius ?? radiusDefault;
  const maxCandidates = opts.maxCandidates ?? maxCandidatesDefault;

  const occupied = [];
  for (let i = 0; i < board.length; i += 1) if (board[i]) occupied.push(i);
  if (occupied.length === 0) {
    const mid = Math.floor(size / 2);
    return [idx(size, mid, mid)];
  }
  const cand = new Set();
  for (const p of occupied) {
    const r = Math.floor(p / size),
      c = p % size;
    for (let dr = -radius; dr <= radius; dr += 1) {
      for (let dc = -radius; dc <= radius; dc += 1) {
        const rr = r + dr,
          cc = c + dc;
        if (!inBounds(size, rr, cc)) continue;
        const ii = idx(size, rr, cc);
        if (!board[ii]) cand.add(ii);
      }
    }
  }
  const arr = Array.from(cand);
  if (arr.length <= maxCandidates) return arr;
  // prune by adjacency score (prefer moves near chains)
  arr.sort((a, b) => {
    const sa = adjScore(board, size, a, "O") + adjScore(board, size, a, "X");
    const sb = adjScore(board, size, b, "O") + adjScore(board, size, b, "X");
    return sb - sa;
  });
  return arr.slice(0, maxCandidates);
}
function adjScore(board, size, idxPos, player) {
  const r = Math.floor(idxPos / size);
  const c = idxPos % size;
  let score = 0;
  for (const [dr, dc] of DIRS) {
    for (let k = 1; k <= 2; k += 1) {
      const rr = r + dr * k,
        cc = c + dc * k;
      if (!inBounds(size, rr, cc)) break;
      if (board[idx(size, rr, cc)] === player) score += 1 / k;
    }
    for (let k = 1; k <= 2; k += 1) {
      const rr = r - dr * k,
        cc = c - dc * k;
      if (!inBounds(size, rr, cc)) break;
      if (board[idx(size, rr, cc)] === player) score += 1 / k;
    }
  }
  return score;
}

/* ---------- fast heuristic evaluation (tunable) ---------- */
function evaluateBoardFast(board, size, winLen) {
  // positive -> good for AI 'O', negative -> good for Human 'X'
  const AI = "O",
    HUMAN = "X";
  let score = 0;
  // base weights; for winLen=4 we want more emphasis on short runs (tighter)
  const baseFactor = winLen <= 4 ? 1.0 : 1.0;
  const weights = [
    0 * baseFactor,
    8 * baseFactor,
    80 * baseFactor,
    800 * baseFactor,
    8000 * baseFactor,
    80000 * baseFactor,
    800000 * baseFactor,
  ];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const i = idx(size, r, c);
      const v = board[i];
      if (!v) continue;
      for (const [dr, dc] of DIRS) {
        // only start at segment start
        const br = r - dr,
          bc = c - dc;
        if (inBounds(size, br, bc) && board[idx(size, br, bc)] === v) continue;
        let run = 0,
          k = 0;
        while (true) {
          const rr = r + dr * k,
            cc = c + dc * k;
          if (!inBounds(size, rr, cc)) break;
          const vv = board[idx(size, rr, cc)];
          if (vv === v) {
            run += 1;
            k += 1;
          } else break;
        }
        if (run <= 0) continue;
        // count open ends
        let open = 0;
        const afterR = r + dr * run,
          afterC = c + dc * run;
        if (inBounds(size, afterR, afterC) && !board[idx(size, afterR, afterC)])
          open += 1;
        if (inBounds(size, r - dr, c - dc) && !board[idx(size, r - dr, c - dc)])
          open += 1;
        const w =
          weights[Math.min(run, weights.length - 1)] *
          (open === 2 ? 2 : open === 1 ? 1 : 0.2);
        score += (v === AI ? 1 : -1) * w;
      }
    }
  }
  return score;
}

/* ---------- alpha-beta minimax with time cutoff ---------- */
function minimaxAB(
  board,
  size,
  winLen,
  depth,
  alpha,
  beta,
  maximizing,
  startTime,
  timeLimitMs
) {
  const AI = "O",
    HUMAN = "X";
  const winner = checkWinner(board, size, winLen);
  if (winner === AI) return { score: 1e9 };
  if (winner === HUMAN) return { score: -1e9 };
  if (winner === "DRAW") return { score: 0 };

  if (Date.now() - startTime > timeLimitMs) {
    return { score: evaluateBoardFast(board, size, winLen) };
  }
  if (depth <= 0) {
    return { score: evaluateBoardFast(board, size, winLen) };
  }

  const candidates = generateCandidateMoves(board, size, winLen, {
    radius: 2,
    maxCandidates: Math.max(18, Math.min(40, Math.floor((size * size) / 8))),
  });
  if (!candidates.length)
    return { score: evaluateBoardFast(board, size, winLen) };

  // order moves by immediate heuristic
  candidates.sort((a, b) => {
    const sa = Math.abs(evaluateMoveHeuristic(board, size, winLen, a, AI));
    const sb = Math.abs(evaluateMoveHeuristic(board, size, winLen, b, AI));
    return sb - sa;
  });

  let bestMove = null;
  if (maximizing) {
    let value = -Infinity;
    for (let i = 0; i < candidates.length; i += 1) {
      const m = candidates[i];
      board[m] = AI;
      const res = minimaxAB(
        board,
        size,
        winLen,
        depth - 1,
        alpha,
        beta,
        false,
        startTime,
        timeLimitMs
      );
      board[m] = null;
      const sc = res.score;
      if (sc > value) {
        value = sc;
        bestMove = m;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
      if (value >= 1e8) break;
    }
    return { score: value, move: bestMove };
  } else {
    let value = Infinity;
    for (let i = 0; i < candidates.length; i += 1) {
      const m = candidates[i];
      board[m] = HUMAN;
      const res = minimaxAB(
        board,
        size,
        winLen,
        depth - 1,
        alpha,
        beta,
        true,
        startTime,
        timeLimitMs
      );
      board[m] = null;
      const sc = res.score;
      if (sc < value) {
        value = sc;
        bestMove = m;
      }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
      if (value <= -1e8) break;
    }
    return { score: value, move: bestMove };
  }
}
function evaluateMoveHeuristic(board, size, winLen, m, player) {
  board[m] = player;
  const sc = evaluateBoardFast(board, size, winLen);
  board[m] = null;
  return sc;
}

/* ---------- localPick: fastest & smart fallback (with winLen-specific tuning) ---------- */
function localPick(board, size, winLen, level = "medium") {
  const empties = getEmptyIndices(board);
  if (!empties.length) return null;
  const AI = "O",
    HUMAN = "X";

  // immediate win/block
  for (let i = 0; i < empties.length; i += 1) {
    const pos = empties[i];
    if (wouldWinAfterMove(board, size, winLen, pos, AI)) return pos;
  }
  for (let i = 0; i < empties.length; i += 1) {
    const pos = empties[i];
    if (wouldWinAfterMove(board, size, winLen, pos, HUMAN)) return pos;
  }

  // candidate tuning
  const occupiedCount = board.length - empties.length;
  const radius = occupiedCount <= 6 ? 3 : 2;
  const maxCandidates =
    level === "hard"
      ? winLen <= 4
        ? 36
        : 40
      : level === "medium"
      ? winLen <= 4
        ? 28
        : 30
      : 18;
  const candidates = generateCandidateMoves(board, size, winLen, {
    radius,
    maxCandidates,
  });
  if (!candidates.length) return chooseRandom(empties);

  // If any candidate creates an immediate double threat (fork), pick it (very strong)
  for (let i = 0; i < candidates.length; i += 1) {
    const m = candidates[i];
    if (createsDoubleThreat(board, size, winLen, m, AI)) return m;
  }

  // EASY: bias to extend own runs but mostly random (very fast)
  if (level === "easy") {
    const ext = [];
    for (let i = 0; i < candidates.length; i += 1) {
      const m = candidates[i];
      if (maxRunAfter(board, size, winLen, m, AI) > 1) ext.push(m);
    }
    if (ext.length && Math.random() < 0.75) return chooseRandom(ext);
    // small bias to center
    candidates.sort((a, b) => {
      const ca =
        Math.abs(Math.floor(a / size) - Math.floor(size / 2)) +
        Math.abs((a % size) - Math.floor(size / 2));
      const cb =
        Math.abs(Math.floor(b / size) - Math.floor(size / 2)) +
        Math.abs((b % size) - Math.floor(size / 2));
      return ca - cb;
    });
    return chooseRandom(candidates.slice(0, Math.min(6, candidates.length)));
  }

  // MEDIUM: if winLen small, increase lookahead a bit; test for opponent forks too
  if (level === "medium") {
    let best = -Infinity;
    let bestMoves = [];
    const start = Date.now();
    const timeLimitMs = winLen <= 4 ? 220 : 140;
    const depth = winLen <= 4 ? 3 : 2; // deeper for 4-in-row
    for (let i = 0; i < candidates.length; i += 1) {
      const m = candidates[i];
      board[m] = AI;
      // immediate check for opponent fork after this move
      const oppFork = (() => {
        const oppEmpties = getEmptyIndices(board);
        for (let j = 0; j < oppEmpties.length; j += 1) {
          const o = oppEmpties[j];
          if (createsDoubleThreat(board, size, winLen, o, HUMAN)) {
            return true;
          }
        }
        return false;
      })();
      // quick minimax shallow
      const res = minimaxAB(
        board,
        size,
        winLen,
        depth - 1,
        -Infinity,
        Infinity,
        false,
        start,
        timeLimitMs
      );
      board[m] = null;
      const sc = res.score + (oppFork ? -1e6 : 0); // penalize if opponent gets fork
      if (sc > best) {
        best = sc;
        bestMoves = [m];
      } else if (sc === best) bestMoves.push(m);
      if (Date.now() - start > timeLimitMs) break;
    }
    if (bestMoves.length) return chooseRandom(bestMoves);
    return chooseRandom(candidates);
  }

  // HARD: iterative deepening alpha-beta with strict time limit, tuned by winLen
  if (level === "hard") {
    const TIME_LIMIT_MS = winLen <= 4 ? 600 : 900; // smaller boards -> faster useful deeper search
    const start = Date.now();
    let bestGlobal = null;
    // move ordering: evaluate single-move heuristic then try deeper
    candidates.sort((a, b) => {
      const sa = Math.abs(evaluateMoveHeuristic(board, size, winLen, a, AI));
      const sb = Math.abs(evaluateMoveHeuristic(board, size, winLen, b, AI));
      return sb - sa;
    });
    // Iterative deepening with depth cap dynamic
    const depthCap = winLen <= 4 ? 6 : 5;
    for (let depth = 1; depth <= depthCap; depth += 1) {
      if (Date.now() - start > TIME_LIMIT_MS) break;
      const res = minimaxAB(
        board,
        size,
        winLen,
        depth,
        -Infinity,
        Infinity,
        true,
        start,
        TIME_LIMIT_MS
      );
      if (Date.now() - start > TIME_LIMIT_MS) break;
      if (res && typeof res.move !== "undefined" && res.move !== null)
        bestGlobal = res.move;
      if (res && res.score >= 1e8) break; // winning move found
    }
    if (bestGlobal !== null) return bestGlobal;
    // fallback: medium style pick
    return localPick(board, size, winLen, "medium");
  }

  // default fallback
  return chooseRandom(candidates);
}

/* ---------- step logic (unchanged interface) ---------- */
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
      const add = s.winScore ?? s.win_score ?? 100;
      s.score += add;
    }

    if (!s.winner) {
      s.turn = "CPU";
    }
    return s;
  }

  if (action.type === "CPU_MOVE") {
    // action.index may be null -> use local fallback
    const index = action.index;
    const AI = "O";
    const empties = getEmptyIndices(s.board);
    let pick = null;
    if (index !== undefined && index !== null) {
      if (s.board[index] == null) pick = index;
    }
    if (pick === null) {
      const level = s.aiLevel ?? s.ai_level ?? "medium";
      pick = localPick(s.board, s.boardSize, s.winLen, level);
    }
    if (pick === null || s.board[pick]) {
      const empt = s.board
        .map((v, ii) => (v ? null : ii))
        .filter((x) => x !== null);
      if (empt.length === 0) return s;
      pick = empt[Math.floor(Math.random() * empt.length)];
    }

    s.board[pick] = AI;
    s.winner = checkWinner(s.board, s.boardSize, s.winLen);
    if (s.winner === "O") s.score -= 10;
    if (s.winner === "DRAW") s.score += 20;
    s.turn = "HUMAN";
    return s;
  }

  if (action.type === "RESET") {
    const ns = createCaro({ boardSize: s.boardSize, winLen: s.winLen });
    ns.aiLevel = s.aiLevel ?? s.ai_level ?? "medium";
    ns.winScore = s.winScore ?? s.win_score ?? ns.winScore;
    ns.timeLimitSeconds =
      s.timeLimitSeconds ?? s.time_limit_seconds ?? ns.timeLimitSeconds;
    ns.useApiAI = s.useApiAI ?? false;
    return ns;
  }

  return s;
}

export function viewCaro({ state, r, c }) {
  const i = idx(state.boardSize, r, c);
  const v = state.board[i];
  if (v === "X")
    return {
      bgClass: "bg-background",
      text: "X",
      textClass: "text-sm font-bold text-blue-600",
    };
  if (v === "O")
    return {
      bgClass: "bg-background",
      text: "O",
      textClass: "text-sm font-bold text-red-600",
    };
  return null;
}
