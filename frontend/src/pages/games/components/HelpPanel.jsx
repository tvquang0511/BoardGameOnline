import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPanel({ gameId }) {
  const common = [
    "Left/Right: di chuyển con trỏ / đổi hướng tuỳ game.",
    "Enter: chọn / thao tác.",
    "Back (Esc): quay lại danh sách game.",
    "Help (H hoặc ?): bật/tắt panel gợi ý.",
    "Save/Load: lưu/tải state ngay trên máy (localStorage).",
  ];

  const byGame = {
    tictactoe: ["Mục tiêu: 3 liên tiếp.", "Bạn đi trước (X), máy đi sau (O, random hợp lệ)."],
    caro4: ["Mục tiêu: 4 liên tiếp.", "Bàn 10x10.", "Máy random nước hợp lệ."],
    caro5: ["Mục tiêu: 5 liên tiếp.", "Bàn 15x15.", "Máy random nước hợp lệ."],
    snake: ["Left/Right: đổi hướng (xoay trái/phải tương đối).", "Enter: pause/resume.", "Ăn mồi +10 điểm."],
    match3: ["Left/Right: di chuyển con trỏ.", "Enter: chọn 1 ô, rồi Enter lần 2 để đổi chỗ với ô kề (trái/phải)."],
    memory: ["Left/Right: di chuyển.", "Enter: lật thẻ.", "Ghép cặp giống nhau để ghi điểm."],
    draw: ["Dùng chuột để vẽ.", "Enter: đổi màu nét.", "Left/Right: đổi độ dày nét."],
  };

  const lines = [...common, ...(byGame[gameId] || [])];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hint / Help</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {lines.map((t, idx) => (
          <div key={idx}>• {t}</div>
        ))}
      </CardContent>
    </Card>
  );
}