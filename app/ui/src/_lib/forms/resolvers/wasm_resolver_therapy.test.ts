import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { SaveTherapyRequest } from '@gen/core/v1/therapy_pb';
import { createWasmResolver } from './wasm-resolver';
import { validateTherapyForm } from '~/validation/custom-validations';
import { setTestLanguage, translate } from '~/__test_utils__';

type WasmResult = {
  ok: boolean;
  errors?: Array<{ fieldPath: string; message: string; constraintID: string; forKey: boolean }>;
};

function simulateWasmValidateMessage(jsonStr: string): WasmResult {
  const parsed = JSON.parse(jsonStr);
  const errors: WasmResult['errors'] = [];

  const minLenFields: Array<{ snakeKey: string; camelKey: string; minLen: number }> = [
    { snakeKey: 'therapist_id', camelKey: 'therapistId', minLen: 1 },
    { snakeKey: 'service_id', camelKey: 'serviceId', minLen: 1 },
    { snakeKey: 'display_name', camelKey: 'displayName', minLen: 1 },
    { snakeKey: 'session_price', camelKey: 'sessionPrice', minLen: 1 },
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

  const startDate = parsed['start_date'] ?? parsed['startDate'];
  if (!startDate || Number(startDate) <= 0) {
    errors.push({
      fieldPath: 'startDate',
      message: 'value must be greater than 0 [int64.gt]',
      constraintID: 'int64.gt',
      forKey: false,
    });
  }

  const sessionDuration = parsed['session_duration'] ?? parsed['sessionDuration'];
  if (sessionDuration === undefined || sessionDuration === null || Number(sessionDuration) <= 0) {
    errors.push({
      fieldPath: 'sessionDuration',
      message: 'value must be greater than 0 [int32.gt]',
      constraintID: 'int32.gt',
      forKey: false,
    });
  }

  const customerIds = parsed['customer_ids'] ?? parsed['customerIds'];
  if (!customerIds || !Array.isArray(customerIds) || customerIds.length < 1) {
    errors.push({
      fieldPath: 'customerIds',
      message: 'value must contain at least 1 item(s) [repeated.min_items]',
      constraintID: 'repeated.min_items',
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

describe('createWasmResolver — therapy validation (English)', () => {
  beforeEach(() => {
    setTestLanguage('en');
    installWasmMock();
  });
  afterEach(() => removeWasmMock());

  it('returns translated errors for all empty required fields', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveTherapyRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({});

    expect(errors.therapistId).toBeDefined();
    expect(errors.therapistId.type).toBe('wasm');
    expect(errors.therapistId.message).toBe('Must have at least 1 character(s)');

    expect(errors.serviceId).toBeDefined();
    expect(errors.serviceId.message).toBe('Must have at least 1 character(s)');

    expect(errors.displayName).toBeDefined();
    expect(errors.displayName.message).toBe('Must have at least 1 character(s)');

    expect(errors.sessionPrice).toBeDefined();
    expect(errors.sessionPrice.message).toBe('Must have at least 1 character(s)');

    expect(errors.startDate).toBeDefined();
    expect(errors.startDate.message).toBe('Must be greater than 0');

    expect(errors.sessionDuration).toBeDefined();
    expect(errors.sessionDuration.message).toBe('Must be greater than 0');

    expect(errors.customerIds).toBeDefined();
    expect(errors.customerIds.message).toBe('Must have at least 1 item(s)');
  });

  it('returns no errors when all required fields are filled', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveTherapyRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      therapistId: 'th-1',
      serviceId: 'svc-1',
      displayName: 'CBT Therapy',
      sessionPrice: '200',
      startDate: String(Date.now()),
      sessionDuration: 50,
      customerIds: ['cust-1'],
    });

    expect(errors.therapistId).toBeUndefined();
    expect(errors.serviceId).toBeUndefined();
    expect(errors.displayName).toBeUndefined();
    expect(errors.sessionPrice).toBeUndefined();
    expect(errors.startDate).toBeUndefined();
    expect(errors.sessionDuration).toBeUndefined();
    expect(errors.customerIds).toBeUndefined();
  });

  it('rejects sessionDuration of zero', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveTherapyRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      therapistId: 'th-1',
      serviceId: 'svc-1',
      displayName: 'CBT Therapy',
      sessionPrice: '200',
      startDate: String(Date.now()),
      sessionDuration: 0,
      customerIds: ['cust-1'],
    });

    expect(errors.sessionDuration).toBeDefined();
    expect(errors.sessionDuration.message).toBe('Must be greater than 0');
  });

  it('allows creation without endDate', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveTherapyRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({
      therapistId: 'th-1',
      serviceId: 'svc-1',
      displayName: 'CBT Therapy',
      sessionPrice: '200',
      startDate: String(Date.now()),
      sessionDuration: 50,
      customerIds: ['cust-1'],
    });

    expect(errors.endDate).toBeUndefined();
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('layers custom validation — offline frequency entry without room', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveTherapyRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
      customValidation: validateTherapyForm,
    });

    const errors = await resolver.validateAll({
      therapistId: 'th-1',
      serviceId: 'svc-1',
      displayName: 'CBT',
      sessionPrice: '200',
      startDate: String(Date.now()),
      sessionDuration: 50,
      customerIds: ['cust-1'],
      sessionFrequency: [{ isOnline: false }],
    });

    expect(errors['sessionFrequency.0.roomId']).toBeDefined();
    expect(errors['sessionFrequency.0.roomId'].type).toBe('custom');
    expect(errors['sessionFrequency.0.roomId'].message).toBe(
      'Room is required for offline sessions'
    );
  });

  it('validateField returns error for a single empty field', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveTherapyRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const error = await resolver.validateField('therapistId', '', {});
    expect(error).not.toBeNull();
    expect(error!.message).toBe('Must have at least 1 character(s)');
  });

  it('validateField returns null for a valid field', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveTherapyRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const error = await resolver.validateField('therapistId', 'th-1', {
      therapistId: 'th-1',
      serviceId: 'svc-1',
      displayName: 'CBT',
      sessionPrice: '200',
      startDate: String(Date.now()),
      sessionDuration: 50,
      customerIds: ['cust-1'],
    });
    expect(error).toBeNull();
  });
});

