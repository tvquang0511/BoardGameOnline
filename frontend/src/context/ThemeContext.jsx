import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "ui.appearance.v3";

const MODES = [
  { id: "light", name: "Light", className: "mode-light", isDark: false },
  { id: "dark", name: "Dark", className: "mode-dark", isDark: true },

  { id: "blue", name: "Blue", className: "mode-blue", isDark: false },
  { id: "blue-dark", name: "Blue Dark", className: "mode-blue-dark", isDark: true },

  { id: "rose", name: "Rose", className: "mode-rose", isDark: false },
  { id: "rose-dark", name: "Rose Dark", className: "mode-rose-dark", isDark: true },

  { id: "emerald", name: "Emerald", className: "mode-emerald", isDark: false },
  { id: "emerald-dark", name: "Emerald Dark", className: "mode-emerald-dark", isDark: true },

  { id: "violet", name: "Violet", className: "mode-violet", isDark: false },
  { id: "violet-dark", name: "Violet Dark", className: "mode-violet-dark", isDark: true },

  { id: "amber", name: "Amber", className: "mode-amber", isDark: false },
  { id: "amber-dark", name: "Amber Dark", className: "mode-amber-dark", isDark: true },

  { id: "cyan", name: "Cyan", className: "mode-cyan", isDark: false },
  { id: "cyan-dark", name: "Cyan Dark", className: "mode-cyan-dark", isDark: true },

  { id: "lime", name: "Lime", className: "mode-lime", isDark: false },
  { id: "lime-dark", name: "Lime Dark", className: "mode-lime-dark", isDark: true },

  { id: "fuchsia", name: "Fuchsia", className: "mode-fuchsia", isDark: false },
  { id: "fuchsia-dark", name: "Fuchsia Dark", className: "mode-fuchsia-dark", isDark: true },

  { id: "orange", name: "Orange", className: "mode-orange", isDark: false },
  { id: "orange-dark", name: "Orange Dark", className: "mode-orange-dark", isDark: true },

  { id: "slate", name: "Slate", className: "mode-slate", isDark: false },
  { id: "slate-dark", name: "Slate Dark", className: "mode-slate-dark", isDark: true },

  { id: "indigo", name: "Indigo", className: "mode-indigo", isDark: false },
  { id: "indigo-dark", name: "Indigo Dark", className: "mode-indigo-dark", isDark: true },
];

function applyToHtml({ modeId }) {
  const root = document.documentElement;

  root.classList.forEach((c) => {
    if (c.startsWith("mode-")) root.classList.remove(c);
  });

  const m = MODES.find((x) => x.id === modeId) || MODES[0];
  root.classList.add(m.className);

  // keep dark class for shadcn components that depend on it
  root.classList.toggle("dark", Boolean(m.isDark));
}

export function ThemeProvider({ children }) {
  const [modeId, setModeId] = useState("light");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed?.modeId === "string") setModeId(parsed.modeId);
      } else {
        const prefersDark =
          window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        setModeId(prefersDark ? "dark" : "light");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    applyToHtml({ modeId });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ modeId }));
    } catch {
      // ignore
    }
  }, [modeId]);

  const value = useMemo(() => {
    return { modeId, setModeId, modes: MODES };
  }, [modeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}