/// <reference types="cypress" />

/**
 * THR_E2E_SES_EDIT — Editing a session from the Sessions tab inside the
 * therapy form must load the session's data into the session edit form.
 *
 * Manually-reproduced bug: opening an existing therapy, switching to the
 * Sessions tab, and double-clicking a row opened the session form but
 * the fields were empty — i.e. the session entity didn't load.
 */

import { loginAsAdmin } from './therapy-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe('Therapy → Sessions Tab → Edit Session', () => {
  beforeEach(() => {
    loginAsAdmin();
    new NavigationHelper().navigateToTherapy();
  });

  it('THPY_SES_E2E_02: should load session data when opening a session from the therapy Sessions tab', () => {
    const grid = new GridComponent();
    const form = new TherapyFormComponent();

    // Wait specifically for the SessionService/List call that fires when
    // the Sessions tab mounts — using `tr[data-id]` to gate the dblclick is
    // unreliable because MUI Table renders skeleton placeholders that also
    // carry data-id attributes during the loading window.
    cy.intercept('POST', '**/core.v1.SessionService/List').as('listSessions');

    // Open a seeded therapy that has sessions (CBT - Individual is bootstrap
    // data and has weekly sessions). Filter first — the therapy grid
    // accumulates rows without a DB reset and the seeded row can paginate away.
    grid.search('filter-displayName', 'Cognitive Behavioral Therapy - Individual');
    grid.waitForFetchSettled();
    grid.findRow('Cognitive Behavioral Therapy - Individual')
      .scrollIntoView()
      .dblclick({ force: true });
    form.waitForFormLoad();

    form.goToSessionsTab();
    cy.wait('@listSessions', { timeout: 30000 });

    // Inner grid lives inside the therapy form (data-form-entity="therapy").
    cy.get(
      '[data-form-entity="therapy"] [data-testid="rpg-grid-component-wrapper"]',
      { timeout: 15000 },
    ).as('innerGrid');
    // Wait for at least one *real* session row — the table briefly renders
    // a placeholder tr while loading and that row has no `data-id`. Hitting
    // it would open the form in CREATE mode (entityId=null) and mask the
    // bug we are actually testing.
    cy.get('@innerGrid')
      .find('tbody tr[data-id]', { timeout: 15000 })
      .should('have.length.gte', 1);

    // Use .trigger('dblclick') instead of .dblclick(): the latter fires
    // click→click→dblclick which toggles MUI row selection between firings
    // and can re-mount the row before the dblclick lands, leaving row.original
    // stale and entityId=null. Pure dblclick avoids the selection churn.
    cy.get('@innerGrid')
      .find('tbody tr[data-id]')
      .first()
      .trigger('dblclick', { bubbles: true });

    // Session form should appear and be populated. Three cheap, decisive
    // checks:
    //   1. The form root mounts.
    //   2. The date field has a value (every session has a date).
    //   3. The customer-ids autocomplete chip area contains *something*
    //      (every session inherits a customer from its therapy).
    cy.get('[data-form-entity="session"]', { timeout: 15000 }).should('exist');

    // Date, start time, and price all come from the loaded session — if any
    // of them is empty the session entity didn't hydrate the form.
    cy.get('[data-form-entity="session"] input[data-testid="session-date"]')
      .invoke('val')
      .should('not.be.empty');
    cy.get('[data-form-entity="session"] input[data-testid="session-start-time"]')
      .invoke('val')
      .should('not.be.empty');
    cy.get('[data-form-entity="session"] input[data-testid="price"]')
      .invoke('val')
      .should('not.be.empty');
    // Therapy-id (loaded as a foreign key on the session) should be the
    // therapy we opened, not blank — proves the form is in EDIT mode.
    cy.get('[data-form-entity="session"] input[data-testid="therapy-id"]')
      .invoke('val')
      .should('contain', 'Cognitive Behavioral Therapy');

    // Cleanup — close inner session form, then outer therapy form.
    // The therapy form hides its Save/Cancel row on the Sessions tab, so
    // we close it via the dialog's X button instead.
    cy.get('[data-form-entity="session"] [data-testid="form-cancel-btn"]').click();
    cy.get('[data-form-entity="session"]').should('not.exist');
    cy.get('[data-testid="window-close-btn"]').click();
  });
});
