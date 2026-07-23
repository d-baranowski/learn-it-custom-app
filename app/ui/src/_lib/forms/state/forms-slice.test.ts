import { describe, it, expect } from '@jest/globals';
import { FormsReducer, FormsState, formsActions, FormReduxState } from './forms-slice';

const blank: FormsState = {
  byId: {},
  formIdByWindowId: {},
  drafts: [],
};

const fid = 'therapy:abc123';
const wid = 'win-1';

const baseCreated = {
  formId: fid,
  entityType: 'therapy',
  entityId: 'abc123',
  protoTypeName: 'core.v1.Therapy',
  schemaVersion: 1,
  defaultValues: { name: '', durationMin: 60 },
};

function applyCreated(state = blank, overrides = {}): FormsState {
  return FormsReducer(state, formsActions.formCreated({ ...baseCreated, ...overrides }));
}

describe('formsSlice — creation & loading', () => {
  it('formCreated for an edit form (entityId present) starts in loading status', () => {
    const next = applyCreated();
    const f = next.byId[fid];
    expect(f.status).toBe('loading');
    expect(f.entityId).toBe('abc123');
    expect(f.values).toEqual({ name: '', durationMin: 60 });
  });

  it('formCreated for a create form (entityId null) starts ready', () => {
    const next = applyCreated(blank, { entityId: null });
    expect(next.byId[fid].status).toBe('ready');
  });

  it('formLoaded replaces values + defaults, clears dirty/errors', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'WIP' }));
    expect(s.byId[fid].isDirty).toBe(true);
    s = FormsReducer(s, formsActions.formLoaded({ formId: fid, values: { name: 'Loaded', durationMin: 45 } }));
    const f = s.byId[fid];
    expect(f.status).toBe('ready');
    expect(f.values).toEqual({ name: 'Loaded', durationMin: 45 });
    expect(f.defaultValues).toEqual({ name: 'Loaded', durationMin: 45 });
    expect(f.isDirty).toBe(false);
  });

  it('formLoadFailed sets formError and submitError status', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.formLoadFailed({ formId: fid, error: 'boom' }));
    expect(s.byId[fid].status).toBe('submitError');
    expect(s.byId[fid].formError).toBe('boom');
    expect(s.byId[fid].isValid).toBe(false);
  });
});

describe('formsSlice — fieldChanged dirty tracking', () => {
  it('marks dirty when value differs from default', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'NewName' }));
    expect(s.byId[fid].fields['name'].isDirty).toBe(true);
    expect(s.byId[fid].isDirty).toBe(true);
  });

  it('clears dirty when value reverts to default', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'X' }));
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: '' }));
    expect(s.byId[fid].fields['name'].isDirty).toBe(false);
    expect(s.byId[fid].isDirty).toBe(false);
  });

  it('uses deep equality for object-valued fields', () => {
    let s = applyCreated(blank, {
      defaultValues: { customer: { id: 'c-1', name: 'A' } },
    });
    // Same shape, different reference → not dirty
    s = FormsReducer(s, formsActions.fieldChanged({
      formId: fid, name: 'customer', value: { id: 'c-1', name: 'A' },
    }));
    expect(s.byId[fid].isDirty).toBe(false);
    // Different shape → dirty
    s = FormsReducer(s, formsActions.fieldChanged({
      formId: fid, name: 'customer', value: { id: 'c-2', name: 'B' },
    }));
    expect(s.byId[fid].isDirty).toBe(true);
  });

  it('per-field dirty drives form-level dirty correctly with multiple fields', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'X' }));
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'durationMin', value: 30 }));
    expect(s.byId[fid].isDirty).toBe(true);
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: '' }));
    expect(s.byId[fid].isDirty).toBe(true); // durationMin still dirty
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'durationMin', value: 60 }));
    expect(s.byId[fid].isDirty).toBe(false);
  });
});

describe('formsSlice — blur, register, unregister', () => {
  it('fieldBlurred sets touched', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldBlurred({ formId: fid, name: 'name' }));
    expect(s.byId[fid].fields['name'].isTouched).toBe(true);
  });

  it('fieldRegistered with default backfills value if absent', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldRegistered({ formId: fid, name: 'newField', defaultValue: 'hello' }));
    expect(s.byId[fid].values['newField']).toBe('hello');
    expect(s.byId[fid].defaultValues['newField']).toBe('hello');
    expect(s.byId[fid].fields['newField']).toBeDefined();
  });

  it('fieldRegistered does not overwrite an existing value', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'preset' }));
    s = FormsReducer(s, formsActions.fieldRegistered({ formId: fid, name: 'name', defaultValue: 'IGNORED' }));
    expect(s.byId[fid].values['name']).toBe('preset');
  });

  it('fieldUnregistered removes value, meta, and error by default', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'X' }));
    s = FormsReducer(s, formsActions.validationCompleted({
      formId: fid,
      validatedNames: ['name'],
      errors: { name: { type: 'required', message: 'r', path: 'name' } },
    }));
    s = FormsReducer(s, formsActions.fieldUnregistered({ formId: fid, name: 'name' }));
    expect(s.byId[fid].values['name']).toBeUndefined();
    expect(s.byId[fid].fields['name']).toBeUndefined();
    expect(s.byId[fid].errors['name']).toBeUndefined();
  });

  it('fieldUnregistered with keepValue retains the value', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'X' }));
    s = FormsReducer(s, formsActions.fieldUnregistered({ formId: fid, name: 'name', keepValue: true }));
    expect(s.byId[fid].values['name']).toBe('X');
  });
});

