import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCcw, Save, FolderOpen, Lightbulb } from 'lucide-react';

export default function GamePlay({ onLogout }) {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);

  const gameNames = {
    caro5: 'Cờ Caro 5',
    caro4: 'Cờ Caro 4',
    tictactoe: 'Tic-Tac-Toe',
    snake: 'Rắn săn mồi',
    match3: 'Ghép hàng 3',
    candy: 'Candy Rush',
    chess: 'Cờ Tí Nhớ',
    bangve: 'Băng Về',
    sudoku: 'Sudoku',
    puzzle: 'Xếp Hình',
    tetris: 'Tetris',
    solitaire: 'Solitaire',
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderGameBoard = () => {
    if (gameId === 'tictactoe' || gameId === 'caro5' || gameId === 'caro4') {
      const size = gameId === 'tictactoe' ? 3 : gameId === 'caro4' ? 10 : 15;
      return (
        <div className="flex items-center justify-center p-8">
          <div
            className="grid gap-1 bg-gray-800 p-2 rounded-lg"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: size * size }).map((_, index) => (
              <div
                key={index}
                className="w-8 h-8 bg-white hover:bg-blue-100 cursor-pointer rounded flex items-center justify-center text-lg font-bold border border-gray-300"
                onClick={() => setScore((prev) => prev + 10)}
              >
                {Math.random() > 0.9 ? (Math.random() > 0.5 ? '⭕' : '❌') : ''}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (gameId === 'snake') {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md aspect-square bg-gray-900 rounded-lg p-4 grid grid-cols-20 gap-0.5">
            {Array.from({ length: 400 }).map((_, index) => (
              <div
                key={index}
                className={`w-full aspect-square rounded-sm ${
                  index % 20 < 3 ? 'bg-green-500' : index === 157 ? 'bg-red-500' : 'bg-gray-800'
                }`}
              />
            ))}
          </div>
        </div>
      );
    }

    if (gameId === 'match3' || gameId === 'candy') {
      const colors = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400'];
      return (
        <div className="flex items-center justify-center p-8">
          <div className="grid grid-cols-8 gap-2 bg-gray-800 p-4 rounded-lg">
            {Array.from({ length: 64 }).map((_, index) => (
              <div
                key={index}
                className={`w-12 h-12 ${colors[Math.floor(Math.random() * colors.length)]} rounded-lg cursor-pointer hover:scale-110 transition-transform`}
                onClick={() => setScore((prev) => prev + 5)}
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center space-y-4">
          <div className="text-6xl">🎮</div>
          <p className="text-gray-600">Màn hình game đang được phát triển...</p>
        </div>
      </div>
    );
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              className="mb-4"
              onClick={() => navigate('/games')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <h1 className="text-4xl font-bold">{gameNames[gameId || ''] || 'Trò chơi'}</h1>
          </div>
          <div className="flex gap-6 text-center">
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600">Điểm</p>
              <p className="text-3xl font-bold text-blue-600">{score}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600">Thời gian</p>
              <p className="text-3xl font-bold text-purple-600">{formatTime(time)}</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Bàn chơi</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Save className="w-4 h-4 mr-2" />
                  Lưu
                </Button>
                <Button size="sm" variant="outline">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Tải
                </Button>
                <Button size="sm" variant="outline">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Gợi ý
                </Button>
                <Button size="sm" variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Chơi lại
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderGameBoard()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Điều khiển</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-center">
              <div className="flex flex-col items-center gap-2">
                <Button size="lg" variant="outline" className="w-16 h-16">
                  <ArrowUp className="w-6 h-6" />
                </Button>
                <div className="flex gap-2">
                  <Button size="lg" variant="outline" className="w-16 h-16">
                    <ArrowLeft className="w-6 h-6" />
                  </Button>
                  <Button size="lg" variant="outline" className="w-16 h-16">
                    <ArrowDown className="w-6 h-6" />
                  </Button>
                  <Button size="lg" variant="outline" className="w-16 h-16">
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Button size="lg" className="bg-green-600 hover:bg-green-700">
                  ENTER
                </Button>
                <Button size="lg" variant="outline">
                  BACK
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}