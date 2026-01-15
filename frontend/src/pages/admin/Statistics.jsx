import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "recharts";
import { adminApi } from "../../api/admin.api";

export default function Statistics({ onLogout }) {
  const [dau, setDau] = useState([]);
  const [hours, setHours] = useState([]);
  const [distribution, setDistribution] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [d, h, g] = await Promise.all([
          adminApi.dau(7),
          adminApi.gamesessionByHour(),
          adminApi.gameDistribution(),
        ]);
        if (!mounted) return;
        setDau(d.days || []);
        setHours(h.hours || []);
        setDistribution(g.distribution || []);
      } catch {
        // TODO(API): error state
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const dailyActiveUsers = useMemo(() => {
    return dau.map((x) => ({ date: x.date, users: x.users }));
  }, [dau]);

  const gameSessionsData = useMemo(() => {
    return hours.map((x) => ({
      hour: String(x.hour).padStart(2, "0") + ":00",
      sessions: x.count,
    }));
  }, [hours]);

  const gameDistribution = useMemo(() => {
    return distribution.map((x) => ({ name: x.name, value: x.plays }));
  }, [distribution]);

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

  return (
    <AdminLayout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Thống kê</h1>
          <p className="text-gray-600">Phân tích chi tiết về hệ thống</p>
        </div>

        {/* Chỉ còn 2 tab: Người dùng & Game */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Người dùng</TabsTrigger>
            <TabsTrigger value="games">Game</TabsTrigger>
          </TabsList>

          {/* USERS: chỉ hiển thị chart hoạt động hàng ngày, chiếm full width (bỏ phần phân bổ người dùng) */}
          <TabsContent value="users" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Người dùng hoạt động hàng ngày</CardTitle>
                  <CardDescription>7 ngày gần đây</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={380}>
                    <AreaChart data={dailyActiveUsers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stroke="#3b82f6"
                        fill="#93c5fd"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* GAMES tab: giữ các chart liên quan tới game */}
          <TabsContent value="games" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Phiên theo giờ (24h)</CardTitle>
                  <CardDescription>
                    Session count trong 24 giờ gần đây
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={gameSessionsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sessions" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Phân bố game</CardTitle>
                  <CardDescription>Số lần chơi theo game</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={340}>
                    <PieChart>
                      <Pie
                        data={gameDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={100}
                        label
                      >
                        {gameDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={48} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
