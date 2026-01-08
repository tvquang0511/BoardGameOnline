const KEY_PREFIX = "bgo.saved";

export function buildSaveKey({ gameId, slot = "default" }) {
  return `${KEY_PREFIX}.${gameId}.${slot}`;
}

export function saveToLocal({ gameId, slot = "default", data }) {
  const key = buildSaveKey({ gameId, slot });
  const payload = {
    version: 1,
    gameId,
    slot,
    savedAt: new Date().toISOString(),
    data,
  };
  localStorage.setItem(key, JSON.stringify(payload));
  return payload;
}

export function loadFromLocal({ gameId, slot = "default" }) {
  const key = buildSaveKey({ gameId, slot });
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function listLocalSaves({ gameId }) {
  const prefix = `${KEY_PREFIX}.${gameId}.`;
  const items = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(prefix)) continue;
    const raw = localStorage.getItem(k);
    try {
      const parsed = JSON.parse(raw);
      items.push({ key: k, ...parsed });
    } catch {
      // ignore broken
    }
  }
  items.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
  return items;
}

export function removeLocalSave({ gameId, slot = "default" }) {
  const key = buildSaveKey({ gameId, slot });
  localStorage.removeItem(key);
}