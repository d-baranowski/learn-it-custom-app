import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ShardStateMachine } from './state-machine.js';
import { ControllerState } from './types.js';

function entry(id: string, mutating = false) {
  return { id, spec: `cypress/e2e/${id}.cy.ts`, title: id, mutating, tags: [] };
}

function passed(id: string) {
  return { id, spec: `cypress/e2e/${id}.cy.ts`, status: 'passed', durationMs: 10 };
}

function makeMachine(cypressResult: { results: object[]; exitCode: number }) {
  const recorded: Array<{ round: number; results: Array<{ id: string; status: string }> }> = [];
  const fakeTimeline = {
    startEvent() {},
    endEvent() {},
    recordResults(round: number, results: Array<{ id: string; status: string }>) {
      recorded.push({ round, results });
    },
    recordContainers() {},
    recordDrift() {},
  };
  const fakeHealth = { probe: async () => ({ healthy: true, degraded: [] }) };
  const fakeCypress = {
    runAll: () => ({ ...cypressResult, durationMs: 100, crashed: false }),
    getRunDirs: () => [],
  };
  const fakeCompose = { listContainers: () => [] };
  const noop = () => {};
  const log = {
    info: noop, warn: noop, error: noop, success: noop, timing: noop, state: noop, separator: noop,
  };
  const config = { grep: null, maxRetries: 2, shardIndex: 1, shardCount: 1 };
  const ports = { ui: 1, bootstrapApi: 1 };

  const sm = new ShardStateMachine(
    config as never,
    fakeCompose as never,
    fakeHealth as never,
    {} as never,
    fakeCypress as never,
    {} as never,
    fakeTimeline as never,
    {} as never,
    log as never,
    ports,
    '/tmp/does-not-matter',
  );
  return { sm, recorded };
}

// A failing before/beforeEach hook aborts the rest of a spec: cypress reports
// fewer results than the shard scheduled. reconcileMissingResults marks those
// tests failed for the shard's exit code — but the merged report reads the
// timeline, so they must be recorded there too, or a red shard is aggregated
// as a green 100% pass.
test('runTests records reconciled missing failures into the timeline', async () => {
  const { sm, recorded } = makeMachine({
    results: [passed('A_E2E_01'), passed('B_E2E_01')],
    exitCode: 1,
  });
  (sm as unknown as { testList: object[] }).testList = [
    entry('A_E2E_01'),
    entry('B_E2E_01'),
    entry('C_E2E_01'),
  ];

  const next = await (sm as unknown as { runTests: () => Promise<ControllerState> }).runTests();
  assert.equal(next, ControllerState.EVALUATE);

  assert.equal(recorded.length, 1, 'one round recorded');
  const ids = recorded[0].results.map((r) => r.id).sort();
  assert.deepEqual(
    ids,
    ['A_E2E_01', 'B_E2E_01', 'C_E2E_01'],
    'timeline must include the test cypress dropped, not silently omit it',
  );
  const c = recorded[0].results.find((r) => r.id === 'C_E2E_01');
  assert.equal(c?.status, 'failed', 'the dropped test is recorded as failed, matching the shard exit code');
});

test('runTests records exactly the cypress results when nothing is missing', async () => {
  const { sm, recorded } = makeMachine({
    results: [passed('A_E2E_01'), passed('B_E2E_01')],
    exitCode: 0,
  });
  (sm as unknown as { testList: object[] }).testList = [entry('A_E2E_01'), entry('B_E2E_01')];

  await (sm as unknown as { runTests: () => Promise<ControllerState> }).runTests();

  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].results.length, 2, 'no phantom entries when all tests reported');
});
