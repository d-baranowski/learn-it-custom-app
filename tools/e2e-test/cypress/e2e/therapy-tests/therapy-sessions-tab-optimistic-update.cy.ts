/// <reference types="cypress" />

/**
 * THR_E2E_SES_OPTIMISTIC — Editing a session from the Sessions tab inside
 * the therapy form must update the inner sessions grid optimistically:
 * the row reflects the new value while the Save button is still in its
 * "saving…" state, before the API resolves.
 *
 * Verification strategy: rely on UI signals only.
 *   - The SaveButton renders `data-saving="true"` while the mutation is in
 *     flight (sessionForm.assertSaving).
 *   - The grid row updates from the optimistic-list cache patch, so it
 *     reflects the new value while Save is still saving.
 *   - The success toast (formSuccessToastMiddleware) fires only after the
 *     mutation resolves — that's the happy-path signal.
 *
 * No `cy.intercept` / `cy.wait('@alias')`. No SQL or DB seeding.
 */

import { loginAsAdmin } from './therapy-test-utils';
import { GridComponent } from '../components-objects/grid.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { SessionFormComponent } from '../components-objects/session-form.component';
import { ToastComponent } from '../components-objects/toast.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe('Therapy → Sessions Tab → Optimistic Update', () => {
  beforeEach(() => {
    loginAsAdmin();
    new NavigationHelper().navigateToTherapy();
  });

  it('THPY_SES_E2E_03: should update the grid row optimistically while save is in flight', () => {
    const outerGrid = new GridComponent();
    const innerGrid = new GridComponent('[data-form-entity="therapy"]');
    const therapyForm = new TherapyFormComponent();
    const sessionForm = new SessionFormComponent();
    const toast = new ToastComponent();

    // Open the same bootstrap therapy used by THR_E2E_SES_EDIT — it has
    // weekly sessions so the inner grid is reliably populated. Filter first —
    // the therapy grid accumulates rows without a DB reset.
    outerGrid.search('filter-displayName', 'Cognitive Behavioral Therapy - Individual');
    outerGrid.waitForFetchSettled();
    outerGrid.openRow('Cognitive Behavioral Therapy - Individual');
    therapyForm.waitForFormLoad();
    therapyForm.goToSessionsTab();

    // Pick a fresh price each run so the assertion can't pass against
    // pre-existing cached state.
    const newPrice = `${300 + Math.floor(Math.random() * 700)}`;

    innerGrid.getFirstRowDataId().then((rowId) => {
      innerGrid.openFirstRow();
      sessionForm.waitForOpen();
      sessionForm.shouldBeLoaded();

      sessionForm.fillPrice(newPrice);
      sessionForm.clickSave();

      // ── KEY ASSERTION ────────────────────────────────────────────────────
      // While the Save button is still in its visible saving state, the
      // inner grid row already reflects the new price. That combination
      // can only hold if the patch landed before the API responded —
      // i.e. optimistic.
      sessionForm.assertSaving();
      innerGrid.assertRowContains(rowId, newPrice);

      // ── HAPPY-PATH COMPLETION ────────────────────────────────────────────
      // Success toast fires only after the API resolves; its presence is
      // proof that the save actually succeeded server-side. The window
      // manager closes the dialog on success, so by the time the toast
      // appears the session form button is already gone — we don't try
      // to read it back to idle.
      toast.expectSuccess();
      sessionForm.waitForClose();

      // After close, the row still shows the new price (the existing
      // `rpg:window:saved` listener refetches in the background; the
      // optimistic patch we wrote should match).
      innerGrid.assertRowContains(rowId, newPrice);
    });

    // Cleanup: close the outer therapy form via the dialog X (Sessions tab
    // hides the Save/Cancel row).
    therapyForm.closeWindow();
  });
});
