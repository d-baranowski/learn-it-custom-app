//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Get element by data-testid attribute
       * @param testId - The value of the data-testid attribute
       * @param options - standard cy.get options (e.g. timeout)
       * @example cy.getByTestId('login-btn', { timeout: 30000 })
       */
      getByTestId(
        testId: string,
        options?: Partial<Cypress.Timeoutable>
      ): Chainable<JQuery<HTMLElement>>;

      /**
       * Find element by data-testid attribute within a parent element
       * @param testId - The value of the data-testid attribute
       * @example cy.get('.form').findByTestId('submit-btn')
       */
      findByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      /**
       * Logs in using provided credentials (defaults: admin / Password1!)
       * and waits until the side navigation is visible.
       * @param username - account username
       * @param password - account password
       */
      login(username?: string, password?: string): Chainable<void>;

      /**
       * Resets the database to bootstrap state via the bootstrap API
       * @example cy.resetDatabase()
       */
      resetDatabase(): Chainable<void>;
    }
  }
}
