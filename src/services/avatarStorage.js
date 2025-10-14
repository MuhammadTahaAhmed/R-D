const STORAGE_KEY = 'savedAvatarUrls';

export function getSavedAvatars() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAvatar(urlObj) {
  if (typeof window === 'undefined') return;
  const existing = getSavedAvatars();
  const entry = {
    id: urlObj.id,
    originalUrl: urlObj.url || urlObj.originalUrl,
    cloudinaryUrl: urlObj.cloudinaryUrl,
    createdAt: Date.now()
  };
  const next = [entry, ...existing].slice(0, 20);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearSavedAvatars() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}


