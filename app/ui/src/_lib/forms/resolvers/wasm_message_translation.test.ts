import { describe, it, expect } from '@jest/globals';
import { wasmMessageToTranslation } from './wasm-resolver';

describe('wasmMessageToTranslation', () => {
  it('maps min_len constraint', () => {
    const result = wasmMessageToTranslation(
      'value length must be at least 1 characters [string.min_len]'
    );
    expect(result).toEqual({ key: 'validation.min_len', values: { min: '1' } });
  });

  it('maps min_len with larger values', () => {
    const result = wasmMessageToTranslation(
      'value length must be at least 10 characters [string.min_len]'
    );
    expect(result).toEqual({ key: 'validation.min_len', values: { min: '10' } });
  });

  it('maps max_len constraint', () => {
    const result = wasmMessageToTranslation(
      'value must not be more than 255 characters [string.max_len]'
    );
    expect(result).toEqual({ key: 'validation.max_len', values: { max: '255' } });
  });

  it('maps min_items constraint', () => {
    const result = wasmMessageToTranslation(
      'value must contain at least 1 item(s) [repeated.min_items]'
    );
    expect(result).toEqual({ key: 'validation.min_items', values: { min: '1' } });
  });

  it('maps gt (greater than) constraint', () => {
    const result = wasmMessageToTranslation(
      'value must be greater than 0 [int32.gt]'
    );
    expect(result).toEqual({ key: 'validation.gt', values: { value: '0' } });
  });

  it('maps gt with negative values', () => {
    const result = wasmMessageToTranslation(
      'value must be greater than -1 [int32.gt]'
    );
    expect(result).toEqual({ key: 'validation.gt', values: { value: '-1' } });
  });

  it('maps gte (greater than or equal) constraint', () => {
    const result = wasmMessageToTranslation(
      'value must be greater than or equal to 0 [int32.gte]'
    );
    expect(result).toEqual({ key: 'validation.gte', values: { value: '0' } });
  });

  it('maps lt (less than) constraint', () => {
    const result = wasmMessageToTranslation(
      'value must be less than 100 [int32.lt]'
    );
    expect(result).toEqual({ key: 'validation.lt', values: { value: '100' } });
  });

  it('maps lte (less than or equal) constraint', () => {
    const result = wasmMessageToTranslation(
      'value must be less than or equal to 99 [int32.lte]'
    );
    expect(result).toEqual({ key: 'validation.lte', values: { value: '99' } });
  });

  it('maps email constraint', () => {
    const result = wasmMessageToTranslation(
      'value must be a valid email address [string.email]'
    );
    expect(result).toEqual({ key: 'validation.email' });
  });

  it('maps uuid constraint', () => {
    const result = wasmMessageToTranslation(
      'value must be a valid uuid [string.uuid]'
    );
    expect(result).toEqual({ key: 'validation.uuid' });
  });

  it('maps enum constraint', () => {
    const result = wasmMessageToTranslation(
      'value must be one of the defined enum values [enum.defined_only]'
    );
    expect(result).toEqual({ key: 'validation.enum' });
  });

  it('maps pattern constraint', () => {
    const result = wasmMessageToTranslation(
      'value does not match regex pattern `^\\+[\\d\\s\\-()]{7,18}$` [string.pattern]'
    );
    expect(result).toEqual({ key: 'validation.pattern' });
  });

  it('returns raw message as key for unknown constraints', () => {
    const raw = 'some unknown validation message';
    const result = wasmMessageToTranslation(raw);
    expect(result).toEqual({ key: raw });
  });
});
