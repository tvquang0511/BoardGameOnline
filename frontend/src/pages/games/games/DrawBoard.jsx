import React, { useEffect, useMemo, useRef, useState } from "react";
import GameBoardFrame from "../components/GameBoardFrame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#111827", "#ef4444", "#22c55e", "#3b82f6", "#a855f7"];

export default function DrawBoard({ state, setState, onScore }) {
  const canvasRef = useRef(null);
  const [isDown, setIsDown] = useState(false);

  const color = useMemo(() => COLORS[state.colorIndex || 0], [state.colorIndex]);
  const lineWidth = useMemo(() => state.lineWidth || 4, [state.lineWidth]);

  useEffect(() => {
    // restore from strokes
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    (state.strokes || []).forEach((s) => {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      s.points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    });
  }, [state.strokes]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    return { x, y };
  };

  const start = (e) => {
    setIsDown(true);
    const p = getPos(e);
    setState((prev) => ({
      ...prev,
      strokes: [...(prev.strokes || []), { color, lineWidth, points: [p] }],
    }));
    onScore?.(1);
  };

  const move = (e) => {
    if (!isDown) return;
    const p = getPos(e);
    setState((prev) => {
      const strokes = [...(prev.strokes || [])];
      if (!strokes.length) return prev;
      strokes[strokes.length - 1] = {
        ...strokes[strokes.length - 1],
        points: [...strokes[strokes.length - 1].points, p],
      };
      return { ...prev, strokes };
    });
  };

  const end = () => setIsDown(false);

  const clear = () => setState((prev) => ({ ...prev, strokes: [] }));
  const undo = () =>
    setState((prev) => ({ ...prev, strokes: (prev.strokes || []).slice(0, -1) }));

  return (
    <GameBoardFrame
      title="Bảng vẽ"
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Color: {color}</Badge>
          <Badge variant="secondary">Width: {lineWidth}</Badge>
          <Button variant="outline" size="sm" onClick={undo}>
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={clear}>
            Clear
          </Button>
        </div>
      }
    >
      <div className="flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full max-w-3xl rounded-md border bg-white"
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
        />
      </div>
    </GameBoardFrame>
  );
}