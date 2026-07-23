/// <reference types="cypress" />

/**
 * TEST: THR_E2E_01 - Create valid therapist as admin
 *
 * Steps:
 * 1. Reset database and login as admin
 * 2. Navigate to therapist page
 * 3. Click "Add Item" to open create form
 * 4. Fill profile content for English and Polish plus Settings
 * 5. Click Save
 * 6. Verify therapist appears in grid with correct visible column values
 * 7. Open edit form and verify all saved fields
 */

import { makeValidTherapist, setupAsAdmin } from './therapist-test-utils';
import { TherapistFormComponent } from '../components-objects/therapist-form.component';
import { GridComponent } from '../components-objects/grid.component';

describe('Therapist - Create valid as admin', () => {
  beforeEach(() => {
    setupAsAdmin();
  });

  it('THR_E2E_01: should create a valid therapist with all fields filled', { tags: '@mutating' }, () => {
    const form = new TherapistFormComponent();
    const grid = new GridComponent();
    const VALID_THERAPIST = makeValidTherapist();

    form.clickAddItem();
    form.waitForFormLoad();

    form.fillEnglishTab({
      professionalTitle: VALID_THERAPIST.english.professionalTitle,
      description: VALID_THERAPIST.english.description,
      metaDescription: VALID_THERAPIST.english.metaDescription,
    });

    form.fillPolishTab({
      professionalTitle: VALID_THERAPIST.polish.professionalTitle,
      description: VALID_THERAPIST.polish.description,
      metaDescription: VALID_THERAPIST.polish.metaDescription,
    });

    form.fillContactSettingsTab(VALID_THERAPIST.contactSettings);

    form.clickSave();
    cy.wait('@createTherapist').its('response.statusCode').should('eq', 200);
    form.waitForFormClose();

    const row = grid.findRow(VALID_THERAPIST.english.professionalTitle);
    row.should('contain.text', VALID_THERAPIST.english.professionalTitle);
    row.should('contain.text', 'English');
    row.should('contain.text', 'Yes');
    row.should('contain.text', VALID_THERAPIST.contactSettings.contactEmail);
    row.should('contain.text', VALID_THERAPIST.contactSettings.contactPhone);
    row.should('not.contain.text', VALID_THERAPIST.contactSettings.slug);

    grid.openRow(VALID_THERAPIST.english.professionalTitle);
    form.waitForFormLoad();

    form.goToEnglishTab();
    cy.get(form.selectors.professionalTitleEn).should(
      'have.value',
      VALID_THERAPIST.english.professionalTitle
    );
    cy.get(form.selectors.descriptionEn).should('have.value', VALID_THERAPIST.english.description);
    cy.get(form.selectors.metaDescriptionEn).should(
      'have.value',
      VALID_THERAPIST.english.metaDescription
    );

    form.goToPolishTab();
    cy.get(form.selectors.professionalTitlePl).should(
      'have.value',
      VALID_THERAPIST.polish.professionalTitle
    );
    cy.get(form.selectors.descriptionPl).should('have.value', VALID_THERAPIST.polish.description);
    cy.get(form.selectors.metaDescriptionPl).should(
      'have.value',
      VALID_THERAPIST.polish.metaDescription
    );

    form.goToContactSettingsTab();
    cy.get(form.selectors.contactEmail).should(
      'have.value',
      VALID_THERAPIST.contactSettings.contactEmail
    );
    cy.get(form.selectors.contactPhone).should(
      'have.value',
      VALID_THERAPIST.contactSettings.contactPhone
    );
    cy.get(form.selectors.slug).should('have.value', VALID_THERAPIST.contactSettings.slug);
    cy.get(form.selectors.percentageProfitSharing).should(
      'have.value',
      VALID_THERAPIST.contactSettings.profitSharing
    );

    form.clickCancel();
  });
});
