import { useEffect, useMemo, useState } from 'react';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award } from 'lucide-react';
import { leaderboardApi } from '../../api/leaderboard.api';

export default function Ranking({ onLogout }) {
  const [globalRows, setGlobalRows] = useState([]);
  const [weeklyRows, setWeeklyRows] = useState([]);
  const [selectedGameSlug, setSelectedGameSlug] = useState('caro5'); // TODO(API): choose game selector

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [g, w, byGame] = await Promise.all([
          leaderboardApi.get({ gameSlug: selectedGameSlug, scope: 'global', limit: 10 }),
          leaderboardApi.get({ gameSlug: selectedGameSlug, scope: 'global', limit: 10, range: '7d' }),
          leaderboardApi.get({ gameSlug: selectedGameSlug, scope: 'global', limit: 10 }),
        ]);
        if (!mounted) return;
        setGlobalRows(g.leaderboard || []);
        setWeeklyRows(w.leaderboard || []);
        // byGame uses same, UI "Theo game" currently static Caro
        // we reuse globalRows below
      } catch {
        // TODO(API): error state
      }
    })();
    return () => { mounted = false; };
  }, [selectedGameSlug]);

  const globalRanking = useMemo(() => {
    return globalRows.map((r, idx) => ({
      rank: idx + 1,
      name: r.display_name || r.username || `User #${r.user_id}`,
      score: Number(r.best_score || 0),
      level: 1, // TODO(API MISSING): leaderboard response chưa có level
      avatar: `rank_${r.user_id}`,
      wins: 0, // TODO(API MISSING): cần API wins
    }));
  }, [globalRows]);

  const weeklyRanking = useMemo(() => {
    return weeklyRows.map((r, idx) => ({
      rank: idx + 1,
      name: r.display_name || r.username || `User #${r.user_id}`,
      score: Number(r.best_score || 0),
      level: 1, // TODO(API MISSING)
      avatar: `week_${r.user_id}`,
      wins: 0, // TODO(API MISSING)
    }));
  }, [weeklyRows]);

  const topCaroPlayers = globalRanking.slice(0, 3).map((p) => ({
    rank: p.rank,
    name: p.name,
    score: p.score,
    avatar: p.avatar,
  }));

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-orange-600" />;
      default: return null;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-orange-500';
      case 2: return 'from-gray-300 to-gray-400';
      case 3: return 'from-orange-400 to-orange-600';
      default: return 'from-blue-400 to-purple-500';
    }
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Bảng xếp hạng</h1>
          <p className="text-gray-600">Những game thủ hàng đầu</p>
        </div>

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
          {/* TODO(API MISSING): rank + score thật của user */}
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
                        player.rank <= 3
                          ? 'bg-gradient-to-r ' + getRankColor(player.rank) + ' text-white'
                          : 'bg-gray-50'
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
                            <Badge
                              variant={player.rank <= 3 ? 'secondary' : 'outline'}
                              className={player.rank <= 3 ? 'bg-white/20 border-white' : ''}
                            >
                              Level {player.level} {/* TODO(API MISSING) */}
                            </Badge>
                            <span className={`text-sm ${player.rank <= 3 ? 'text-white/80' : 'text-gray-600'}`}>
                              {player.wins} thắng {/* TODO(API MISSING) */}
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
                        player.rank <= 3
                          ? 'bg-gradient-to-r ' + getRankColor(player.rank) + ' text-white'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[60px]">{getRankIcon(player.rank)}</div>
                        <Avatar className="w-12 h-12 border-2 border-white">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${player.avatar}`} />
                          <AvatarFallback>{player.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{player.name}</p>
                          <span className="text-sm text-white/80">{player.wins} thắng tuần này {/* TODO */}</span>
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
                        player.rank <= 3
                          ? 'bg-gradient-to-r ' + getRankColor(player.rank) + ' text-white'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[60px]">{getRankIcon(player.rank)}</div>
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