import React, { useEffect, useMemo, useReducer, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { attachKeyboardControls } from "./keyboard";
import { getGameById } from "./games.registry";
import { loadFromLocal, saveToLocal, listLocalSaves } from "./storage";

import GameControls from "./components/GameControls";
import GameStatsBar from "./components/GameStatsBar";
import GameBoardFrame from "./components/GameBoardFrame";
import HelpPanel from "./components/HelpPanel";

import { createTicTacToeState, reduceTicTacToe } from "./games/engine.tictactoe";
import { createCaroState, reduceCaro } from "./games/engine.caro";
import { createSnakeState, reduceSnake } from "./games/engine.snake";
import { createMatch3State, reduceMatch3, colorToClass } from "./games/engine.match3";
import { createMemoryState, reduceMemory, idToEmoji } from "./games/engine.memory";
import DrawBoard from "./games/DrawBoard";

function useGameEngine(gameId) {
  // returns: { initState, reducer, viewType }
  if (gameId === "tictactoe") {
    return { initState: createTicTacToeState(), reducer: reduceTicTacToe, viewType: "BOARD3" };
  }
  if (gameId === "caro4") {
    return { initState: createCaroState({ size: 10, winLen: 4 }), reducer: reduceCaro, viewType: "CARO" };
  }
  if (gameId === "caro5") {
    return { initState: createCaroState({ size: 15, winLen: 5 }), reducer: reduceCaro, viewType: "CARO" };
  }
  if (gameId === "snake") {
    return { initState: createSnakeState({ rows: 20, cols: 20 }), reducer: reduceSnake, viewType: "SNAKE" };
  }
  if (gameId === "match3") {
    return { initState: createMatch3State({ size: 8 }), reducer: reduceMatch3, viewType: "MATCH3" };
  }
  if (gameId === "memory") {
    return { initState: createMemoryState({ size: 4 }), reducer: reduceMemory, viewType: "MEMORY" };
  }
  if (gameId === "draw") {
    return {
      initState: { strokes: [], colorIndex: 0, lineWidth: 4, score: 0 },
      reducer: (s, a) => {
        if (a.type === "SET") return { ...s, ...a.patch };
        if (a.type === "RESET") return { strokes: [], colorIndex: 0, lineWidth: 4, score: 0 };
        return s;
      },
      viewType: "DRAW",
    };
  }
  return { initState: { score: 0 }, reducer: (s) => s, viewType: "UNKNOWN" };
}

export default function GameShell({ onLogout }) {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const game = getGameById(gameId);

  const { initState, reducer, viewType } = useGameEngine(gameId);

  const [state, dispatch] = useReducer(reducer, initState);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(0); // 0 = no limit
  const [showHelp, setShowHelp] = useState(false);

  const score = useMemo(() => {
    if (viewType === "DRAW") return state.score || 0;
    return state.score || 0;
  }, [state, viewType]);

  // timer tick
  useEffect(() => {
    const t = setInterval(() => setTimeSeconds((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // snake tick + memory auto close tick
  useEffect(() => {
    if (viewType !== "SNAKE") return undefined;
    const ms = state.tickMs || 180;
    const t = setInterval(() => dispatch({ type: "TICK" }), ms);
    return () => clearInterval(t);
  }, [viewType, state.tickMs]);

  useEffect(() => {
    if (viewType !== "MEMORY") return undefined;
    if (!state.lock) return undefined;
    const t = setTimeout(() => dispatch({ type: "TICK" }), 650);
    return () => clearTimeout(t);
  }, [viewType, state.lock]);

  // time limit
  useEffect(() => {
    if (!timeLimitSeconds || timeLimitSeconds <= 0) return;
    if (timeSeconds < timeLimitSeconds) return;
    // hết giờ => reset game (đơn giản)
    dispatch({ type: "RESET" });
    setTimeSeconds(0);
  }, [timeSeconds, timeLimitSeconds]);

  const handleBack = () => navigate("/games");

  const onAction = (action) => {
    if (!game) return;

    if (action === "HELP") {
      setShowHelp((v) => !v);
      return;
    }

    if (viewType === "SNAKE") {
      if (action === "LEFT") dispatch({ type: "TURN", turn: "LEFT" });
      else if (action === "RIGHT") dispatch({ type: "TURN", turn: "RIGHT" });
      else if (action === "ENTER") dispatch({ type: "TOGGLE_PAUSE" });
      return;
    }

    if (viewType === "DRAW") {
      if (action === "LEFT") dispatch({ type: "SET", patch: { lineWidth: Math.max(1, (state.lineWidth || 4) - 1) } });
      else if (action === "RIGHT") dispatch({ type: "SET", patch: { lineWidth: Math.min(24, (state.lineWidth || 4) + 1) } });
      else if (action === "ENTER") dispatch({ type: "SET", patch: { colorIndex: ((state.colorIndex || 0) + 1) % 5 } });
      return;
    }

    if (action === "LEFT") dispatch({ type: "MOVE_CURSOR", dir: -1 });
    if (action === "RIGHT") dispatch({ type: "MOVE_CURSOR", dir: +1 });
    if (action === "ENTER") dispatch({ type: "ENTER" });
  };

  useEffect(() => {
    return attachKeyboardControls({
      onAction: (a) => {
        if (a === "BACK") handleBack();
        else onAction(a);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, viewType, state]);

  const onSave = () => {
    if (!game) return;
    saveToLocal({
      gameId,
      slot: "default",
      data: {
        state,
        timeSeconds,
        timeLimitSeconds,
      },
    });
    alert("Đã Save (localStorage)!");
  };

  const onLoad = () => {
    if (!game) return;
    const payload = loadFromLocal({ gameId, slot: "default" });
    if (!payload?.data) {
      alert("Chưa có save nào!");
      return;
    }
    const { state: savedState, timeSeconds: t, timeLimitSeconds: tl } = payload.data;
    // nạp state: dùng dispatch kiểu SET cho draw, còn lại thay bằng RESET + patch thủ công (đơn giản: reload bằng hack reducer)
    // Cách an toàn trong JS: set bằng cách dispatch một action custom nếu reducer hỗ trợ.
    // Ở đây: dùng window.location để reload vào state saved? Không.
    // => Chọn cách: thay reducer state bằng cách dispatch action "LOAD" nếu reducer hiểu.
    // Vì reducer từng game ở trên không có LOAD, nên mình sẽ dùng giải pháp: lưu thẳng vào localStorage và người dùng copy? Không.
    // => Giải pháp nhẹ: dùng "replaceState" bằng cách bọc thêm reducer ngoài (phức tạp).
    // => Thực tế: dễ nhất là refresh page với state saved trong query/localStorage rồi init bằng đó.
    // Mình làm cách này: set temp key rồi reload.
    localStorage.setItem(`bgo.runtime.load.${gameId}`, JSON.stringify(payload.data));
    window.location.reload();
  };

  // runtime load on mount (after reload)
  useEffect(() => {
    const k = `bgo.runtime.load.${gameId}`;
    const raw = localStorage.getItem(k);
    if (!raw) return;
    localStorage.removeItem(k);
    try {
      const data = JSON.parse(raw);
      // set time
      if (typeof data.timeSeconds === "number") setTimeSeconds(data.timeSeconds);
      if (typeof data.timeLimitSeconds === "number") setTimeLimitSeconds(data.timeLimitSeconds);

      // set state:
      if (viewType === "DRAW") {
        dispatch({ type: "SET", patch: data.state || {} });
      } else {
        // HACK: overwrite by forcing a "RESET" then mutating via custom "LOAD" using reducer wrapper pattern:
        // simplest: store in window and read here, but still need to set reducer state.
        // In React, we can't directly set useReducer state without dispatch.
        // => workaround: we reload page with initialState from storage by using a key in component state
        // But it's too late in lifecycle. So we do a second reload with an init override:
        localStorage.setItem(`bgo.runtime.init.${gameId}`, JSON.stringify(data.state || {}));
        window.location.reload();
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // init override (before render) - implemented by forcing component key
  const [bootKey] = useState(() => {
    const k = `bgo.runtime.init.${gameId}`;
    const raw = localStorage.getItem(k);
    if (!raw) return "boot";
    localStorage.removeItem(k);
    try {
      const override = JSON.parse(raw);
      // monkey patch initState by mutating; okay for JS
      Object.assign(initState, override);
      return "boot_loaded";
    } catch {
      return "boot";
    }
  });

  if (!game) {
    return (
      <Layout onLogout={onLogout}>
        <Card>
          <CardHeader>
            <CardTitle>Game không tồn tại</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/games")}>Quay lại</Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  const statusBadge = (() => {
    if (viewType === "SNAKE") {
      if (state.dead) return <Badge variant="destructive">DEAD</Badge>;
      if (state.paused) return <Badge variant="secondary">PAUSED</Badge>;
      return <Badge variant="default">RUNNING</Badge>;
    }
    if (state.winner) return <Badge variant="secondary">Kết quả: {state.winner}</Badge>;
    return <Badge variant="outline">VS Computer</Badge>;
  })();

  const board = (() => {
    if (viewType === "DRAW") {
      return (
        <DrawBoard
          state={state}
          setState={(fn) => {
            const next = typeof fn === "function" ? fn(state) : fn;
            dispatch({ type: "SET", patch: next });
          }}
          onScore={(delta) => dispatch({ type: "SET", patch: { score: (state.score || 0) + delta } })}
        />
      );
    }

    if (viewType === "BOARD3") {
      return (
        <GameBoardFrame
          title="Bàn game"
          footer={
            <div className="text-sm text-muted-foreground">
              Cursor: {state.cursor} • Turn: {state.turn}
            </div>
          }
        >
          <div className="flex items-center justify-center">
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
              {state.board.map((v, i) => (
                <button
                  key={i}
                  className={[
                    "h-20 w-20 rounded-md border text-3xl font-bold",
                    "bg-background hover:bg-muted transition-colors",
                    i === state.cursor ? "ring-2 ring-primary" : "",
                  ].join(" ")}
                  onClick={() => dispatch({ type: "MOVE_CURSOR", dir: i - state.cursor })}
                  onDoubleClick={() => dispatch({ type: "ENTER" })}
                >
                  {v || ""}
                </button>
              ))}
            </div>
          </div>
        </GameBoardFrame>
      );
    }

    if (viewType === "CARO") {
      const size = state.size;
      return (
        <GameBoardFrame
          title={`Bàn game (${size}x${size})`}
          footer={
            <div className="text-sm text-muted-foreground">
              Win: {state.winLen} • Turn: {state.turn} • Moves: {state.moves}
            </div>
          }
        >
          <div className="flex items-center justify-center">
            <div
              className="grid gap-1 rounded-md border bg-muted p-2"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {state.board.map((v, i) => (
                <button
                  key={i}
                  className={[
                    "h-7 w-7 sm:h-8 sm:w-8 rounded-sm border",
                    "bg-background hover:bg-accent transition-colors text-xs font-semibold",
                    i === state.cursor ? "ring-2 ring-primary" : "",
                  ].join(" ")}
                  onClick={() => dispatch({ type: "MOVE_CURSOR", dir: i - state.cursor })}
                  onDoubleClick={() => dispatch({ type: "ENTER" })}
                >
                  {v || ""}
                </button>
              ))}
            </div>
          </div>
        </GameBoardFrame>
      );
    }

    if (viewType === "SNAKE") {
      const rows = state.rows;
      const cols = state.cols;
      const snakeSet = new Set(state.snake.map((p) => `${p.r},${p.c}`));
      const foodKey = `${state.food.r},${state.food.c}`;

      return (
        <GameBoardFrame
          title={`Bàn game (${rows}x${cols})`}
          footer={
            <div className="text-sm text-muted-foreground">
              Left/Right đổi hướng • Enter pause/resume • Tick: {state.tickMs}ms
            </div>
          }
        >
          <div className="flex items-center justify-center">
            <div
              className="grid gap-0.5 rounded-md border bg-muted p-2"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: rows * cols }).map((_, i) => {
                const r = Math.floor(i / cols);
                const c = i % cols;
                const k = `${r},${c}`;
                const isSnake = snakeSet.has(k);
                const isFood = k === foodKey;
                return (
                  <div
                    key={i}
                    className={[
                      "h-3 w-3 sm:h-4 sm:w-4 rounded-[2px]",
                      isFood ? "bg-red-500" : isSnake ? "bg-green-500" : "bg-background",
                    ].join(" ")}
                  />
                );
              })}
            </div>
          </div>
        </GameBoardFrame>
      );
    }

    if (viewType === "MATCH3") {
      const size = state.size;
      return (
        <GameBoardFrame
          title={`Bàn game (${size}x${size})`}
          footer={
            <div className="text-sm text-muted-foreground">
              Enter: chọn ô • Enter lần 2 để swap với ô hiện tại (chỉ khi kề nhau)
            </div>
          }
        >
          <div className="flex items-center justify-center">
            <div
              className="grid gap-1 rounded-md border bg-muted p-2"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {state.board.map((v, i) => {
                const isCursor = i === state.cursor;
                const isSelected = i === state.selected;
                return (
                  <button
                    key={i}
                    className={[
                      "h-9 w-9 rounded-sm border",
                      "transition-colors",
                      colorToClass(v),
                      isSelected ? "ring-4 ring-white" : "",
                      isCursor ? "outline outline-2 outline-primary" : "",
                    ].join(" ")}
                    onClick={() => dispatch({ type: "MOVE_CURSOR", dir: i - state.cursor })}
                    onDoubleClick={() => dispatch({ type: "ENTER" })}
                    title={v}
                  />
                );
              })}
            </div>
          </div>
        </GameBoardFrame>
      );
    }

    if (viewType === "MEMORY") {
      const size = state.size;
      return (
        <GameBoardFrame
          title={`Bàn game (${size}x${size})`}
          footer={
            <div className="text-sm text-muted-foreground">
              Moves: {state.moves} • Pairs matched: {state.deck.filter((c) => c.matched).length / 2}
            </div>
          }
        >
          <div className="flex items-center justify-center">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
            >
              {state.deck.map((card, i) => {
                const isCursor = i === state.cursor;
                const face = card.matched || card.revealed ? idToEmoji(card.id) : "❓";
                return (
                  <button
                    key={i}
                    className={[
                      "h-16 w-16 rounded-md border text-2xl",
                      "bg-background hover:bg-muted transition-colors",
                      isCursor ? "ring-2 ring-primary" : "",
                      card.matched ? "opacity-60" : "",
                    ].join(" ")}
                    onClick={() => dispatch({ type: "MOVE_CURSOR", dir: i - state.cursor })}
                    onDoubleClick={() => dispatch({ type: "ENTER" })}
                  >
                    {face}
                  </button>
                );
              })}
            </div>
          </div>
        </GameBoardFrame>
      );
    }

    return (
      <GameBoardFrame title="Chưa hỗ trợ">
        <div className="text-sm text-muted-foreground">Game này chưa có engine.</div>
      </GameBoardFrame>
    );
  })();

  return (
    <Layout onLogout={onLogout} key={bootKey}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center text-2xl`}>
                {game.emoji}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{game.name}</h1>
                <div className="text-sm text-muted-foreground">{game.description}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge}
            <Button variant="outline" onClick={() => dispatch({ type: "RESET" })}>
              Reset
            </Button>
          </div>
        </div>

        <GameStatsBar
          score={score}
          timeSeconds={timeSeconds}
          timeLimitSeconds={timeLimitSeconds}
          onChangeTimeLimitSeconds={setTimeLimitSeconds}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <GameControls
            onAction={onAction}
            onSave={onSave}
            onLoad={onLoad}
            onBack={handleBack}
            showHelp={showHelp}
          />
          <div className="text-xs text-muted-foreground">
            Hotkeys: ←/→, Enter, Esc, H/?
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">{board}</div>
          <div className="lg:col-span-1 space-y-4">
            {showHelp ? <HelpPanel gameId={gameId} /> : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Local saves</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {listLocalSaves({ gameId }).slice(0, 5).map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <div className="text-muted-foreground truncate">
                      {s.savedAt || "unknown"}
                    </div>
                    <Badge variant="outline">{s.slot || "default"}</Badge>
                  </div>
                ))}
                <div className="text-xs text-muted-foreground">
                  Save/Load đang dùng localStorage để chạy ngay. Nếu bạn muốn mình đổi sang API `/api/saved-games` của backend, nói mình sẽ map lại.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}