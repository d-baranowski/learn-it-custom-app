/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

/**
 * Component Object for Navigation
 * Encapsulates navigation actions within the application
 */
export class NavigationHelper {
  selectors: {
    sessionsNavItem: string;
    therapyNavItem: string;
    customerNavText: string;
    therapyNavText: string;
    breadcrumb: string;
    accountButton: string;
    logOutButton: string;
    loginButton: string;

    sessionsExpandToggle: string;
    sessionsExpandMoreIcon: string;
    sessionsExpandLessIcon: string;
  };

  constructor() {
    this.selectors = {
      // The nav group formerly labelled "Sessions" is now "Schedule"; its
      // data-testid is derived from the title (side-nav-item.tsx createTestId).
      sessionsNavItem: '[data-testid="side-nav-item-schedule"]',
      therapyNavItem: '[data-testid="side-nav-item-therapy"]',
      customerNavText: '[data-testid="side-nav-text-customer"]',
      therapyNavText: '[data-testid="side-nav-text-therapy"]',
      breadcrumb: 'nav[aria-label="breadcrumb"]',
      accountButton: '[data-testid="account-button"]',
      logOutButton: '[data-testid="log-out-button"]',
      loginButton: '[data-testid="login-button"]',

      sessionsExpandToggle: '[data-testid="side-nav-expand-schedule"]',
      sessionsExpandMoreIcon: '[data-testid="ExpandMoreIcon"]',
      sessionsExpandLessIcon: '[data-testid="ExpandLessIcon"]',
    };
  }

  /**
   * Click any button by its data-testid attribute
   * @param dataTestId - The data-testid value of the button
   */
  clickButton(dataTestId: string): this {
    cy.get(`[data-testid="${dataTestId}"]`).click();
    return this;
  }

  private ensureExpandedByToggle(toggleTestId: string): void {
    const toggleSelector = `[data-testid="${toggleTestId}"]`;

    cy.get('body').then(($body) => {
      const hasToggle = $body.find(toggleSelector).length > 0;
      if (!hasToggle) {
        return;
      }

      const isCollapsed =
        $body.find(toggleSelector).find(this.selectors.sessionsExpandMoreIcon)
          .length > 0;

      if (isCollapsed) {
        cy.get(toggleSelector).click();
        cy.get(toggleSelector)
          .find(this.selectors.sessionsExpandLessIcon)
          .should('exist');
      }
    });
  }

