import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Gamepad2, TrendingUp, Activity, Search } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { adminApi } from "../../api/admin.api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminDashboard({ onLogout }) {
  const [statsResp, setStatsResp] = useState(null);
  const [growthResp, setGrowthResp] = useState(null);
  const [activityResp, setActivityResp] = useState(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s, g] = await Promise.all([
          adminApi.stats(),
          adminApi.userGrowth(6),
        ]);
        if (!mounted) return;
        setStatsResp(s);
        setGrowthResp(g);
      } catch {
        // TODO(API): error state
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load activities khi search query hoặc type filter thay đổi
  useEffect(() => {
    const loadActivities = async () => {
      setActivityLoading(true);
      try {
        const data = await adminApi.recentActivity({
          q: searchQuery,
          limit: 20,
          type: typeFilter,
        });
        setActivityResp(data);
      } catch (error) {
        console.error("Failed to load activities:", error);
        setActivityResp(null);
      } finally {
        setActivityLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(loadActivities, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, typeFilter]);

  const stats = useMemo(() => {
    const users = statsResp?.users ?? 0;
    const gameSessions = statsResp?.game_sessions ?? statsResp?.sessions ?? 0;
    const authSessions = statsResp?.auth_sessions ?? 0;

    return [
      {
        name: "Tổng người dùng",
        value: users.toLocaleString(),
        change: "—",
        icon: Users,
        color: "from-blue-400 to-blue-600",
      },
      {
        name: "Game sessions",
        value: gameSessions.toLocaleString(),
        change: "—",
        icon: Gamepad2,
        color: "from-green-400 to-green-600",
      },
      {
        name: "Auth sessions",
        value: authSessions.toLocaleString(),
        change: "—",
        icon: Activity,
        color: "from-purple-400 to-purple-600",
      },
    ];
  }, [statsResp]);

  const userGrowthData = useMemo(() => {
    const months = growthResp?.months || [];
    return months.map((m) => ({
      month: m.month,
      users: m.cumulative,
    }));
  }, [growthResp]);

  const gamePopularityData = useMemo(() => {
    const top = statsResp?.topGames || [];
    return top.map((g) => ({ game: g.name, plays: Number(g.plays || 0) }));
  }, [statsResp]);

  // Format thời gian relative
  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Get activity icon và màu sắc
  const getActivityInfo = (activity) => {
    if (activity.type === "auth") {
      return {
        color: "bg-blue-100 text-blue-800",
        label: "Đăng nhập",
      };
    } else {
      return {
        color: "bg-green-100 text-green-800",
        label: "Chơi game",
      };
    }
  };

  // Get avatar seed từ user id
  const getAvatarSeed = (userId) => {
    return `user_${userId}`;
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return "0s";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  return (
    <AdminLayout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600">Tổng quan hệ thống</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{stat.name}</CardDescription>
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <p className="text-sm text-green-600">
                    {stat.change} so với tháng trước
                  </p>
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
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hoạt động gần đây</CardTitle>
                <CardDescription>
                  {activityResp?.activities?.length || 0} hoạt động gần nhất
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm user..."
                    className="pl-10 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="auth">Auth sessions</option>
                  <option value="game">Game sessions</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="py-8 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-2 text-gray-500">Đang tải hoạt động...</p>
              </div>
            ) : activityResp?.activities?.length > 0 ? (
              <div className="space-y-4">
                {activityResp.activities.map((activity) => {
                  const activityInfo = getActivityInfo(activity);
                  const user = activity.user;
                  const timeAgo = formatTimeAgo(activity.started_at);

                  return (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={
                              user?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${getAvatarSeed(
                                activity.user_id,
                              )}`
                            }
                          />
                          <AvatarFallback>
                            {user?.username?.charAt(0) ||
                              user?.email?.charAt(0) ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={activityInfo.color}>
                              {activityInfo.icon} {activityInfo.label}
                            </Badge>
                            {activity.type === "game" && activity.game_name && (
                              <Badge variant="outline">
                                {activity.game_name}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">
                            {user?.display_name ||
                              user?.username ||
                              user?.email ||
                              `User #${activity.user_id}`}
                          </p>
                          {user?.level != null && (
                            <div className="text-xs text-gray-500">
                              Level{" "}
                              <span className="font-medium">{user.level}</span>
                            </div>
                          )}
                          <div className="text-sm text-gray-600">
                            {activity.type === "auth" ? (
                              <></>
                            ) : (
                              <>
                                Chơi {activity.game_name || "game"} - Điểm:{" "}
                                <span className="font-medium">
                                  {activity.score || 0}
                                </span>{" "}
                                - Thời gian:{" "}
                                <span className="font-medium">
                                  {formatDuration(activity.duration_seconds)}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Bắt đầu:{" "}
                            {new Date(activity.started_at).toLocaleString(
                              "vi-VN",
                            )}
                            {activity.ended_at && (
                              <>
                                {" "}
                                - Kết thúc:{" "}
                                {new Date(activity.ended_at).toLocaleString(
                                  "vi-VN",
                                )}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {timeAgo}
                        </div>
                        <div className="text-xs text-gray-500">
                          {activity.type === "game" && (
                            <Badge
                              variant={
                                activity.status === "finished"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {activity.status === "finished"
                                ? "Hoàn thành"
                                : "Đang chơi"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">
                  {searchQuery || typeFilter !== "all"
                    ? "Không tìm thấy hoạt động nào phù hợp với bộ lọc."
                    : "Chưa có hoạt động nào."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
