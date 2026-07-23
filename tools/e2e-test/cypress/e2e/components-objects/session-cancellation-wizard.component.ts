/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

import { ToastComponent } from './toast.component';

export type CancellationActor = 'Customer' | 'Therapist';

/**
 * Component Object for the Session Cancel / Undo Cancellation wizard.
 *
 * The wizard opens from the session grid's row context menu and is also
 * responsible for the read-only cancellation fields rendered inside the
 * session form once a session has been cancelled.
 */
export class SessionCancellationWizardComponent {
  readonly selectors = {
    gridWrapper: '[data-testid="rpg-grid-component-wrapper"]',
    cancelMenuItem: '[data-testid="session-cancel"]',
    undoMenuItem: '[data-testid="session-undo-cancellation"]',
    reasonInput: '[data-testid="session-cancellation-reason"]',
    actorSelect: '[data-testid="session-cancellation-actor"]',
    confirmButton: '[data-testid="session-cancellation-confirm"]',
    cancelledAtInput: '[data-testid="cancelled-at"]',
    cancelledByInput: '[data-testid="session-cancelled-by"]',
    cancellationReasonInput: '[data-testid="cancellation-reason"]',
  };

  private readonly titles = {
    cancel: 'Cancel Session',
    undo: 'Undo Cancellation',
  };

  private readonly toast = new ToastComponent();

  private openContextMenuForPrice(price: string): void {
    const priceRegex = new RegExp(`^${price}$`);
    const rowCell = () =>
      cy
        .get(this.selectors.gridWrapper)
        .contains('tbody tr[data-id] td', priceRegex, { timeout: 30000 });
    rowCell().scrollIntoView();
    rowCell().rightclick({ force: true });
  }

  private openWizard(
    price: string,
    menuItemSelector: string,
    title: string
  ): void {
    cy.get('body').then(($body) => {
      if ($body.find(`h2:contains("${title}"):visible`).length > 0) return;
      this.openContextMenuForPrice(price);
      cy.get(menuItemSelector, { timeout: 10000 }).click();
    });
    cy.contains('h2', title, { timeout: 10000 }).should('be.visible');
  }

  /** Open the "Cancel Session" wizard for the row matching the given price. No-op if already open. */
  openForPrice(price: string): this {
    cylog(`cancellation wizard: open cancel for price "${price}"`);
    this.openWizard(price, this.selectors.cancelMenuItem, this.titles.cancel);
    return this;
  }

  /** Open the "Undo Cancellation" wizard for the row matching the given price. No-op if already open. */
  openUndoForPrice(price: string): this {
    cylog(`cancellation wizard: open undo for price "${price}"`);
    this.openWizard(price, this.selectors.undoMenuItem, this.titles.undo);
    return this;
  }

  fillReason(reason: string): this {
    cy.get(this.selectors.reasonInput).should('be.visible').type(reason);
    // The testid sits on the MUI wrapper — the typed value lives on the
    // inner textarea/input.
    cy.get(this.selectors.reasonInput)
      .find('textarea, input')
      .first()
      .should('have.value', reason);
    return this;
  }

  selectActor(actor: CancellationActor): this {
    cy.get(this.selectors.actorSelect).should('be.visible').click();
    cy.get('[role="option"]').contains(actor).click();
    cy.get('[role="option"]').should('not.exist');
    return this;
  }

  /** Confirm the wizard and wait for the success toast + wizard teardown. */
  confirm(successToast: string): this {
    cy.get(this.selectors.confirmButton)
      .should('be.visible')
      .and('not.be.disabled')
      .click();
    this.toast.expectSuccess(successToast);
    cy.get(this.selectors.confirmButton).should('not.exist');
    return this;
  }

  /** Full cancel flow: open wizard for the row, fill reason, pick actor, confirm. */
  cancelSessionForPrice(
    price: string,
    reason: string,
    actor: CancellationActor = 'Customer'
  ): this {
    this.openForPrice(price);
    this.fillReason(reason);
    this.selectActor(actor);
    return this.confirm('Session cancelled');
  }

  /** Full undo flow: open undo wizard for the row and confirm. */
  undoCancellationForPrice(price: string): this {
    this.openUndoForPrice(price);
    return this.confirm('Session cancellation undone');
  }

  /** Assert the read-only cancellation fields in the session form (edit mode). */
  expectReadOnlyInfo(actor: CancellationActor, reason: string): this {
    cy.get(this.selectors.cancelledAtInput)
      .invoke('val')
      .should('not.be.empty');
    cy.get(this.selectors.cancelledByInput)
      .should('have.value', actor)
      .and('be.disabled');
    cy.get(this.selectors.cancellationReasonInput)
      .should('have.value', reason)
      .and('be.disabled');
    return this;
  }

  /** Assert the cancellation section is absent from the session form. */
  expectNoCancellationInfo(): this {
    cy.get(this.selectors.cancelledAtInput).should('not.exist');
    cy.get(this.selectors.cancelledByInput).should('not.exist');
    cy.get(this.selectors.cancellationReasonInput).should('not.exist');
    return this;
  }
}
