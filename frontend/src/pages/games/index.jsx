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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
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

function initState(boardSize, gameId) {
  return {
    boardSize,
    mode: "play", // Luôn ở mode play
    activeGameId: gameId,
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

  if (action.type === "SET_CURSOR") {
    s.cursor = action.cursor;
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
  const { gameSlug } = useParams(); // Lấy gameSlug từ URL
  const navigate = useNavigate();
  const DEFAULT_BOARD_SIZE = 15;

  const [state, dispatch] = useReducer(
    reducer,
    { boardSize: DEFAULT_BOARD_SIZE, gameId: gameSlug },
    (init) => initState(init.boardSize, init.gameId)
  );

  const [timeSeconds, setTimeSeconds] = useState(0);
  const [perTurnSeconds, setPerTurnSeconds] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionFinished, setSessionFinished] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [autoSaveData, setAutoSaveData] = useState(null);
  const [pendingDefaultConfig, setPendingDefaultConfig] = useState(null);
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [gameLoaded, setGameLoaded] = useState(false);

  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [currentGameMeta, setCurrentGameMeta] = useState(null);

  // Load current game metadata
  useEffect(() => {
    if (!gameSlug) return;
    let mounted = true;
    (async () => {
      try {
        const data = await gamesApi.getBySlug(gameSlug);
        if (!mounted) return;
        const gm = data.game ?? data;
        setCurrentGameMeta(gm);
      } catch (error) {
        console.error("Failed to load game metadata:", error);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [gameSlug]);

  // Auto-load game từ URL params
  useEffect(() => {
    if (!gameSlug || gameLoaded) return;

    const loadGame = async () => {
      try {
        const gameMeta = await gamesApi.getBySlug(gameSlug);
        if (!gameMeta) {
          alert("Không tìm thấy game.");
          navigate("/games-list");
          return;
        }

        const gm = gameMeta.game ?? gameMeta;
        if (gm.status !== "active") {
          alert("Game này hiện không thể chơi (inactive).");
          navigate("/games-list");
          return;
        }

        const defaultConfig = gm.default_config || {};
        const { init: initialState, boardSize } = buildInitialGameState(
          gameSlug,
          defaultConfig
        );
        setPendingDefaultConfig(defaultConfig);

        // Check for auto-save
        try {
          const { saved } = await savedGamesApi.list({ gameSlug });
          const autoSave = saved.find((s) => s.name === "__autosave__");
          if (autoSave) {
            setAutoSaveData(autoSave);
            setShowContinueDialog(true);
            setGameLoaded(true);
            return;
          }
        } catch (error) {
          console.error("Failed to check auto-save:", error);
        }

        // Nếu là caro, hỏi độ khó
        if (gameSlug === "caro4" || gameSlug === "caro5") {
          setShowDifficultyDialog(true);
          setGameLoaded(true);
          return;
        }

        // Start game ngay
        dispatch({
          type: "SET_MODE",
          mode: "play",
          activeGameId: gameSlug,
          boardSize,
        });
        dispatch({
          type: "GAME",
          gameId: gameSlug,
          gameAction: { type: "RESTORE_STATE", state: initialState },
        });
        setTimeSeconds(0);
        setSessionId(null);
        setSessionFinished(false);
        setGameResult(null);
        setGameLoaded(true);
      } catch (error) {
        console.error("Failed to load game metadata:", error);
        alert("Không thể khởi động game lúc này.");
        navigate("/games-list");
      }
    };

    loadGame();
  }, [gameSlug, gameLoaded, navigate]);

  // Winner detection
  const winner = (() => {
    const id = state.activeGameId;
    if (!id) return null;

    if (id === "caro4") return state.caro4.winner;
    if (id === "caro5") return state.caro5.winner;
    if (id === "tictactoe") return state.tictactoe.winner;
    if (id === "memory") return state.memory.done ? "WIN" : null;
    if (id === "snake") return state.snake.dead ? "LOSE" : null;
    if (id === "match3") return null;
    if (id === "pixel") {
      const allPainted =
        state.pixel.pixels && state.pixel.pixels.every(Boolean);
      return allPainted ? "WIN" : null;
    }

    return null;
  })();

  const isLocked = (() => {
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
      ms
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
      } catch (error) {
        console.error("❌ Failed to start session:", error);
      }
    };
    startSession();
  }, [state.mode, state.activeGameId, user, sessionId, state]);

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
  }, [winner, state.activeGameId]);

  // Auto-finish session when game ends
  useEffect(() => {
    if (!winner || !sessionId || !state.activeGameId || sessionFinished) return;

    setSessionFinished(true);

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
        await sessionsApi.finish(sessionId, {
          result,
          score: finalScore,
          duration_seconds: finalTime,
        });
      } catch (error) {
        console.error("❌ Failed to finish session:", error);
        setSessionFinished(false);
      }
    };
    finishSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, sessionId, sessionFinished]);

  // Time limit watcher (match-level)
  useEffect(() => {
    if (state.mode !== "play" || !state.activeGameId || sessionFinished) return;
    if (["caro4", "caro5", "tictactoe"].includes(state.activeGameId)) return;

    const gs = state[state.activeGameId];
    const limit = gs?.timeLimitSeconds ?? gs?.time_limit_seconds ?? null;
    if (!limit) return;
    if (timeSeconds < limit) return;

    const handleTimeUp = async () => {
      try {
        const isSnake = state.activeGameId === "snake";
        const result = isSnake ? "win" : "lose";

        setGameResult(result);
        setPerTurnSeconds(0);
        setSessionFinished(true);

        const currentGameState = state[state.activeGameId] || {};
        const normalizedWinner = result === "lose" ? "LOSE" : "WIN";
        const patchedState = { ...currentGameState, winner: normalizedWinner };
        if (state.activeGameId === "snake") patchedState.dead = true;

        dispatch({
          type: "GAME",
          gameId: state.activeGameId,
          gameAction: { type: "RESTORE_STATE", state: patchedState },
        });

        if (sessionId) {
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
      } catch (err) {
        console.error("Time up handling error:", err);
      }
    };

    handleTimeUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSeconds, state.mode, state.activeGameId, sessionId, sessionFinished]);

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

    if (isLocked) return;
    dispatch({
      type: "GAME",
      gameId: id,
      gameAction: { type: "SELECT", r, c },
    });
  };

  // Handle cell click (chuột)
  const handleCellClick = (r, c) => {
    const id = state.activeGameId;
    if (!id || isLocked) return;

    // Snake không hỗ trợ click chuột
    if (id === "snake") return;

    // Di chuyển cursor đến vị trí click
    dispatch({ type: "SET_CURSOR", cursor: { r, c } });

    // Thực hiện select
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
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }
      // Quay lại trang chọn game
      navigate("/games-list");
    }
  };

  const onAction = (a) => {
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
    [state.mode, state.activeGameId, state.cursor, isLocked]
  );

  const handleContinueGame = async () => {
    try {
      const { saved } = await savedGamesApi.getById(autoSaveData.id);
      const restored = saved.data.gameState;
      const gmResp = await gamesApi.getBySlug(gameSlug);
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
        (gameSlug === "caro4" || gameSlug === "caro5") &&
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
        activeGameId: gameSlug,
        boardSize,
      });
      dispatch({
        type: "GAME",
        gameId: gameSlug,
        gameAction: { type: "RESTORE_STATE", state: merged },
      });
      setTimeSeconds(saved.data.timeSeconds || 0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
      setShowContinueDialog(false);
      await savedGamesApi.remove(autoSaveData.id);
      setPendingDefaultConfig(null);
      setPerTurnSeconds(0);
    } catch (error) {
      console.error("Continue failed:", error);
      alert("Load game thất bại!");
    }
  };

  const handleStartFresh = async () => {
    try {
      if (autoSaveData) await savedGamesApi.remove(autoSaveData.id);
      if (gameSlug) {
        const gmResp = await gamesApi.getBySlug(gameSlug);
        const gm = gmResp.game ?? gmResp;
        if (!gm || gm.status !== "active") {
          alert("Game không khả dụng.");
          setShowContinueDialog(false);
          return;
        }
        const defaultConfig = gm.default_config || {};
        if (gameSlug === "caro4" || gameSlug === "caro5") {
          setPendingDefaultConfig(defaultConfig);
          setShowDifficultyDialog(true);
          setShowContinueDialog(false);
          return;
        }
        const { init: initialState, boardSize } = buildInitialGameState(
          gameSlug,
          defaultConfig
        );
        dispatch({
          type: "SET_MODE",
          mode: "play",
          activeGameId: gameSlug,
          boardSize,
        });
        dispatch({
          type: "GAME",
          gameId: gameSlug,
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
    if (!gameSlug) return;
    try {
      let defaultConfig = pendingDefaultConfig;
      if (!defaultConfig) {
        const gmResp = await gamesApi.getBySlug(gameSlug);
        const gm = gmResp.game ?? gmResp;
        defaultConfig = gm?.default_config ?? {};
      }
      const { init: initialState, boardSize } = buildInitialGameState(
        gameSlug,
        defaultConfig || {}
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
        activeGameId: gameSlug,
        boardSize,
      });
      dispatch({
        type: "GAME",
        gameId: gameSlug,
        gameAction: { type: "RESTORE_STATE", state: initialState },
      });
      setTimeSeconds(0);
      setSessionId(null);
      setSessionFinished(false);
      setGameResult(null);
      setShowDifficultyDialog(false);
      setPendingDefaultConfig(null);
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
    setPerTurnSeconds(0);
  }, [activeGameState?.turn, state.activeGameId]);

  // per-turn timer
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

  // auto-invoke AI when turn === "CPU"
  useEffect(() => {
    if (state.mode !== "play" || !state.activeGameId) return;
    const ag = activeGameState;
    if (!ag) return;
    if (ag.turn !== "CPU") return;
    if (winner || sessionFinished) return;

    let mounted = true;
    const thinkDelay = 80;

    const runAI = async () => {
      await new Promise((res) => setTimeout(res, thinkDelay));
      if (!mounted) return;

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
        }
      }

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
    activeGameState?.board?.length,
    winner,
    sessionFinished,
  ]);

  function getHelpForGame(gameId) {
    switch (gameId) {
      case "caro4":
      case "caro5":
        return (
          <>
            <div>
              • Mục tiêu: nối {gameId === "caro4" ? "4" : "5"} quân liên tiếp
              theo hàng, cột hoặc chéo.
            </div>
            <div>• Bạn là ⭕, CPU là ❌.</div>
            <div>
              • Độ khó AI: Easy = random; Medium = block + tấn công; Hard =
              heuristic lookahead.
            </div>
            <div>• Click chuột hoặc di chuyển con trỏ (↑↓←→) + Enter để chọn ô.</div>
            <div>
              • Thời gian mỗi nước:{" "}
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
            <div>• Tic-tac-toe 3x3 ở giữa bàn.</div>
            <div>• Click chuột hoặc phím mũi tên + Enter để chọn.</div>
            <div>
              • Thời gian mỗi nước:{" "}
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
            <div>• CHỈ dùng phím mũi tên để điều khiển (không hỗ trợ chuột).</div>
            <div>• Không tự va vào thân mình.</div>
          </>
        );
      case "match3":
        return (
          <>
            <div>• Ghép 3 trái cây giống nhau theo hàng hoặc cột.</div>
            <div>• Click vào 1 trái cây, sau đó click vào trái cây lân cận để đổi chỗ.</div>
            <div>• Chỉ đổi chỗ nếu tạo được hàng 3+ giống nhau.</div>
          </>
        );
      case "memory":
        return (
          <>
            <div>• Lật 2 thẻ để tìm cặp giống nhau.</div>
            <div>• Click chuột hoặc phím mũi tên + Enter để lật.</div>
            <div>• Hoàn tất tất cả cặp để thắng.</div>
          </>
        );
      case "pixel":
        return (
          <>
            <div>• Chọn màu ở trên rồi click chuột hoặc Enter để tô.</div>
            <div>• Mỗi 20 ô tô được sẽ nhận điểm thưởng.</div>
          </>
        );
      default:
        return <div>Help content chưa có cho trò chơi này.</div>;
    }
  }

  const getCellView = (r, c) => {
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

  const handleResetGame = async () => {
    const id = state.activeGameId;
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
          defaultConfig
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
        dispatch({ type: "RESET_GAME" });
      }

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

  if (!gameLoaded) {
    return (
      <Layout onLogout={onLogout}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-4xl mb-4">🎮</div>
            <p className="text-xl">Đang tải game...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            {activeConfig?.name || "Board Games"}
          </h1>
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

        <Card className="bg-card text-card-foreground border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Đang chơi: {activeConfig?.name || ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Board
              size={state.boardSize}
              cursor={state.cursor}
              getCellView={getCellView}
              onCellClick={handleCellClick}
            />
          </CardContent>
        </Card>

        {showHelp ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Hướng dẫn</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              {getHelpForGame(state.activeGameId)}
            </CardContent>
          </Card>
        ) : null}

        {/* Review Box */}
        {currentGameMeta && (
          <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 border-2 border-blue-100 dark:border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
                    <Star className="w-7 h-7 fill-white text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Đánh giá từ cộng đồng
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Chia sẻ trải nghiệm của bạn
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-4 py-2 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(currentGameMeta.average_rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900 dark:text-white">
                      {currentGameMeta.average_rating
                        ? parseFloat(currentGameMeta.average_rating).toFixed(1)
                        : "N/A"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {currentGameMeta.review_count || 0} đánh giá
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setReviewDialogOpen(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-6 text-base shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <span className="mr-2">📝</span>
                Xem tất cả đánh giá & Viết đánh giá của bạn
              </Button>
            </CardContent>
          </Card>
        )}

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
                  navigate("/games-list");
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

        {/* Review Dialog */}
        {currentGameMeta && (
          <GameReviewsDialog
            gameId={currentGameMeta.id}
            gameName={currentGameMeta.name}
            open={reviewDialogOpen}
            onOpenChange={(open) => {
              setReviewDialogOpen(open);
              if (!open) {
                // Reload game metadata to refresh rating
                gamesApi
                  .getBySlug(gameSlug)
                  .then((data) => {
                    const gm = data.game ?? data;
                    setCurrentGameMeta(gm);
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