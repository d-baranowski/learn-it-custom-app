import { describe, it, expect } from '@jest/globals';
import { WhereOperator } from '@gen/request/v1/base_pb';
import { roomOrOnlineFilterResolver } from './room_or_online';
import { customersFilterResolver } from './customers';

describe('roomOrOnlineFilterResolver', () => {
  it('returns isOnline filter when row is online', () => {
    const result = roomOrOnlineFilterResolver({ isOnline: true, roomId: 'rm-1', roomLabel: 'Room A' });
    expect(result).toEqual({
      field: 'isOnline',
      value: true,
      operator: WhereOperator.EQ,
      label: 'Online',
    });
  });

  it('returns roomId filter when row is offline with room', () => {
    const result = roomOrOnlineFilterResolver({ isOnline: false, roomId: 'rm-1', roomLabel: 'Room A' });
    expect(result).toEqual({
      field: 'roomId',
      value: 'rm-1',
      operator: WhereOperator.EQ,
      label: 'Room A',
    });
  });

  it('uses empty label when roomLabel is missing', () => {
    const result = roomOrOnlineFilterResolver({ isOnline: false, roomId: 'rm-1' });
    expect(result).toEqual({
      field: 'roomId',
      value: 'rm-1',
      operator: WhereOperator.EQ,
      label: '',
    });
  });

  it('returns null when row has no roomId and is not online', () => {
    const result = roomOrOnlineFilterResolver({ isOnline: false });
    expect(result).toBeNull();
  });

  it('returns null for undefined row', () => {
    expect(roomOrOnlineFilterResolver(undefined)).toBeNull();
  });

  it('returns null for null row', () => {
    expect(roomOrOnlineFilterResolver(null)).toBeNull();
  });
});

describe('customersFilterResolver', () => {
  it('returns customerIds filter when exactly one customer', () => {
    const result = customersFilterResolver({
      customerIds: ['cust-1'],
      customerLabels: 'Jan Kowalski',
    });
    expect(result).toEqual({
      field: 'customerIds',
      value: 'cust-1',
      operator: WhereOperator.EQ,
      label: 'Jan Kowalski',
    });
  });

  it('returns null when multiple customers (ambiguous)', () => {
    const result = customersFilterResolver({
      customerIds: ['cust-1', 'cust-2'],
      customerLabels: 'Jan Kowalski, Anna Nowak',
    });
    expect(result).toBeNull();
  });

  it('returns null when no customerIds', () => {
    expect(customersFilterResolver({ customerLabels: 'Jan' })).toBeNull();
  });

  it('returns null when customerIds is empty', () => {
    expect(customersFilterResolver({ customerIds: [] })).toBeNull();
  });

  it('uses empty label when customerLabels is missing', () => {
    const result = customersFilterResolver({ customerIds: ['cust-1'] });
    expect(result).toEqual({
      field: 'customerIds',
      value: 'cust-1',
      operator: WhereOperator.EQ,
      label: '',
    });
  });

  it('returns null for undefined row', () => {
    expect(customersFilterResolver(undefined)).toBeNull();
  });
});
