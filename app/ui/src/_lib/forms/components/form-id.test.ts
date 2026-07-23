import { describe, it, expect } from '@jest/globals';
import { makeFormId, parseFormId } from './form-id';

describe('formId conventions', () => {
  it('encodes edit forms as <type>:<id>', () => {
    expect(makeFormId({ entityType: 'therapy', entityId: 'abc123' })).toBe('therapy:abc123');
  });

  it('encodes create forms with a nonce', () => {
    const id = makeFormId({ entityType: 'therapy', entityId: null });
    expect(id.startsWith('therapy:new:')).toBe(true);
    expect(id.split(':')[2]).toHaveLength(6);
  });

  it('respects an explicit createNonce', () => {
    expect(makeFormId({ entityType: 'therapy', entityId: null, createNonce: 'abcdef' }))
      .toBe('therapy:new:abcdef');
  });

  it('parses an edit formId', () => {
    expect(parseFormId('therapy:abc123')).toEqual({ entityType: 'therapy', entityId: 'abc123' });
  });

  it('parses a create formId', () => {
    expect(parseFormId('therapy:new:xyz')).toEqual({
      entityType: 'therapy',
      entityId: null,
      createNonce: 'xyz',
    });
  });

  it('returns null for malformed ids', () => {
    expect(parseFormId('justastring')).toBeNull();
    expect(parseFormId('a:b:c:d')).toBeNull();
  });

  it('round-trips edit and create ids', () => {
    const edit = makeFormId({ entityType: 'therapy', entityId: 'abc' });
    expect(parseFormId(edit)).toEqual({ entityType: 'therapy', entityId: 'abc' });

    const create = makeFormId({ entityType: 'therapy', entityId: null, createNonce: 'xyz' });
    expect(parseFormId(create)).toEqual({
      entityType: 'therapy',
      entityId: null,
      createNonce: 'xyz',
    });
  });
});