  navigateToTherapy(): this {

    cylog(`nav → Therapy`);
    // Ensure the Sessions group is expanded before clicking Therapy.
    // ExpandMoreIcon => collapsed; ExpandLessIcon => expanded.
    cy.get('body').then(($body) => {
      const hasToggle =
        $body.find(this.selectors.sessionsExpandToggle).length > 0;
      if (!hasToggle) {
        // If there is no toggle (edge case), fall back to clicking the group.
        this.clickButton('side-nav-item-schedule');
        return;
      }

      const $toggle = $body.find(this.selectors.sessionsExpandToggle);
      const isCollapsed =
        $toggle.find(this.selectors.sessionsExpandMoreIcon).length > 0;
      if (isCollapsed) {
        cy.get(this.selectors.sessionsExpandToggle).click();
      }
    });

    // Now click child item.
    this.clickButton('side-nav-item-therapy');

    cy.get(this.selectors.breadcrumb, { timeout: 10000 }).should(
      'contain.text',
      'Therapy'
    );
    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 10000,
    }).should('exist');
    return this;
  }

  navigateToSession(): this {

    cylog(`nav → Session`);
    // Use direct URL navigation to avoid sidebar expand/collapse race conditions.
    // The sidebar toggle for Sessions group behaves inconsistently across users.
    // TODO: replace with sidebar click once side-nav-expand-sessions toggle is reliable
    cy.visit('/core/session');

    cy.get(this.selectors.breadcrumb, { timeout: 10000 }).should(
      'contain.text',
      'Session'
    );
    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 10000,
    }).should('exist');
    return this;
  }

  navigateToCustomer(): this {

    cylog(`nav → Customer`);
    // If Customer is under a collapsible group, expand it first.
    // We don't know the exact group, but if a customer toggle exists we'll use it.
    this.ensureExpandedByToggle('side-nav-expand-customer');
    this.ensureExpandedByToggle('side-nav-expand-customers');

    this.clickButton('side-nav-text-customer');

    // Customer page typically renders the grid.
    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 10000,
    }).should('exist');
    return this;
  }

  navigateToTherapistCustomer(): this {

    cylog(`nav → Therapist Customer`);
    // Use direct URL navigation to avoid race conditions.
    // The sidebar data-testid for this item is unconfirmed.
    // TODO: replace cy.visit with a sidebar click once the data-testid is added to the UI
    cy.visit('/core/therapist-customer');

    cy.get(this.selectors.breadcrumb, { timeout: 10000 }).should(
      'contain.text',
      'Therapist Customer'
    );
    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 10000,
    }).should('exist');
    return this;
  }

  navigateToSessionIssues(): this {

    cylog(`nav → Session Issues`);
    cy.visit('/core/session-issues');
    // Session Issues page uses a different layout — wait for the page title
    cy.contains('Session Issues', { timeout: 10000 }).should('be.visible');
    return this;
  }

  navigateToTherapistCalendar(dateISO?: string): this {

    cylog(`nav → Therapist Calendar`);
    const dateParam = dateISO ? `&date=${dateISO}` : '';
    cy.visit(
      `/core/therapist-calendar?view=day${dateParam}`
    );
    cy.get('.rbc-time-content', { timeout: 30000 }).should('exist');
    return this;
  }

  navigateToRoomCalendar(dateISO?: string): this {

    cylog(`nav → Room Calendar`);
    const dateParam = dateISO ? `&date=${dateISO}` : '';
    cy.visit(`/core/room-calendar?view=day${dateParam}`);
    cy.get('.rbc-time-content', { timeout: 30000 }).should('exist');
    return this;
  }

  navigateToRecurringCashflow(): this {

    cylog(`nav → Recurring Cashflow`);
    cy.visit('/core/recurring-cashflow');
    cy.get(this.selectors.breadcrumb, { timeout: 10000 }).should(
      'contain.text',
      'Recurring Cashflows'
    );
    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 10000,
    }).should('exist');
    return this;
  }

  navigateToTransaction(): this {

    cylog(`nav → Transaction`);
    cy.visit('/core/transaction');
    cy.get(this.selectors.breadcrumb, { timeout: 10000 }).should(
      'contain.text',
      'Transactions'
    );
    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 10000,
    }).should('exist');
    return this;
  }

  navigateToFinancialOverview(): this {

    cylog(`nav → Financial Overview`);
    cy.visit('/core/financial-overview');
    cy.contains('Monthly Income Overview', { timeout: 10000 }).should(
      'be.visible'
    );
    return this;
  }

  navigateToUsers(): this {

    cylog(`nav → Users`);
    cy.visit('/users');
    cy.get(this.selectors.breadcrumb, { timeout: 10000 }).should(
      'contain.text',
      'User'
    );
    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 10000,
    }).should('exist');
    return this;
  }

  navigateToIssuesAndSuggestions(): this {

    cylog(`nav → Issues And Suggestions`);
    cy.visit('/core/issues-and-suggestions');
    cy.get(this.selectors.breadcrumb, { timeout: 10000 }).should(
      'contain.text',
      'Issues and Suggestions'
    );
    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 10000,
    }).should('exist');
    return this;
  }

  /**
   * Verify breadcrumb contains specific text
   * @param text - The text to verify in breadcrumb
   */
  verifyBreadcrumb(text: string): this {
    cy.get(this.selectors.breadcrumb, { timeout: 10000 }).should(
      'contain.text',
      text
    );
    return this;
  }

  logout(): this {
    cy.get(this.selectors.accountButton).click();
    cy.get(this.selectors.logOutButton).contains('Logout').click();
    cy.get(this.selectors.loginButton).contains('Login').click();
    return this;
  }

  /**
   * Wait for page to load (breadcrumb and grid)
   * @param expectedBreadcrumb - The expected breadcrumb text
   */
  waitForPageLoad(expectedBreadcrumb: string = 'Therapy'): this {
    cy.get(this.selectors.breadcrumb, { timeout: 10000 }).should(
      'contain.text',
      expectedBreadcrumb
    );
    cy.get('[data-testid="rpg-grid-component-wrapper"]', {
      timeout: 10000,
    }).should('exist');
    return this;
  }
}
