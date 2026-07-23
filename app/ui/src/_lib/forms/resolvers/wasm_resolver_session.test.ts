import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SaveSessionRequest } from '@gen/core/v1/session_pb';
import { createWasmResolver } from './wasm-resolver';
import { validateSessionForm } from '~/validation/custom-validations';
import { setTestLanguage, translate } from '~/__test_utils__';

type WasmResult = {
  ok: boolean;
  errors?: Array<{ fieldPath: string; message: string; constraintID: string; forKey: boolean }>;
};

function simulateWasmValidateMessage(jsonStr: string): WasmResult {
  const parsed = JSON.parse(jsonStr);
  const errors: WasmResult['errors'] = [];

  // Proto field names in the JSON can be either snake_case (useProtoFieldName)
  // or camelCase depending on serialization. Check both.
  const minLenFields: Array<{ snakeKey: string; camelKey: string; minLen: number }> = [
    { snakeKey: 'therapist_id', camelKey: 'therapistId', minLen: 1 },
    { snakeKey: 'date', camelKey: 'date', minLen: 10 },
    { snakeKey: 'start_time', camelKey: 'startTime', minLen: 5 },
    { snakeKey: 'end_time', camelKey: 'endTime', minLen: 5 },
    { snakeKey: 'price', camelKey: 'price', minLen: 1 },
    { snakeKey: 'timezone', camelKey: 'timezone', minLen: 1 },
  ];

  for (const { snakeKey, camelKey, minLen } of minLenFields) {
    const value = parsed[snakeKey] ?? parsed[camelKey];
    if (!value || (typeof value === 'string' && value.length < minLen)) {
      errors.push({
        fieldPath: camelKey,
        message: `value length must be at least ${minLen} characters [string.min_len]`,
        constraintID: 'string.min_len',
        forKey: false,
      });
    }
  }

  return { ok: errors.length === 0, errors };
}

function installWasmMock() {
  (globalThis as Record<string, unknown>).validateMessage = (json: string) =>
    simulateWasmValidateMessage(json);
}

function removeWasmMock() {
  delete (globalThis as Record<string, unknown>).validateMessage;
}

// ── English tests ────────────────────────────────────────────────────────────

describe('createWasmResolver — session validation (English)', () => {
  beforeEach(() => {
    setTestLanguage('en');
    installWasmMock();
  });
  afterEach(() => removeWasmMock());

  it('returns translated errors for empty required fields', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveSessionRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({});

    expect(errors.therapistId).toBeDefined();
    expect(errors.therapistId.type).toBe('wasm');
    expect(errors.therapistId.message).toBe('Must have at least 1 character(s)');

    expect(errors.date).toBeDefined();
    expect(errors.date.message).toBe('Must have at least 10 character(s)');

    expect(errors.startTime).toBeDefined();
    expect(errors.startTime.message).toBe('Must have at least 5 character(s)');

    expect(errors.price).toBeDefined();
    expect(errors.price.message).toBe('Must have at least 1 character(s)');

    expect(errors.timezone).toBeDefined();
    expect(errors.timezone.message).toBe('Must have at least 1 character(s)');
  });

  it('returns no errors when all required fields are filled', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveSessionRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      therapistId: 'th-1',
      date: '2026-05-27',
      startTime: '10:00',
      endTime: '10:50',
      price: '200',
      timezone: 'Europe/Warsaw',
    });

    expect(errors.therapistId).toBeUndefined();
    expect(errors.date).toBeUndefined();
    expect(errors.startTime).toBeUndefined();
    expect(errors.endTime).toBeUndefined();
    expect(errors.price).toBeUndefined();
    expect(errors.timezone).toBeUndefined();
  });

  it('layers custom validation on top of wasm errors', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveSessionRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
      customValidation: validateSessionForm,
    });

    const errors = await resolver.validateAll({
      therapistId: 'th-1',
      date: '2026-05-27',
      startTime: '10:00',
      endTime: '10:50',
      price: '200',
      timezone: 'Europe/Warsaw',
      isOnline: false,
    });

    expect(errors.roomId).toBeDefined();
    expect(errors.roomId.type).toBe('custom');
    expect(errors.roomId.message).toBe('Room is required for offline sessions');
  });

  it('validateField returns error for a single field', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveSessionRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const error = await resolver.validateField('therapistId', '', {});
    expect(error).not.toBeNull();
    expect(error!.message).toBe('Must have at least 1 character(s)');
  });

  it('validateField returns null for a valid field', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveSessionRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const error = await resolver.validateField('therapistId', 'th-1', {
      therapistId: 'th-1',
      date: '2026-05-27',
      startTime: '10:00',
      endTime: '10:50',
      price: '200',
      timezone: 'Europe/Warsaw',
    });
    expect(error).toBeNull();
  });
});

