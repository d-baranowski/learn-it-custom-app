import { describe, it, expect } from '@jest/globals';
import { wasmMessageToTranslation } from './wasm-resolver';

describe('wasmMessageToTranslation', () => {
  it('parses min_items message', () => {
    const result = wasmMessageToTranslation('value must contain at least 1 item(s)');
    expect(result).toEqual({ key: 'validation.min_items', values: { min: '1' } });
  });

  it('parses min_len message', () => {
    const result = wasmMessageToTranslation('length must be at least 3 characters');
    expect(result).toEqual({ key: 'validation.min_len', values: { min: '3' } });
  });

  it('parses max_len message', () => {
    const result = wasmMessageToTranslation('must not be more than 255 characters');
    expect(result).toEqual({ key: 'validation.max_len', values: { max: '255' } });
  });

  it('parses gte message', () => {
    const result = wasmMessageToTranslation('must be greater than or equal to 0');
    expect(result).toEqual({ key: 'validation.gte', values: { value: '0' } });
  });

  it('parses gt message', () => {
    const result = wasmMessageToTranslation('must be greater than 5');
    expect(result).toEqual({ key: 'validation.gt', values: { value: '5' } });
  });

  it('parses lte message', () => {
    const result = wasmMessageToTranslation('must be less than or equal to 100');
    expect(result).toEqual({ key: 'validation.lte', values: { value: '100' } });
  });

  it('parses lt message', () => {
    const result = wasmMessageToTranslation('must be less than 10');
    expect(result).toEqual({ key: 'validation.lt', values: { value: '10' } });
  });

  it('parses email message', () => {
    const result = wasmMessageToTranslation('must be a valid email');
    expect(result).toEqual({ key: 'validation.email' });
  });

  it('parses uuid message', () => {
    const result = wasmMessageToTranslation('must be a valid uuid');
    expect(result).toEqual({ key: 'validation.uuid' });
  });

  it('parses enum message', () => {
    const result = wasmMessageToTranslation('must be one of the defined values');
    expect(result).toEqual({ key: 'validation.enum' });
  });

  it('falls back to raw message for unknown patterns', () => {
    const raw = 'some completely unknown validation error';
    const result = wasmMessageToTranslation(raw);
    expect(result).toEqual({ key: raw });
  });

  it('parses negative gte value', () => {
    const result = wasmMessageToTranslation('must be greater than or equal to -1');
    expect(result).toEqual({ key: 'validation.gte', values: { value: '-1' } });
  });
});
