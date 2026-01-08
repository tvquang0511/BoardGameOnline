import { deepCopy, shuffle } from "../utils";

export function createMemoryState({ size = 4 }) {
  // size x size, must be even number of cells
  const total = size * size;
  const pairs = total / 2;
  const base = Array.from({ length: pairs }, (_, i) => i);
  const deck = shuffle([...base, ...base]).map((id) => ({
    id,
    revealed: false,
    matched: false,
  }));

  return {
    size,
    deck,
    cursor: 0,
    opened: [], // indexes
    lock: false,
    score: 0,
    moves: 0,
  };
}

export function reduceMemory(state, action) {
  const s = deepCopy(state);

  if (action.type === "MOVE_CURSOR") {
    const dir = action.dir;
    s.cursor = (s.cursor + dir + s.deck.length) % s.deck.length;
    return s;
  }

  if (action.type === "ENTER") {
    if (s.lock) return s;
    const i = s.cursor;
    const card = s.deck[i];
    if (card.matched || card.revealed) return s;

    card.revealed = true;
    s.opened.push(i);

    if (s.opened.length === 2) {
      s.moves += 1;
      const [a, b] = s.opened;
      if (s.deck[a].id === s.deck[b].id) {
        s.deck[a].matched = true;
        s.deck[b].matched = true;
        s.score += 20;
        s.opened = [];
      } else {
        s.lock = true;
      }
    }

    return s;
  }

  if (action.type === "TICK") {
    // used to close unmatched pair after delay
    if (!s.lock) return s;
    if (s.opened.length !== 2) {
      s.lock = false;
      s.opened = [];
      return s;
    }
    const [a, b] = s.opened;
    s.deck[a].revealed = false;
    s.deck[b].revealed = false;
    s.opened = [];
    s.lock = false;
    return s;
  }

  if (action.type === "RESET") return createMemoryState({ size: s.size });

  return s;
}

export function idToEmoji(id) {
  const emojis = ["🍎","🍌","🍇","🍒","🍓","🍍","🥝","🍉","🍑","🥥","🥑","🍋","🥕","🍪","🍩","🍿"];
  return emojis[id % emojis.length];
}