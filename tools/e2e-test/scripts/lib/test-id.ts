// Canonical test-ID shape: UPPERCASE_PREFIX_NN with an optional one-letter
// variant suffix (WH_E2E_01b, WH_E2E_01B). Every parser must share this one
// definition: when the scheduler's copy is looser than the result parser's
// (as happened with uppercase suffixes), a test exists for the controller
// but its results never key back to it — it is reconciled as "missing",
// retried until exhaustion, and fails the shard while the merged report
// shows the very same test passing.
export const TEST_ID_PATTERN = '[A-Z][A-Z0-9_]+_\\d+[a-zA-Z]?';

// Declared titles in spec source: anchored, optionally parameterized with a
// template placeholder — it(`SES_E2E_05_${lang}: …`).
const DECLARED_TITLE_RE = new RegExp(`^(${TEST_ID_PATTERN})(?:_\\$\\{[^}]+\\})?:\\s`);

// Runtime titles interpolate the placeholder ("TS_LANG_E2E_01_en: …");
// strip the suffix so results key back to the declared ID.
const RUNTIME_TITLE_RE = new RegExp(`(${TEST_ID_PATTERN})(?:_[^:]+)?:`);

// Bare IDs embedded in arbitrary text (screenshot file names).
const BARE_ID_RE = new RegExp(`(${TEST_ID_PATTERN})`);

export function extractDeclaredId(title: string): string {
  const m = title.match(DECLARED_TITLE_RE);
  return m ? m[1] : '';
}

export function matchRuntimeTitleId(title: string): string | null {
  const m = title.match(RUNTIME_TITLE_RE);
  return m ? m[1] : null;
}

export function matchBareId(text: string): string | null {
  const m = text.match(BARE_ID_RE);
  return m ? m[1] : null;
}
