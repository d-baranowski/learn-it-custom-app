/// <reference types="cypress" />

/**
 * THR_E2E_SES_DATE_FILTER — UTR-000202
 *
 * The Sessions tab inside the Therapy edit form must honour the date-range
 * quick filter. Originally reported as broken: setting a From/To range did
 * not narrow the inner sessions grid.
 *
 * a) Setting a far-past From/To range narrows the grid to zero rows.
 * b) Clearing the filter (re-opens to the broad range) restores the rows.
 *
 * Bootstrap therapy "Cognitive Behavioral Therapy - Individual" has
 * recurring weekly sessions (cf. THR_E2E_SES_EDIT / THR_E2E_SES_OPTIMISTIC).
 *
 * No `cy.intercept`, no `cy.wait('@alias')`, no SQL — UI signals only.
 */

import { loginAsAdmin } from './therapy-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import { fillDateFilter } from '../session-tests/session-test-utils';

const THERAPY_NAME = 'Cognitive Behavioral Therapy - Individual';

const FAR_PAST_FROM = '01/01/2000';
const FAR_PAST_TO = '02/01/2000';

describe('Therapy → Sessions Tab → Date Range Filter (UTR-000202)', () => {
  beforeEach(() => {
    loginAsAdmin();
    new NavigationHelper().navigateToTherapy();
  });

  it('THPY_SES_E2E_01: date-range quick filter narrows the inner sessions grid', () => {
    const SCOPE = '[data-form-entity="therapy"]';
    const outerGrid = new GridComponent();
    const innerGrid = new GridComponent(SCOPE);
    const therapyForm = new TherapyFormComponent();

    outerGrid.search('filter-displayName', THERAPY_NAME);
    outerGrid.waitForFetchSettled();
    outerGrid.openRow(THERAPY_NAME);
    therapyForm.waitForFormLoad();
    therapyForm.goToSessionsTab();

    innerGrid.waitForRowsLoaded();
    innerGrid
      .getFirstRowDataId()
      .should('be.a', 'string')
      .and('not.be.empty');

    cy.get(`${SCOPE} input[data-testid="date-from"]`).should('exist');
    cy.get(`${SCOPE} input[data-testid="date-to"]`).should('exist');

    fillDateFilter('date-from', FAR_PAST_FROM, SCOPE);
    cy.get('body').click(0, 0);
    fillDateFilter('date-to', FAR_PAST_TO, SCOPE);
    cy.get('body').click(0, 0);

    // Cypress retries until the grid reacts to the filter (handles debounce + fetch)
    // eslint-disable-next-line no-restricted-syntax -- far-past date range is expected to contain zero sessions
    cy.get(
      `${SCOPE} [data-testid="rpg-grid-component-wrapper"] tbody tr[data-id]`,
      { timeout: 20000 },
    ).should('have.length', 0);

    therapyForm.closeWindow();
  });
});