// ── Polish tests ─────────────────────────────────────────────────────────────

describe('createWasmResolver — session validation (Polish)', () => {
  beforeEach(() => {
    setTestLanguage('pl');
    installWasmMock();
  });
  afterEach(() => {
    removeWasmMock();
    setTestLanguage('en');
  });

  it('returns Polish-translated errors for empty required fields', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveSessionRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({});

    expect(errors.therapistId).toBeDefined();
    expect(errors.therapistId.message).toBe('Musi zawierać co najmniej 1 znak(ów)');

    expect(errors.date).toBeDefined();
    expect(errors.date.message).toBe('Musi zawierać co najmniej 10 znak(ów)');

    expect(errors.price).toBeDefined();
    expect(errors.price.message).toBe('Musi zawierać co najmniej 1 znak(ów)');
  });

  it('layers custom validation in Polish context', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveSessionRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
      customValidation: validateSessionForm,
    });

    const errors = await resolver.validateAll({
      therapistId: 'th-1',
      date: '2026-05-27',
      startTime: '10:00',
      endTime: '10:50',
      price: '200',
      timezone: 'Europe/Warsaw',
      isOnline: false,
    });

    expect(errors.roomId.message).toBe('Pokój jest wymagany dla sesji stacjonarnych');
    expect(errors.roomId.type).toBe('custom');
  });
});

// ── Edge cases ───────────────────────────────────────────────────────────────

describe('createWasmResolver — edge cases', () => {
  afterEach(() => removeWasmMock());

  it('returns wasm_unavailable when validateMessage is not present', async () => {
    removeWasmMock();
    const resolver = createWasmResolver({
      protoConstructor: SaveSessionRequest,
    });

    const errors = await resolver.validateAll({ therapistId: 'th-1' });
    expect(errors._form).toBeDefined();
    expect(errors._form.type).toBe('wasm_unavailable');
  });

  it('returns wasm_threw when validateMessage throws', async () => {
    (globalThis as Record<string, unknown>).validateMessage = () => {
      throw new Error('WASM crashed');
    };

    const resolver = createWasmResolver({
      protoConstructor: SaveSessionRequest,
    });

    const errors = await resolver.validateAll({
      therapistId: 'th-1',
      date: '2026-05-27',
      startTime: '10:00',
      endTime: '10:50',
      price: '200',
      timezone: 'Europe/Warsaw',
    });
    expect(errors._form).toBeDefined();
    expect(errors._form.type).toBe('wasm_threw');
    expect(errors._form.message).toContain('WASM crashed');
  });

  it('returns wasm_unknown when result.ok is false but no field errors', async () => {
    (globalThis as Record<string, unknown>).validateMessage = () => ({
      ok: false,
    });

    const resolver = createWasmResolver({
      protoConstructor: SaveSessionRequest,
    });

    const errors = await resolver.validateAll({
      therapistId: 'th-1',
      date: '2026-05-27',
      startTime: '10:00',
      endTime: '10:50',
      price: '200',
      timezone: 'Europe/Warsaw',
    });
    expect(errors._form).toBeDefined();
    expect(errors._form.type).toBe('wasm_unknown');
  });

  it('uses raw message when no t function provided', async () => {
    installWasmMock();

    const resolver = createWasmResolver({
      protoConstructor: SaveSessionRequest,
    });

    const errors = await resolver.validateAll({});
    expect(errors.therapistId.message).toContain('at least 1 characters');
  });
});
