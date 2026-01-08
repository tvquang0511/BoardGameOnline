import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Gamepad2, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminApi } from '../../api/admin.api';

export default function AdminDashboard({ onLogout }) {
  const [statsResp, setStatsResp] = useState(null);
  const [growthResp, setGrowthResp] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s, g] = await Promise.all([adminApi.stats(), adminApi.userGrowth(6)]);
        if (!mounted) return;
        setStatsResp(s);
        setGrowthResp(g);
      } catch {
        // TODO(API): error state
      }
    })();
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const users = statsResp?.users ?? 0;
    const gameSessions = statsResp?.game_sessions ?? statsResp?.sessions ?? 0;
    const authSessions = statsResp?.auth_sessions ?? 0;

    return [
      { name: 'Tổng người dùng', value: users.toLocaleString(), change: '—', icon: Users, color: 'from-blue-400 to-blue-600' },
      { name: 'Game sessions', value: gameSessions.toLocaleString(), change: '—', icon: Gamepad2, color: 'from-green-400 to-green-600' },
      { name: 'Auth sessions', value: authSessions.toLocaleString(), change: '—', icon: Activity, color: 'from-purple-400 to-purple-600' },
      { name: 'Tỷ lệ tăng trưởng', value: '—', change: '—', icon: TrendingUp, color: 'from-orange-400 to-orange-600' }, // TODO(API MISSING)
    ];
  }, [statsResp]);

  const userGrowthData = useMemo(() => {
    const months = growthResp?.months || [];
    // map YYYY-MM -> Tn (rough)
    return months.map((m) => ({
      month: m.month,
      users: m.cumulative,
    }));
  }, [growthResp]);

  const gamePopularityData = useMemo(() => {
    const top = statsResp?.topGames || [];
    return top.map((g) => ({ game: g.name, plays: Number(g.plays || 0) }));
  }, [statsResp]);

  const recentActivities = [
    // TODO(API MISSING): audit_logs API endpoint
    { user: 'GamePro', action: 'đăng ký tài khoản mới', time: '5 phút trước' },
    { user: 'CoolGamer99', action: 'đạt thành tựu Master Player', time: '12 phút trước' },
    { user: 'ProPlayer123', action: 'lên level 30', time: '25 phút trước' },
    { user: 'QueenBee', action: 'chơi game Cờ Caro', time: '1 giờ trước' },
    { user: 'SpeedRunner', action: 'tham gia bảng xếp hạng top 100', time: '2 giờ trước' },
  ];

  return (
    <AdminLayout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Tổng quan hệ thống</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{stat.name}</CardDescription>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <p className="text-sm text-green-600">{stat.change} so với tháng trước</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tăng trưởng người dùng</CardTitle>
              <CardDescription>6 tháng gần đây</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Độ phổ biến game</CardTitle>
              <CardDescription>Số lượt chơi theo game</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gamePopularityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="game" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="plays" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>
              Các hoạt động mới nhất trên hệ thống (TODO(API MISSING): audit_logs endpoint)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p>
                      <span className="font-semibold">{activity.user}</span>{' '}
                      <span className="text-gray-600">{activity.action}</span>
                    </p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}