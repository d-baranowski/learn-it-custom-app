/// <reference types="cypress" />

// Single source of truth for seeded test users — these constants were
// duplicated across a dozen group utils and inline in specs.
export const ADMIN = {
  username: 'admin',
  password: 'Password1!',
} as const;

export const ADAM = {
  username: 'adamhalaczkiewicz',
  password: 'Password1!',
  fullName: 'Adam Hałaczkiewicz',
  displayName: 'Adam',
  abbreviation: 'AH',
} as const;

export interface SeededSession {
  userId: string;
  sessionId: string;
  email: string;
  displayName: string;
}

// Fixed long-lived auth sessions seeded by bootstrap
// (app/bootstrap/service/bootstrap/auth_session.go — the ids MUST match). Keyed
// by username; `cy.login` injects an RPG_AUTH_TOKEN cookie for these instead of
// driving the login UI. Users not listed here fall back to a real UI login.
export const SEEDED_SESSIONS: Record<string, SeededSession> = {
  [ADMIN.username]: {
    userId: '2imfnAVjkbfcwEos1LLLztn1vEP',
    sessionId: 'E2ESEEDEDADMINSESSION000001',
    email: 'admin@pathtech.net',
    displayName: 'Admin',
  },
  [ADAM.username]: {
    userId: '37C6yuezOh2tMDfwLqmgWoKS0tD',
    sessionId: 'E2ESEEDEDADAMSESSION0000001',
    email: 'adameusz.halaczkiewicz@gmail.com',
    displayName: 'Adam Hałaczkiewicz',
  },
};

export type TestRole = 'admin' | 'adam';

export function loginAs(role: TestRole): void {
  if (role === 'admin') {
    cy.login();
  } else {
    cy.login(ADAM.username, ADAM.password);
  }
}
