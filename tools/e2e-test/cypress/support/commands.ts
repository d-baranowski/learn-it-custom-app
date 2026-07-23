/// <reference types="cypress" />

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      getByTestId(
        testId: string,
        options?: Partial<Cypress.Timeoutable>
      ): Chainable<JQuery<HTMLElement>>;
      findByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      login(username?: string, password?: string): Chainable<void>;
      resetDatabase(): Chainable<void>;
    }
  }
}

import { cylog } from '../utils/cylog';
import { ADMIN, SEEDED_SESSIONS, type SeededSession } from '../utils/test-users';

Cypress.Commands.add(
  'getByTestId',
  (testId: string, options?: Partial<Cypress.Timeoutable>) => {
    return cy.get(`[data-testid="${testId}"]`, options);
  }
);

Cypress.Commands.add('findByTestId', { prevSubject: 'element' }, (subject, testId: string) => {
  return cy.wrap(subject).find(`[data-testid="${testId}"]`);
});

const signinUrl = '/auth/signin';
const sideNavSelector = '[data-testid="side-nav-list"]';
const loginErrorToastSelector = '[role="status"]:contains("Failed to login")';
const MAX_LOGIN_ATTEMPTS = 3;
const OUTCOME_WINDOW_MS = 15000;
const OUTCOME_POLL_MS = 500;

function typeUntilAccepted(testId: string, value: string, attempt = 1): void {
  cy.getByTestId(testId).clear();
  cy.getByTestId(testId).type(value);
  cy.getByTestId(testId).then(($el) => {
    if (String($el.val()) === value) return;
    if (attempt >= 3) {
      throw new Error(`login: "${testId}" did not accept input after ${attempt} attempts`);
    }
    typeUntilAccepted(testId, value, attempt + 1);
  });
}

const AUTH_COOKIE = 'RPG_AUTH_TOKEN';