describe('formsSlice — validation', () => {
  it('validationStarted then validationCompleted clears flags and applies errors', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.validationStarted({ formId: fid, names: ['name'] }));
    expect(s.byId[fid].fields['name'].isValidating).toBe(true);
    s = FormsReducer(s, formsActions.validationCompleted({
      formId: fid,
      validatedNames: ['name'],
      errors: { name: { type: 'required', message: 'Required', path: 'name' } },
    }));
    expect(s.byId[fid].fields['name'].isValidating).toBe(false);
    expect(s.byId[fid].errors['name'].message).toBe('Required');
    expect(s.byId[fid].isValid).toBe(false);
  });

  it('validationCompleted clears prior error when field validates clean', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.validationCompleted({
      formId: fid,
      validatedNames: ['name'],
      errors: { name: { type: 'r', message: 'm', path: 'name' } },
    }));
    expect(s.byId[fid].isValid).toBe(false);
    s = FormsReducer(s, formsActions.validationCompleted({
      formId: fid,
      validatedNames: ['name'],
      errors: {},
    }));
    expect(s.byId[fid].errors['name']).toBeUndefined();
    expect(s.byId[fid].isValid).toBe(true);
  });

  it('formError participates in isValid', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.validationCompleted({
      formId: fid,
      validatedNames: [],
      errors: {},
      formError: 'server says no',
    }));
    expect(s.byId[fid].formError).toBe('server says no');
    expect(s.byId[fid].isValid).toBe(false);
  });
});

describe('formsSlice — submit lifecycle', () => {
  it('submit started → succeeded clears any draft', () => {
    let s = applyCreated();
    // Make it dirty + dismiss to create a draft, then re-create + submit succeeds.
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'X' }));
    s = FormsReducer(s, formsActions.formDestroyed({ formId: fid, persistOnDismiss: true }));
    expect(s.drafts).toHaveLength(1);
    s = applyCreated(s); // re-mounts
    s = FormsReducer(s, formsActions.formSubmitStarted({ formId: fid }));
    s = FormsReducer(s, formsActions.formSubmitSucceeded({ formId: fid }));
    expect(s.byId[fid].status).toBe('submitSuccess');
    expect(s.drafts).toHaveLength(0);
  });

  it('submit failed records error and stays mounted', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.formSubmitStarted({ formId: fid }));
    s = FormsReducer(s, formsActions.formSubmitFailed({ formId: fid, error: 'oops' }));
    expect(s.byId[fid].status).toBe('submitError');
    expect(s.byId[fid].submitError).toBe('oops');
    expect(s.byId[fid]).toBeDefined();
  });
});

describe('formsSlice — destroy / draft / restore', () => {
  it('formDestroyed on a clean form deletes it', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.formDestroyed({ formId: fid, persistOnDismiss: true }));
    expect(s.byId[fid]).toBeUndefined();
    expect(s.drafts).toHaveLength(0);
  });

  it('formDestroyed on a dirty form with persistOnDismiss persists as draft', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'X' }));
    s = FormsReducer(s, formsActions.formDestroyed({ formId: fid, persistOnDismiss: true }));
    expect(s.byId[fid]).toBeDefined();
    expect(s.byId[fid].status).toBe('draft');
    expect(s.byId[fid].isDraft).toBe(true);
    expect(s.drafts).toHaveLength(1);
    expect(s.drafts[0].formId).toBe(fid);
  });

  it('formDestroyed with forceDelete hard-deletes even if dirty', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'X' }));
    s = FormsReducer(s, formsActions.formDestroyed({ formId: fid, persistOnDismiss: true, forceDelete: true }));
    expect(s.byId[fid]).toBeUndefined();
    expect(s.drafts).toHaveLength(0);
  });

  it('formDestroyed without persistOnDismiss deletes even if dirty', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'X' }));
    s = FormsReducer(s, formsActions.formDestroyed({ formId: fid, persistOnDismiss: false }));
    expect(s.byId[fid]).toBeUndefined();
    expect(s.drafts).toHaveLength(0);
  });

  it('formCreated on a draft restores values from the draft', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'WIP' }));
    s = FormsReducer(s, formsActions.formDestroyed({ formId: fid, persistOnDismiss: true }));
    s = applyCreated(s); // re-mount with same formId
    expect(s.byId[fid].status).toBe('ready');
    expect(s.byId[fid].values['name']).toBe('WIP');
    expect(s.byId[fid].isDraft).toBe(false);
    expect(s.drafts).toHaveLength(0);
  });

  it('draftDiscarded removes draft entirely', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'X' }));
    s = FormsReducer(s, formsActions.formDestroyed({ formId: fid, persistOnDismiss: true }));
    s = FormsReducer(s, formsActions.draftDiscarded({ formId: fid }));
    expect(s.byId[fid]).toBeUndefined();
    expect(s.drafts).toHaveLength(0);
  });
});

