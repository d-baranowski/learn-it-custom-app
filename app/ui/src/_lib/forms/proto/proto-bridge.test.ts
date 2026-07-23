import { describe, it, expect } from '@jest/globals';
import {
  unflattenValues,
  flattenValues,
} from './proto-bridge';

describe('proto-bridge — unflattenValues', () => {
  it('handles a single flat key', () => {
    expect(unflattenValues({ name: 'X' })).toEqual({ name: 'X' });
  });

  it('expands dotted keys into nested objects', () => {
    expect(unflattenValues({ 'a.b': 1, 'a.c': 2 })).toEqual({ a: { b: 1, c: 2 } });
  });

  it('expands numeric segments into array indices', () => {
    expect(unflattenValues({ 'tags.0': 'a', 'tags.1': 'b' })).toEqual({
      tags: ['a', 'b'],
    });
  });

  it('handles arrays of objects', () => {
    expect(
      unflattenValues({
        'addresses.0.line1': '1 main',
        'addresses.0.city': 'Warsaw',
        'addresses.1.line1': '2 oak',
      })
    ).toEqual({
      addresses: [
        { line1: '1 main', city: 'Warsaw' },
        { line1: '2 oak' },
      ],
    });
  });
});

describe('proto-bridge — flattenValues', () => {
  it('inverts unflatten for nested objects', () => {
    const flat = { 'a.b': 1, 'a.c': 2 };
    expect(flattenValues(unflattenValues(flat))).toEqual(flat);
  });

  it('keeps arrays of objects as a single array value (owned by field-array components)', () => {
    expect(flattenValues({ addresses: [{ line1: 'x', city: 'W' }] })).toEqual({
      addresses: [{ line1: 'x', city: 'W' }],
    });
  });

  it('preserves primitive arrays at leaves', () => {
    expect(flattenValues({ tags: ['a', 'b'] })).toEqual({ tags: ['a', 'b'] });
  });

  it('handles empty objects and arrays', () => {
    expect(flattenValues({})).toEqual({});
    expect(flattenValues({ items: [] })).toEqual({ items: [] });
  });

  it('round-trips a complex shape', () => {
    const nested = {
      name: 'X',
      address: { line1: '1 main', city: 'W' },
      tags: ['a', 'b'],
      contacts: [{ email: 'a@b.c' }, { email: 'd@e.f' }],
    };
    expect(unflattenValues(flattenValues(nested))).toEqual(nested);
  });
});