// UTF-8-safe base64url (btoa alone dies on non-Latin1 chars like "ł").
function base64url(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Build the RPG_AUTH_TOKEN cookie value: an unsigned JWT matching the claims the
// UI BFF mints (app/ui/src/auth/create-signed-rpg-token.ts). The e2e stack sets
// no JWT_SECRET, so get-token.ts uses decodeJwt (no signature/exp check) and the
// gateway trusts the derived x-user-id. If a JWT_SECRET is ever configured for
// the e2e ui service, this must instead sign HS256 with that secret + issuer +
// audience.
function buildAuthJwt(seeded: SeededSession): string {
  const header = { alg: 'none', typ: 'JWT' };
  const payload = {
    userId: seeded.userId,
    sessionId: seeded.sessionId,
    user: { id: seeded.userId, email: seeded.email, name: seeded.displayName, avatar: '' },
  };
  return `${base64url(header)}.${base64url(payload)}.`;
}

// Real UI login — visits /auth/signin and types credentials. Retained for users
// without a seeded session and for specs that exercise the login/logout flow.
function loginViaUI(username: string, password: string): void {
  cylog(`login: starting UI login as "${username}"`);
  const loginStart = performance.now();

  cy.clearCookies();
  cy.clearLocalStorage();

  function submitCredentials(): void {
    cy.visit(signinUrl);
    cy.get('body').then(($body) => {
      if ($body.find(sideNavSelector).length > 0) {
        return;
      }
      // Keystrokes typed before React hydration finishes get silently
      // dropped, and a trailing .should('have.value') only retries the
      // assertion — never the typing. Re-type until the value sticks.
      cy.getByTestId('account').should('be.visible');
      typeUntilAccepted('account', username);
      typeUntilAccepted('password', password);
      cy.getByTestId('login-btn').should('be.enabled').click();
    });
  }

  // Poll for a login outcome: success (side nav), rejection (error toast),
  // or nothing at all — the last happens when the auth backend hangs
  // mid-reset, so a stalled attempt must be RE-SUBMITTED, not just awaited.
  function expectOutcome(attempt: number, remainingMs: number): void {
    cy.get('body').then(($body) => {
      if ($body.find(sideNavSelector).length > 0) {
        const elapsed = ((performance.now() - loginStart) / 1000).toFixed(1);
        cylog(`login: success as "${username}" in ${elapsed}s`);
        return;
      }

      const rejected = $body.find(loginErrorToastSelector).length > 0;
      if (rejected || remainingMs <= 0) {
        if (attempt >= MAX_LOGIN_ATTEMPTS) {
          cy.screenshot();
          throw new Error(
            rejected
              ? `login: backend rejected "${username}" ${attempt} times — ` +
                'auth is down or the DB is unseeded (did a reset fail?)'
              : `login: no outcome (nav or error toast) for "${username}" after ` +
                `${attempt} attempts — auth request appears to hang`
          );
        }
        cylog(
          `login: attempt ${attempt} ${rejected ? 'rejected' : 'stalled'}, retrying...`
        );
        submitCredentials();
        expectOutcome(attempt + 1, OUTCOME_WINDOW_MS);
        return;
      }

      // Bounded state poll — not an arbitrary sleep; each tick re-inspects
      // the DOM for one of the two terminal states above.
      // eslint-disable-next-line cypress/no-unnecessary-waiting -- bounded poll interval between DOM state checks
      cy.wait(OUTCOME_POLL_MS);
      expectOutcome(attempt, remainingMs - OUTCOME_POLL_MS);
    });
  }

  submitCredentials();
  expectOutcome(1, OUTCOME_WINDOW_MS);
}

// Fast auth: for seeded roles (admin/adam) inject the RPG_AUTH_TOKEN cookie
// instead of driving the login UI, cached per role across specs. Any other user
// (e.g. jannowak in therapy-read-nonadmin.cy.ts) falls back to a real UI login.
Cypress.Commands.add('login', (username = ADMIN.username, password = ADMIN.password) => {
  const seeded = SEEDED_SESSIONS[username];
  if (!seeded) {
    loginViaUI(username, password);
    return;
  }

  cy.session(
    username,
    () => {
      cy.setCookie(AUTH_COOKIE, buildAuthJwt(seeded), {
        domain: 'localhost',
        path: '/',
        sameSite: 'lax',
      });
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        cy.visit('/');
        cy.get(sideNavSelector).should('be.visible');
      },
    }
  );

  cy.visit('/');
});

const DEFAULT_BOOTSTRAP_BASE = 'http://localhost:8080';
const ADMIN_USER_ID = '2imfnAVjkbfcwEos1LLLztn1vEP';
const MAX_RESET_ATTEMPTS = 5;

Cypress.Commands.add('resetDatabase', () => {
  const startTime = performance.now();
  cylog('DB reset: starting');

  function doReset(attempt: number): void {
    const bootstrapBase =
      Cypress.env('BOOTSTRAP_API_URL') || DEFAULT_BOOTSTRAP_BASE;
    const resetUrl = `${bootstrapBase}/bootstrap.v1.BootstrapService/ResetDatabase`;

    cy.request({
      method: 'POST',
      url: resetUrl,
      headers: {
        'X-User-Id': ADMIN_USER_ID,
        'Content-Type': 'application/json',
      },
      body: {},
      timeout: 180000,
      failOnStatusCode: false,
    }).then((response) => {
      if ([200, 201].includes(response.status)) {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        cylog(`DB reset: success in ${elapsed}s (attempt ${attempt})`);
      } else if (attempt < MAX_RESET_ATTEMPTS) {
        cylog(`DB reset: attempt ${attempt} returned ${response.status}, retrying...`);
        // eslint-disable-next-line cypress/no-unnecessary-waiting -- backoff before retrying a failed reset request
        cy.wait(1000);
        doReset(attempt + 1);
      } else {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        // A failed reset can leave the DB wiped but unseeded, which breaks
        // every test that follows — fail loudly here instead.
        throw new Error(
          `DB reset: failed after ${attempt} attempts (${elapsed}s) — ` +
            `last status ${response.status}, body: ` +
            `${JSON.stringify(response.body).slice(0, 300)}`
        );
      }
    });
  }

  doReset(1);
});

export {};
