export const KEY_ACTIONS = {
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  ArrowUp: "UP",
  ArrowDown: "DOWN",

  a: "LEFT",
  d: "RIGHT",
  w: "UP",
  s: "DOWN",
  A: "LEFT",
  D: "RIGHT",
  W: "UP",
  S: "DOWN",

  Enter: "SELECT",
  " ": "SELECT", // Space

  Escape: "BACK",

  e: "HELP",
  E: "HELP",
};

export function attachInput({ onAction }) {
  const handler = (e) => {
    const action = KEY_ACTIONS[e.key];
    if (!action) return;

    const tag = String(e.target?.tagName || "").toLowerCase();
    const isTyping = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
    if (isTyping) return;

    e.preventDefault();
    onAction(action, e);
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}