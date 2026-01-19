import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Settings } from "lucide-react";
import { gamesApi } from "../../api/games.api";
import { adminApi } from "@/api/admin.api";

const EMOJI_BY_SLUG = {
  caro5: "⭕",
  caro4: "🔵",
  tictactoe: "❌",
  snake: "🐍",
  match3: "💎",
  candy: "🍬",
};

export default function GameManagement({ onLogout }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);

  // editing modal state
  const [editingGame, setEditingGame] = useState(null); // game object
  const [editingConfig, setEditingConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await gamesApi.list({ all: true });
      setGames(data.games || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {
      // TODO(API): error state
    });
  }, []);

  const viewGames = useMemo(() => {
    return games.map((g) => ({
      id: g.id,
      slug: g.slug,
      name: g.name,
      emoji: EMOJI_BY_SLUG[g.slug] || "🎮",
      status: g.status,
      players: 0, // TODO: analytics
      avgTime: "—",
      difficulty: "medium",
      default_config: g.default_config || {},
    }));
  }, [games]);

  const toggleGameStatus = async (gameId) => {
    const g = games.find((x) => x.id === gameId);
    if (!g) return;
    const newStatus = g.status === "active" ? "inactive" : "active";
    await gamesApi.update(gameId, { status: newStatus });
    await load();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Hoạt động</Badge>;
      case "inactive":
        return <Badge variant="secondary">Không hoạt động</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-500">Bảo trì</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // open editor for a game
  const openConfig = (game) => {
    // ensure default_config has expected shape
    const dc = game.default_config || {};
    const board = dc.board || { rows: 15, cols: 15 };
    const cfg = {
      board: {
        rows: board.rows || board.cols || 15,
        cols: board.cols || board.rows || 15,
      },
      time_limit_seconds:
        typeof dc.time_limit_seconds === "number"
          ? dc.time_limit_seconds
          : 1800,
      win_score:
        typeof dc.win_score === "number"
          ? dc.win_score
          : dc.win_score_default || 100,
    };
    setEditingGame(game);
    setEditingConfig(cfg);
    setDialogOpen(true);
  };

  const closeConfig = () => {
    setEditingGame(null);
    setEditingConfig(null);
    setDialogOpen(false);
    setSaving(false);
  };

  const handleSaveConfig = async () => {
    if (!editingGame || !editingConfig) return;
    // basic validation
    const rows = parseInt(editingConfig.board.rows, 10);
    const cols = parseInt(editingConfig.board.cols, 10);
    const t = parseInt(editingConfig.time_limit_seconds, 10);
    const winScore = parseInt(editingConfig.win_score, 10);

    if (!rows || !cols || rows <= 0 || cols <= 0) {
      alert("Kích thước bàn phải là số dương");
      return;
    }
    if (!t || t <= 0) {
      alert("Thời gian tối đa phải là số giây lớn hơn 0");
      return;
    }

    const payload = {
      default_config: {
        ...(editingGame.default_config || {}),
        board: { rows, cols },
        time_limit_seconds: t,
        win_score: winScore,
      },
    };

    setSaving(true);
    try {
      await adminApi.updateGame(editingGame.id, payload);
      await load();
      closeConfig();
      alert("Lưu cấu hình thành công");
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Lỗi khi lưu cấu hình";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Quản lý Game</h1>
            <p className="text-gray-600">Cấu hình và quản lý các trò chơi</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {viewGames.map((game) => (
              <Card key={game.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">{game.emoji}</div>
                      <div>
                        <h3 className="text-lg font-semibold">{game.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(game.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Người chơi</p>
                      <p className="font-semibold">
                        {game.players.toLocaleString()}{" "}
                        {/* TODO(API MISSING) */}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={game.status === "active"}
                        onCheckedChange={() => toggleGameStatus(game.id)}
                      />
                      <Label className="text-sm">
                        {game.status === "active" ? "Kích hoạt" : "Vô hiệu hóa"}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openConfig(game)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Cấu hình
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Config dialog (controlled) */}
        <Dialog
          open={dialogOpen}
          onOpenChange={(v) => {
            if (!v) closeConfig(); /* keep close handler */
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cấu hình {editingGame?.name || ""}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rows">Rows (số hàng)</Label>
                  <Input
                    id="rows"
                    type="number"
                    value={editingConfig?.board?.rows ?? ""}
                    onChange={(e) =>
                      setEditingConfig((p) => ({
                        ...p,
                        board: { ...(p?.board || {}), rows: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cols">Cols (số cột)</Label>
                  <Input
                    id="cols"
                    type="number"
                    value={editingConfig?.board?.cols ?? ""}
                    onChange={(e) =>
                      setEditingConfig((p) => ({
                        ...p,
                        board: { ...(p?.board || {}), cols: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_limit">Thời gian tối đa (giây)</Label>
                <Input
                  id="time_limit"
                  type="number"
                  value={editingConfig?.time_limit_seconds ?? ""}
                  onChange={(e) =>
                    setEditingConfig((p) => ({
                      ...p,
                      time_limit_seconds: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="win_score">Điểm thưởng khi thắng</Label>
                <Input
                  id="win_score"
                  type="number"
                  value={editingConfig?.win_score ?? ""}
                  onChange={(e) =>
                    setEditingConfig((p) => ({
                      ...p,
                      win_score: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleSaveConfig}
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu cấu hình"}
                </Button>
                <Button variant="ghost" onClick={closeConfig} disabled={saving}>
                  Hủy
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
