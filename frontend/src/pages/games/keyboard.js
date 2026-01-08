export const KEY_ACTIONS = {
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  ArrowUp: "LEFT",
  ArrowDown: "RIGHT",
  Enter: "ENTER",
  Escape: "BACK",
  Backspace: "BACK",
  "?": "HELP",
  "/": "HELP",
  h: "HELP",
  H: "HELP",
};

export function attachKeyboardControls({ onAction }) {
  const handler = (e) => {
    const action = KEY_ACTIONS[e.key];
    if (!action) return;

    // Tránh chặn input/textareas
    const tag = String(e.target?.tagName || "").toLowerCase();
    const isTyping = tag === "input" || tag === "textarea" || e.target?.isContentEditable;
    if (isTyping) return;

    e.preventDefault();
    onAction(action, e);
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}