describe('formsSlice — window binding', () => {
  it('windowBoundToForm and unbound update the index', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.windowBoundToForm({ windowId: wid, formId: fid }));
    expect(s.formIdByWindowId[wid]).toBe(fid);
    s = FormsReducer(s, formsActions.windowUnboundFromForm({ windowId: wid }));
    expect(s.formIdByWindowId[wid]).toBeUndefined();
  });

  it('formDestroyed clears window binding', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.windowBoundToForm({ windowId: wid, formId: fid }));
    s = FormsReducer(s, formsActions.formDestroyed({ formId: fid, persistOnDismiss: false }));
    expect(s.formIdByWindowId[wid]).toBeUndefined();
  });

  it('draftRestoredInto re-binds to a window', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'X' }));
    s = FormsReducer(s, formsActions.formDestroyed({ formId: fid, persistOnDismiss: true }));
    expect(s.byId[fid].status).toBe('draft');
    s = FormsReducer(s, formsActions.draftRestoredInto({ formId: fid, windowId: 'win-2' }));
    expect(s.byId[fid].status).toBe('ready');
    expect(s.byId[fid].isDraft).toBe(false);
    expect(s.formIdByWindowId['win-2']).toBe(fid);
    expect(s.drafts).toHaveLength(0);
  });
});

describe('formsSlice — UI state', () => {
  it('formActiveTabChanged updates uiState.activeTabIndex', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.formActiveTabChanged({ formId: fid, index: 2 }));
    expect(s.byId[fid].uiState.activeTabIndex).toBe(2);
  });
});

describe('formsSlice — formReset', () => {
  it('formReset with no args reverts to defaultValues and clears dirty/errors', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.fieldChanged({ formId: fid, name: 'name', value: 'X' }));
    s = FormsReducer(s, formsActions.formReset({ formId: fid }));
    expect(s.byId[fid].values).toEqual({ name: '', durationMin: 60 });
    expect(s.byId[fid].isDirty).toBe(false);
    expect(s.byId[fid].fields).toEqual({});
  });

  it('formReset with values replaces values', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.formReset({ formId: fid, values: { name: 'A', durationMin: 90 } }));
    expect(s.byId[fid].values).toEqual({ name: 'A', durationMin: 90 });
  });

  it('formReset with defaultValues replaces both', () => {
    let s = applyCreated();
    s = FormsReducer(s, formsActions.formReset({
      formId: fid,
      defaultValues: { name: 'D', durationMin: 30 },
    }));
    expect(s.byId[fid].defaultValues).toEqual({ name: 'D', durationMin: 30 });
    expect(s.byId[fid].values).toEqual({ name: 'D', durationMin: 30 });
  });
});

describe('formsSlice — draftsHydrated', () => {
  it('hydrates from persistence without clobbering live forms', () => {
    let s = applyCreated();
    const persisted: FormReduxState = {
      ...s.byId[fid],
      id: 'therapy:other',
      entityId: 'other',
      status: 'draft',
      isDraft: true,
      values: { name: 'persisted' },
    };
    s = FormsReducer(s, formsActions.draftsHydrated({
      drafts: [{
        formId: 'therapy:other',
        entityType: 'therapy',
        entityId: 'other',
        createdAt: 1,
        lastInteractionAt: 1,
        schemaVersion: 1,
      }],
      byId: { 'therapy:other': persisted },
    }));
    expect(s.byId[fid]).toBeDefined();
    expect(s.byId['therapy:other']).toBeDefined();
    expect(s.drafts).toHaveLength(1);
  });

  it('does not overwrite a live form with a hydrated draft for the same id', () => {
    let s = applyCreated(); // live form for fid
    const masquerader = { ...s.byId[fid], values: { name: 'EVIL' } };
    s = FormsReducer(s, formsActions.draftsHydrated({
      drafts: [],
      byId: { [fid]: masquerader },
    }));
    expect(s.byId[fid].values).toEqual({ name: '', durationMin: 60 });
  });
});
