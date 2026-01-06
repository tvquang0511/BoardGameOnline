import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Camera, Edit, Trophy, Star, Target, Zap } from 'lucide-react';

export default function Profile({ onLogout }) {
  const stats = [
    { label: 'Tổng trận', value: '250', icon: Target },
    { label: 'Thắng', value: '180', icon: Trophy },
    { label: 'Tỷ lệ thắng', value: '72%', icon: Star },
    { label: 'Điểm cao nhất', value: '12,450', icon: Zap },
  ];

  const achievements = [
    { name: 'First Win', icon: '🏆', color: 'bg-yellow-500' },
    { name: 'Win Streak 5', icon: '🔥', color: 'bg-orange-500' },
    { name: 'Master Player', icon: '👑', color: 'bg-purple-500' },
    { name: 'Speed Demon', icon: '⚡', color: 'bg-blue-500' },
  ];

  const favoriteGames = [
    { name: 'Cờ Caro 5', plays: 85, winRate: '75%' },
    { name: 'Tic-Tac-Toe', plays: 62, winRate: '80%' },
    { name: 'Ghép hàng 3', plays: 45, winRate: '68%' },
    { name: 'Rắn săn mồi', plays: 38, winRate: '62%' },
  ];

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <h1 className="text-4xl font-bold">Hồ sơ cá nhân</h1>

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=gamer" />
                  <AvatarFallback>GP</AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold">GamePro</h2>
                  <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-purple-600">
                    Level 25
                  </Badge>
                </div>
                <p className="text-gray-600 mb-4">gamerpro@email.com</p>
                <div className="flex gap-2">
                  <Button>
                    <Edit className="w-4 h-4 mr-2" />
                    Chỉnh sửa hồ sơ
                  </Button>
                  <Button variant="outline">Đổi mật khẩu</Button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Xếp hạng toàn cầu</div>
                <div className="text-4xl font-bold text-blue-600">#42</div>
                <div className="text-sm text-gray-600 mt-2">Tham gia: 6 tháng trước</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{stat.label}</span>
                    <Icon className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Thành tựu nổi bật</CardTitle>
              <CardDescription>Các huy hiệu bạn đã đạt được</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.name}
                    className="flex flex-col items-center p-4 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`w-16 h-16 ${achievement.color} rounded-full flex items-center justify-center text-3xl mb-2`}
                    >
                      {achievement.icon}
                    </div>
                    <span className="text-sm font-medium text-center">{achievement.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Favorite Games */}
          <Card>
            <CardHeader>
              <CardTitle>Trò chơi yêu thích</CardTitle>
              <CardDescription>Các game bạn chơi nhiều nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {favoriteGames.map((game, index) => (
                  <div key={game.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{game.name}</p>
                        <p className="text-sm text-gray-500">{game.plays} ván đã chơi</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{game.winRate}</div>
                      <div className="text-xs text-gray-500">Tỷ lệ thắng</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}