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
import GameReviewsDialog from "@/components/GameReviewsDialog";
import { Star } from "lucide-react";
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
    if (typeof action.boardSize === "number") {
      s.boardSize = action.boardSize;
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

    if (gameAction.type === "RESTORE_STATE") {
      s[gameId] = JSON.parse(JSON.stringify(gameAction.state));
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
    [state.boardSize],
  );

  const [timeSeconds, setTimeSeconds] = useState(0);

  // per-turn counter in seconds
  const [perTurnSeconds, setPerTurnSeconds] = useState(0);

  const [showHelp, setShowHelp] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [gameResult, setGameResult] = useState(null); // 'win', 'lose', 'draw'
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [pendingGameId, setPendingGameId] = useState(null);
  const [autoSaveData, setAutoSaveData] = useState(null);

  // Caro difficulty
  const [pendingDefaultConfig, setPendingDefaultConfig] = useState(null);
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);

  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedGameForReview, setSelectedGameForReview] = useState(null);
  const [gamesMetadata, setGamesMetadata] = useState([]);

  // Load games metadata with ratings
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await gamesApi.list({ all: false });
        if (!mounted) return;
        setGamesMetadata(data.games || []);
      } catch (error) {
        console.error("Failed to load games metadata:", error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Winner detection (only real game-end conditions)
  const winner = (() => {
    const id = state.activeGameId;
    if (!id) return null;

    if (id === "caro4") return state.caro4.winner;
    if (id === "caro5") return state.caro5.winner;
    if (id === "tictactoe") return state.tictactoe.winner;

    if (id === "memory") return state.memory.done ? "WIN" : null;

    if (id === "snake") return state.snake.dead ? "LOSE" : null;

    // match3: don't auto-win by score — only end by time/session. So return null here.
    if (id === "match3") return null;

    if (id === "pixel") {
      // win when all painted
      const allPainted =
        state.pixel.pixels && state.pixel.pixels.every(Boolean);
      return allPainted ? "WIN" : null;
    }

    return null;
  })();

  // Determine lock state: when player lost, lock input except ESC (BACK)
  const isLocked = (() => {
    // consider both normalized gameResult and raw winner values
    const lostByResult = gameResult === "lose";
    const lostByWinner = winner === "O" || winner === "LOSE";
    return lostByResult || lostByWinner;
  })();

  // Timer (global match timer)
  useEffect(() => {
    if (state.mode !== "play" || winner || sessionFinished) return;
    const t = setInterval(() => setTimeSeconds((p) => p + 1), 1000);
    return () => clearInterval(t);
  }, [state.mode, winner, sessionFinished]);

  useEffect(() => {
    if (
      state.mode !== "play" ||
      state.activeGameId !== "snake" ||
      sessionFinished ||
      gameResult
    )
      return;

    const ms = state.snake.tickMs || 160;
    const t = setInterval(
      () =>
        dispatch({
          type: "GAME",
          gameId: "snake",
          gameAction: { type: "TICK" },
        }),
      ms,
    );
    return () => clearInterval(t);
  }, [
    state.mode,
    state.activeGameId,
    state.snake.tickMs,
    sessionFinished,
    gameResult,
  ]);

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
      650,
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

  // Start session
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

  // Show game result when winner detected
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

  // Auto-finish session when game ends
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
          `Score: ${finalScore}, Time: ${finalTime}s, Result: ${result}`,
        );
      } catch (error) {
        console.error("❌ Failed to finish session:", error);
        // still mark finished to stop timers if API failed
        setSessionFinished(true);
      }
    };
    finishSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, sessionId, sessionFinished]);

  // Time limit watcher (match-level)
  useEffect(() => {
    if (state.mode !== "play" || !state.activeGameId || sessionFinished) return;
    // For caro4, caro5 and tictactoe we treat timeLimitSeconds as per-turn, not match-level
    if (["caro4", "caro5", "tictactoe"].includes(state.activeGameId)) return;

    const gs = state[state.activeGameId];
    const limit = gs?.timeLimitSeconds ?? gs?.time_limit_seconds ?? null;
    if (!limit) return;
    if (timeSeconds < limit) return;

    const handleTimeUp = async () => {
      try {
        // Stop everything immediately: set gameResult and sessionFinished so all timers/effects stop
        const isSnake = state.activeGameId === "snake";
        const result = isSnake ? "win" : "lose";

        setGameResult(result);
        setPerTurnSeconds(0);
        // mark finished immediately so intervals stop
        setSessionFinished(true);

        // Normalize a winner-like flag into the game state so UI/engines that read winner can reflect finished state.
        const currentGameState = state[state.activeGameId] || {};
        const normalizedWinner = result === "lose" ? "LOSE" : "WIN";
        // For snake, set dead=true so winner detection (snake.dead) reports LOSE
        const patchedState = { ...currentGameState, winner: normalizedWinner };
        if (state.activeGameId === "snake") patchedState.dead = true;

        dispatch({
          type: "GAME",
          gameId: state.activeGameId,
          gameAction: { type: "RESTORE_STATE", state: patchedState },
        });

        if (sessionId) {
          // finish session remotely but don't wait before stopping UI/timers
          try {
            await sessionsApi.finish(sessionId, {
              result,
              score,
              duration_seconds: timeSeconds,
            });
          } catch (err) {
            console.error("Failed to finish session API call:", err);
          }
        }

        console.log("⏱️ Time limit reached — session finished", {
          game: state.activeGameId,
          result,
          timeSeconds,
        });
      } catch (err) {
        console.error("Time up handling error:", err);
      }
    };

    handleTimeUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSeconds, state.mode, state.activeGameId, sessionId, sessionFinished]);

  // buildInitialGameState (same as before)
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
      init.paintedCount = 0;
      init.winScore = winScore;
      init.timeLimitSeconds = timeLimitSeconds;
    } else {
      init = { boardSize, winScore, timeLimitSeconds };
    }

    return { init, boardSize };
  };

  const onSelect = async () => {
    const { r, c } = state.cursor;
    if (state.mode === "select") {
      const cell = findSelectCell(selectCells, r, c);
      if (!cell) return;
      try {
        const gameMeta = await gamesApi.getBySlug(cell.gameId);
        if (!gameMeta) {
          alert("Không tìm thấy game.");
          return;
        }
        const gm = gameMeta.game ?? gameMeta;
        if (gm.status !== "active") {
          alert("Game này hiện không thể chơi (inactive).");
          return;
        }
        const defaultConfig = gm.default_config || {};
        const { init: initialState, boardSize } = buildInitialGameState(
          cell.gameId,
          defaultConfig,
        );
        setPendingDefaultConfig(defaultConfig);

        try {
          const { saved } = await savedGamesApi.list({ gameSlug: cell.gameId });
          const autoSave = saved.find((s) => s.name === "__autosave__");
          if (autoSave) {
            setPendingGameId(cell.gameId);
            setAutoSaveData(autoSave);
            setShowContinueDialog(true);
            return;
          }
        } catch (error) {
          console.error("Failed to check auto-save:", error);
        }

        if (cell.gameId === "caro4" || cell.gameId === "caro5") {
          setPendingGameId(cell.gameId);
          setShowDifficultyDialog(true);
          return;
        }

        dispatch({
          type: "SET_MODE",
          mode: "play",
          activeGameId: cell.gameId,
          boardSize,
        });
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
    // if locked (player lost) do not allow selecting moves
    if (isLocked) return;
    dispatch({
      type: "GAME",
      gameId: id,
      gameAction: { type: "SELECT", r, c },
    });
  };

  const onBack = async () => {
    if (state.mode === "play") {
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
      dispatch({ type: "RESET_GAME" });
      dispatch({ type: "SET_BOARD_SIZE", boardSize: DEFAULT_BOARD_SIZE });
      dispatch({ type: "SET_MODE", mode: "select", activeGameId: null });
      setTimeSeconds(0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
      setPerTurnSeconds(0);
    }
  };

  const onAction = (a) => {
    // Lock behavior: when player lost, only allow BACK (ESC). Ignore everything else.
    if (isLocked && a !== "BACK") return;

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
    if (sessionFinished) return;
    dispatch({ type: "MOVE", dir: a });
  };

  useEffect(
    () => attachInput({ onAction }),
    [state.mode, state.activeGameId, state.cursor, selectCells, isLocked],
  );

  const handleContinueGame = async () => {
    try {
      const { saved } = await savedGamesApi.getById(autoSaveData.id);
      const restored = saved.data.gameState;
      const gmResp = await gamesApi.getBySlug(pendingGameId);
      const gm = gmResp.game ?? gmResp;
      const defaultConfig = gm?.default_config ?? {};
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
      const merged = { ...restored, boardSize, winScore, timeLimitSeconds };
      if (
        (pendingGameId === "caro4" || pendingGameId === "caro5") &&
        !merged.aiLevel
      ) {
        merged.aiLevel =
          defaultConfig?.ai_level ??
          defaultConfig?.aiLevel ??
          restored?.aiLevel ??
          "medium";
      }
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
      setTimeSeconds(saved.data.timeSeconds || 0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
      setShowContinueDialog(false);
      await savedGamesApi.remove(autoSaveData.id);
      setPendingDefaultConfig(null);
      setPendingGameId(null);
      setPerTurnSeconds(0);
    } catch (error) {
      console.error("Continue failed:", error);
      alert("Load game thất bại!");
    }
  };

  const handleStartFresh = async () => {
    try {
      if (autoSaveData) await savedGamesApi.remove(autoSaveData.id);
      if (pendingGameId) {
        const gmResp = await gamesApi.getBySlug(pendingGameId);
        const gm = gmResp.game ?? gmResp;
        if (!gm || gm.status !== "active") {
          alert("Game không khả dụng.");
          setShowContinueDialog(false);
          return;
        }
        const defaultConfig = gm.default_config || {};
        if (pendingGameId === "caro4" || pendingGameId === "caro5") {
          setPendingDefaultConfig(defaultConfig);
          setShowDifficultyDialog(true);
          setShowContinueDialog(false);
          return;
        }
        const { init: initialState, boardSize } = buildInitialGameState(
          pendingGameId,
          defaultConfig,
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
      }
      setTimeSeconds(0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
      setShowContinueDialog(false);
      setPerTurnSeconds(0);
    } catch (error) {
      console.error("Failed to delete auto-save:", error);
    }
  };

  const handleStartCaroWithDifficulty = async (difficulty) => {
    if (!pendingGameId) return;
    try {
      let defaultConfig = pendingDefaultConfig;
      if (!defaultConfig) {
        const gmResp = await gamesApi.getBySlug(pendingGameId);
        const gm = gmResp.game ?? gmResp;
        defaultConfig = gm?.default_config ?? {};
      }
      const { init: initialState, boardSize } = buildInitialGameState(
        pendingGameId,
        defaultConfig || {},
      );
      initialState.aiLevel = difficulty;
      initialState.winScore =
        initialState.winScore ??
        initialState.win_score ??
        defaultConfig?.win_score ??
        0;
      initialState.timeLimitSeconds =
        initialState.timeLimitSeconds ??
        initialState.time_limit_seconds ??
        defaultConfig?.time_limit_seconds ??
        null;
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
      setTimeSeconds(0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
      setShowDifficultyDialog(false);
      setPendingDefaultConfig(null);
      setPendingGameId(null);
      setPerTurnSeconds(0);
    } catch (err) {
      console.error("Failed to start caro with difficulty", err);
      alert("Không thể bắt đầu game.");
    }
  };

  const activeGameState = state.activeGameId ? state[state.activeGameId] : null;
  const activeTimeLimit =
    activeGameState?.timeLimitSeconds ??
    activeGameState?.time_limit_seconds ??
    null;
  const activeWinScore =
    activeGameState?.winScore ?? activeGameState?.win_score ?? null;

  useEffect(() => {
    // reset per-turn counter whenever turn or active game changes
    setPerTurnSeconds(0);
  }, [activeGameState?.turn, state.activeGameId]);

  // per-turn timer: only for tictactoe, caro4, caro5 (treat timeLimitSeconds as per-turn)
  useEffect(() => {
    if (state.mode !== "play" || !state.activeGameId || sessionFinished) return;
    if (!["caro4", "caro5", "tictactoe"].includes(state.activeGameId)) return;
    if (!activeGameState) return;
    if (!activeGameState.turn) return;
    if (winner) return;

    const limit =
      activeGameState?.timeLimitSeconds ??
      activeGameState?.time_limit_seconds ??
      null;
    if (!limit || limit <= 0) return;

    let mounted = true;
    const t = setInterval(() => {
      if (!mounted) return;
      setPerTurnSeconds((prev) => {
        const next = prev + 1;
        if (next >= limit) {
          // dispatch timeout for this game's current turn
          dispatch({
            type: "GAME",
            gameId: state.activeGameId,
            gameAction: { type: "TURN_TIMEOUT" },
          });
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [
    state.mode,
    state.activeGameId,
    activeGameState?.turn,
    activeGameState?.timeLimitSeconds,
    activeGameState?.time_limit_seconds,
    sessionFinished,
    winner,
  ]);

  // auto-invoke AI when active game's turn === "CPU"
  useEffect(() => {
    if (state.mode !== "play" || !state.activeGameId) return;
    const ag = activeGameState;
    if (!ag) return;
    if (ag.turn !== "CPU") return;
    if (winner || sessionFinished) return;

    let mounted = true;
    const thinkDelay = 80; // ms - small UX delay

    const runAI = async () => {
      // small delay so UI can render "CPU thinking"
      await new Promise((res) => setTimeout(res, thinkDelay));
      if (!mounted) return;

      // If useApiAI enabled, try remote AI first
      if (ag.useApiAI) {
        try {
          const resp = await fetch("/api/ai/caro-move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              board: ag.board,
              boardSize: ag.boardSize,
              winLen: ag.winLen,
              aiLevel: ag.aiLevel ?? ag.ai_level ?? "medium",
            }),
          });
          if (!mounted) return;
          if (!resp.ok) throw new Error(`AI API ${resp.status}`);
          const json = await resp.json();
          const index = typeof json?.index === "number" ? json.index : null;
          dispatch({
            type: "GAME",
            gameId: state.activeGameId,
            gameAction: { type: "CPU_MOVE", index },
          });
          return;
        } catch (err) {
          console.error("AI API failed, falling back to local AI:", err);
          // fallthrough to local fallback
        }
      }

      // Local fallback: dispatch CPU_MOVE with index=null so stepCaro uses localPick
      dispatch({
        type: "GAME",
        gameId: state.activeGameId,
        gameAction: { type: "CPU_MOVE", index: null },
      });
    };

    runAI();

    return () => {
      mounted = false;
    };
  }, [
    state.mode,
    state.activeGameId,
    activeGameState?.turn,
    activeGameState?.useApiAI,
    activeGameState?.board?.length, // re-run if board changes
    winner,
    sessionFinished,
  ]);

  function getHelpForGame(gameId, mode) {
    if (mode === "select") {
      return (
        <>
          <div>• Di chuyển: WASD / ↑↓←→</div>
          <div>• Chọn: Enter / Space</div>
          <div>• Nhấn E để xem hướng dẫn trò chơi cụ thể.</div>
          <div>
            • Chọn game: di chuyển đến ô có màu tương ứng trên bàn và nhấn
            Enter.
          </div>
        </>
      );
    }
    switch (gameId) {
      case "caro4":
      case "caro5":
        return (
          <>
            <div>
              • Mục tiêu: nối {gameId === "caro4" ? "4" : "5"} ô 'X' liên tiếp
              theo hàng, cột hoặc chéo.
            </div>
            <div>• Bạn là 'X', CPU là 'O'.</div>
            <div>
              • Độ khó AI: Easy = random; Medium = block + tấn công; Hard =
              heuristic lookahead.
            </div>
            <div>• Chọn ô: di chuyển con trỏ đến ô và nhấn Enter.</div>
            <div>
              • Thời gian mỗi nước (per-turn):{" "}
              {activeGameState?.timeLimitSeconds ??
                activeGameState?.time_limit_seconds ??
                "không giới hạn"}{" "}
              giây
            </div>
          </>
        );
      case "tictactoe":
        return (
          <>
            <div>• Tic-tac-toe 3x3 ở giữa bàn. Bạn là 'X'.</div>
            <div>
              • Thời gian mỗi nước (per-turn):{" "}
              {activeGameState?.timeLimitSeconds ??
                activeGameState?.time_limit_seconds ??
                "không giới hạn"}{" "}
              giây
            </div>
          </>
        );
      case "snake":
        return (
          <>
            <div>• Điều khiển rắn ăn mồi để tăng điểm.</div>
            <div>
              • Không có điều kiện WIN bằng điểm — chỉ thua khi rắn tự va vào
              mình.
            </div>
          </>
        );
      case "match3":
        return (
          <>
            <div>• Đổi chỗ 2 ô lân cận để tạo hàng/3 trở lên.</div>
            <div>
              • Mỗi lần xảy ra match (một hoặc nhiều hàng/col) bạn được điểm;
              win_score được cộng mỗi lần match xảy ra (một lần cho mỗi
              hàng/col)
            </div>
          </>
        );
      case "memory":
        return (
          <>
            <div>
              • Mở 2 thẻ để tìm cặp giống nhau; hoàn tất tất cả cặp sẽ thắng và
              nhận win_score.
            </div>
          </>
        );
      case "pixel":
        return (
          <>
            <div>• Chọn màu trên ControlsCard rồi tô ô với Enter/Space.</div>
            <div>
              • Mỗi 20 ô mới tô được bạn nhận win_score; game kết thúc khi tô
              hết các ô khả dụng (tất cả ô).
            </div>
          </>
        );
      default:
        return <div>Help content chưa có cho trò chơi này.</div>;
    }
  }

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
          noBorder: true,
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

  // Allow reset even when locked/finished. Reset restores a fresh initial state
  // using default_config if available (so new rules apply).
  const handleResetGame = async () => {
    const id = state.activeGameId;
    // If no active game, just do generic reset
    if (!id) {
      dispatch({ type: "RESET_GAME" });
      setTimeSeconds(0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
      setPerTurnSeconds(0);
      return;
    }

    try {
      // Prefer pendingDefaultConfig (if we have it), otherwise fetch game metadata
      let defaultConfig = pendingDefaultConfig;
      if (!defaultConfig) {
        try {
          const gmResp = await gamesApi.getBySlug(id);
          const gm = gmResp.game ?? gmResp;
          defaultConfig = gm?.default_config ?? null;
        } catch (err) {
          defaultConfig = null;
        }
      }

      if (defaultConfig) {
        const { init: initialState, boardSize } = buildInitialGameState(
          id,
          defaultConfig,
        );
        dispatch({
          type: "SET_MODE",
          mode: "play",
          activeGameId: id,
          boardSize,
        });
        dispatch({
          type: "GAME",
          gameId: id,
          gameAction: { type: "RESTORE_STATE", state: initialState },
        });
      } else {
        // fallback to simple reset via reducer
        dispatch({ type: "RESET_GAME" });
      }

      // reset UI/session timers/flags
      setTimeSeconds(0);
      setPerTurnSeconds(0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
    } catch (err) {
      console.error("Reset failed, falling back to simple reset:", err);
      dispatch({ type: "RESET_GAME" });
      setTimeSeconds(0);
      setPerTurnSeconds(0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
    }
  };

  const handleToggleHelp = () => {
    if (isLocked) return;
    setShowHelp((v) => !v);
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Board Games</h1>
        </div>

        <ControlsCard
          mode={state.mode}
          gameId={state.activeGameId}
          gameName={activeConfig?.name || ""}
          score={score}
          timeSeconds={timeSeconds}
          timeLimitSeconds={activeTimeLimit}
          winScore={activeWinScore}
          perTurnSeconds={perTurnSeconds}
          onResetGame={handleResetGame}
          onBackToSelect={onBack}
          onToggleHelp={handleToggleHelp}
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
                  ? "Chiến thắng!"
                  : gameResult === "lose"
                    ? "Thất bại"
                    : "Hòa"}
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
              {getHelpForGame(state.activeGameId, state.mode)}
            </CardContent>
          </Card>
        ) : null}

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

        <Dialog
          open={showDifficultyDialog}
          onOpenChange={setShowDifficultyDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chọn độ khó</DialogTitle>
              <DialogDescription>
                Chọn mức độ AI cho Caro trước khi bắt đầu
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDifficultyDialog(false);
                  setPendingGameId(null);
                  setPendingDefaultConfig(null);
                }}
              >
                Hủy
              </Button>
              <Button onClick={() => handleStartCaroWithDifficulty("easy")}>
                Easy
              </Button>
              <Button onClick={() => handleStartCaroWithDifficulty("medium")}>
                Medium
              </Button>
              <Button onClick={() => handleStartCaroWithDifficulty("hard")}>
                Hard
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {GAME_CONFIGS.map((g) => {
            const gameMeta = gamesMetadata.find((gm) => gm.slug === g.id);
            const avgRating = gameMeta?.average_rating;
            const reviewCount = gameMeta?.review_count || 0;

            return (
              <Card key={g.id} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${g.legendGradient} flex items-center justify-center text-3xl`}
                  >
                    {g.emoji}
                  </div>
                  <h3 className="font-semibold text-sm">{g.name}</h3>
                  <div className="text-xs text-muted-foreground">
                    Chọn bằng ô màu trên bàn
                  </div>

                  {/* Rating Display */}
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {avgRating ? parseFloat(avgRating).toFixed(1) : "N/A"}
                    </span>
                    <span className="text-gray-400">({reviewCount})</span>
                  </div>

                  {/* Review Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-7"
                    onClick={async (e) => {
                      e.stopPropagation();
                      // If we don't have gameMeta yet, fetch it
                      let gameId = gameMeta?.id;
                      if (!gameId) {
                        try {
                          const gameData = await gamesApi.getBySlug(g.id);
                          gameId = gameData.game.id;
                        } catch (error) {
                          console.error("Failed to get game:", error);
                          return;
                        }
                      }
                      setSelectedGameForReview({
                        id: gameId,
                        name: g.name,
                      });
                      setReviewDialogOpen(true);
                    }}
                  >
                    📝 Đánh giá
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Review Dialog */}
        {selectedGameForReview && (
          <GameReviewsDialog
            gameId={selectedGameForReview.id}
            gameName={selectedGameForReview.name}
            open={reviewDialogOpen}
            onOpenChange={(open) => {
              setReviewDialogOpen(open);
              if (!open) {
                // Reload games metadata when dialog closes to refresh ratings
                gamesApi
                  .list({ all: false })
                  .then((data) => {
                    setGamesMetadata(data.games || []);
                  })
                  .catch(console.error);
              }
            }}
          />
        )}
      </div>
    </Layout>
  );
}
