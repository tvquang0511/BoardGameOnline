import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock } from "lucide-react";
import { achievementsApi } from "../../api/achievements.api";

export default function Achievements({ onLogout }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await achievementsApi.progress();
        if (!mounted) return;
        setAchievements(data.achievements || []);
      } catch (err) {
        console.error("Failed to load achievements:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { unlocked, locked, categories } = useMemo(() => {
    const unlockedList = achievements.filter((a) => !!a.unlocked_at);
    const lockedList = achievements.filter((a) => !a.unlocked_at);

    const categorySet = new Set(
      achievements.map((a) => a.category || "gameplay"),
    );

    return {
      unlocked: unlockedList,
      locked: lockedList,
      categories: Array.from(categorySet),
    };
  }, [achievements]);

  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === "all") return achievements;
    return achievements.filter((a) => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "Common":
        return "bg-gray-500";
      case "Rare":
        return "bg-blue-500";
      case "Epic":
        return "bg-purple-500";
      case "Legendary":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      gameplay: "Gameplay",
      social: "Xã hội",
      level: "Cấp độ",
      collection: "Sưu tầm",
    };
    return labels[category] || category;
  };

  const totalCount = achievements.length;

  if (loading) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Thành tựu</h1>
          <p className="text-gray-600">
            Bạn đã mở khóa {unlocked.length}/{totalCount} thành tựu
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Đã mở khóa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {unlocked.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Đang tiến hành</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {locked.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tỷ lệ hoàn thành</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {totalCount
                  ? Math.round((unlocked.length / totalCount) * 100)
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tất cả ({totalCount})
          </button>
          {categories.map((cat) => {
            const count = achievements.filter((a) => a.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {getCategoryLabel(cat)} ({count})
              </button>
            );
          })}
        </div>

        <Tabs defaultValue="unlocked" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unlocked">
              Đã mở khóa (
              {filteredAchievements.filter((a) => a.unlocked_at).length})
            </TabsTrigger>
            <TabsTrigger value="locked">
              Chưa mở khóa (
              {filteredAchievements.filter((a) => !a.unlocked_at).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unlocked" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements
                .filter((a) => a.unlocked_at)
                .map((achievement) => (
                  <Card
                    key={achievement.code}
                    className="overflow-hidden border-2 border-green-200 bg-gradient-to-br from-white to-green-50"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center text-3xl flex-shrink-0 shadow-lg`}
                        >
                          {achievement.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-lg">
                              {achievement.name}
                            </h3>
                            <Badge
                              className={getRarityColor(achievement.rarity)}
                            >
                              {achievement.rarity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-yellow-600 font-semibold">
                              +{achievement.points} pts
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {new Date(
                                achievement.unlocked_at,
                              ).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            {filteredAchievements.filter((a) => a.unlocked_at).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Chưa có thành tựu nào được mở khóa trong danh mục này
              </div>
            )}
          </TabsContent>

          <TabsContent value="locked" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAchievements
                .filter((a) => !a.unlocked_at)
                .map((achievement) => (
                  <Card
                    key={achievement.code}
                    className="overflow-hidden opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="relative w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center text-3xl flex-shrink-0">
                          <span className="opacity-30">{achievement.icon}</span>
                          <Lock className="w-6 h-6 text-gray-600 absolute" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-gray-700">
                              {achievement.name}
                            </h3>
                            <Badge
                              className={getRarityColor(achievement.rarity)}
                            >
                              {achievement.rarity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            {achievement.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Tiến độ</span>
                              <span className="font-medium">
                                {achievement.current}/{achievement.target}
                              </span>
                            </div>
                            <Progress
                              value={achievement.progress}
                              className="h-2"
                            />
                            <div className="text-xs text-gray-500">
                              +{achievement.points} điểm khi hoàn thành
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            {filteredAchievements.filter((a) => !a.unlocked_at).length ===
              0 && (
              <div className="text-center py-12 text-gray-500">
                Đã mở khóa tất cả thành tựu trong danh mục này! 🎉
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
