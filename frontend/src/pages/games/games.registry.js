export const GAMES = [
  {
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    description: "3x3 - chơi với máy (random hợp lệ).",
    emoji: "❌",
    gradient: "from-green-400 to-emerald-500",
    kind: "board",
  },
  {
    id: "caro4",
    name: "Caro 4 hàng",
    description: "Bàn 10x10 - mục tiêu 4 liên tiếp.",
    emoji: "🔵",
    gradient: "from-blue-400 to-cyan-500",
    kind: "board",
  },
  {
    id: "caro5",
    name: "Caro 5 hàng",
    description: "Bàn 15x15 - mục tiêu 5 liên tiếp.",
    emoji: "⭕",
    gradient: "from-red-400 to-pink-500",
    kind: "board",
  },
  {
    id: "snake",
    name: "Rắn săn mồi",
    description: "Điều khiển rắn ăn mồi, tính điểm theo mồi.",
    emoji: "🐍",
    gradient: "from-yellow-400 to-orange-500",
    kind: "grid",
  },
  {
    id: "match3",
    name: "Ghép hàng 3",
    description: "Đổi chỗ kề nhau để tạo 3+ viên cùng màu.",
    emoji: "💎",
    gradient: "from-purple-400 to-pink-500",
    kind: "grid",
  },
  {
    id: "memory",
    name: "Trí nhớ",
    description: "Lật 2 ô - nếu giống nhau thì giữ lại.",
    emoji: "🧠",
    gradient: "from-indigo-400 to-violet-500",
    kind: "grid",
  },
  {
    id: "draw",
    name: "Bảng vẽ tự do",
    description: "Canvas vẽ tự do, có Clear/Undo.",
    emoji: "🖊️",
    gradient: "from-sky-400 to-blue-600",
    kind: "canvas",
  },
];

export function getGameById(id) {
  return GAMES.find((g) => g.id === id);
}