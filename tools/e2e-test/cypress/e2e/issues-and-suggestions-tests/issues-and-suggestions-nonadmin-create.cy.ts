/// <reference types="cypress" />

/**
 * ISS_E2E_01 — Non-admin (Adam/therapist) creates issues and suggestions
 *
 * Verifies that a therapist (Adam) can:
 * - Access the Issues and Suggestions page
 * - Create a new issue via the form
 * - See the created issue in the grid
 * - Create multiple issues
 */

import {
  setupIssuesTestForAdam,
  createIssueViaForm,
} from './issues-and-suggestions-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe('Issues and Suggestions — Therapist Create (Adam) — ISS_E2E_01', { env: { mutating: true } }, () => {
  beforeEach(() => {
    setupIssuesTestForAdam();
  });

  it('ISS_E2E_01: therapist should be able to access the Issues and Suggestions page', () => {
    const nav = new NavigationHelper();
    const grid = new GridComponent();

    nav.verifyBreadcrumb('Issues and Suggestions');
    grid.waitForGrid();
  });

  it('ISS_E2E_02: therapist should see the New button', () => {
    const grid = new GridComponent();
    grid.waitForGrid();

    // Therapist has Create permission — New button should exist
    cy.get('[data-testid="create-item-btn"]').should('exist');
  });

  it('ISS_E2E_03: therapist should create an issue with title only', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    grid.waitForGrid();

    const uniqueTitle = `Bug Report ${Date.now()}`;

    createIssueViaForm({
      title: uniqueTitle,
    });

    // Verify the created issue appears in the grid
    grid.shouldContain(uniqueTitle);
  });

  it('ISS_E2E_04: therapist should create an issue with title and description', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    grid.waitForGrid();

    const uniqueTitle = `Feature Idea ${Date.now()}`;
    const description = 'This is a detailed description of the feature idea.';

    createIssueViaForm({
      title: uniqueTitle,
      description,
    });

    // Verify the created issue appears in the grid
    grid.shouldContain(uniqueTitle);
  });

  it('ISS_E2E_05: therapist should not be able to delete issues', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    grid.waitForGrid();

    const uniqueTitle = `No Delete Issue ${Date.now()}`;

    createIssueViaForm({
      title: uniqueTitle,
    });

    grid.shouldContain(uniqueTitle);

    // Select the row and check that delete action is disabled
    grid.selectRow(uniqueTitle);
    cy.get('[data-testid="grid-actions-button"]').click();
    cy.get('[data-testid="delete-menu-item"]').should('have.attr', 'aria-disabled', 'true');
  });
});
