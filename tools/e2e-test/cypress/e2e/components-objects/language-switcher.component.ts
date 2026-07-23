/// <reference types="cypress" />

/**
 * Component Object for Language Switcher
 * Encapsulates all interactions with the language picker menu in the app banner.
 * Supports switching between English (en), Vietnamese (vi), and Polish (pl).
 */

export type LanguageCode = 'en' | 'vi' | 'pl';

export interface LanguageConfig {
  code: LanguageCode;
  label: string;
  tabBasicInformation: string;
  tabNotes: string;
  firstNameLabel: string;
  lastNameLabel: string;
  emailLabel: string;
}

export const LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  en: {
    code: 'en',
    label: 'English',
    tabBasicInformation: 'Basic Information',
    tabNotes: 'Notes',
    firstNameLabel: 'First Name',
    lastNameLabel: 'Last Name',
    emailLabel: 'Email',
  },
  vi: {
    code: 'vi',
    label: 'Tiếng Việt',
    tabBasicInformation: 'Thông tin cơ bản',
    tabNotes: 'Ghi chú',
    firstNameLabel: 'Tên',
    lastNameLabel: 'Họ',
    emailLabel: 'Email',
  },
  pl: {
    code: 'pl',
    label: 'Polski',
    tabBasicInformation: 'Informacje podstawowe',
    tabNotes: 'Notatki',
    firstNameLabel: 'Imię',
    lastNameLabel: 'Nazwisko',
    emailLabel: 'Email',
  },
};

export class LanguageSwitcherComponent {
  readonly selectors = {
    languagePickerButton: '[data-testid="language-picker-btn"]',
    languageItemEn: '[data-testid="language-picker-item-en"]',
    languageItemVi: '[data-testid="language-picker-item-vi"]',
    languageItemPl: '[data-testid="language-picker-item-pl"]',
    formTabs: '[data-testid="form-tabs"]',
    tabBasicInformation: '[data-testid="tab-basic-information"]',
    tabNotes: '[data-testid="tab-notes"]',
    formSubmitButton: '[data-testid="form-submit-btn"]',
    formCancelButton: '[data-testid="form-cancel-btn"]',
    firstNameInput: '[data-testid="first-name"]',
    lastNameInput: '[data-testid="last-name"]',
    emailInput: '[data-testid="email"]',
  };

  private getLanguageItemSelector(code: LanguageCode): string {
    const map: Record<LanguageCode, string> = {
      en: this.selectors.languageItemEn,
      vi: this.selectors.languageItemVi,
      pl: this.selectors.languageItemPl,
    };
    return map[code];
  }

  switchTo(code: LanguageCode): this {
    const itemSelector = this.getLanguageItemSelector(code);

    // Defensive cleanup: dismiss any lingering MUI Menu/Popover portal
    // from a previous test before opening our own. The MuiBackdrop-invisible
    // class can persist briefly when a portal from the previous spec hasn't
    // finished unmounting, intercepting our click and timing the test out
    // (THR_VAL_E2E_01_pl, build #4-#6).
    cy.get('body').type('{esc}', { force: true });
    cy.get('body').click('topLeft', { force: true });

    // Open the picker menu, retrying the click if the menu items don't
    // render. Under CI load the click occasionally lands during a layout
    // reflow and the MUI Menu's portal never paints. Three attempts with
    // *increasing* per-attempt waits (2s → 3s → 5s — front-loaded retries
    // on the assumption that a healthy click renders the menu in ~2s,
    // only escalating patience if multiple attempts fail). Total
    // worst-case ~10s, same as the original timeout but with two real
    // retries baked in.
    const waitsMs = [2000, 3000, 5000];
    const tryOpen = (idx: number) => {
      cy.get(this.selectors.languagePickerButton).click({ force: true });
      // Bounded wait then synchronous check. cy.wait(ms) is an antipattern
      // in general but is the cleanest expression of "give the click N ms
      // to propagate before I retry the action" — chained should() with
      // timeout would bail the test on the first miss instead of allowing
      // the recursive retry.
      cy.wait(waitsMs[idx]);
      cy.get('body').then(($body) => {
        const open = $body.find(`${itemSelector}:visible`).length > 0;
        if (!open && idx + 1 < waitsMs.length) {
          tryOpen(idx + 1);
        }
      });
    };
    tryOpen(0);

    cy.get(itemSelector).should('be.visible').click();

    // Wait for URL to reflect the language change
    if (code === 'en') {
      cy.url().should('not.include', '/vi/').and('not.include', '/pl/');
    } else {
      cy.url().should('include', `/${code}/`);
      // Full page visit to ensure translation JSON loads (client-side switch gets 307)
      cy.url().then((url) => cy.visit(url));
    }
    // Dismiss any lingering MUI tooltip from the language picker button
    cy.get('body').click({ force: true });
    return this;
  }

  /**
   * Assert that the form tab labels match the expected language.
   * The form must be open for these assertions to work.
   * Uses the form-tabs wrapper to check tab text because the individual
   * tab button may render text in a nested child element.
   */
  shouldHaveTabLabels(config: LanguageConfig): this {
    cy.get(this.selectors.formTabs)
      .should('contain.text', config.tabBasicInformation)
      .and('contain.text', config.tabNotes);
    return this;
  }

  /**
   * Assert that the form field labels match the expected language.
   * The form must be open for these assertions to work.
   */
  shouldHaveFieldLabels(config: LanguageConfig): this {
    // Use label[for] association via the input's parent MuiFormControl
    cy.get(this.selectors.firstNameInput)
      .parents('.MuiFormControl-root')
      .first()
      .should('contain.text', config.firstNameLabel);
    cy.get(this.selectors.lastNameInput)
      .parents('.MuiFormControl-root')
      .first()
      .should('contain.text', config.lastNameLabel);
    cy.get(this.selectors.emailInput)
      .parents('.MuiFormControl-root')
      .first()
      .should('contain.text', config.emailLabel);
    return this;
  }

  /**
   * Assert that the "Basic Information" tab has a specific error badge count.
   * The badge wraps the tab button text, so we look for it by traversing
   * from the tab button to its parent wrapper.
   */
  shouldHaveTabErrorCount(expectedCount: number): this {
    cy.get(this.selectors.tabBasicInformation)
      .parent('.MuiBadge-root')
      .find('.MuiBadge-badge')
      .should('have.text', String(expectedCount));
    return this;
  }

  /**
   * Assert that a specific field is in error state (has Mui-error class).
   */
  shouldHaveFieldError(fieldSelector: string): this {
    cy.get(fieldSelector).closest('.MuiFormControl-root').find('.Mui-error').should('exist');
    return this;
  }
}
