import AdminLayout from '../../components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

export default function Statistics({ onLogout }) {
  const dailyActiveUsers = [
    { date: 'T2', users: 3200 },
    { date: 'T3', users: 3800 },
    { date: 'T4', users: 4100 },
    { date: 'T5', users: 4500 },
    { date: 'T6', users: 5200 },
    { date: 'T7', users: 6800 },
    { date: 'CN', users: 7200 },
  ];

  const gameSessionsData = [
    { hour: '00:00', sessions: 120 },
    { hour: '04:00', sessions: 80 },
    { hour: '08:00', sessions: 350 },
    { hour: '12:00', sessions: 680 },
    { hour: '16:00', sessions: 920 },
    { hour: '20:00', sessions: 1250 },
    { hour: '23:00', sessions: 580 },
  ];

  const gameDistribution = [
    { name: 'Cờ Caro', value: 35 },
    { name: 'Tic-Tac-Toe', value: 25 },
    { name: 'Rắn săn mồi', value: 20 },
    { name: 'Match 3', value: 12 },
    { name: 'Khác', value: 8 },
  ];

  const revenueData = [
    { month: 'T1', revenue: 12000, users: 4000 },
    { month: 'T2', revenue: 15000, users: 5200 },
    { month: 'T3', revenue: 18500, users: 6800 },
    { month: 'T4', revenue: 22000, users: 8100 },
    { month: 'T5', revenue: 26500, users: 9500 },
    { month: 'T6', revenue: 32000, users: 12345 },
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  return (
    <AdminLayout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Thống kê</h1>
          <p className="text-gray-600">Phân tích chi tiết về hệ thống</p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Người dùng</TabsTrigger>
            <TabsTrigger value="games">Game</TabsTrigger>
            <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
            <TabsTrigger value="engagement">Tương tác</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Người dùng hoạt động hàng ngày</CardTitle>
                  <CardDescription>Tuần này</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyActiveUsers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="#93c5fd" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Phân bổ người dùng</CardTitle>
                  <CardDescription>Theo độ tuổi và giới tính</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">18-24 tuổi</span>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">25-34 tuổi</span>
                        <span className="text-sm font-medium">30%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '30%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">35-44 tuổi</span>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '15%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">45+ tuổi</span>
                        <span className="text-sm font-medium">10%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: '10%' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="games" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Phân bố game</CardTitle>
                  <CardDescription>Tỷ lệ chơi theo game</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={gameDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {gameDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Phiên chơi theo giờ</CardTitle>
                  <CardDescription>Số lượng phiên chơi trong ngày</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gameSessionsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sessions" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Doanh thu & Người dùng</CardTitle>
                <CardDescription>6 tháng gần đây</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Doanh thu ($)" />
                    <Line yAxisId="right" type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Người dùng" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Thời gian chơi trung bình</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-600">45 phút</div>
                  <p className="text-sm text-green-600 mt-1">+5% so với tuần trước</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Tỷ lệ quay lại</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-purple-600">68%</div>
                  <p className="text-sm text-green-600 mt-1">+3% so với tuần trước</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Số game/người dùng</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-orange-600">8.5</div>
                  <p className="text-sm text-green-600 mt-1">+12% so với tuần trước</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}