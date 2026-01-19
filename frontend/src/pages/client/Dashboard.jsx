import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, Star, Target, Zap, Gamepad2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { profilesApi } from "../../api/profiles.api";
import { achievementsApi } from "../../api/achievements.api";
import { gamesApi } from "../../api/games.api";
import { useAuth } from "../../context/AuthContext";

export default function Dashboard({ onLogout }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [myAchievements, setMyAchievements] = useState([]);
  const [globalRank, setGlobalRank] = useState(null);

  // recent games (infinite scroll)
  const [recentGames, setRecentGames] = useState([]);
  const [recentPage, setRecentPage] = useState(1);
  const [recentLimit] = useState(10);
  const [recentHasMore, setRecentHasMore] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);

  // most played
  const [mostPlayed, setMostPlayed] = useState(null);
  const [mostPlayedLoading, setMostPlayedLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, a, r] = await Promise.all([
          profilesApi.me(),
          achievementsApi.my(),
          profilesApi.myGlobalRank(),
        ]);
        if (!mounted) return;
        setProfile(p.profile);
        setMyAchievements(a.achievements || []);
        setGlobalRank(r.rank);
      } catch {
        // TODO(API): error state
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // fetch most-played and first page of recent games once user is available
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const loadMostPlayed = async () => {
      setMostPlayedLoading(true);
      try {
        const resp = await gamesApi.getMyMostPlayedGame();
        if (!mounted) return;
        setMostPlayed(resp.mostPlayed || null);
      } catch (err) {
        console.error("Failed to load most-played:", err);
      } finally {
        if (mounted) setMostPlayedLoading(false);
      }
    };

    const loadRecent = async (page = 1) => {
      setRecentLoading(true);
      try {
        const resp = await gamesApi.getMyRecentGames({
          limit: recentLimit,
          page,
        });
        if (!mounted) return;
        setRecentHasMore(Boolean(resp.hasMore));
        if (page === 1) setRecentGames(resp.results || []);
        else setRecentGames((prev) => [...prev, ...(resp.results || [])]);
        setRecentPage(page);
      } catch (err) {
        console.error("Failed to load recent games:", err);
      } finally {
        if (mounted) setRecentLoading(false);
      }
    };

    loadMostPlayed();
    loadRecent(1);

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadMoreRecent = async () => {
    if (recentLoading || !recentHasMore) return;
    const next = recentPage + 1;
    try {
      setRecentLoading(true);
      const resp = await gamesApi.getMyRecentGames({
        limit: recentLimit,
        page: next,
      });
      setRecentGames((prev) => [...prev, ...(resp.results || [])]);
      setRecentHasMore(Boolean(resp.hasMore));
      setRecentPage(next);
    } catch (err) {
      console.error("Load more recent failed:", err);
    } finally {
      setRecentLoading(false);
    }
  };

  const unlockedCount = myAchievements.filter((x) => x.unlocked_at).length;

  const stats = useMemo(() => {
    return [
      {
        name: "Tổng điểm",
        value: (profile?.points ?? 0).toLocaleString("vi-VN"),
        icon: Star,
        bgColor: "bg-yellow-500",
      },
      {
        name: "Trò chơi ưa thích",
        value: mostPlayed?.game?.name
          ? `${mostPlayed.game.name}`
          : mostPlayedLoading
            ? "Đang tải..."
            : "Chưa có",
        icon: Gamepad2,
        bgColor: "bg-blue-400",
      },
      {
        name: "Thành tựu",
        value: `${unlockedCount}/10`,
        icon: Target,
        bgColor: "bg-green-600",
      },
      {
        name: "Hạng",
        value: globalRank ? `#${globalRank}` : "#--",
        icon: Trophy,
        bgColor: "bg-purple-600",
      },
    ];
  }, [profile, unlockedCount, mostPlayed, mostPlayedLoading, globalRank]);

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Xin chào, {profile?.display_name || profile?.username || "Player"}!
          </h1>
          <p className="text-gray-600">
            Chào mừng bạn trở lại với Board Game Hub
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.name} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>{stat.name}</CardDescription>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold whitespace-pre-wrap">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hành động nhanh</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Link to="/games">
              <Button className="bg-blue-600">Chơi ngay</Button>
            </Link>
            <Link to="/achievements">
              <Button variant="outline">Xem thành tựu</Button>
            </Link>
            <Link to="/ranking">
              <Button variant="outline">Xếp hạng</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lịch sử chơi gần đây</CardTitle>
            <CardDescription>Các ván game bạn đã chơi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGames.length === 0 && !recentLoading && (
                <div className="text-sm text-gray-500">Chưa có ván nào.</div>
              )}

              {recentGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {game.game_name || game.game?.name || "Không rõ"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(game.created_at).toLocaleString()}
                      {game.duration_seconds
                        ? ` • ${game.duration_seconds}s`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        game.result === "win" ||
                        game.result === "WIN" ||
                        game.result === "Thắng"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {game.result === "win" || game.result === "WIN"
                        ? "Thắng"
                        : game.result === "draw" || game.result === "DRAW"
                          ? "Hòa"
                          : "Thua"}
                    </span>
                    <span
                      className={`font-bold ${game.score > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {game.score > 0 ? "+" : ""}
                      {game.score}
                    </span>
                  </div>
                </div>
              ))}

              {recentHasMore && (
                <div className="flex justify-center">
                  <Button onClick={loadMoreRecent} disabled={recentLoading}>
                    {recentLoading ? "Đang tải..." : "Xem thêm"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
