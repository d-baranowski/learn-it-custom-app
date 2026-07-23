/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';
import { ADAM } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';
import { uniquePrice } from '../../utils/unique';
import { GridComponent } from '../components-objects/grid.component';
import { DeleteDialog } from '../components-objects/delete-dialog.component';
import { FilterPanelComponent } from '../components-objects/filter-panel.component';

/** Non-admin credentials */
export const ADAM_USERNAME = ADAM.username;
export const ADAM_PASSWORD = ADAM.password;
export const ADAM_DISPLAY_NAME = ADAM.fullName;

export interface TherapistServiceData {
  therapistName: string;
  serviceName: string;
  price: string;
}

/**
 * A valid therapist-service link with a per-run unique price so its grid row
 * can be identified against the shared, accumulating DB. The (therapist,
 * service) pair is uniqueness-constrained, so tests self-heal it first (see
 * {@link deleteTherapistServiceLinkIfExists}).
 */
export function makeValidTherapistService(): TherapistServiceData {
  return {
    therapistName: ADAM.fullName,
    serviceName: 'Cognitive Behavioral Therapy',
    price: String(uniquePrice()),
  };
}

/** Navigate to the therapist service list page */
export function navigateToTherapistServicePage(): void {
  cylog('navigate to therapist service page');
  cy.visit('/core/therapist-service');
  cy.get('[data-testid="rpg-grid-component-wrapper"]', { timeout: 30000 }).should('be.visible');
}

/**
 * Filter the grid to a single (therapist, service) pair via the More Filters
 * autocompletes. Leaves the grid showing only matching links.
 */
export function filterTherapistService(therapistName: string, serviceName: string): void {
  cylog('filter therapist service');
  const panel = new FilterPanelComponent();
  panel.openFilterPanel();
  panel.selectAutocompleteFilter('filter-therapistId', therapistName);
  panel.selectAutocompleteFilter('filter-serviceId', serviceName);
  panel.closeFilterPanel();
  new GridComponent().waitForFetchSettled();
}

/**
 * Remove a (therapist, service) link if it already exists, so a subsequent
 * create won't 409 against the uniqueness constraint on the non-reset DB. Safe
 * to call when no such link exists (no-op).
 */
export function deleteTherapistServiceLinkIfExists(
  therapistName: string,
  serviceName: string
): void {
  cylog('delete therapist service link if exists');
  navigateToTherapistServicePage();
  filterTherapistService(therapistName, serviceName);

  const grid = new GridComponent();
  const deleteDialog = new DeleteDialog();
  cy.get('[data-testid="rpg-grid-component-wrapper"]').then(($wrapper) => {
    const hasDataRow = $wrapper.find('tbody tr[data-id]').length > 0;
    if (hasDataRow) {
      grid.selectRow(serviceName);
      grid.deleteSelected();
      deleteDialog.confirm();
      grid.waitForFetchSettled();
    }
  });
}

/**
 * Remove the current user's link to the given service if it exists. For the
 * non-admin grid (which shows only the logged-in therapist's own links, so a
 * service name uniquely identifies the row) this avoids a 409 when re-creating
 * the same link on the non-reset DB. No-op when absent.
 */
export function deleteOwnServiceLinkIfExists(serviceName: string): void {
  cylog('delete own service link if exists');
  navigateToTherapistServicePage();
  const grid = new GridComponent();
  const deleteDialog = new DeleteDialog();
  grid.waitForFetchSettled();
  cy.get('[data-testid="rpg-grid-component-wrapper"]').then(($wrapper) => {
    const hasLink =
      $wrapper.find(`tbody tr[data-id]:contains("${serviceName}")`).length > 0;
    if (hasLink) {
      grid.selectRow(serviceName);
      grid.deleteSelected();
      deleteDialog.confirm();
      grid.waitForFetchSettled();
    }
  });
}

/**
 * Scroll the virtualized grid to the bottom so all rows render.
 * The MUI table uses row virtualization — only ~20 rows render at a time.
 * Waits for at least one row to load before scrolling.
 */
export function scrollGridToBottom(): void {
  cylog('scroll grid to bottom');
  cy.get('[data-testid="rpg-grid-component-wrapper"]')
    .find('tbody tr', { timeout: 30000 })
    .should('have.length.greaterThan', 0);
  cy.get('[data-testid="rpg-grid-component-wrapper"]')
    .find('div')
    .filter('[class*="TableContainer"], [class*="tableContainer"]')
    .first()
    .scrollTo('bottom');
}

/** Login as admin and navigate to the therapist service page. */
export function setupAsAdmin(): void {
  cylog('setup as admin');
  setupFor('admin', () => navigateToTherapistServicePage());
}

/** Login as Adam (non-admin) and navigate to the therapist service page. */
export function setupAsAdam(): void {
  cylog('setup as adam');
  setupFor('adam', () => navigateToTherapistServicePage());
}
