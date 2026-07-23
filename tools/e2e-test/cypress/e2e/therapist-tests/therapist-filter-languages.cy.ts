/// <reference types="cypress" />

/**
 * TEST: THR_FILTER_E2E_03 — Filter therapists by Language
 *
 * Steps:
 * 1. Login as admin, navigate to therapist page
 * 2. Dynamically find the Languages column index
 * 3. Open "More Filters" panel
 * 4. Select "English" in the Language autocomplete filter, close panel
 * 5. Verify all visible rows contain "English" in the Languages column
 * 6. Reopen panel, clear filter, select "Polish", close panel
 * 7. Verify all visible rows contain "Polish" in the Languages column
 */

import { navigateToTherapistPage } from './therapist-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { FilterPanelComponent } from '../components-objects/filter-panel.component';

const LANGUAGES_COLUMN = 'Languages';
const LANGUAGE_FILTER_TEST_ID = 'filter-languageIds';

describe('Therapist - Filter by Languages', () => {
  beforeEach(() => {
    cy.login();
    navigateToTherapistPage();
  });

  it('THR_FILTER_E2E_03: should filter therapists by language', () => {
    const grid = new GridComponent();
    const filterPanel = new FilterPanelComponent();

    grid.waitForRowsLoaded().waitForFetchSettled();
    grid.shouldContain('English');
    grid.columnIndex(LANGUAGES_COLUMN).as('colIndex');

    const filterByLanguageAndVerify = (language: string) => {
      filterPanel
        .openFilterPanel()
        .selectAutocompleteFilter(LANGUAGE_FILTER_TEST_ID, language);
      grid.waitForFetchSettled();
      filterPanel.closeFilterPanel();

      cy.get('@colIndex').then((colIndex) => {
        grid.expectEveryRowCell(
          Number(colIndex),
          `languages cell contains "${language}"`,
          (text) => text.includes(language)
        );
      });
    };

    filterByLanguageAndVerify('English');

    filterPanel
      .openFilterPanel()
      .clearAutocompleteFilter(LANGUAGE_FILTER_TEST_ID);
    filterByLanguageAndVerify('Polish');
  });
});
