import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award } from 'lucide-react';

export default function Ranking({ onLogout }) {
  const globalRanking = [
    { rank: 1, name: 'LegendMaster', score: 25840, level: 45, avatar: 'rank1', wins: 320 },
    { rank: 2, name: 'ProGamerX', score: 24150, level: 42, avatar: 'rank2', wins: 305 },
    { rank: 3, name: 'ChampionKing', score: 23670, level: 41, avatar: 'rank3', wins: 295 },
    { rank: 4, name: 'NinjaWarrior', score: 22980, level: 40, avatar: 'rank4', wins: 285 },
    { rank: 5, name: 'QueenBee', score: 21450, level: 38, avatar: 'rank5', wins: 270 },
    { rank: 6, name: 'SpeedRunner', score: 20780, level: 36, avatar: 'rank6', wins: 260 },
    { rank: 7, name: 'CoolGamer99', score: 19650, level: 35, avatar: 'rank7', wins: 245 },
    { rank: 8, name: 'StarPlayer', score: 18920, level: 33, avatar: 'rank8', wins: 235 },
    { rank: 9, name: 'GameMaster', score: 17850, level: 32, avatar: 'rank9', wins: 220 },
    { rank: 10, name: 'ProPlayer123', score: 16740, level: 30, avatar: 'rank10', wins: 210 },
  ];

  const weeklyRanking = [
    { rank: 1, name: 'FastPlayer', score: 3250, level: 28, avatar: 'week1', wins: 45 },
    { rank: 2, name: 'QuickWinner', score: 2980, level: 26, avatar: 'week2', wins: 42 },
    { rank: 3, name: 'SpeedDemon', score: 2750, level: 25, avatar: 'week3', wins: 38 },
  ];

  const topCaroPlayers = [
    { rank: 1, name: 'CaroMaster', score: 15840, avatar: 'caro1' },
    { rank: 2, name: 'ChessKing', score: 14150, avatar: 'caro2' },
    { rank: 3, name: 'BoardMaster', score: 13670, avatar: 'caro3' },
  ];

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-orange-500';
      case 2:
        return 'from-gray-300 to-gray-400';
      case 3:
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-blue-400 to-purple-500';
    }
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Bảng xếp hạng</h1>
          <p className="text-gray-600">Những game thủ hàng đầu</p>
        </div>

        {/* Your Rank */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  #42
                </div>
                <div>
                  <p className="text-sm text-gray-600">Xếp hạng của bạn</p>
                  <p className="text-2xl font-bold">GamePro</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Tổng điểm</p>
                <p className="text-2xl font-bold text-blue-600">12,450</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="global">Toàn cầu</TabsTrigger>
            <TabsTrigger value="weekly">Tuần này</TabsTrigger>
            <TabsTrigger value="game">Theo game</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Bảng xếp hạng toàn cầu</CardTitle>
                <CardDescription>Top 10 người chơi xuất sắc nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {globalRanking.map((player) => (
                    <div
                      key={player.rank}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        player.rank <= 3 ? 'bg-gradient-to-r ' + getRankColor(player.rank) + ' text-white' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[60px]">
                          {getRankIcon(player.rank) || (
                            <span className={`text-xl font-bold ${player.rank <= 3 ? 'text-white' : 'text-gray-600'}`}>
                              #{player.rank}
                            </span>
                          )}
                        </div>
                        <Avatar className="w-12 h-12 border-2 border-white">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.avatar}`} />
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{player.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={player.rank <= 3 ? 'secondary' : 'outline'} className={player.rank <= 3 ? 'bg-white/20 border-white' : ''}>
                              Level {player.level}
                            </Badge>
                            <span className={`text-sm ${player.rank <= 3 ? 'text-white/80' : 'text-gray-600'}`}>
                              {player.wins} thắng
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${player.rank <= 3 ? 'text-white' : 'text-blue-600'}`}>
                          {player.score.toLocaleString()}
                        </p>
                        <p className={`text-sm ${player.rank <= 3 ? 'text-white/80' : 'text-gray-500'}`}>điểm</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Bảng xếp hạng tuần</CardTitle>
                <CardDescription>Top người chơi xuất sắc tuần này</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyRanking.map((player) => (
                    <div
                      key={player.rank}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        player.rank <= 3 ? 'bg-gradient-to-r ' + getRankColor(player.rank) + ' text-white' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[60px]">
                          {getRankIcon(player.rank)}
                        </div>
                        <Avatar className="w-12 h-12 border-2 border-white">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.avatar}`} />
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{player.name}</p>
                          <span className="text-sm text-white/80">{player.wins} thắng tuần này</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{player.score.toLocaleString()}</p>
                        <p className="text-sm text-white/80">điểm</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="game" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Bảng xếp hạng Cờ Caro</CardTitle>
                <CardDescription>Top người chơi cờ caro xuất sắc</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topCaroPlayers.map((player) => (
                    <div
                      key={player.rank}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        player.rank <= 3 ? 'bg-gradient-to-r ' + getRankColor(player.rank) + ' text-white' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[60px]">
                          {getRankIcon(player.rank)}
                        </div>
                        <Avatar className="w-12 h-12 border-2 border-white">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.avatar}`} />
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <p className="font-semibold">{player.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{player.score.toLocaleString()}</p>
                        <p className="text-sm text-white/80">điểm</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}