import React, { useEffect, useMemo, useReducer, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { sessionsApi } from "@/api/sessions.api";
import { attachInput } from "./input";
import { wrap } from "./utils";

import Board from "./Board";
import ControlsCard from "./ControlsCard";
import { GAME_CONFIGS, getGameConfig } from "./games.config";
import { buildSelectCells, findSelectCell } from "./selectLayout";

import { createCaro, stepCaro, viewCaro } from "./engines/caro";
import { createTtt, stepTtt, viewTtt } from "./engines/tictactoe";
import { createSnake, stepSnake, viewSnake } from "./engines/snake";
import { createMatch3, stepMatch3, viewMatch3 } from "./engines/match3";
import { createMemory, stepMemory, viewMemory } from "./engines/memory";
import {
  createPixel,
  stepPixel,
  viewPixel,
  PIXEL_COLORS,
} from "./engines/pixel";

function initState(boardSize) {
  return {
    boardSize,
    mode: "select",
    activeGameId: null,
    cursor: { r: Math.floor(boardSize / 2), c: Math.floor(boardSize / 2) },

    caro4: createCaro({ boardSize, winLen: 4 }),
    caro5: createCaro({ boardSize, winLen: 5 }),
    tictactoe: createTtt({ boardSize }),
    snake: createSnake({ boardSize }),
    match3: createMatch3({ boardSize }),
    memory: createMemory({ boardSize }),
    pixel: createPixel({ boardSize }),
  };
}

function reducer(state, action) {
  const s = JSON.parse(JSON.stringify(state));

  if (action.type === "MOVE") {
    const { dir } = action;
    const size = s.boardSize;
    if (dir === "LEFT") s.cursor.c = wrap(s.cursor.c - 1, size);
    if (dir === "RIGHT") s.cursor.c = wrap(s.cursor.c + 1, size);
    if (dir === "UP") s.cursor.r = wrap(s.cursor.r - 1, size);
    if (dir === "DOWN") s.cursor.r = wrap(s.cursor.r + 1, size);
    return s;
  }

  if (action.type === "SET_MODE") {
    s.mode = action.mode;
    s.activeGameId = action.activeGameId ?? null;
    return s;
  }

  if (action.type === "RESET_GAME") {
    const id = s.activeGameId;
    if (id === "caro4")
      s.caro4 = createCaro({ boardSize: s.boardSize, winLen: 4 });
    if (id === "caro5")
      s.caro5 = createCaro({ boardSize: s.boardSize, winLen: 5 });
    if (id === "tictactoe") s.tictactoe = createTtt({ boardSize: s.boardSize });
    if (id === "snake") s.snake = createSnake({ boardSize: s.boardSize });
    if (id === "match3") s.match3 = createMatch3({ boardSize: s.boardSize });
    if (id === "memory") s.memory = createMemory({ boardSize: s.boardSize });
    if (id === "pixel") s.pixel = createPixel({ boardSize: s.boardSize });
    return s;
  }

  if (action.type === "GAME") {
    const { gameId, gameAction } = action;
    if (gameId === "caro4") s.caro4 = stepCaro(s.caro4, gameAction);
    if (gameId === "caro5") s.caro5 = stepCaro(s.caro5, gameAction);
    if (gameId === "tictactoe") s.tictactoe = stepTtt(s.tictactoe, gameAction);
    if (gameId === "snake") s.snake = stepSnake(s.snake, gameAction);
    if (gameId === "match3") s.match3 = stepMatch3(s.match3, gameAction);
    if (gameId === "memory") s.memory = stepMemory(s.memory, gameAction);
    if (gameId === "pixel") s.pixel = stepPixel(s.pixel, gameAction);
    return s;
  }

  return s;
}

export default function GamesPage({ onLogout }) {
  const { user } = useAuth();
  const BOARD_SIZE = 15;
  const [state, dispatch] = useReducer(reducer, BOARD_SIZE, initState);

  const selectCells = useMemo(
    () => buildSelectCells(state.boardSize),
    [state.boardSize]
  );

  const [timeSeconds, setTimeSeconds] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [gameResult, setGameResult] = useState(null); // 'win', 'lose', 'draw'

  const winner = (() => {
    const id = state.activeGameId;
    if (id === "caro4") return state.caro4.winner;
    if (id === "caro5") return state.caro5.winner;
    if (id === "tictactoe") return state.tictactoe.winner;
    if (id === "memory") return state.memory.done ? "WIN" : null;
    return null;
  })();

  // Timer only runs in play mode and game not finished
  useEffect(() => {
    if (state.mode !== "play" || winner) return;
    const t = setInterval(() => setTimeSeconds((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, [state.mode, winner]);

  useEffect(() => {
    if (state.mode !== "play" || state.activeGameId !== "snake") return;
    const ms = state.snake.tickMs || 160;
    const t = setInterval(
      () =>
        dispatch({
          type: "GAME",
          gameId: "snake",
          gameAction: { type: "TICK" },
        }),
      ms
    );
    return () => clearInterval(t);
  }, [state.mode, state.activeGameId, state.snake.tickMs]);

  useEffect(() => {
    if (state.mode !== "play" || state.activeGameId !== "memory") return;
    if (!state.memory.lock) return;
    const t = setTimeout(
      () =>
        dispatch({
          type: "GAME",
          gameId: "memory",
          gameAction: { type: "TICK" },
        }),
      650
    );
    return () => clearTimeout(t);
  }, [state.mode, state.activeGameId, state.memory.lock]);

  const activeConfig = state.activeGameId
    ? getGameConfig(state.activeGameId)
    : null;

  const score = (() => {
    const id = state.activeGameId;
    if (id === "caro4") return state.caro4.score;
    if (id === "caro5") return state.caro5.score;
    if (id === "tictactoe") return state.tictactoe.score;
    if (id === "snake") return state.snake.score;
    if (id === "match3") return state.match3.score;
    if (id === "memory") return state.memory.score;
    if (id === "pixel") return state.pixel.score;
    return 0;
  })();

  // Start session when game starts
  useEffect(() => {
    if (state.mode !== "play" || !state.activeGameId || !user || sessionId)
      return;

    const startSession = async () => {
      try {
        const result = await sessionsApi.start({
          gameSlug: state.activeGameId,
          mode: "ai",
          state: state[state.activeGameId],
        });
        setSessionId(result.session.id);
        console.log("🎮 Session started:", result.session.id);
      } catch (error) {
        console.error("❌ Failed to start session:", error);
      }
    };

    startSession();
  }, [state.mode, state.activeGameId, user, sessionId]);

  // Auto-finish session when game ends (ONLY ONCE)
  useEffect(() => {
    if (!winner || !sessionId || !state.activeGameId || sessionFinished) return;

    const finishSession = async () => {
      try {
        const result =
          winner === "X" || winner === "O"
            ? winner === "X"
              ? "win"
              : "lose"
            : winner === "WIN"
            ? "win"
            : "draw";

        // Show game result immediately (no delay)
        setGameResult(result);

        // Capture score and time at the moment of finishing
        const finalScore = score;
        const finalTime = timeSeconds;

        const response = await sessionsApi.finish(sessionId, {
          result,
          score: finalScore,
          duration_seconds: finalTime,
        });

        setSessionFinished(true);
        console.log(
          "✅ Session finished:",
          response.session.id,
          `Score: ${finalScore}, Time: ${finalTime}s, Result: ${result}`
        );
      } catch (error) {
        console.error("❌ Failed to finish session:", error);
      }
    };

    finishSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, sessionId, sessionFinished]);

  const onSelect = () => {
    const { r, c } = state.cursor;

    if (state.mode === "select") {
      const cell = findSelectCell(selectCells, r, c);
      if (!cell) return;

      dispatch({ type: "SET_MODE", mode: "play", activeGameId: cell.gameId });
      setTimeSeconds(0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
      return;
    }

    const id = state.activeGameId;
    if (!id) return;

    if (id === "snake") {
      dispatch({
        type: "GAME",
        gameId: "snake",
        gameAction: { type: "TOGGLE_PAUSE" },
      });
      return;
    }

    dispatch({
      type: "GAME",
      gameId: id,
      gameAction: { type: "SELECT", r, c },
    });
  };

  const onBack = () => {
    if (state.mode === "play") {
      dispatch({ type: "RESET_GAME" }); // Reset game state to clear winner
      dispatch({ type: "SET_MODE", mode: "select", activeGameId: null });
      setTimeSeconds(0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
    }
  };

  const onAction = (a) => {
    if (a === "HELP") {
      setShowHelp((v) => !v);
      return;
    }
    if (a === "BACK") {
      onBack();
      return;
    }
    if (a === "SELECT") {
      onSelect();
      return;
    }

    if (state.mode === "play" && state.activeGameId === "snake") {
      if (a === "UP" || a === "DOWN" || a === "LEFT" || a === "RIGHT") {
        dispatch({
          type: "GAME",
          gameId: "snake",
          gameAction: { type: "SET_DIR", dir: a },
        });
        return;
      }
    }

    dispatch({ type: "MOVE", dir: a });
  };

  useEffect(
    () => attachInput({ onAction }),
    [state.mode, state.activeGameId, state.cursor, selectCells]
  );

  const getCellView = (r, c) => {
    if (state.mode === "select") {
      const cell = findSelectCell(selectCells, r, c);
      if (cell) {
        const cfg = getGameConfig(cell.gameId);
        return {
          bgClass: cfg.selectColorBg,
          text: cfg.emoji,
          textClass: "text-sm",
          ring: true,
          noBorder: true, // ✅ remove border only for select cells
          title: `Chọn: ${cfg.name}`,
        };
      }
      return null;
    }

    const id = state.activeGameId;
    if (id === "caro4") return viewCaro({ state: state.caro4, r, c });
    if (id === "caro5") return viewCaro({ state: state.caro5, r, c });
    if (id === "tictactoe") return viewTtt({ state: state.tictactoe, r, c });
    if (id === "snake") return viewSnake({ state: state.snake, r, c });
    if (id === "match3") return viewMatch3({ state: state.match3, r, c });
    if (id === "memory") return viewMemory({ state: state.memory, r, c });
    if (id === "pixel") return viewPixel({ state: state.pixel, r, c });
    return null;
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Board Games</h1>
          <p className="text-muted-foreground">
            1 bàn game cố định cho tất cả trò chơi. Chọn game bằng ô màu trên
            bàn.
          </p>
        </div>

        <ControlsCard
          mode={state.mode}
          gameId={state.activeGameId}
          gameName={activeConfig?.name || ""}
          score={score}
          timeSeconds={timeSeconds}
          onResetGame={() => {
            dispatch({ type: "RESET_GAME" });
            setTimeSeconds(0);
            setSessionId(null);
            setSessionFinished(false);
            setGameResult(null);
          }}
          onBackToSelect={onBack}
          onToggleHelp={() => setShowHelp((v) => !v)}
          helpOn={showHelp}
          pixelColorId={state.pixel.colorId}
          pixelColors={PIXEL_COLORS}
          onPixelSetColor={(colorId) =>
            dispatch({
              type: "GAME",
              gameId: "pixel",
              gameAction: { type: "SET_COLOR", colorId },
            })
          }
        />

        {/* Game Result Notification */}
        {gameResult && (
          <Card
            className={`border-2 ${
              gameResult === "win"
                ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50"
                : gameResult === "lose"
                ? "border-red-500 bg-gradient-to-r from-red-50 to-rose-50"
                : "border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50"
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {gameResult === "win"
                  ? "🏆 Chiến thắng!"
                  : gameResult === "lose"
                  ? "😔 Thất bại"
                  : "🤝 Hòa"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-6xl">
                  {gameResult === "win"
                    ? "🎊"
                    : gameResult === "lose"
                    ? "💔"
                    : "🤷‍♂️"}
                </div>
                <div>
                  <p className="text-xl font-bold">
                    {gameResult === "win"
                      ? "Xuất sắc! Bạn đã chiến thắng!"
                      : gameResult === "lose"
                      ? "Đừng bỏ cuộc! Thử lại nhé!"
                      : "Kết quả hòa! Chơi lại để phân thắng bại!"}
                  </p>
                  <p className="text-lg text-muted-foreground mt-1">
                    Điểm số: {score} | Thời gian: {Math.floor(timeSeconds / 60)}
                    :{String(timeSeconds % 60).padStart(2, "0")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {state.mode === "select"
                ? "Chọn game (7 ô màu)"
                : `Đang chơi: ${activeConfig?.name || ""}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Board
              size={state.boardSize}
              cursor={state.cursor}
              getCellView={getCellView}
            />
          </CardContent>
        </Card>

        {showHelp ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Hướng dẫn</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div>• Move: WASD/↑↓←→</div>
              <div>• Select: Enter/Space</div>
              <div>• Back: Esc</div>
              <div>• Help: E</div>
              <div>• Match3: giờ dùng toàn bộ bàn game.</div>
              <div>• Memory: 5x5 (có 1 thẻ ⭐ Joker ghép với mọi thẻ).</div>
              <div>• Pixel: chọn màu trực tiếp trên card điều khiển.</div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {GAME_CONFIGS.map((g) => (
            <Card key={g.id} className="overflow-hidden">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${g.legendGradient} flex items-center justify-center text-3xl`}
                >
                  {g.emoji}
                </div>
                <h3 className="font-semibold text-sm">{g.name}</h3>
                <div className="text-xs text-muted-foreground">
                  Chọn bằng ô màu trên bàn
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
