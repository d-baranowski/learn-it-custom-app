/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

import { closeWindowIfOpen } from './form.component';

export interface OfficeData {
  nameEn: string;
  namePl: string;
  address: string;
}

/**
 * Component Object for the Office create/edit form.
 * The form has three tabs: English, Polish, Rooms.
 * `address` is rendered outside the tabs and is hidden when the Rooms tab is active.
 */
export class OfficeFormComponent {
  readonly selectors = {
    nameEnInput: 'input[data-testid="display-name-en"]',
    namePlInput: 'input[data-testid="display-name-pl"]',
    addressInput: 'textarea[data-testid="address"], input[data-testid="address"]',
    newButton: '[data-testid="create-item-btn"]',
    submitButton: '[data-testid="form-submit-btn"]',
    cancelButton: '[data-testid="form-cancel-btn"]',
    englishTab: '[role="tab"]:contains("English")',
    polishTab: '[role="tab"]:contains("Polish")',
    roomsTab: '[role="tab"]:contains("Rooms")',
  };

  clickNew(): this {


    cylog('Office: clickNew');
    cy.get(this.selectors.newButton).click();
    return this;
  }

  waitForFormLoad(): this {
    cy.get(this.selectors.nameEnInput, { timeout: 10000 }).should('exist');
    return this;
  }

  fillEnglishName(value: string, clear = true): this {
    if (clear) cy.get(this.selectors.nameEnInput).clear();
    cy.get(this.selectors.nameEnInput).type(value);
    return this;
  }

  fillPolishName(value: string, clear = true): this {
    if (clear) cy.get(this.selectors.namePlInput).clear();
    cy.get(this.selectors.namePlInput).type(value);
    return this;
  }

  fillAddress(value: string, clear = true): this {
    if (clear) cy.get(this.selectors.addressInput).clear();
    cy.get(this.selectors.addressInput).type(value);
    return this;
  }

  goToEnglishTab(): this {
    cy.get(this.selectors.englishTab).click();
    cy.get(this.selectors.nameEnInput).should('be.visible');
    return this;
  }

  goToPolishTab(): this {
    cy.get(this.selectors.polishTab).click();
    cy.get(this.selectors.namePlInput).should('be.visible');
    return this;
  }

  goToRoomsTab(): this {
    cy.get(this.selectors.roomsTab).click();
    return this;
  }

  /** Fill all top-level office fields. Switches tabs as needed. */
  fill(data: Partial<OfficeData>, clear = true): this {
    if (data.nameEn !== undefined) {
      this.goToEnglishTab();
      this.fillEnglishName(data.nameEn, clear);
    }
    if (data.namePl !== undefined) {
      this.goToPolishTab();
      this.fillPolishName(data.namePl, clear);
    }
    if (data.address !== undefined) {
      this.fillAddress(data.address, clear);
    }
    return this;
  }

  submit(): this {


    cylog('Office: submit');
    cy.get(this.selectors.submitButton).click();
    closeWindowIfOpen();
    cy.get(this.selectors.nameEnInput, { timeout: 15000 }).should('not.exist');
    return this;
  }

  cancel(): this {


    cylog('Office: cancel');
    cy.get(this.selectors.cancelButton).click();
    return this;
  }

  shouldHaveEnglishName(expected: string): this {
    this.goToEnglishTab();
    cy.get(this.selectors.nameEnInput).should('have.value', expected);
    return this;
  }

  shouldHavePolishName(expected: string): this {
    this.goToPolishTab();
    cy.get(this.selectors.namePlInput).should('have.value', expected);
    return this;
  }

  shouldHaveAddress(expected: string): this {
    cy.get(this.selectors.addressInput).should('have.value', expected);
    return this;
  }
}
