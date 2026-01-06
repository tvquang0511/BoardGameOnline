import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Star, Target, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Dashboard({ onLogout }) {
  const stats = [
    { name: 'Tổng điểm', value: '12,450', icon: Star, color: 'from-yellow-400 to-orange-500' },
    { name: 'Thắng liên tiếp', value: '8', icon: Trophy, color: 'from-blue-400 to-blue-600' },
    { name: 'Thành tựu', value: '23/50', icon: Target, color: 'from-green-400 to-green-600' },
    { name: 'Hạng', value: '#42', icon: Zap, color: 'from-purple-400 to-purple-600' },
  ];

  const recentGames = [
    { name: 'Cờ Caro 5', result: 'Thắng', score: 250, date: '2 giờ trước' },
    { name: 'Tic-Tac-Toe', result: 'Thắng', score: 100, date: '5 giờ trước' },
    { name: 'Rắn săn mồi', result: 'Thua', score: -50, date: 'Hôm qua' },
    { name: 'Ghép hàng 3', result: 'Thắng', score: 180, date: 'Hôm qua' },
  ];

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Xin chào, GamePro!</h1>
          <p className="text-gray-600">Chào mừng bạn trở lại với Board Game Hub</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{stat.name}</CardDescription>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hành động nhanh</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Link to="/games">
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600">
                Chơi ngay
              </Button>
            </Link>
            <Link to="/friends">
              <Button variant="outline">
                Thách đấu bạn bè
              </Button>
            </Link>
            <Link to="/achievements">
              <Button variant="outline">
                Xem thành tựu
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Games */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử chơi gần đây</CardTitle>
            <CardDescription>Các ván game bạn đã chơi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGames.map((game, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{game.name}</p>
                    <p className="text-sm text-gray-500">{game.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        game.result === 'Thắng'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {game.result}
                    </span>
                    <span
                      className={`font-bold ${
                        game.score > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {game.score > 0 ? '+' : ''}{game.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}