import Layout from '../../components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function GameSelection({ onLogout }) {
  const navigate = useNavigate();

  const games = [
    { id: 'caro5', name: 'Cờ Caro 5', color: 'from-red-400 to-pink-500', emoji: '⭕' },
    { id: 'caro4', name: 'Cờ Caro 4', color: 'from-blue-400 to-cyan-500', emoji: '🔵' },
    { id: 'tictactoe', name: 'Tic-Tac-Toe', color: 'from-green-400 to-emerald-500', emoji: '❌' },
    { id: 'snake', name: 'Rắn săn mồi', color: 'from-yellow-400 to-orange-500', emoji: '🐍' },
    { id: 'match3', name: 'Ghép hàng 3', color: 'from-purple-400 to-pink-500', emoji: '💎' },
    { id: 'candy', name: 'Candy Rush', color: 'from-pink-400 to-rose-500', emoji: '🍬' },
    { id: 'chess', name: 'Cờ Tí Nhớ', color: 'from-indigo-400 to-purple-500', emoji: '🎴' },
    { id: 'bangve', name: 'Băng Về', color: 'from-teal-400 to-cyan-500', emoji: '🏠' },
    { id: 'sudoku', name: 'Sudoku', color: 'from-orange-400 to-red-500', emoji: '🔢' },
    { id: 'puzzle', name: 'Xếp Hình', color: 'from-cyan-400 to-blue-500', emoji: '🧩' },
    { id: 'tetris', name: 'Tetris', color: 'from-lime-400 to-green-500', emoji: '🟦' },
    { id: 'solitaire', name: 'Solitaire', color: 'from-rose-400 to-red-500', emoji: '🃏' },
  ];

  const handleGameClick = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Chọn Trò Chơi</h1>
          <p className="text-gray-600">Khám phá và chơi các trò chơi board game đa dạng</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {games.map((game) => (
            <Card
              key={game.id}
              className="cursor-pointer transition-all hover:scale-105 hover:shadow-xl"
              onClick={() => handleGameClick(game.id)}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-3xl`}
                >
                  {game.emoji}
                </div>
                <h3 className="font-semibold text-sm">{game.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-none">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">💡 Mẹo chơi game</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Sử dụng phím mũi tên ←↑→↓ hoặc Left/Right để di chuyển</li>
              <li>• Nhấn ENTER để chọn/xác nhận</li>
              <li>• Nhấn Back để quay lại</li>
              <li>• Nhấn Hint/Help để xem gợi ý khi cần</li>
              <li>• Sử dụng Save để lưu tiến trình, Load để tải lại</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}