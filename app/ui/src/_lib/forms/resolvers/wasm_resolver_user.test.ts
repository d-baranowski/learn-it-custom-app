import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SaveUserRequest } from '@gen/core/v1/user_pb';
import { createWasmResolver } from './wasm-resolver';
import { setTestLanguage, translate } from '~/__test_utils__';

type WasmResult = {
  ok: boolean;
  errors?: Array<{ fieldPath: string; message: string; constraintID: string; forKey: boolean }>;
};

function simulateWasmValidateMessage(jsonStr: string): WasmResult {
  const parsed = JSON.parse(jsonStr);
  const errors: WasmResult['errors'] = [];

  const username = parsed['username'] ?? '';
  if (typeof username !== 'string' || username.length <= 5) {
    errors.push({
      fieldPath: 'username',
      message: 'Username must be longer than 5 letter',
      constraintID: 'user.username.1',
      forKey: false,
    });
  }

  const displayName = parsed['display_name'] ?? parsed['displayName'] ?? '';
  if (typeof displayName === 'string' && displayName.length > 0 && displayName.length <= 5) {
    errors.push({
      fieldPath: 'displayName',
      message: 'Display name must be longer than 5 letter',
      constraintID: 'user.displayName.1',
      forKey: false,
    });
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

// ── English ─────────────────────────────────────────────────────────────────

describe('createWasmResolver — user validation (English)', () => {
  beforeEach(() => {
    setTestLanguage('en');
    installWasmMock();
  });
  afterEach(() => removeWasmMock());

  it('returns CEL error for short username', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveUserRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({ username: 'abc' });

    expect(errors.username).toBeDefined();
    expect(errors.username.type).toBe('wasm');
    expect(errors.username.message).toBe('Username must be longer than 5 letter');
  });

  it('returns CEL error for short displayName', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveUserRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      username: 'validuser',
      displayName: 'AB',
    });

    expect(errors.displayName).toBeDefined();
    expect(errors.displayName.message).toBe('Display name must be longer than 5 letter');
  });

  it('returns no errors when fields are valid', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveUserRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      username: 'validuser',
      displayName: 'John Doe',
      email: 'john@example.com',
    });

    expect(errors.username).toBeUndefined();
    expect(errors.displayName).toBeUndefined();
  });

  it('accepts empty displayName (optional field)', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveUserRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      username: 'validuser',
      displayName: '',
    });

    expect(errors.displayName).toBeUndefined();
  });

  it('validates username at exact boundary (5 chars fails, 6 passes)', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveUserRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errShort = await resolver.validateAll({ username: '12345' });
    expect(errShort.username).toBeDefined();

    const errOk = await resolver.validateAll({ username: '123456' });
    expect(errOk.username).toBeUndefined();
  });

  it('validateField returns error for invalid username', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveUserRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const error = await resolver.validateField('username', 'ab', { username: 'ab' });
    expect(error).not.toBeNull();
    expect(error!.message).toBe('Username must be longer than 5 letter');
  });

  it('validateField returns null for valid username', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveUserRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const error = await resolver.validateField('username', 'validuser', {
      username: 'validuser',
    });
    expect(error).toBeNull();
  });
});

// ── Polish ──────────────────────────────────────────────────────────────────

describe('createWasmResolver — user validation (Polish)', () => {
  beforeEach(() => {
    setTestLanguage('pl');
    installWasmMock();
  });
  afterEach(() => {
    removeWasmMock();
    setTestLanguage('en');
  });

  it('returns raw CEL message (not translated) for short username', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveUserRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({ username: 'abc' });
    expect(errors.username.message).toBe('Username must be longer than 5 letter');
  });
});
