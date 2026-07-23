/**
 * forms-draft-storage — localStorage persistence for form drafts.
 *
 * Owns its own localStorage key (separate from the grids/userSettings key)
 * because:
 *   - Drafts have their own LRU + TTL policy (50 entries, 24h).
 *   - We only want to persist the `drafts` index and the draft form records,
 *     never live in-progress form values.
 *   - Versioning the draft schema independently is easier.
 *
 * Format:
 *   localStorage[KEY] = JSON.stringify({
 *     formatVersion: 1,
 *     drafts: DraftIndexEntry[],
 *     byId: Record<formId, FormReduxState>,  // only entries with status==='draft'
 *   })
 */

import type { FormsState, FormReduxState, DraftIndexEntry } from './forms-slice';

const KEY = 'utro:formDrafts:v1';
const FORMAT_VERSION = 1;
const MAX_DRAFTS = 50;
const TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface PersistedShape {
  formatVersion: number;
  drafts: DraftIndexEntry[];
  byId: Record<string, FormReduxState>;
}

export interface LoadedDrafts {
  drafts: DraftIndexEntry[];
  byId: Record<string, FormReduxState>;
  /**
   * formIds that were dropped during load due to TTL expiry or LRU.
   * Surfaced so the UI can show a "your old draft was discarded" snackbar
   * if needed.
   */
  evicted: DraftIndexEntry[];
}

/**
 * Load drafts from localStorage. Applies TTL + LRU eviction at load time.
 * Returns {drafts: [], byId: {}, evicted: []} if storage is unavailable
 * or contains invalid data.
 */
export function loadDrafts(now: number = Date.now()): LoadedDrafts {
  if (typeof localStorage === 'undefined') {
    return { drafts: [], byId: {}, evicted: [] };
  }
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return { drafts: [], byId: {}, evicted: [] };
  }
  if (!raw) return { drafts: [], byId: {}, evicted: [] };

  let parsed: PersistedShape | undefined;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { drafts: [], byId: {}, evicted: [] };
  }
  if (!parsed || parsed.formatVersion !== FORMAT_VERSION) {
    // Format mismatch — nuke and start fresh.
    return { drafts: [], byId: {}, evicted: [] };
  }

  const evicted: DraftIndexEntry[] = [];
  const live: DraftIndexEntry[] = [];

  for (const d of parsed.drafts ?? []) {
    if (now - d.lastInteractionAt > TTL_MS) {
      evicted.push(d);
    } else {
      live.push(d);
    }
  }

  // LRU: keep the MAX_DRAFTS most recent.
  live.sort((a, b) => b.lastInteractionAt - a.lastInteractionAt);
  if (live.length > MAX_DRAFTS) {
    evicted.push(...live.splice(MAX_DRAFTS));
  }

  // Project byId down to surviving formIds.
  const byId: Record<string, FormReduxState> = {};
  for (const d of live) {
    const rec = parsed.byId?.[d.formId];
    if (rec) byId[d.formId] = rec;
  }

  return { drafts: live, byId, evicted };
}

/**
 * Persist the current draft state. Caller selects only the draft slice;
 * we don't reach into the wider state here.
 */
export function saveDrafts(drafts: DraftIndexEntry[], byId: Record<string, FormReduxState>): void {
  if (typeof localStorage === 'undefined') return;
  // Only persist records that are actually drafts (defensive).
  const draftById: Record<string, FormReduxState> = {};
  for (const d of drafts) {
    const rec = byId[d.formId];
    if (rec && rec.isDraft) draftById[d.formId] = rec;
  }
  const payload: PersistedShape = {
    formatVersion: FORMAT_VERSION,
    drafts,
    byId: draftById,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded or storage disabled — drop silently.
  }
}

/**
 * Project a FormsState slice down to just the draft pieces. Used by the
 * persistence subscriber.
 */
export function selectPersistableDrafts(forms: FormsState): {
  drafts: DraftIndexEntry[];
  byId: Record<string, FormReduxState>;
} {
  return { drafts: forms.drafts, byId: forms.byId };
}
