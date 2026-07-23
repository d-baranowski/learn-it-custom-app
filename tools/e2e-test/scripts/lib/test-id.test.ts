import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractDeclaredId, matchRuntimeTitleId, matchBareId } from './test-id.js';

test('runtime title IDs match regardless of suffix case', () => {
  // Uppercase variant suffix — PR-166 build 59: WH_E2E_01B parsed into a
  // full-title key, was reconciled as missing, and failed the shard while
  // the merged report showed it green.
  assert.equal(matchRuntimeTitleId('WH_E2E_01B: should support templates'), 'WH_E2E_01B');
  assert.equal(matchRuntimeTitleId('CUS_E2E_04b: partial update'), 'CUS_E2E_04b');
  assert.equal(matchRuntimeTitleId('SES_E2E_01: creates a session'), 'SES_E2E_01');
});

test('runtime title IDs strip interpolated parameter suffixes', () => {
  assert.equal(matchRuntimeTitleId('TS_LANG_E2E_01_en: labels in English'), 'TS_LANG_E2E_01');
  assert.equal(matchRuntimeTitleId('TS_LANG_E2E_01_pl: labels in Polish'), 'TS_LANG_E2E_01');
});

test('runtime titles without an ID do not match', () => {
  assert.equal(matchRuntimeTitleId('renders the calendar'), null);
});

test('declared titles support template placeholders', () => {
  assert.equal(extractDeclaredId('WH_E2E_01B: should support templates'), 'WH_E2E_01B');
  // eslint-disable-next-line no-template-curly-in-string
  assert.equal(extractDeclaredId('SES_E2E_05_${lang}: validation messages'), 'SES_E2E_05');
  assert.equal(extractDeclaredId('no id here'), '');
});

test('bare IDs match inside screenshot file names', () => {
  assert.equal(
    matchBareId('WH_E2E_01B should support templates (failed) (attempt 2)'),
    'WH_E2E_01B'
  );
  assert.equal(matchBareId('no id'), null);
});