// ── Polish ──────────────────────────────────────────────────────────────────

describe('createWasmResolver — therapy validation (Polish)', () => {
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
      protoConstructor: SaveTherapyRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
    });

    const errors = await resolver.validateAll({});

    expect(errors.therapistId.message).toBe('Musi zawierać co najmniej 1 znak(ów)');
    expect(errors.serviceId.message).toBe('Musi zawierać co najmniej 1 znak(ów)');
    expect(errors.displayName.message).toBe('Musi zawierać co najmniej 1 znak(ów)');
    expect(errors.sessionPrice.message).toBe('Musi zawierać co najmniej 1 znak(ów)');
    expect(errors.startDate.message).toBe('Musi być większe niż 0');
    expect(errors.sessionDuration.message).toBe('Musi być większe niż 0');
    expect(errors.customerIds.message).toBe('Musi zawierać co najmniej 1 element(ów)');
  });

  it('layers custom validation in Polish context with translated custom message', async () => {
    const resolver = createWasmResolver({
      protoConstructor: SaveTherapyRequest,
      t: ((key: string, opts?: Record<string, unknown>) => translate(key, opts)) as never,
      customValidation: validateTherapyForm,
    });

    const errors = await resolver.validateAll({
      therapistId: 'th-1',
      serviceId: 'svc-1',
      displayName: 'CBT',
      sessionPrice: '200',
      startDate: String(Date.now()),
      sessionDuration: 50,
      customerIds: ['cust-1'],
      sessionFrequency: [{ isOnline: false }],
    });

    expect(errors['sessionFrequency.0.roomId'].message).toBe(
      'Pokój jest wymagany dla sesji stacjonarnych'
    );
    expect(errors['sessionFrequency.0.roomId'].type).toBe('custom');
  });
});
