import { deepCopy, randInt } from "../utils";

function shuffle(a) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const EMOJIS = [
  "🍎",
  "🍌",
  "🍇",
  "🍒",
  "🍓",
  "🍍",
  "🥝",
  "🍉",
  "🍑",
  "🥥",
  "🥑",
  "🍋",
  "🥕",
  "🍪",
  "🍩",
  "🍿",
  "🍫",
  "🧁",
  "🍰",
];

export function createMemory({ boardSize }) {
  const size = 4;
  const total = size * size;

  const pairs = total / 2;
  const base = Array.from({ length: pairs }, (_, i) => i);
  const ids = shuffle([...base, ...base]);

  const deck = ids.map((id) => ({
    id,
    revealed: false,
    matched: false,
  }));

  return {
    boardSize,
    size,
    deck,
    opened: [],
    lock: false,
    score: 0,
    done: false,
  };
}

export function stepMemory(state, action) {
  const s = deepCopy(state);

  if (action.type === "TICK") {
    if (!s.lock) return s;
    if (s.opened.length !== 2) {
      s.lock = false;
      s.opened = [];
      return s;
    }
    const [a, b] = s.opened;
    // close if not matched
    if (!s.deck[a].matched) s.deck[a].revealed = false;
    if (!s.deck[b].matched) s.deck[b].revealed = false;
    s.opened = [];
    s.lock = false;
    return s;
  }

  if (action.type === "SELECT") {
    if (s.done) return s;
    if (s.lock) return s;

    const start = Math.floor((s.boardSize - s.size) / 2);
    const rr = action.r - start;
    const cc = action.c - start;
    if (rr < 0 || cc < 0 || rr >= s.size || cc >= s.size) return s;

    const i = rr * s.size + cc;
    const card = s.deck[i];
    if (card.matched || card.revealed) return s;

    card.revealed = true;
    s.opened.push(i);

    if (s.opened.length === 2) {
      const [x, y] = s.opened;
      const a = s.deck[x];
      const b = s.deck[y];

      const isMatch = a.id === b.id;

      if (isMatch) {
        a.matched = true;
        b.matched = true;
        s.score += 20;
        s.opened = [];
        s.lock = false;

        const allMatched = s.deck.every((c) => c.matched);
        if (allMatched) {
          s.done = true;
          // award configured win_score on complete
          s.score += (s.winScore ?? s.win_score ?? 0);
        }
      } else {
        s.lock = true;
      }
    }

    return s;
  }

  if (action.type === "RESET") return createMemory({ boardSize: s.boardSize });
  return s;
}

export function viewMemory({ state, r, c }) {
  const start = Math.floor((state.boardSize - state.size) / 2);
  const rr = r - start;
  const cc = c - start;
  if (rr < 0 || cc < 0 || rr >= state.size || cc >= state.size) return null;

  const i = rr * state.size + cc;
  const card = state.deck[i];

  let face = "❓";
  if (card.matched || card.revealed) {
    face = EMOJIS[card.id % EMOJIS.length];
  }

  const bg = card.matched ? "bg-muted text-muted-foreground" : "bg-background";
  return { bgClass: bg, text: face, textClass: "text-base" };
}