/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

import { closeWindowIfOpen } from './form.component';

/**
 * Component Object for Therapist Form
 * Encapsulates all interactions with the therapist create/edit form
 */
export class TherapistFormComponent {
  selectors: {
    addItemButton: string;
    submitButton: string;
    cancelButton: string;
    formWrapper: string;
    formTabs: string;

    profileTab: string;
    settingsTab: string;
    englishTab: string;
    polishTab: string;
    contactSettingsTab: string;
    imageTab: string;

    professionalTitleEn: string;
    descriptionEn: string;
    metaDescriptionEn: string;

    professionalTitlePl: string;
    descriptionPl: string;
    metaDescriptionPl: string;

    userId: string;
    languageIds: string;
    contactEmail: string;
    contactPhone: string;
    slug: string;
    percentageProfitSharing: string;

    option: string;
    errorBadge: string;
    errorClass: string;
    formControl: string;
  };

  constructor() {
    this.selectors = {
      addItemButton: '[data-testid="create-item-btn"]',
      submitButton: '[data-testid="form-submit-btn"]',
      cancelButton: '[data-testid="form-cancel-btn"]',
      formWrapper: '[data-testid="tabular-form-wrapper"]',
      formTabs: '[data-testid="form-tabs"]',

      profileTab: '[data-testid="tab-profile"]',
      settingsTab: '[data-testid="tab-settings"]',
      englishTab: '[data-testid="tab-profile"]',
      polishTab: '[data-testid="tab-profile"]',
      contactSettingsTab: '[data-testid="tab-settings"]',
      imageTab: '[data-testid="tab-profile"]',

      professionalTitleEn: 'input[data-testid="professional-title-en"]',
      descriptionEn: 'textarea[datatestid="description-en"]',
      metaDescriptionEn: 'textarea[data-testid="meta-description-en"]',

      professionalTitlePl: 'input[data-testid="professional-title-pl"]',
      descriptionPl: 'textarea[datatestid="description-pl"]',
      metaDescriptionPl: 'textarea[data-testid="meta-description-pl"]',

      userId: 'input[data-testid="user-id"]',
      languageIds: 'input[data-testid="language-ids"]',
      contactEmail: 'input[data-testid="contact-email"]',
      contactPhone: 'input[data-testid="contact-phone"]',
      slug: 'input[data-testid="slug"]',
      percentageProfitSharing: 'input[data-testid="percentage-profit-sharing"]',

      option: '[role="option"]',
      errorBadge: '.MuiBadge-colorError',
      errorClass: '.Mui-error',
      formControl: '.MuiFormControl-root',
    };
  }

  /** Click the Add Item button to open the create form */
  clickAddItem(): this {

    cylog('Therapist: clickAddItem');
    cy.get(this.selectors.addItemButton).click();
    return this;
  }

  /** Wait for the form to be visible */
  waitForFormLoad(): this {
    cy.get(this.selectors.formWrapper).should('be.visible');
    return this;
  }

  /** Wait for the form to close after submit */
  waitForFormClose(timeout: number = 10000): this {
    closeWindowIfOpen();
    cy.get(this.selectors.formWrapper, { timeout }).should('not.exist');
    return this;
  }

  /** Navigate to the Profile tab */
  goToProfileTab(): this {
    cy.get(this.selectors.profileTab).click();
    return this;
  }

  /** Navigate to the Settings tab */
  goToSettingsTab(): this {
    cy.get(this.selectors.settingsTab).click();
    return this;
  }

  /** Switch the profile language panel to English */
  goToEnglishTab(): this {
    this.goToProfileTab();
    cy.get(this.selectors.formWrapper).contains('button', 'English').click();
    return this;
  }

  /** Switch the profile language panel to Polish */
  goToPolishTab(): this {
    this.goToProfileTab();
    cy.get(this.selectors.formWrapper).contains('button', 'Polish').click();
    return this;
  }

  /** Navigate to the Settings tab (legacy alias) */
  goToContactSettingsTab(): this {
    this.goToSettingsTab();
    return this;
  }

  /** Navigate to the Profile tab (legacy alias for image/profile section) */
  goToImageTab(): this {
    this.goToProfileTab();
    return this;
  }

  fillProfessionalTitleEn(value: string): this {
    cy.get(this.selectors.professionalTitleEn).clear();
    cy.get(this.selectors.professionalTitleEn).type(value);
    return this;
  }

  fillDescriptionEn(value: string): this {
    cy.get(this.selectors.descriptionEn).clear();
    cy.get(this.selectors.descriptionEn).type(value);
    return this;
  }

  fillMetaDescriptionEn(value: string): this {
    cy.get(this.selectors.metaDescriptionEn).clear();
    cy.get(this.selectors.metaDescriptionEn).type(value);
    return this;
  }

  fillProfessionalTitlePl(value: string): this {
    cy.get(this.selectors.professionalTitlePl).clear();
    cy.get(this.selectors.professionalTitlePl).type(value);
    return this;
  }

