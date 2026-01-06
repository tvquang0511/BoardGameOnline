import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock } from 'lucide-react';

export default function Achievements({ onLogout }) {
  const unlocked = [
    {
      name: 'First Win',
      description: 'Giành chiến thắng đầu tiên',
      icon: '🏆',
      color: 'from-yellow-400 to-orange-500',
      date: '5 tháng trước',
      rarity: 'Common',
    },
    {
      name: 'Win Streak 5',
      description: 'Thắng 5 ván liên tiếp',
      icon: '🔥',
      color: 'from-orange-400 to-red-500',
      date: '3 tháng trước',
      rarity: 'Rare',
    },
    {
      name: 'Master Player',
      description: 'Đạt level 25',
      icon: '👑',
      color: 'from-purple-400 to-pink-500',
      date: '1 tháng trước',
      rarity: 'Epic',
    },
    {
      name: 'Speed Demon',
      description: 'Hoàn thành game trong 2 phút',
      icon: '⚡',
      color: 'from-blue-400 to-cyan-500',
      date: '2 tuần trước',
      rarity: 'Rare',
    },
    {
      name: 'Perfectionist',
      description: 'Đạt điểm tối đa trong 1 ván',
      icon: '💎',
      color: 'from-indigo-400 to-purple-500',
      date: '1 tuần trước',
      rarity: 'Epic',
    },
    {
      name: 'Social Butterfly',
      description: 'Có 10 bạn bè',
      icon: '🦋',
      color: 'from-pink-400 to-rose-500',
      date: '3 ngày trước',
      rarity: 'Common',
    },
  ];

  const locked = [
    {
      name: 'Win Streak 10',
      description: 'Thắng 10 ván liên tiếp',
      icon: '🌟',
      color: 'from-gray-300 to-gray-400',
      progress: 80,
      current: 8,
      total: 10,
      rarity: 'Epic',
    },
    {
      name: 'Grand Master',
      description: 'Đạt level 50',
      icon: '🎖️',
      color: 'from-gray-300 to-gray-400',
      progress: 50,
      current: 25,
      total: 50,
      rarity: 'Legendary',
    },
    {
      name: 'Game Collector',
      description: 'Chơi tất cả các game',
      icon: '🎮',
      color: 'from-gray-300 to-gray-400',
      progress: 66,
      current: 8,
      total: 12,
      rarity: 'Rare',
    },
    {
      name: 'Top 10',
      description: 'Lọt top 10 bảng xếp hạng',
      icon: '🥇',
      color: 'from-gray-300 to-gray-400',
      progress: 20,
      current: 42,
      total: 10,
      rarity: 'Legendary',
    },
  ];

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Common':
        return 'bg-gray-500';
      case 'Rare':
        return 'bg-blue-500';
      case 'Epic':
        return 'bg-purple-500';
      case 'Legendary':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Thành tựu</h1>
          <p className="text-gray-600">Bạn đã mở khóa {unlocked.length}/50 thành tựu</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Đã mở khóa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{unlocked.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Đang tiến hành</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{locked.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tỷ lệ hoàn thành</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {Math.round((unlocked.length / 50) * 100)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="unlocked" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unlocked">Đã mở khóa ({unlocked.length})</TabsTrigger>
            <TabsTrigger value="locked">Chưa mở khóa ({locked.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="unlocked" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unlocked.map((achievement) => (
                <Card key={achievement.name} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center text-3xl flex-shrink-0`}
                      >
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold">{achievement.name}</h3>
                          <Badge className={getRarityColor(achievement.rarity)}>
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <p className="text-xs text-gray-500">Mở khóa: {achievement.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="locked" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {locked.map((achievement) => (
                <Card key={achievement.name} className="overflow-hidden opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center text-3xl flex-shrink-0 relative`}
                      >
                        <Lock className="w-6 h-6 text-gray-600 absolute" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-gray-700">{achievement.name}</h3>
                          <Badge className={getRarityColor(achievement.rarity)}>
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Tiến độ</span>
                            <span className="font-medium">
                              {achievement.current}/{achievement.total}
                            </span>
                          </div>
                          <Progress value={achievement.progress} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}