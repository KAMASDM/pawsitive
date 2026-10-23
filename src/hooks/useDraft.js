import { useEffect, useState } from 'react';

// Drafts are scoped to the signed-in account and stay on this device for the
// current browser session. Saving or explicitly discarding removes the draft.
export default function useDraft(key, initial) {
  const [draft, setDraft] = useState(() => {
    const fallback = typeof initial === 'function' ? initial() : initial;
    try {
      const stored = sessionStorage.getItem(key);
      if (!stored) return fallback;
      const value = JSON.parse(stored);
      if (typeof value !== typeof fallback || value === null) return fallback;
      if (typeof fallback !== 'object') return value;
      if (Array.isArray(value) !== Array.isArray(fallback)) return fallback;
      for (const [field, defaultValue] of Object.entries(fallback)) {
        if (!(field in value) || defaultValue === null) continue;
        if (typeof value[field] !== typeof defaultValue || Array.isArray(value[field]) !== Array.isArray(defaultValue)) return fallback;
      }
      return { ...fallback, ...value };
    } catch { return fallback; }
  });
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify(draft)); } catch { /* Saving to the server remains available. */ } }, [key, draft]);
  const clear = () => { try { sessionStorage.removeItem(key); } catch { /* No draft to remove. */ } };
  return [draft, setDraft, clear];
}
