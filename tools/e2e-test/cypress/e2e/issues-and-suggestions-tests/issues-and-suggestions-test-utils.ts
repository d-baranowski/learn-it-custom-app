/// <reference types="cypress" />

import { GridComponent } from '../components-objects/grid.component';
import { ADAM, loginAs } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';

// ── Constants ──────────────────────────────────────────────────────────────────

export const ADAM_USERNAME = ADAM.username;
export const ADAM_FULL_NAME = ADAM.fullName;

// ── Login helpers ──────────────────────────────────────────────────────────────

export function loginAsAdmin(): void {
  loginAs('admin');
}

export function loginAsAdam(): void {
  loginAs('adam');
}

// ── Setup functions ──────────────────────────────────────────────────────────

export function setupIssuesTestForAdmin(): void {
  setupFor('admin', (nav) => nav.navigateToIssuesAndSuggestions());
}

export function setupIssuesTestForAdam(): void {
  setupFor('adam', (nav) => nav.navigateToIssuesAndSuggestions());
}

// ── Creation helpers ──────────────────────────────────────────────────────────

export interface IssueCreateOptions {
  title: string;
  description?: string;
}

/**
 * Create an issue via the form.
 * Assumes the Issues and Suggestions grid page is already open.
 */
export function createIssueViaForm(options: IssueCreateOptions): void {
  const grid = new GridComponent();

  // Click the New button to open the form
  cy.get('[data-testid="create-item-btn"]').click();

  // Wait for the form to load
  cy.get('[data-testid="tabular-form-wrapper"]').should('exist');
  cy.get('input[data-testid="title"]').should('exist');

  // Fill in title
  cy.get('input[data-testid="title"]').clear();
  cy.get('input[data-testid="title"]').type(options.title);

  // Fill in description if provided
  if (options.description) {
    cy.get('textarea[data-testid="description"]').clear();
    cy.get('textarea[data-testid="description"]').type(options.description);
  }

  // Submit the form
  cy.get('[data-testid="form-submit-btn"]').click();

  // Wait for the form to close and grid to reload
  grid.waitForGrid();
}
