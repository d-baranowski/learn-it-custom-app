/**
 * proto-bridge — convert between Redux form values and protobuf instances.
 *
 * Form values stored in Redux are flat-keyed (`addresses.0.line1`) and use
 * `undefined` for empty optional fields, by convention. Protobufs need:
 *   - nested object structure
 *   - explicit nulls (or absence) for unset optional fields
 *   - empty string ≠ unset for some message types (handled via the same
 *     rules as nullToUndefined)
 *
 * This module is the only place form code touches protos. Form authors
 * never call `nullToUndefined` themselves — the bridge does it.
 */

import { isArray, isPlainObject, mapValues } from 'lodash';
import { Message } from '@bufbuild/protobuf';
import setIn from 'lodash/set';

export type ProtoConstructor<T extends Message<T>> = {
  new (...args: any[]): Message<T>;
  fields: { findJsonName(i: string): unknown };
};

/**
 * Recursively replace null and "" with undefined. Mirrors the existing
 * `~/utils/null-to-undefined` helper but kept local so the bridge has no
 * external coupling.
 */
function normalizeForProto<T = unknown>(value: T): T {
  if (isPlainObject(value)) {
    return mapValues(value as object, normalizeForProto) as T;
  }
  if (isArray(value)) {
    return (value as unknown[]).map(normalizeForProto) as T;
  }
  if (value === null || value === '') {
    return undefined as T;
  }
  return value;
}

/**
 * Reconstruct a nested object from a flat-keyed value map.
 * `{ "addresses.0.line1": "abc" }` → `{ addresses: [{ line1: "abc" }] }`.
 *
 * Uses lodash.set which understands dot notation including numeric indices.
 */
export function unflattenValues(
  flat: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key in flat) {
    setIn(out, key, flat[key]);
  }
  return out;
}

/**
 * Build a proto instance from form values.
 *
 * Steps:
 *   1. Unflatten the JSON-path keys into a nested object.
 *   2. Normalize null/"" → undefined so the proto constructor treats those
 *      fields as absent rather than explicitly set.
 *   3. Construct the proto.
 */
export function buildProtoFromValues<T extends Message<T>>(
  protoConstructor: ProtoConstructor<T>,
  values: Record<string, unknown>
): Message<T> {
  const nested = unflattenValues(values);
  const normalized = normalizeForProto(nested);
  return new protoConstructor(normalized);
}

// Default (lowerCamelCase) JSON keys are required so the round trip stays
// symmetric with `buildProtoFromValues`, which feeds keys to
// `new T({...})` — that only recognises the generated camelCase fields.
// `useProtoFieldName: true` would yield snake_case keys for proto fields
// declared snake_case (e.g. `is_online`) and silently drop them on save.
// `enumAsInteger: true` keeps enum ids numeric so option pickers
// (`options.find(o => o.id === value)`) keep matching.
export function extractValuesFromProto<T extends Message<T>>(
  proto: Message<T>
): Record<string, unknown> {
  const json = proto.toJson({
    enumAsInteger: true,
  }) as Record<string, unknown>;
  return flattenValues(json);
}

/**
 * Flatten a nested object into a record keyed by JSON paths.
 * Inverse of `unflattenValues`.
 *
 * Plain nested objects ARE flattened (`addr.line1`).
 * Arrays — both of primitives and of objects — are kept as-is at the leaf
 * (`tags: ["a","b"]`, `sessionFrequency: [{...},{...}]`). Array-of-object
 * fields are owned by a single field-array component (e.g. SessionFrequencyFe)
 * which renders rows from the array and writes the whole array back through
 * `useFormController`.
 */
export function flattenValues(
  input: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key in input) {
    const v = input[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(v)) {
      Object.assign(out, flattenValues(v as Record<string, unknown>, path));
    } else {
      out[path] = v;
    }
  }
  return out;
}
