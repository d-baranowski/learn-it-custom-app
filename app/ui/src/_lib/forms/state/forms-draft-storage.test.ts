import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import type { FormReduxState, DraftIndexEntry, FormsState } from './forms-slice';
import { loadDrafts, saveDrafts, selectPersistableDrafts } from './forms-draft-storage';

// Minimal in-memory localStorage shim — avoids pulling in jsdom for one
// pure-JS file's tests. Both loadDrafts and saveDrafts inspect
// `typeof localStorage` lazily inside their function bodies, so installing
// the shim before tests run (rather than before module import) is enough.
class MemoryStorage {
  private store: Record<string, string> = {};
  getItem(k: string) { return this.store[k] ?? null; }
  setItem(k: string, v: string) { this.store[k] = v; }
  removeItem(k: string) { delete this.store[k]; }
  clear() { this.store = {}; }
  key(i: number) { return Object.keys(this.store)[i] ?? null; }
  get length() { return Object.keys(this.store).length; }
}

const originalLocalStorage = (globalThis as any).localStorage;
beforeAll(() => {
  (globalThis as any).localStorage = new MemoryStorage();
});
afterAll(() => {
  (globalThis as any).localStorage = originalLocalStorage;
});

function mkRec(formId: string, overrides: Partial<FormReduxState> = {}): FormReduxState {
  return {
    id: formId,
    entityType: 'therapy',
    entityId: 'abc',
    status: 'draft',
    mountedAt: 0,
    lastInteractionAt: 0,
    protoTypeName: 'core.v1.Therapy',
    schemaVersion: 1,
    defaultValues: {},
    values: {},
    fields: {},
    isDirty: true,
    isValid: true,
    errors: {},
    formError: null,
    submitCount: 0,
    submitError: null,
    isDraft: true,
    draftSavedAt: 0,
    uiState: {},
    ...overrides,
  };
}

function mkEntry(formId: string, overrides: Partial<DraftIndexEntry> = {}): DraftIndexEntry {
  return {
    formId,
    entityType: 'therapy',
    entityId: 'abc',
    createdAt: 0,
    lastInteractionAt: 0,
    schemaVersion: 1,
    ...overrides,
  };
}

describe('forms-draft-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips drafts', () => {
    const drafts = [mkEntry('therapy:1', { lastInteractionAt: 100 })];
    const byId = { 'therapy:1': mkRec('therapy:1') };
    saveDrafts(drafts, byId);
    const loaded = loadDrafts(101);
    expect(loaded.drafts).toHaveLength(1);
    expect(loaded.byId['therapy:1']).toBeDefined();
    expect(loaded.evicted).toHaveLength(0);
  });

  it('returns empty when no storage', () => {
    expect(loadDrafts()).toEqual({ drafts: [], byId: {}, evicted: [] });
  });

  it('evicts entries older than 24h', () => {
    const oldEnough = mkEntry('therapy:old', { lastInteractionAt: 0 });
    const fresh = mkEntry('therapy:new', { lastInteractionAt: 25 * 60 * 60 * 1000 });
    saveDrafts(
      [oldEnough, fresh],
      {
        'therapy:old': mkRec('therapy:old'),
        'therapy:new': mkRec('therapy:new'),
      }
    );
    const loaded = loadDrafts(25 * 60 * 60 * 1000 + 1000);
    expect(loaded.drafts).toHaveLength(1);
    expect(loaded.drafts[0].formId).toBe('therapy:new');
    expect(loaded.evicted).toHaveLength(1);
    expect(loaded.evicted[0].formId).toBe('therapy:old');
  });

  it('LRU-evicts when more than 50 drafts', () => {
    const drafts: DraftIndexEntry[] = [];
    const byId: Record<string, FormReduxState> = {};
    for (let i = 0; i < 60; i++) {
      const id = `therapy:${i}`;
      drafts.push(mkEntry(id, { lastInteractionAt: i }));
      byId[id] = mkRec(id);
    }
    saveDrafts(drafts, byId);
    const loaded = loadDrafts(60);
    expect(loaded.drafts).toHaveLength(50);
    // Most recent should survive (formId 59 has highest lastInteractionAt)
    expect(loaded.drafts[0].formId).toBe('therapy:59');
    expect(loaded.evicted).toHaveLength(10);
  });

  it('discards persisted data with mismatched format version', () => {
    localStorage.setItem(
      'utro:formDrafts:v1',
      JSON.stringify({ formatVersion: 999, drafts: [], byId: {} })
    );
    const loaded = loadDrafts();
    expect(loaded.drafts).toHaveLength(0);
  });

  it('only persists records that are isDraft', () => {
    const drafts = [mkEntry('therapy:1')];
    const byId = {
      'therapy:1': mkRec('therapy:1', { isDraft: true }),
      'therapy:2': mkRec('therapy:2', { isDraft: false }), // shouldn't be persisted
    };
    saveDrafts(drafts, byId);
    const raw = localStorage.getItem('utro:formDrafts:v1');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.byId['therapy:1']).toBeDefined();
    expect(parsed.byId['therapy:2']).toBeUndefined();
  });

  it('selectPersistableDrafts projects from FormsState', () => {
    const state: FormsState = {
      byId: { 'therapy:1': mkRec('therapy:1') },
      formIdByWindowId: { 'win-1': 'therapy:1' },
      drafts: [mkEntry('therapy:1')],
    };
    const projection = selectPersistableDrafts(state);
    expect(projection.drafts).toHaveLength(1);
    expect(projection.byId['therapy:1']).toBeDefined();
    // The reverse window index is NOT in the projection — it's transient.
    expect(projection).not.toHaveProperty('formIdByWindowId');
  });
});
