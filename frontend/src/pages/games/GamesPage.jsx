import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { GAMES } from "./games.registry";

export default function GamesPage({ onLogout }) {
  const navigate = useNavigate();

  const items = useMemo(() => GAMES, []);

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Games</h1>
          <p className="text-muted-foreground">
            Chọn trò chơi để bắt đầu. Giao diện bàn game đã thống nhất theo một GameShell.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((g) => (
            <Card
              key={g.id}
              className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
              onClick={() => navigate(`/game/${g.id}`)}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${g.gradient} flex items-center justify-center text-3xl`}
                >
                  {g.emoji}
                </div>
                <div className="font-semibold text-sm">{g.name}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2">💡 Hướng dẫn phím</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Left/Right: điều khiển theo từng game</li>
              <li>• Enter: chọn/xác nhận</li>
              <li>• Back: Esc / Backspace để quay lại</li>
              <li>• Hint/Help: H hoặc ? để bật/tắt</li>
              <li>• Save/Load: lưu/tải tiến trình (localStorage)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}