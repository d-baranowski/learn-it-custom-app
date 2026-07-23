/// <reference types="cypress" />

/**
 * TEST: THR_FILTER_E2E_01 — Filter therapists by In Person Therapy
 *
 * Steps:
 * 1. Login as admin, navigate to therapist page
 * 2. Open "More Filters" panel
 * 3. Select "Yes" for In Person Therapy Format
 * 4. Verify all visible rows show "Yes" in that column
 * 5. Select "No" for In Person Therapy Format
 * 6. Verify all visible rows do NOT show "Yes" in that column
 * 7. Select "All" to reset the filter
 * 8. Verify the full list is shown again
 */

import { navigateToTherapistPage } from './therapist-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { FilterPanelComponent } from '../components-objects/filter-panel.component';

const IN_PERSON_COLUMN = 'In Person Therapy Format';

describe('Therapist - Filter by In Person Therapy', () => {
  beforeEach(() => {
    cy.login();
    navigateToTherapistPage();
  });

  it('THR_FILTER_E2E_01: should filter therapists by in person therapy format', () => {
    const grid = new GridComponent();
    const filterPanel = new FilterPanelComponent();

    grid.waitForRowsLoaded().waitForFetchSettled();
    grid.getVisibleRows().its('length').as('totalRows');
    grid.columnIndex(IN_PERSON_COLUMN).as('colIndex');

    filterPanel.openFilterPanel();

    filterPanel.selectRadioFilter(IN_PERSON_COLUMN, 'Yes');
    grid.waitForFetchSettled();
    cy.get('@colIndex').then((colIndex) => {
      grid.expectEveryRowCell(
        Number(colIndex),
        'in-person cell is "Yes"',
        (text) => text === 'Yes'
      );
    });

    filterPanel.selectRadioFilter(IN_PERSON_COLUMN, 'No');
    grid.waitForFetchSettled();
    cy.get('@colIndex').then((colIndex) => {
      grid.expectEveryRowCell(
        Number(colIndex),
        'in-person cell is not "Yes"',
        (text) => text !== 'Yes'
      );
    });

    filterPanel.selectRadioFilter(IN_PERSON_COLUMN, 'All');
    grid.waitForFetchSettled();
    cy.get('@totalRows').then((totalRows) => {
      grid.expectRowCount(Number(totalRows));
    });

    filterPanel.closeFilterPanel();
  });
});
