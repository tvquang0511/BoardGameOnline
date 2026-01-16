import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, RotateCcw, ArrowLeft, Palette } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatTime(sec) {
  if (sec == null || Number.isNaN(Number(sec))) return "--:--";
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function ControlsCard({
  mode,
  gameId,
  gameName,
  score,
  timeSeconds,
  timeLimitSeconds,
  remainingSeconds,
  winScore,
  onResetGame,
  onBackToSelect,
  onToggleHelp,
  helpOn,

  // pixel controls
  pixelColorId,
  pixelColors,
  onPixelSetColor,
}) {
  // percentage for a simple progress bar (0..100)
  const progressPercent =
    typeof timeLimitSeconds === "number" && timeLimitSeconds > 0 && typeof remainingSeconds === "number"
      ? Math.round((remainingSeconds / timeLimitSeconds) * 100)
      : null;

  // low-time indicator if remaining less than 15% or <=10s
  const isLowTime =
    (typeof remainingSeconds === "number" && typeof timeLimitSeconds === "number" && remainingSeconds <= Math.max(10, Math.floor(timeLimitSeconds * 0.15))) ||
    (typeof remainingSeconds === "number" && remainingSeconds <= 10);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Điều khiển</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Badge variant={mode === "select" ? "secondary" : "outline"}>
          Mode: {mode.toUpperCase()}
        </Badge>

        {gameName ? <Badge variant="secondary">{gameName}</Badge> : null}

        <Badge variant="outline">Score: {score}</Badge>

        {typeof winScore === "number" && winScore > 0 ? (
          <Badge variant="outline">Win score: {winScore}</Badge>
        ) : null}

        <Badge variant="outline">Time: {formatTime(timeSeconds)}</Badge>

        {typeof timeLimitSeconds === "number" ? (
          <Badge variant="outline">Limit: {formatTime(timeLimitSeconds)}</Badge>
        ) : null}

        {typeof remainingSeconds === "number" ? (
          <Badge
            // keep badge variant but add red text when low time
            className={isLowTime ? "text-red-600" : ""}
            variant={isLowTime ? "secondary" : "outline"}
          >
            Remaining: {formatTime(remainingSeconds)}
          </Badge>
        ) : null}

        {/* simple progress bar under badges when time limit exists */}
        {progressPercent !== null ? (
          <div className="w-full mt-1">
            <div className="h-2 w-full bg-muted rounded overflow-hidden">
              <div
                className={`h-2 transition-all ${isLowTime ? "bg-red-500" : "bg-emerald-500"}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {progressPercent}% remaining
            </div>
          </div>
        ) : null}

        {mode === "play" && gameId === "pixel" ? (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Badge variant="outline" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Color
            </Badge>

            <Select
              value={pixelColorId}
              onValueChange={(v) => onPixelSetColor?.(v)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Chọn màu" />
              </SelectTrigger>
              <SelectContent>
                {(pixelColors || []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-xs text-muted-foreground">
              Tip: Enter/Space để tô pixel theo màu đang chọn
            </div>
          </>
        ) : null}

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={onResetGame}
          disabled={mode !== "play"}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onBackToSelect}
          disabled={mode !== "play"}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          variant={helpOn ? "secondary" : "outline"}
          size="sm"
          onClick={onToggleHelp}
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          Help (E)
        </Button>

        <div className="ml-auto text-xs text-muted-foreground">
          Move: WASD/↑↓←→ • Select: Enter/Space • Back: Esc • Help: E
        </div>
      </CardContent>
    </Card>
  );
}