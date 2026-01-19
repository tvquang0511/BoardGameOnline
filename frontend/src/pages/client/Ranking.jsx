import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Trophy, Medal, Award, Users, Globe, User } from "lucide-react";
import { leaderboardApi } from "../../api/leaderboard.api";
import { gamesApi } from "../../api/games.api";

export default function Ranking({ onLogout }) {
  const [games, setGames] = useState([]);
  const [selectedGameSlug, setSelectedGameSlug] = useState(null); // null = overall ranking
  const [scope, setScope] = useState("global"); // 'global' | 'friends' | 'me'

  // Data states
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);

  // Load games list
  useEffect(() => {
    gamesApi
      .list()
      .then((data) => setGames(data.games || []))
      .catch(() => {});
  }, []);

  // Load leaderboard data
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    (async () => {
      try {
        if (scope === "me") {
          // Load personal stats
          const data = await leaderboardApi.get({
            gameSlug: selectedGameSlug,
            scope: "me",
          });
          if (!mounted) return;
          setMyStats(data.stats);
          setLeaderboard([]);
        } else {
          // Load leaderboard (global or friends)
          const data = await leaderboardApi.get({
            gameSlug: selectedGameSlug,
            scope,
            page: pagination.page,
            limit: pagination.limit,
          });
          if (!mounted) return;
          setLeaderboard(data.leaderboard || []);
          setPagination((prev) => ({
            ...prev,
            ...data.pagination,
          }));
          setMyStats(null);
        }
      } catch (err) {
        console.error("Load leaderboard error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedGameSlug, scope, pagination.page, pagination.limit]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

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
        return "from-yellow-400 to-orange-500";
      case 2:
        return "from-gray-300 to-gray-400";
      case 3:
        return "from-orange-400 to-orange-600";
      default:
        return "from-blue-400 to-purple-500";
    }
  };

  const renderPlayerRow = (player) => {
    const isTopThree = player.rank <= 3;
    return (
      <div
        key={player.user_id}
        className={`flex items-center justify-between p-4 rounded-lg transition-all ${
          player.is_current_user
            ? "bg-blue-50 border-2 border-blue-400"
            : isTopThree
              ? "bg-gradient-to-r " + getRankColor(player.rank) + " text-white"
              : "bg-gray-50 hover:bg-gray-100"
        }`}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 min-w-[60px]">
            {getRankIcon(player.rank) || (
              <span
                className={`text-xl font-bold ${
                  isTopThree ? "text-white" : "text-gray-600"
                }`}
              >
                #{player.rank}
              </span>
            )}
          </div>
          <Avatar className="w-12 h-12 border-2 border-white">
            <AvatarImage
              src={
                player.avatar_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`
              }
            />
            <AvatarFallback>
              {(player.display_name || player.username || "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold flex items-center gap-2">
              {player.display_name || player.username}
              {player.is_current_user && <Badge variant="secondary">Bạn</Badge>}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <Badge
                variant={isTopThree ? "secondary" : "outline"}
                className={
                  isTopThree ? "bg-white/20 border-white text-white" : ""
                }
              >
                Level {player.level}
              </Badge>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-2xl font-bold ${
              player.is_current_user
                ? "text-blue-600"
                : isTopThree
                  ? "text-white"
                  : "text-blue-600"
            }`}
          >
            {(player.total_score !== undefined
              ? player.total_score
              : player.points
            ).toLocaleString()}
          </p>
          <p
            className={`text-sm ${
              isTopThree ? "text-white/80" : "text-gray-500"
            }`}
          >
            {player.total_score !== undefined
              ? "Tổng điểm game"
              : "Điểm tích lũy"}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Bảng xếp hạng</h1>
          <p className="text-gray-600">Những game thủ xuất sắc nhất</p>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Game</label>
                <Select
                  value={selectedGameSlug || "all"}
                  onValueChange={(v) =>
                    setSelectedGameSlug(v === "all" ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn game" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tổng điểm tất cả game</SelectItem>
                    {games.map((g) => (
                      <SelectItem key={g.slug} value={g.slug}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Phạm vi xếp hạng
                </label>
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Toàn cầu
                      </div>
                    </SelectItem>
                    <SelectItem value="friends">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Bạn bè
                      </div>
                    </SelectItem>
                    <SelectItem value="me">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Cá nhân
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-4">
              {selectedGameSlug
                ? "Xếp hạng theo tổng điểm trong game được chọn"
                : "Xếp hạng theo tổng điểm tích lũy từ tất cả game"}
            </div>
          </CardContent>
        </Card>

        {/* Personal Stats View */}
        {scope === "me" && myStats && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle>Thống kê cá nhân</CardTitle>
              <CardDescription>Thành tích của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">
                    #{myStats.rank}
                  </div>
                  <p className="text-sm text-gray-600">Xếp hạng</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600 mb-1">
                    {selectedGameSlug && myStats?.total_score !== undefined
                      ? myStats.total_score.toLocaleString()
                      : myStats?.points?.toLocaleString() || 0}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedGameSlug ? "Tổng điểm game" : "Điểm tích lũy"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600 mb-1">
                    {myStats.wins}/{myStats.total_games}
                  </p>
                  <p className="text-sm text-gray-600">Thắng/Tổng trận</p>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={myStats.avatar_url} />
                  <AvatarFallback>
                    {(myStats.display_name ||
                      myStats.username ||
                      "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-bold">
                    {myStats.display_name || myStats.username}
                  </p>
                  <Badge>Level {myStats.level}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard View */}
        {scope !== "me" && (
          <Card>
            <CardHeader>
              <CardTitle>
                {scope === "global"
                  ? "Bảng xếp hạng toàn cầu"
                  : "Bảng xếp hạng bạn bè"}
              </CardTitle>
              <CardDescription>
                {selectedGameSlug
                  ? `Xếp hạng theo tổng điểm trong ${
                      games.find((g) => g.slug === selectedGameSlug)?.name ||
                      "game"
                    }`
                  : "Xếp hạng theo tổng điểm tích lũy từ tất cả game"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Đang tải...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {scope === "friends"
                    ? "Chưa có dữ liệu bạn bè"
                    : "Chưa có dữ liệu"}
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {leaderboard.map(renderPlayerRow)}
                  </div>
                  {/* Pagination */}
                  <div className="flex flex-col items-center gap-4 mt-6 pt-4 border-t">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              pagination.page > 1 &&
                              handlePageChange(pagination.page - 1)
                            }
                            className={
                              pagination.page <= 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>

                        {Array.from(
                          { length: pagination.totalPages },
                          (_, i) => i + 1,
                        ).map((page) => {
                          // Show first page, last page, current page, and pages around current
                          const showPage =
                            page === 1 ||
                            page === pagination.totalPages ||
                            Math.abs(page - pagination.page) <= 1;

                          const showEllipsisBefore =
                            page === pagination.page - 2 && pagination.page > 3;
                          const showEllipsisAfter =
                            page === pagination.page + 2 &&
                            pagination.page < pagination.totalPages - 2;

                          if (showEllipsisBefore || showEllipsisAfter) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }

                          if (!showPage) return null;

                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={page === pagination.page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              pagination.page < pagination.totalPages &&
                              handlePageChange(pagination.page + 1)
                            }
                            className={
                              pagination.page >= pagination.totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
