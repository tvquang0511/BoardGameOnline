import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Timer, Trophy } from "lucide-react";

export default function GameStatsBar({
  score,
  timeSeconds,
  timeLimitSeconds,
  onChangeTimeLimitSeconds,
}) {
  const mm = String(Math.floor(timeSeconds / 60)).padStart(2, "0");
  const ss = String(timeSeconds % 60).padStart(2, "0");

  return (
    <Card>
      <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-5 w-5" />
          <div className="text-sm">
            <div className="text-muted-foreground">Score</div>
            <div className="font-semibold">{score}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Timer className="h-5 w-5" />
          <div className="text-sm">
            <div className="text-muted-foreground">Time</div>
            <div className="font-semibold">{mm}:{ss}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Time limit (sec)</div>
          <Input
            type="number"
            className="w-32"
            value={timeLimitSeconds}
            onChange={(e) => onChangeTimeLimitSeconds?.(Number(e.target.value || 0))}
            min={0}
          />
        </div>
      </CardContent>
    </Card>
  );
}