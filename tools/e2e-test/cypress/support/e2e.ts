import './commands';
import 'cypress-mochawesome-reporter/register';
import { register as registerCypressGrep } from '@cypress/grep';
import { cylog } from '../utils/cylog';

registerCypressGrep();

Cypress.on('uncaught:exception', (err) => {
  if (
    err.message.includes('Minified React error #418') ||
    err.message.includes('Minified React error #423') ||
    err.message.includes('Hydration failed') ||
    err.message.includes('Text content does not match server-rendered HTML')
  ) {
    return false;
  }
});

beforeEach(function () {
  const title = this.currentTest?.title ?? 'unknown';
  cylog(`▶ START: ${title}`);
});

afterEach(function () {
  const title = this.currentTest?.title ?? 'unknown';
  const state = this.currentTest?.state ?? 'unknown';
  const duration = this.currentTest?.duration ?? 0;
  const sec = (duration / 1000).toFixed(1);

  cylog(`${state === 'passed' ? '✓' : '✗'} END: ${title} (${state}, ${sec}s)`);
});