  fillDescriptionPl(value: string): this {
    cy.get(this.selectors.descriptionPl).clear();
    cy.get(this.selectors.descriptionPl).type(value);
    return this;
  }

  fillMetaDescriptionPl(value: string): this {
    cy.get(this.selectors.metaDescriptionPl).clear();
    cy.get(this.selectors.metaDescriptionPl).type(value);
    return this;
  }

  selectUser(userName: string): this {
    cy.get(this.selectors.userId).click();
    cy.get(this.selectors.userId).type(userName);
    cy.get(this.selectors.option, { timeout: 25000 })
      .should('be.visible')
      .contains(userName)
      .click();
    return this;
  }

  selectLanguage(languageName: string): this {
    cy.get(this.selectors.languageIds).click();
    cy.get(this.selectors.option, { timeout: 25000 })
      .should('be.visible')
      .contains(languageName)
      .click();
    return this;
  }

  selectLanguages(languageNames: string[]): this {
    cy.get(this.selectors.languageIds).click();
    languageNames.forEach((name) => {
      cy.get(this.selectors.option, { timeout: 25000 }).should('be.visible').contains(name).click();
    });
    this.dismissDropdown();
    return this;
  }

  fillContactEmail(value: string): this {
    cy.get(this.selectors.contactEmail).clear();
    cy.get(this.selectors.contactEmail).type(value);
    return this;
  }

  fillContactPhone(value: string): this {
    cy.get(this.selectors.contactPhone).clear();
    cy.get(this.selectors.contactPhone).type(value);
    return this;
  }

  fillSlug(value: string): this {
    cy.get(this.selectors.slug).clear();
    cy.get(this.selectors.slug).type(value);
    return this;
  }

  fillProfitSharing(value: string): this {
    cy.get(this.selectors.percentageProfitSharing).clear();
    cy.get(this.selectors.percentageProfitSharing).type(value);
    return this;
  }

  /** Toggle a switch row by its visible title text */
  toggleCheckbox(labelText: string): this {
    cy.get(this.selectors.formWrapper)
      .contains(labelText)
      .closest('div')
      .parent()
      .find('input[type="checkbox"]')
      .click({ force: true });
    return this;
  }

  clickSave(): this {
    cylog('Therapist: clickSave');
    cy.get(this.selectors.submitButton).click();
    return this;
  }

  clickCancel(): this {
    cy.get(this.selectors.cancelButton).click();
    return this;
  }

  fillEnglishTab(data: {
    professionalTitle: string;
    description: string;
    metaDescription?: string;
  }): this {
    this.goToEnglishTab();
    this.fillProfessionalTitleEn(data.professionalTitle);
    this.fillDescriptionEn(data.description);
    if (data.metaDescription) {
      this.fillMetaDescriptionEn(data.metaDescription);
    }
    return this;
  }

  fillPolishTab(data: {
    professionalTitle: string;
    description: string;
    metaDescription?: string;
  }): this {
    this.goToPolishTab();
    this.fillProfessionalTitlePl(data.professionalTitle);
    this.fillDescriptionPl(data.description);
    if (data.metaDescription) {
      this.fillMetaDescriptionPl(data.metaDescription);
    }
    return this;
  }

  fillContactSettingsTab(data: {
    userId?: string;
    languages?: string[];
    contactEmail?: string;
    contactPhone?: string;
    slug: string;
    profitSharing?: string;
    inPersonTherapy?: boolean;
    onlineTherapy?: boolean;
    acceptingNewClients?: boolean;
  }): this {
    this.goToContactSettingsTab();

    if (data.userId) {
      this.selectUser(data.userId);
    }
    if (data.languages && data.languages.length > 0) {
      this.selectLanguages(data.languages);
    }
    if (data.contactEmail) {
      this.fillContactEmail(data.contactEmail);
    }
    if (data.contactPhone) {
      this.fillContactPhone(data.contactPhone);
    }
    this.fillSlug(data.slug);
    if (data.profitSharing) {
      this.fillProfitSharing(data.profitSharing);
    }
    if (data.inPersonTherapy) {
      this.toggleCheckbox('In-Person Therapy');
    }
    if (data.onlineTherapy) {
      this.toggleCheckbox('Online Therapy');
    }
    if (data.acceptingNewClients) {
      this.toggleCheckbox('Accepting New Clients');
    }
    return this;
  }

  shouldHaveTabError(tabSelector: string): this {
    cy.get(tabSelector).parent('.MuiBadge-root').find(this.selectors.errorBadge).should('exist');
    return this;
  }

  shouldHaveFieldError(fieldSelector: string): this {
    cy.get(fieldSelector)
      .closest(this.selectors.formControl)
      .find(this.selectors.errorClass)
      .should('exist');
    return this;
  }

  shouldHaveErrorBadge(): this {
    cy.get(this.selectors.errorBadge).should('exist');
    return this;
  }

  private dismissDropdown(): void {
    cy.get('body').type('{esc}');
  }
}
