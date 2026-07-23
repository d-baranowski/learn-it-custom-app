import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SaveCustomerRequest } from '@gen/core/v1/customer_pb';
import { createWasmResolver } from './wasm-resolver';
import { setTestLanguage, translate } from '~/__test_utils__';

type WasmResult = {
  ok: boolean;
  errors?: Array<{ fieldPath: string; message: string; constraintID: string; forKey: boolean }>;
};

const PHONE_PATTERN = /^\+[\d\s\-()]{7,18}$/;

function simulateWasmValidateMessage(jsonStr: string): WasmResult {
  const parsed = JSON.parse(jsonStr);
  const errors: WasmResult['errors'] = [];

  const minLenFields: Array<{ snakeKey: string; camelKey: string; minLen: number }> = [
    { snakeKey: 'first_name', camelKey: 'firstName', minLen: 1 },
    { snakeKey: 'last_name', camelKey: 'lastName', minLen: 1 },
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

  const email = parsed['email'];
  if (email && typeof email === 'string' && email.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({
        fieldPath: 'email',
        message: 'value must be a valid email address [string.email]',
        constraintID: 'string.email',
        forKey: false,
      });
    }
  }

  const phone = parsed['phone_number'] ?? parsed['phoneNumber'];
  if (phone && typeof phone === 'string' && phone.length > 0) {
    if (!PHONE_PATTERN.test(phone)) {
      errors.push({
        fieldPath: 'phoneNumber',
        message: `value does not match regex pattern \`^\\+[\\d\\s\\-()]{7,18}$\` [string.pattern]`,
        constraintID: 'string.pattern',
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

// ── English ─────────────────────────────────────────────────────────────────

describe('createWasmResolver — customer validation (English)', () => {
  beforeEach(() => {
    setTestLanguage('en');
    installWasmMock();
  });
  afterEach(() => removeWasmMock());

  it('returns translated errors for empty required fields', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({});

    expect(errors.firstName).toBeDefined();
    expect(errors.firstName.type).toBe('wasm');
    expect(errors.firstName.message).toBe('Must have at least 1 character(s)');

    expect(errors.lastName).toBeDefined();
    expect(errors.lastName.message).toBe('Must have at least 1 character(s)');
  });

  it('returns no errors when required fields are filled', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      firstName: 'Jan',
      lastName: 'Kowalski',
    });

    expect(errors.firstName).toBeUndefined();
    expect(errors.lastName).toBeUndefined();
  });

  it('returns email validation error for invalid email', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'not-an-email',
    });

    expect(errors.email).toBeDefined();
    expect(errors.email.type).toBe('wasm');
    expect(errors.email.message).toBe('Must be a valid email');
  });

  it('accepts valid email address', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'jan@example.com',
    });

    expect(errors.email).toBeUndefined();
  });

  it('returns pattern error for phone without country code', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      firstName: 'Jan',
      lastName: 'Kowalski',
      phoneNumber: '123456789',
    });

    expect(errors.phoneNumber).toBeDefined();
    expect(errors.phoneNumber.type).toBe('wasm');
    expect(errors.phoneNumber.message).toBe('Invalid format');
  });

  it('accepts valid phone number with country code', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      firstName: 'Jan',
      lastName: 'Kowalski',
      phoneNumber: '+48123456789',
    });

    expect(errors.phoneNumber).toBeUndefined();
  });

  it('accepts phone with spaces and dashes', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      firstName: 'Jan',
      lastName: 'Kowalski',
      phoneNumber: '+48 123-456-789',
    });

    expect(errors.phoneNumber).toBeUndefined();
  });

  it('validates both email and phone errors together', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'bad',
      phoneNumber: '123456789',
    });

    expect(errors.email).toBeDefined();
    expect(errors.email.message).toBe('Must be a valid email');
    expect(errors.phoneNumber).toBeDefined();
    expect(errors.phoneNumber.message).toBe('Invalid format');
  });

  it('validateField returns error for a single empty required field', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const error = await resolver.validateField('firstName', '', {});
    expect(error).not.toBeNull();
    expect(error!.message).toBe('Must have at least 1 character(s)');
  });

  it('validateField returns null for a valid field', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const error = await resolver.validateField('firstName', 'Jan', {
      firstName: 'Jan',
      lastName: 'Kowalski',
    });
    expect(error).toBeNull();
  });
});

// ── Polish ──────────────────────────────────────────────────────────────────

describe('createWasmResolver — customer validation (Polish)', () => {
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
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({});

    expect(errors.firstName.message).toBe('Musi zawierać co najmniej 1 znak(ów)');
    expect(errors.lastName.message).toBe('Musi zawierać co najmniej 1 znak(ów)');
  });

  it('returns Polish email validation error', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      firstName: 'Jan',
      lastName: 'Kowalski',
      email: 'bad-email',
    });

    expect(errors.email.message).toBe('Musi być prawidłowym adresem e-mail');
  });

  it('returns Polish phone pattern error', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveCustomerRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      firstName: 'Jan',
      lastName: 'Kowalski',
      phoneNumber: '123456789',
    });

    expect(errors.phoneNumber).toBeDefined();
    expect(errors.phoneNumber.type).toBe('wasm');
    expect(errors.phoneNumber.message).toBe('Nieprawidłowy format');
  });
});
