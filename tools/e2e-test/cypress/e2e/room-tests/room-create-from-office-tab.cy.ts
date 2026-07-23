/// <reference types="cypress" />

import { OfficeFormComponent } from '../components-objects/office-form.component';
import { GridComponent } from '../components-objects/grid.component';
import {
  generateRandomString,
  setupOfficeTestForAdmin,
} from '../office-tests/office-test-utils';

describe('Room CREATE from Office Rooms tab (Admin)', () => {
  beforeEach(() => {
    setupOfficeTestForAdmin();
  });

  it('ROOM_E2E_01: opens the Rooms tab and creates a room scoped to the office', { tags: '@mutating' }, () => {
    const suffix = generateRandomString(6);
    const office = {
      nameEn: `Office Rooms ${suffix}`,
      namePl: `Biuro Pokoje ${suffix}`,
      address: `Rooms St ${suffix}`,
    };
    const roomNameEn = `Room EN ${suffix}`;
    const roomNamePl = `Pokoj PL ${suffix}`;
    const roomAbbr = `R${suffix.substring(0, 2).toUpperCase()}`;

    const officeForm = new OfficeFormComponent();
    const officeGrid = new GridComponent();

    officeForm.clickNew();
    officeForm.waitForFormLoad();
    officeForm.fill(office, false);
    officeForm.submit();

    officeGrid.waitForGrid();
    // Filter to this run's office before asserting/opening — the office grid
    // accumulates rows without a DB reset and a new office can paginate away.
    officeGrid.search('filter-displayName', office.nameEn);
    officeGrid.waitForFetchSettled();
    officeGrid.shouldContain(office.nameEn);

    officeGrid.openRow(office.nameEn);
    officeForm.waitForFormLoad();
    officeForm.goToRoomsTab();

    // Embedded GridTab uses the icon AddItemGridBtn (no "New" button); the background
    // Office grid has the same button so we scope to the open office form's dialog.
    cy.get('[data-form-entity="office"]', { timeout: 15000 })
      .find('[data-testid="add-item-grid-btn"]')
      .click();

    // Scope all room form interactions to the room form (avoid the office form
    // still mounted in the background).
    const roomFormScope = '[data-form-entity="room"]';
    cy.get(`${roomFormScope} input[data-testid="display-name-en"]`, {
      timeout: 10000,
    }).type(roomNameEn);
    cy.get(`${roomFormScope} [role="tab"]:contains("Polish")`).click();
    cy.get(`${roomFormScope} input[data-testid="display-name-pl"]`).type(roomNamePl);
    cy.get(`${roomFormScope} input[data-testid="display-abbreviation"]`).type(roomAbbr);

    cy.get(`${roomFormScope} [data-testid="form-submit-btn"]`).click();

    cy.get(roomFormScope, { timeout: 15000 }).should('not.exist');

    cy.contains(roomNameEn, { timeout: 15000 }).should('be.visible');
  });
});
