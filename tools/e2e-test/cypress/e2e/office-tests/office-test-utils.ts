/// <reference types="cypress" />

import { GridComponent } from '../components-objects/grid.component';
import { cylog } from '../../utils/cylog';
import { generateRandomString } from '../../utils/unique';

export { generateRandomString };

export function setupOfficeTestForAdmin(): void {
  cylog('setup office test for admin');
  cy.login();
  cy.visit('/core/office');
  new GridComponent().waitForGrid();
  cy.get('nav[aria-label="breadcrumb"]', { timeout: 10000 }).should(
    'contain.text',
    'Office'
  );
}
