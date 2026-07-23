/// <reference types="cypress" />

/**
 * Component Object for the "More Filters" panel (dialog2-container)
 * Encapsulates all interactions with the filter dialog used across grid views
 */
export class FilterPanelComponent {
  selectors: {
    // TODO: add data-testid to UI for More Filters button
    moreFiltersButton: string;
    filterDialog: string;
    // TODO: add data-testid to UI for MUI form group labels
    formLabel: string;
    option: string;
  };

  constructor() {
    this.selectors = {
      moreFiltersButton: 'button[aria-label="More Filters"]',
      filterDialog: '[data-testid="dialog2-container"]',
      formLabel: '.MuiFormLabel-root',
      option: '[role="option"]',
    };
  }

  /** Open the "More Filters" panel. No-op if it is already open. */
  openFilterPanel(): this {
    cy.get('body').then(($body) => {
      if ($body.find(`${this.selectors.filterDialog}:visible`).length > 0) {
        return;
      }
      // force: true needed — MUI backdrop from grid can obscure the button
      cy.get(this.selectors.moreFiltersButton).click({ force: true });
    });
    cy.get(this.selectors.filterDialog, { timeout: 10000 }).should('be.visible');
    return this;
  }

  /** Close the "More Filters" panel. No-op if it is already closed. */
  closeFilterPanel(): this {
    cy.get('body').then(($body) => {
      if ($body.find(this.selectors.filterDialog).length === 0) {
        return;
      }
      cy.get(this.selectors.filterDialog).find('[data-testid="CloseIcon"]').first().click();
    });
    cy.get(this.selectors.filterDialog).should('not.exist');
    return this;
  }

  /**
   * Select a value from an autocomplete filter by its data-testid
   * @param testId - The data-testid of the autocomplete wrapper (e.g., 'filter-languageIds')
   * @param value - The option text to select
   */
  selectAutocompleteFilter(testId: string, value: string): this {
    cy.get(this.selectors.filterDialog).should('be.visible');

    // Clicks/keystrokes into a freshly-mounted MUI autocomplete are
    // occasionally swallowed (popper re-mounts the input), and under CI
    // load the options request can lag — retry the whole open+type dance
    // until options actually appear (PR-166 #64: options never showed).
    const tryOpen = (attempt: number): void => {
      cy.get(this.selectors.filterDialog).within(() => {
        cy.get(`[data-testid="${testId}"] input`).click({ force: true });
        cy.get(`[data-testid="${testId}"] input`).clear({ force: true });
        cy.get(`[data-testid="${testId}"] input`).type(value, { force: true });
      });
      cy.get('body').then(($body) => {
        if ($body.find('.MuiAutocomplete-loading').length > 0) {
          cy.get('.MuiAutocomplete-loading', { timeout: 30000 }).should('not.exist');
        }
      });
      cy.get('body').then(($body) => {
        if ($body.find(`${this.selectors.option}:contains("${value}")`).length > 0 || attempt >= 3) {
          // Final pass surfaces a clear timeout error if options never came.
          cy.get(this.selectors.option, { timeout: 15000 }).contains(value).click();
          return;
        }
        tryOpen(attempt + 1);
      });
    };
    tryOpen(1);

    // Selecting an option writes the FULL option label into the input
    // (e.g. "Jan Nowak - Family Therapist" for the query "Jan Nowak"),
    // so assert containment of what was typed, not equality.
    cy.get(this.selectors.filterDialog)
      .find(`[data-testid="${testId}"] input`)
      .invoke('val')
      .should('contain', value);
    return this;
  }

  /**
   * Clear an autocomplete filter by clicking its clear button
   * @param testId - The data-testid of the autocomplete wrapper
   */
  clearAutocompleteFilter(testId: string): this {
    cy.get(this.selectors.filterDialog).should('be.visible');
    cy.get(this.selectors.filterDialog).within(() => {
      cy.get(`[data-testid="${testId}"]`).find('button[aria-label="Clear"]').click({ force: true });
      cy.get(`[data-testid="${testId}"] input`).should('have.value', '');
    });
    return this;
  }

  /**
   * Select a radio option within a named filter group
   * @param groupLabel - The label of the filter group (e.g., 'In Person Therapy Format')
   * @param option - The radio option to select (e.g., 'Yes', 'No', 'All')
   */
  selectRadioFilter(groupLabel: string, option: string): this {
    cy.get(this.selectors.filterDialog).should('be.visible');
    // force: true needed — MUI dialog overlay div covers the radio labels
    cy.get(this.selectors.filterDialog).within(() => {
      cy.contains(this.selectors.formLabel, groupLabel)
        .parent()
        .contains('label', option)
        .click({ force: true });
      cy.contains(this.selectors.formLabel, groupLabel)
        .parent()
        .contains('label', option)
        .find('input[type="radio"]')
        .should('be.checked');
    });
    return this;
  }
}
