import { rm } from 'node:fs/promises';
import { defineConfig } from 'cypress';
// @ts-ignore — no type declarations available
import { beforeRunHook, afterRunHook } from 'cypress-mochawesome-reporter/lib';
// @ts-ignore — named export, no type declarations
import { plugin as cypressGrepPlugin } from '@cypress/grep/plugin';

export default defineConfig({
  // cypress-multi-reporters runs both mochawesome (HTML) and JUnit XML.
  // JUnit XML is picked up by Jenkins' JUnit plugin which renders test
  // results natively (no CSP issue, drill-down into failures).
  reporter: 'cypress-multi-reporters',
  reporterOptions: {
    reporterEnabled: 'cypress-mochawesome-reporter, mocha-junit-reporter',
    cypressMochawesomeReporterReporterOptions: {
      charts: true,
      reportPageTitle: 'Utro E2E Report',
      embeddedScreenshots: true,
      inlineAssets: true,
      saveAllAttempts: false,
      saveJson: true,
      overwrite: false,
      reportDir: process.env.CYPRESS_REPORT_DIR || 'cypress/reports',
    },
    mochaJunitReporterReporterOptions: {
      mochaFile: `${process.env.CYPRESS_REPORT_DIR || 'cypress/reports'}/junit-[hash].xml`,
      toConsole: false,
      jenkinsMode: true,
      includePending: true,
      outputs: true,
    },
  },
  // Video recording is opt-in via CYPRESS_VIDEO (the controller sets it from the
  // Jenkins RECORD_VIDEO param) and driven per-run: the controller points
  // videosFolder at each run-N dir. Compression is always on to keep clips small;
  // the after:spec hook below keeps only videos for specs that failed.
  video: process.env.CYPRESS_VIDEO === 'true',
  videoCompression: 32,
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1920,
    viewportHeight: 1080,
    defaultCommandTimeout: 10000,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 2,
    // Retry flaky tests under load. Many of our specs talk to a real backend
    // running in docker alongside other workers, and a heavy parallel run can
    // produce timing-sensitive failures (autocomplete autofill races, recharts
    // bar click delivery, refetch race conditions). Retrying once absorbs
    // those without masking real regressions: a deterministic bug will fail
    // both attempts, while a flake usually passes on the second try.
    // openMode: 0 keeps interactive `cypress open` snappy.
    retries: {
      runMode: 3,
      openMode: 0,
    },
    setupNodeEvents(on, config) {
      cypressGrepPlugin(config);

      on('task', {
        log(message: string) {
          process.stderr.write(message + '\n');
          return null;
        },
      });

      // Mochawesome reporter hooks.
      on('before:run', async (details) => {
        await beforeRunHook(details);
      });

      on('after:run', async () => {
        try {
          await afterRunHook();
        } catch (err) {
          console.log('[cypress] afterRunHook failed, continuing:', err);
        }
      });

      // Keep videos only for specs that failed. Recording captures every spec,
      // but a green spec's clip is noise — delete it so the archived artifacts
      // and the report's video browser hold failures only.
      on('after:spec', async (_spec, results) => {
        if (results?.video && results.stats.failures === 0) {
          await rm(results.video, { force: true });
        }
      });

      return config;
    },
  },

  component: {
    viewportWidth: 1920,
    viewportHeight: 1080,
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
