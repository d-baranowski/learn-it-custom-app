/// <reference types="cypress" />

/**
 * Component object for the global react-hot-toast surface.
 *
 * react-hot-toast renders each toast as a div with role="status". Success
 * and error toasts are visually distinguished by an icon and background
 * but share the role; we match by both role and (optionally) text. Per
 * the project's "assert UI, not network" rule, this is the canonical way
 * to confirm an API call succeeded — the success toast fires only after
 * the mutation resolves.
 */
export class ToastComponent {
  selectors = {
    container: '[role="status"]',
  };

  /**
   * Wait for any toast to appear with the given (substring) message.
   *
   * Uses `cy.contains(selector, text)` rather than `cy.get(selector).should('contain.text', text)`
   * because react-hot-toast renders an outer empty `[role="status"]`
   * wrapper that the latter would lock onto and never see updated.
   * `cy.contains` retries until SOME matching element contains the text.
   */
  expectMessage(message: string, timeout: number = 10000): this {
    cy.contains(this.selectors.container, message, { timeout }).should(
      'be.visible'
    );
    return this;
  }

  /**
   * Wait for a success toast (defaults to "Saved", which the form
   * success-toast middleware emits on a successful save).
   */
  expectSuccess(message: string = 'Saved', timeout: number = 10000): this {
    return this.expectMessage(message, timeout);
  }

  /**
   * Wait for an error toast with the given (substring) text.
   */
  expectError(message: string, timeout: number = 10000): this {
    return this.expectMessage(message, timeout);
  }

  /**
   * Best-effort dismiss of any visible toasts. Useful between specs to
   * keep state clean without coupling to react-hot-toast internals.
   */
  dismissAll(): this {
    cy.get('body').then(($body) => {
      const toasts = $body.find(this.selectors.container);
      if (toasts.length > 0) {
        cy.wrap(toasts).each(($el) => cy.wrap($el).click({ force: true }));
      }
    });
    return this;
  }
}
