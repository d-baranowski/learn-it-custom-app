const KEY = "rpg-redux-grids-store";

// Keys that represent transient UI state and should NOT be persisted
// across page reloads or navigations.
//
//   `windows` — open dialog/window UI state.
//   `forms`   — form values; drafts have their own persistence layer
//               (forms-draft-storage.ts) with TTL/LRU/version handling.
//               Live (non-draft) form state is intentionally NOT persisted
//               via this generic blob.
const TRANSIENT_KEYS = ['windows', 'forms'];

export function loadState() {
  try {
    if (typeof localStorage === "undefined") return undefined;
    const serializedState = localStorage.getItem(KEY);
    if (!serializedState) return undefined;
    const parsed = JSON.parse(serializedState);
    // Strip transient keys that may have been persisted by older versions
    for (const key of TRANSIENT_KEYS) {
      delete parsed[key];
    }
    return parsed;
  } catch (e) {
    return undefined;
  }
}

export async function saveState(state: any) {
  try {
    if (typeof localStorage === "undefined") return;
    // Exclude transient UI state from persistence
    const persistable = { ...state };
    for (const key of TRANSIENT_KEYS) {
      delete persistable[key];
    }
    const serializedState = JSON.stringify(persistable);
    localStorage.setItem(KEY, serializedState);
  } catch (e) {
    // Ignore
  }
}
