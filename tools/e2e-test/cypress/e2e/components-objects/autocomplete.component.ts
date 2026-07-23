/// <reference types="cypress" />

/**
 * Shared driver for MUI autocomplete dropdowns.
 *
 * Every utro dropdown (rpg-autocomplete-fe) refetches its options on open
 * (`onOpen={refetch}`) and a single input click is occasionally swallowed while
 * a dialog is still settling — leaving the listbox closed so the downstream
 * `[role="option"]` wait times out. Centralised here so each form component
 * object drives dropdowns the same robust way instead of re-implementing it.
 */
export class AutocompleteComponent {
  private readonly selectors = {
    listbox: '[role="listbox"]',
    loading: '.MuiAutocomplete-loading',
  };

  /**
   * Open the autocomplete at `inputSelector` and wait for its options to settle.
   *
   * `{downArrow}` opens the popper idempotently — unlike a click, repeating it
   * never toggles an already-open list shut — so we retry until it sticks.
   * `.first()` guards the transient two-dialogs case where an unscoped match
   * would yield two inputs. Then we wait for the on-open refetch's loading row
   * to clear, so callers read/select against a settled list (populated or not).
   */
  open(inputSelector: string, maxAttempts = 5): this {
    cy.get(inputSelector).first().should('be.visible').and('not.be.disabled');

    const tryOpen = (attempt: number): void => {
      cy.get(inputSelector).first().focus();
      cy.get(inputSelector).first().type('{downArrow}', { force: true });
      cy.get('body').then(($body) => {
        if ($body.find(`${this.selectors.listbox}:visible`).length > 0) return;
        if (attempt + 1 >= maxAttempts) {
          throw new Error(
            `AutocompleteComponent.open: listbox failed to open after ${maxAttempts} attempts on ${inputSelector}`
          );
        }
        // eslint-disable-next-line cypress/no-unnecessary-waiting -- pre-retry pacing; nothing rendered yet to gate on
        cy.wait(400);
        tryOpen(attempt + 1);
      });
    };
    tryOpen(0);

    cy.get(this.selectors.listbox, { timeout: 5000 }).should('be.visible');
    cy.get(this.selectors.loading, { timeout: 30000 }).should('not.exist');
    return this;
  }
}
