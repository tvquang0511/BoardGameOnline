import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { gamesApi } from '../../api/games.api';

const FALLBACK_STYLE_BY_SLUG = {
  caro5: { color: 'from-red-400 to-pink-500', emoji: '⭕' },
  caro4: { color: 'from-blue-400 to-cyan-500', emoji: '🔵' },
  tictactoe: { color: 'from-green-400 to-emerald-500', emoji: '❌' },
  snake: { color: 'from-yellow-400 to-orange-500', emoji: '🐍' },
  match3: { color: 'from-purple-400 to-pink-500', emoji: '💎' },
  candy: { color: 'from-pink-400 to-rose-500', emoji: '🍬' },
  sudoku: { color: 'from-orange-400 to-red-500', emoji: '🔢' },
};

export default function GameSelection({ onLogout }) {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await gamesApi.list({ all: false });
        if (!mounted) return;
        setGames(data.games || []);
      } catch (e) {
        // TODO(API): nếu cần fallback mock list game khi backend lỗi
        setGames([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const view = useMemo(() => {
    return (games || []).map((g) => {
      const fb = FALLBACK_STYLE_BY_SLUG[g.slug] || { color: 'from-gray-400 to-gray-500', emoji: '🎮' };
      return {
        id: g.slug,
        name: g.name,
        color: fb.color, // TODO(API MISSING): backend chưa có color
        emoji: fb.emoji, // TODO(API MISSING): backend chưa có emoji
      };
    });
  }, [games]);

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
          {view.map((game) => (
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