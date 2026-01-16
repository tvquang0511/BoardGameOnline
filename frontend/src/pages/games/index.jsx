import React, { useEffect, useMemo, useReducer, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { sessionsApi } from "@/api/sessions.api";
import { savedGamesApi } from "@/api/savedGames.api";
import { gamesApi } from "@/api/games.api";
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
    // allow updating root boardSize when switching mode (so Board grid uses correct size)
    if (typeof action.boardSize === "number") {
      s.boardSize = action.boardSize;
      // also adjust cursor to center of new board
      s.cursor = {
        r: Math.floor(s.boardSize / 2),
        c: Math.floor(s.boardSize / 2),
      };
    }
    return s;
  }

  if (action.type === "SET_BOARD_SIZE") {
    if (typeof action.boardSize === "number") {
      s.boardSize = action.boardSize;
      s.cursor = {
        r: Math.floor(s.boardSize / 2),
        c: Math.floor(s.boardSize / 2),
      };
    }
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

    // Handle RESTORE_STATE action
    if (gameAction.type === "RESTORE_STATE") {
      s[gameId] = JSON.parse(JSON.stringify(gameAction.state)); // Deep copy to avoid reference issues
      console.log("📦 RESTORE_STATE:", gameId, s[gameId]);
      return s;
    }

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
  const DEFAULT_BOARD_SIZE = 15;
  const [state, dispatch] = useReducer(reducer, DEFAULT_BOARD_SIZE, initState);

  const selectCells = useMemo(
    () => buildSelectCells(state.boardSize),
    [state.boardSize]
  );

  const [timeSeconds, setTimeSeconds] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [gameResult, setGameResult] = useState(null); // 'win', 'lose', 'draw'
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [pendingGameId, setPendingGameId] = useState(null);
  const [autoSaveData, setAutoSaveData] = useState(null);

  // Winner detection: prefer engine-provided winner, otherwise check configured winScore for score-based games
  const winner = (() => {
    const id = state.activeGameId;
    if (!id) return null;

    // Engine-provided winners
    if (id === "caro4") return state.caro4.winner;
    if (id === "caro5") return state.caro5.winner;
    if (id === "tictactoe") return state.tictactoe.winner;

    // Memory uses done flag
    if (id === "memory") {
      return state.memory.done ? "WIN" : null;
    }

    // Snake: death => LOSE; also allow win by reaching configured winScore
    if (id === "snake") {
      if (state.snake.dead) return "LOSE";
      if (
        typeof state.snake.winScore === "number" &&
        state.snake.score >= state.snake.winScore
      )
        return "WIN";
      return null;
    }

    // Score-based games (match3, pixel): use configured winScore if present
    if (id === "match3") {
      if (
        typeof state.match3.winScore === "number" &&
        state.match3.score >= state.match3.winScore
      )
        return "WIN";
      return null;
    }
    if (id === "pixel") {
      if (
        typeof state.pixel.winScore === "number" &&
        state.pixel.score >= state.pixel.winScore
      )
        return "WIN";
      return null;
    }

    return null;
  })();

  // Timer only runs in play mode and game not finished or sessionFinished
  useEffect(() => {
    if (state.mode !== "play" || winner || sessionFinished) return;
    const t = setInterval(() => setTimeSeconds((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, [state.mode, winner, sessionFinished]);

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

  // Show game result immediately when winner detected (independent of session API)
  useEffect(() => {
    if (!winner || !state.activeGameId) return;

    const result =
      winner === "X" || winner === "WIN"
        ? "win"
        : winner === "O" || winner === "LOSE"
        ? "lose"
        : winner === "DRAW"
        ? "draw"
        : "draw";

    setGameResult(result);
    console.log("🏆 Game result set:", result);
  }, [winner, state.activeGameId]);

  // Auto-finish session when game ends (ONLY ONCE)
  useEffect(() => {
    if (!winner || !sessionId || !state.activeGameId || sessionFinished) return;

    const finishSession = async () => {
      try {
        const result =
          winner === "X" || winner === "WIN"
            ? "win"
            : winner === "O" || winner === "LOSE"
            ? "lose"
            : winner === "DRAW"
            ? "draw"
            : "draw";

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

  // Time limit watcher: finish game when exceeding configured time_limit_seconds
  useEffect(() => {
    if (state.mode !== "play" || !state.activeGameId || sessionFinished) return;

    const gs = state[state.activeGameId];
    const limit = gs?.timeLimitSeconds ?? gs?.time_limit_seconds ?? null;
    if (!limit) return;
    if (timeSeconds < limit) return;

    const handleTimeUp = async () => {
      try {
        // mark result as lose on timeout
        setGameResult("lose");
        // finish session if exists
        if (sessionId) {
          try {
            const response = await sessionsApi.finish(sessionId, {
              result: "lose",
              score,
              duration_seconds: timeSeconds,
            });
            console.log(
              "⏱️ Session finished due to timeout:",
              response.session.id
            );
          } catch (err) {
            console.error("Failed to finish session on timeout:", err);
          }
        }
        setSessionFinished(true);
      } catch (err) {
        console.error("Time up handling error:", err);
      }
    };

    handleTimeUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSeconds, state.mode, state.activeGameId, sessionId, sessionFinished]);

  // Helper: build initial game state from DB default_config
  const buildInitialGameState = (gameId, defaultConfig = {}) => {
    const cols = defaultConfig?.board?.cols ?? state.boardSize;
    const rows = defaultConfig?.board?.rows ?? state.boardSize;
    const boardSize = Math.max(cols, rows) || state.boardSize;
    const timeLimitSeconds =
      defaultConfig?.time_limit_seconds ??
      defaultConfig?.timeLimitSeconds ??
      null;
    const winScore = defaultConfig?.win_score ?? defaultConfig?.winScore ?? 0;

    let init = null;
    if (gameId === "caro4") {
      init = createCaro({ boardSize, winLen: 4 });
      init.winScore = winScore;
      init.timeLimitSeconds = timeLimitSeconds;
    } else if (gameId === "caro5") {
      init = createCaro({ boardSize, winLen: 5 });
      init.winScore = winScore;
      init.timeLimitSeconds = timeLimitSeconds;
    } else if (gameId === "tictactoe") {
      init = createTtt({ boardSize });
      init.winScore = winScore;
      init.timeLimitSeconds = timeLimitSeconds;
    } else if (gameId === "snake") {
      init = createSnake({ boardSize });
      init.winScore = winScore;
      init.timeLimitSeconds = timeLimitSeconds;
    } else if (gameId === "match3") {
      init = createMatch3({ boardSize });
      init.winScore = winScore;
      init.timeLimitSeconds = timeLimitSeconds;
    } else if (gameId === "memory") {
      init = createMemory({ boardSize });
      init.winScore = winScore;
      init.timeLimitSeconds = timeLimitSeconds;
    } else if (gameId === "pixel") {
      init = createPixel({ boardSize });
      // add paintedCount to track painted cells
      init.paintedCount = 0;
      init.winScore = winScore;
      init.timeLimitSeconds = timeLimitSeconds;
    } else {
      // fallback: try default creators if any
      init = { boardSize, winScore, timeLimitSeconds };
    }

    return { init, boardSize };
  };

  const onSelect = async () => {
    const { r, c } = state.cursor;

    if (state.mode === "select") {
      const cell = findSelectCell(selectCells, r, c);
      if (!cell) return;

      // Fetch game metadata from the server (status + default_config)
      try {
        const gameMeta = await gamesApi.getBySlug(cell.gameId);
        if (!gameMeta) {
          alert("Không tìm thấy game.");
          return;
        }
        // The API returns object with `game` key (as in your console screenshot)
        const gm = gameMeta.game ?? gameMeta;
        if (gm.status !== "active") {
          alert("Game này hiện không thể chơi (inactive).");
          return;
        }
        const defaultConfig = gm.default_config || {};

        // Prepare initial state from config
        const { init: initialState, boardSize } = buildInitialGameState(
          cell.gameId,
          defaultConfig
        );

        // Check for auto-save
        try {
          const { saved } = await savedGamesApi.list({ gameSlug: cell.gameId });
          const autoSave = saved.find((s) => s.name === "__autosave__");

          if (autoSave) {
            // Found auto-save, ask user
            setPendingGameId(cell.gameId);
            setAutoSaveData(autoSave);
            // show dialog; when starting fresh we'll re-fetch meta and set state (handleStartFresh)
            setShowContinueDialog(true);
            return;
          }
        } catch (error) {
          console.error("Failed to check auto-save:", error);
        }

        // No auto-save, start fresh with initialState
        dispatch({
          type: "SET_MODE",
          mode: "play",
          activeGameId: cell.gameId,
          boardSize,
        });
        // restore the newly created initial state so engines get correct boardSize/winScore/timeLimit
        dispatch({
          type: "GAME",
          gameId: cell.gameId,
          gameAction: { type: "RESTORE_STATE", state: initialState },
        });

        setTimeSeconds(0);
        setSessionId(null);
        setSessionFinished(false);
        setGameResult(null);
        return;
      } catch (error) {
        console.error("Failed to load game metadata:", error);
        alert("Không thể khởi động game lúc này.");
        return;
      }
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

  const onBack = async () => {
    if (state.mode === "play") {
      // Auto-save if game is in progress (not finished)
      if (!winner && state.activeGameId) {
        try {
          await savedGamesApi.create({
            gameSlug: state.activeGameId,
            sessionId: sessionId,
            name: "__autosave__",
            data: {
              gameState: state[state.activeGameId],
              timeSeconds: timeSeconds,
            },
          });
          console.log("💾 Auto-saved game");
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }

      dispatch({ type: "RESET_GAME" }); // Reset game state to clear winner
      // Reset root board size back to default when exiting play
      dispatch({ type: "SET_BOARD_SIZE", boardSize: DEFAULT_BOARD_SIZE });
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

    // ignore movement if session finished/time up
    if (sessionFinished) return;

    dispatch({ type: "MOVE", dir: a });
  };

  useEffect(
    () => attachInput({ onAction }),
    [state.mode, state.activeGameId, state.cursor, selectCells]
  );

  const handleContinueGame = async () => {
    try {
      const { saved } = await savedGamesApi.getById(autoSaveData.id);
      console.log("🔄 Loading saved game:", pendingGameId, saved.data);
      // Start game with loaded state
      const restored = saved.data.gameState;

      // Re-fetch default_config to ensure we apply admin-configured win_score/time_limit/board
      const gmResp = await gamesApi.getBySlug(pendingGameId);
      const gm = gmResp.game ?? gmResp;
      const defaultConfig = gm?.default_config ?? {};

      // Merge defaults: prefer admin default_config when provided, otherwise keep restored values
      const cols =
        defaultConfig?.board?.cols ??
        restored?.boardSize ??
        restored?.size ??
        DEFAULT_BOARD_SIZE;
      const rows =
        defaultConfig?.board?.rows ??
        restored?.boardSize ??
        restored?.size ??
        DEFAULT_BOARD_SIZE;
      const boardSize = Math.max(cols, rows);
      const timeLimitSeconds =
        defaultConfig?.time_limit_seconds ??
        defaultConfig?.timeLimitSeconds ??
        restored?.timeLimitSeconds ??
        restored?.time_limit_seconds ??
        null;
      const winScore =
        defaultConfig?.win_score ??
        defaultConfig?.winScore ??
        restored?.winScore ??
        restored?.win_score ??
        0;

      const merged = {
        ...restored,
        boardSize,
        winScore,
        timeLimitSeconds,
      };

      // Start with merged boardSize at root and restore merged state
      dispatch({
        type: "SET_MODE",
        mode: "play",
        activeGameId: pendingGameId,
        boardSize,
      });
      dispatch({
        type: "GAME",
        gameId: pendingGameId,
        gameAction: { type: "RESTORE_STATE", state: merged },
      });

      console.log("✅ State restored for", pendingGameId, merged);
      setTimeSeconds(saved.data.timeSeconds || 0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
      setShowContinueDialog(false);
      // Delete auto-save after loading
      await savedGamesApi.remove(autoSaveData.id);
    } catch (error) {
      console.error("Continue failed:", error);
      alert("Load game thất bại!");
    }
  };

  const handleStartFresh = async () => {
    try {
      // Delete auto-save
      if (autoSaveData) {
        await savedGamesApi.remove(autoSaveData.id);
      }
      // Re-fetch game meta to build initial state according to DB config
      if (pendingGameId) {
        try {
          const gmResp = await gamesApi.getBySlug(pendingGameId);
          const gm = gmResp.game ?? gmResp;
          if (!gm || gm.status !== "active") {
            alert("Game không khả dụng.");
            setShowContinueDialog(false);
            return;
          }
          const { init: initialState, boardSize } = buildInitialGameState(
            pendingGameId,
            gm.default_config || {}
          );
          dispatch({
            type: "SET_MODE",
            mode: "play",
            activeGameId: pendingGameId,
            boardSize,
          });
          dispatch({
            type: "GAME",
            gameId: pendingGameId,
            gameAction: { type: "RESTORE_STATE", state: initialState },
          });
        } catch (err) {
          console.error("Failed to fetch game meta for fresh start:", err);
        }
      }

      setTimeSeconds(0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
      setShowContinueDialog(false);
    } catch (error) {
      console.error("Failed to delete auto-save:", error);
    }
  };

  // derive active game UI values (winScore, timeLimit and remaining)
  // derive active game UI values (winScore, timeLimit and remaining)
  const activeGameState = state.activeGameId ? state[state.activeGameId] : null;
  // prefer camelCase (timeLimitSeconds / winScore) then fallback to underscore names
  const activeTimeLimit =
    activeGameState?.timeLimitSeconds ??
    activeGameState?.time_limit_seconds ??
    null;
  const activeWinScore =
    activeGameState?.winScore ?? activeGameState?.win_score ?? null;
  const remainingSeconds = activeTimeLimit
    ? Math.max(0, activeTimeLimit - timeSeconds)
    : null;

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
          // new props for UI
          timeLimitSeconds={activeTimeLimit}
          remainingSeconds={remainingSeconds}
          winScore={activeWinScore}
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

        {/* Continue Game Dialog */}
        <Dialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tiếp tục game?</DialogTitle>
              <DialogDescription>
                Bạn có game đang dở, muốn tiếp tục hay bắt đầu mới?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleStartFresh}>
                Bắt đầu mới
              </Button>
              <Button onClick={handleContinueGame}>Tiếp tục</Button>
            </div>
          </DialogContent>
        </Dialog>

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
