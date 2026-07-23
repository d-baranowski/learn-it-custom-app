/// <reference types="cypress" />

/**
 * Per-run unique identifiers for accumulation-safe specs. The suite no longer
 * resets the DB between mutating tests, so every created entity must carry a
 * token that is unique to this test execution — assertions then scope to that
 * token instead of leaning on a clean database.
 *
 * Generate tokens inside `beforeEach`/`it`, never at `describe`/module scope:
 * module scope is evaluated once per spec load, so two `it`s (or an in-process
 * retry) would reuse the same token and collide.
 */

export function generateRandomString(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/** Short, greppable, collision-resistant token. */
export function uniqueToken(prefix?: string): string {
  const core = `${Date.now().toString(36)}-${generateRandomString(4)}`;
  return prefix ? `${prefix}-${core}` : core;
}

/** e.g. `alice.mfk2q9-a1b2@test.com` */
export function uniqueEmail(local = 'user'): string {
  return `${local}.${uniqueToken()}@test.com`;
}

/** Slug-safe unique identifier (lowercase, dash-separated). */
export function uniqueSlug(base: string): string {
  return uniqueToken(base).toLowerCase();
}

/** Human-readable unique display name, e.g. `Bob mfk2q9-a1b2`. */
export function uniqueName(base: string): string {
  return `${base} ${uniqueToken()}`;
}

/**
 * A per-run price for numeric-only fields (session/therapist-service price)
 * where a token can't be embedded. High range keeps it clear of seeded values;
 * varies per call so two rows in one test don't collide.
 */
export function uniquePrice(): number {
  return 90000 + Math.floor(Math.random() * 9999);
}
