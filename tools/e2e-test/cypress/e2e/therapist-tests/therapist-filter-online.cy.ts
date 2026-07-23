/// <reference types="cypress" />

/**
 * TEST: THR_FILTER_E2E_02 — Filter therapists by Online Therapy
 *
 * Steps:
 * 1. Reset DB, login as admin, navigate to therapist page
 * 2. Open "More Filters" panel
 * 3. Select "Yes" for Online Therapy Format
 * 4. Verify all visible rows show "Yes" in that column
 * 5. Select "No" for Online Therapy Format
 * 6. Verify all visible rows do NOT show "Yes" in that column
 * 7. Select "All" to reset the filter
 * 8. Verify the full list is shown again
 */

import { navigateToTherapistPage } from './therapist-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { FilterPanelComponent } from '../components-objects/filter-panel.component';

const ONLINE_COLUMN = 'Online Therapy Format';

describe('Therapist - Filter by Online Therapy', () => {
  beforeEach(() => {
    cy.login();
    navigateToTherapistPage();
  });

  it('THR_FILTER_E2E_02: should filter therapists by online therapy format', () => {
    const grid = new GridComponent();
    const filterPanel = new FilterPanelComponent();

    grid.waitForRowsLoaded().waitForFetchSettled();
    grid.getVisibleRows().its('length').as('totalRows');
    grid.columnIndex(ONLINE_COLUMN).as('colIndex');

    filterPanel.openFilterPanel();

    filterPanel.selectRadioFilter(ONLINE_COLUMN, 'Yes');
    grid.waitForFetchSettled();
    cy.get('@colIndex').then((colIndex) => {
      grid.expectEveryRowCell(
        Number(colIndex),
        'online cell is "Yes"',
        (text) => text === 'Yes'
      );
    });

    filterPanel.selectRadioFilter(ONLINE_COLUMN, 'No');
    grid.waitForFetchSettled();
    cy.get('@colIndex').then((colIndex) => {
      grid.expectEveryRowCell(
        Number(colIndex),
        'online cell is not "Yes"',
        (text) => text !== 'Yes'
      );
    });

    filterPanel.selectRadioFilter(ONLINE_COLUMN, 'All');
    grid.waitForFetchSettled();
    cy.get('@totalRows').then((totalRows) => {
      grid.expectRowCount(Number(totalRows));
    });

    filterPanel.closeFilterPanel();
  });
});
