export const GAME_CONFIGS = [
  {
    id: "caro4",
    name: "Caro 4 hàng",
    selectColorBg: "bg-red-300",
    legendGradient: "from-red-400 to-pink-500",
    emoji: "🔴",
  },
  {
    id: "caro5",
    name: "Caro 5 hàng",
    selectColorBg: "bg-blue-300",
    legendGradient: "from-blue-400 to-cyan-500",
    emoji: "🔵",
  },
  {
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    selectColorBg: "bg-sky-300",
    legendGradient: "from-sky-400 to-blue-500",
    emoji: "❎",
  },
  {
    id: "snake",
    name: "Rắn săn mồi",
    selectColorBg: "bg-yellow-300",
    legendGradient: "from-yellow-400 to-orange-500",
    emoji: "🐍",
  },
  {
    id: "match3",
    name: "Ghép hàng 3",
    selectColorBg: "bg-purple-300",
    legendGradient: "from-purple-400 to-pink-500",
    emoji: "💎",
  },
  {
    id: "memory",
    name: "Trí nhớ",
    selectColorBg: "bg-indigo-300",
    legendGradient: "from-indigo-400 to-violet-500",
    emoji: "🧠",
  },
  {
    id: "pixel",
    name: "Bảng vẽ pixel",
    selectColorBg: "bg-emerald-300",
    legendGradient: "from-emerald-400 to-green-600",
    emoji: "🟩",
  },
];

export function getGameConfig(id) {
  return GAME_CONFIGS.find((g) => g.id === id);
}