/**
 * formId conventions.
 *
 *   <entityType>:<entityId>           → edit form
 *   <entityType>:new:<createNonce>    → create form
 *
 * The encoding lets the windowing layer detect "form for this entity is
 * already open" by string comparison and lets drafts be grouped by entity.
 */

export interface FormIdParts {
  entityType: string;
  entityId: string | null;
  /** Only present for create forms. */
  createNonce?: string;
}

const NONCE_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Local 6-char nonce generator. Avoids importing `nanoid` so this module
 * stays jest-friendly (nanoid ships ESM-only). Collision probability for
 * the small handful of concurrent create-forms a user might open is
 * negligible — we use 36^6 ≈ 2.2 billion possibilities.
 */
function makeNonce(): string {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += NONCE_ALPHABET[Math.floor(Math.random() * NONCE_ALPHABET.length)];
  }
  return out;
}

export function makeFormId(parts: FormIdParts): string {
  if (parts.entityId !== null) {
    return `${parts.entityType}:${parts.entityId}`;
  }
  const nonce = parts.createNonce ?? makeNonce();
  return `${parts.entityType}:new:${nonce}`;
}

export function parseFormId(formId: string): FormIdParts | null {
  const parts = formId.split(':');
  if (parts.length === 2) {
    return { entityType: parts[0], entityId: parts[1] };
  }
  if (parts.length === 3 && parts[1] === 'new') {
    return { entityType: parts[0], entityId: null, createNonce: parts[2] };
  }
  return null;
}
