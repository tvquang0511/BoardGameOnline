export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function deepCopy(obj) {
  // clone an toàn cho state dạng JSON (array/object/number/string/boolean/null)
  return obj == null ? obj : JSON.parse(JSON.stringify(obj));
}

export function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}