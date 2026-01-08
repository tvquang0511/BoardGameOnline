export function deepCopy(x) {
  return x == null ? x : JSON.parse(JSON.stringify(x));
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function wrap(n, max) {
  return ((n % max) + max) % max;
}

export function randInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}