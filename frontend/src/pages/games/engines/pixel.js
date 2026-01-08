import { deepCopy } from "../utils";

export const PIXEL_COLORS = [
  { id: "blue", name: "Blue", bg: "bg-blue-500" },
  { id: "red", name: "Red", bg: "bg-red-500" },
  { id: "green", name: "Green", bg: "bg-green-500" },
  { id: "yellow", name: "Yellow", bg: "bg-yellow-400" },
  { id: "purple", name: "Purple", bg: "bg-purple-500" },
  { id: "pink", name: "Pink", bg: "bg-pink-500" },
  { id: "orange", name: "Orange", bg: "bg-orange-500" },
  { id: "cyan", name: "Cyan", bg: "bg-cyan-500" },
  { id: "lime", name: "Lime", bg: "bg-lime-500" },
  { id: "indigo", name: "Indigo", bg: "bg-indigo-500" },
  { id: "black", name: "Black", bg: "bg-black" },
  { id: "white", name: "White", bg: "bg-white border" },
];

function idx(size, r, c) {
  return r * size + c;
}

export function createPixel({ boardSize }) {
  return {
    boardSize,
    pixels: Array.from({ length: boardSize * boardSize }, () => null), // color id
    colorId: "blue",
    score: 0,
  };
}

export function stepPixel(state, action) {
  const s = deepCopy(state);

  if (action.type === "SET_COLOR") {
    s.colorId = action.colorId;
    return s;
  }

  if (action.type === "SELECT") {
    const i = idx(s.boardSize, action.r, action.c);
    s.pixels[i] = s.colorId;
    s.score += 1;
    return s;
  }

  if (action.type === "RESET") return createPixel({ boardSize: s.boardSize });
  return s;
}

export function viewPixel({ state, r, c }) {
  const i = idx(state.boardSize, r, c);
  const colorId = state.pixels[i];
  if (!colorId) return null;
  const p = PIXEL_COLORS.find((x) => x.id === colorId);
  if (!p) return null;
  return { bgClass: p.bg, text: "" };
}