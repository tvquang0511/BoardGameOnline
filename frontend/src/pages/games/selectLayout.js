import { GAME_CONFIGS } from "./games.config";

/**
 * 7 ô select trên 1 hàng, căn giữa.
 * Mỗi game = 1 cell.
 */
export function buildSelectCells(size) {
  const startR = 1;
  const gap = 1; // cách nhau 1 ô
  const totalW = GAME_CONFIGS.length + (GAME_CONFIGS.length - 1) * gap;
  const startC = Math.max(0, Math.floor((size - totalW) / 2));

  return GAME_CONFIGS.map((g, idx) => ({
    gameId: g.id,
    r: startR,
    c: startC + idx * (1 + gap),
  }));
}

export function findSelectCell(selectCells, r, c) {
  return selectCells.find((x) => x.r === r && x.c === c);
}