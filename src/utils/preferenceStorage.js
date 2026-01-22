export const USER_PREFERENCE_STORAGE_KEY = "userPreferenceVector6";
export const USER_PREFERENCE_UPDATED_EVENT = "userPreferenceUpdated";

export function loadUserPreferenceVector() {
  try {
    const raw = localStorage.getItem(USER_PREFERENCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 6) return null;
    const vec = parsed.map(Number);
    if (vec.some(v => !Number.isFinite(v))) return null;
    return vec;
  } catch {
    return null;
  }
}

export function saveUserPreferenceVector(vec) {
  try {
    if (!Array.isArray(vec) || vec.length !== 6) return;
    const cleaned = vec.map(v => {
      const n = Number(v);
      if (!Number.isFinite(n)) return 0.5;
      if (n < 0) return 0;
      if (n > 1) return 1;
      return n;
    });
    localStorage.setItem(USER_PREFERENCE_STORAGE_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new Event(USER_PREFERENCE_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

export function subscribeUserPreferenceVector(onChange) {
  if (typeof onChange !== "function") return () => {};

  const notify = () => {
    onChange(loadUserPreferenceVector());
  };

  const onStorage = e => {
    if (e?.key !== USER_PREFERENCE_STORAGE_KEY) return;
    notify();
  };

  const onCustom = () => notify();

  window.addEventListener("storage", onStorage);
  window.addEventListener(USER_PREFERENCE_UPDATED_EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(USER_PREFERENCE_UPDATED_EVENT, onCustom);
  };
}
