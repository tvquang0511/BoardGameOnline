import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Gamepad2, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard({ onLogout }) {
  const stats = [
    { name: 'Tổng người dùng', value: '12,345', change: '+12%', icon: Users, color: 'from-blue-400 to-blue-600' },
    { name: 'Game đang chơi', value: '1,234', change: '+5%', icon: Gamepad2, color: 'from-green-400 to-green-600' },
    { name: 'Người dùng hoạt động', value: '8,765', change: '+8%', icon: Activity, color: 'from-purple-400 to-purple-600' },
    { name: 'Tỷ lệ tăng trưởng', value: '23%', change: '+3%', icon: TrendingUp, color: 'from-orange-400 to-orange-600' },
  ];

  const userGrowthData = [
    { month: 'T1', users: 4000 },
    { month: 'T2', users: 5200 },
    { month: 'T3', users: 6800 },
    { month: 'T4', users: 8100 },
    { month: 'T5', users: 9500 },
    { month: 'T6', users: 12345 },
  ];

  const gamePopularityData = [
    { game: 'Cờ Caro', plays: 4500 },
    { game: 'Tic-Tac-Toe', plays: 3800 },
    { game: 'Rắn săn mồi', plays: 3200 },
    { game: 'Match 3', plays: 2900 },
    { game: 'Candy Rush', plays: 2400 },
  ];

  const recentActivities = [
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

        {/* Stats Grid */}
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
          {/* User Growth Chart */}
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

          {/* Game Popularity Chart */}
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

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Các hoạt động mới nhất trên hệ thống</CardDescription>
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