import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, Mail, User, FileText, Trophy, Star, Target, Zap } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { profilesApi } from '../../api/profiles.api';

export default function Profile({ onLogout }) {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [meData, statsData] = await Promise.all([
          authApi.me(),
          profilesApi.myStats()
        ]);
        if (!mounted) return;
        setMe(meData);
        setStats(statsData.stats);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu profile:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const statsCards = useMemo(() => {
    const total_games = stats?.total_games ?? 0;
    const wins = stats?.wins ?? 0;
    const win_rate = stats?.win_rate ?? 0;
    const best_score = stats?.best_score ?? 0;

    return [
      { label: 'Tổng trận', value: String(total_games), icon: Target },
      { label: 'Thắng', value: String(wins), icon: Trophy },
      { label: 'Tỷ lệ thắng', value: `${win_rate}%`, icon: Star },
      { label: 'Điểm cao nhất', value: best_score.toLocaleString('vi-VN'), icon: Zap },
    ];
  }, [stats]);

  if (loading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Đang tải thông tin...</div>
        </div>
      </Layout>
    );
  }

  const displayName = me?.profile?.display_name || me?.profile?.username || 'User';
  const username = me?.profile?.username || '';
  const email = me?.user?.email || '';
  const bio = me?.profile?.bio || 'Chưa có giới thiệu';
  const avatar = me?.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username || email)}`;
  const level = me?.profile?.level ?? 1;
  const points = me?.profile?.points ?? 0;
  const createdAt = me?.user?.created_at ? new Date(me.user.created_at).toLocaleDateString('vi-VN') : '...';

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Hồ sơ cá nhân</h1>
          <Button onClick={() => navigate('/profile/edit')}>
            <Edit className="w-4 h-4 mr-2" />
            Chỉnh sửa hồ sơ
          </Button>
        </div>

        {/* Main Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="w-40 h-40 border-4 border-white shadow-lg">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="text-4xl">
                      {displayName?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="mt-4 text-center">
                  <Badge variant="default" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                    Level {level}
                  </Badge>
                  <div className="mt-2 text-sm text-gray-500">Điểm: {points.toLocaleString('vi-VN')}</div>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-3xl font-bold">{displayName}</h2>
                  {me?.profile?.display_name && (
                    <p className="text-gray-500">@{username}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tên đăng nhập</p>
                      <p className="font-medium">@{username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tham gia từ</p>
                      <p className="font-medium">{createdAt}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Giới thiệu</p>
                      <p className="font-medium truncate">{bio}</p>
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">Giới thiệu</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{bio}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statsCards.map((stat) => {
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

        {/* Achievements and Favorite Games (Keep as is) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Thành tựu nổi bật</CardTitle>
              <CardDescription>Các huy hiệu bạn đã đạt được</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'First Win', icon: '🏆', color: 'bg-yellow-500' },
                  { name: 'Win Streak 5', icon: '🔥', color: 'bg-orange-500' },
                  { name: 'Master Player', icon: '👑', color: 'bg-purple-500' },
                  { name: 'Speed Demon', icon: '⚡', color: 'bg-blue-500' },
                ].map((achievement) => (
                  <div key={achievement.name} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <div className={`w-16 h-16 ${achievement.color} rounded-full flex items-center justify-center text-3xl mb-2`}>
                      {achievement.icon}
                    </div>
                    <span className="text-sm font-medium text-center">{achievement.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trò chơi yêu thích</CardTitle>
              <CardDescription>Các game bạn chơi nhiều nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Cờ Caro 5', plays: 85, winRate: '75%' },
                  { name: 'Tic-Tac-Toe', plays: 62, winRate: '80%' },
                  { name: 'Ghép hàng 3', plays: 45, winRate: '68%' },
                  { name: 'Rắn săn mồi', plays: 38, winRate: '62%' },
                ].map((game, index) => (
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