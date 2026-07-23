/// <reference types="cypress" />

/**
 * TEST: THR_NONADMIN_E2E_01 — Non-admin therapist cannot create new therapists
 */

import { navigateToTherapistPage } from './therapist-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { TherapistFormComponent } from '../components-objects/therapist-form.component';
import { ADAM, loginAs } from '../../utils/test-users';

describe('Therapist - Non-Admin Restrictions', () => {
  beforeEach(() => {
    loginAs('adam');
    cy.intercept('POST', '**/core.v1.TherapistService/List').as('therapistList');
    navigateToTherapistPage();
    cy.wait('@therapistList');
  });

  it('THR_NONADMIN_E2E_01: non-admin should not be able to create a new therapist', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const form = new TherapistFormComponent();

    cy.get(form.selectors.addItemButton).should('not.exist');
    // Adam sees only his own therapist profile(s). Assert at-least-one + his
    // presence rather than exactly one: therapists created by other specs
    // accumulate on the non-reset DB and some may be owned by Adam.
    grid.getVisibleRows().should('have.length.gte', 1);
    grid.shouldContain(ADAM.displayName);
  });

  it('THR_NONADMIN_E2E_02: non-admin should be able to open and edit their own entry', { tags: '@mutating' }, () => {
    const grid = new GridComponent();
    const form = new TherapistFormComponent();

    grid.openRow(ADAM.displayName);
    form.waitForFormLoad();

    cy.get(form.selectors.formWrapper).should('be.visible');

    form.goToContactSettingsTab();
    form.fillContactEmail('adam-updated@utro-test.com');

    cy.get(form.selectors.submitButton).should('not.be.disabled');

    cy.intercept('POST', '**/core.v1.TherapistService/Update').as('updateTherapist');
    form.clickSave();
    cy.wait('@updateTherapist', { timeout: 30000 });
    form.waitForFormClose();

    grid.getVisibleRows().should('have.length.gte', 1);
  });
});
