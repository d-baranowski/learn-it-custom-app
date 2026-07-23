/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

import { AutocompleteComponent } from './autocomplete.component';

export class WorkingHoursFormComponent {
  private readonly autocomplete = new AutocompleteComponent();
  private readonly axisStartMinutes = 6 * 60;
  private readonly axisTotalMinutes = 16 * 60;
  private readonly popoverRoot = '.MuiPopover-root';

  readonly selectors = {
    editor: '[data-testid="working-hours-editor"]',
    therapistTrigger: '[data-testid="working-hours-therapist"]',
    saveButton: '[data-testid="working-hours-save"]',
    cancelButton: '[data-testid="working-hours-cancel"]',
    clearAllButton: '[data-testid="working-hours-clear-all"]',
    templateButton: '[data-testid="working-hours-apply-template-btn"]',
    copyFromButton: '[data-testid="working-hours-copy-from-therapist-btn"]',
    selectedToolbar: '[data-testid="working-hours-selected-toolbar"]',
    preciseFrom: 'input[data-testid="working-hours-precise-from"]',
    preciseTill: 'input[data-testid="working-hours-precise-till"]',
    preciseSave: '[data-testid="working-hours-precise-save"]',
    copyFromInput: 'input[data-testid="working-hours-copy-from-therapist"]',
    copyFromSubmit: '[data-testid="working-hours-copy-from-submit"]',
    confirmSubmit: '[data-testid="working-hours-confirm-submit"]',
    totalBar: '[data-testid="working-hours-total-bar"]',
    totalHours: '[data-testid="working-hours-total-hours"]',
    totalDays: '[data-testid="working-hours-total-days"]',
    undoDelete: '[data-testid="working-hours-undo-delete"]',
    option: '[role="option"]',
  };

  waitForEditorLoad(): this {
    cy.get(this.selectors.editor, { timeout: 30000 }).should('be.visible');
    cy.get(this.selectors.therapistTrigger, { timeout: 30000 }).should('be.visible');
    return this;
  }

  waitForIdle(): this {
    cy.get('body').then(($body) => {
      if ($body.find('[role="progressbar"]').length > 0) {
        cy.get('[role="progressbar"]', { timeout: 30000 }).should('not.exist');
      }
    });
    return this;
  }

  selectTherapist(therapistName: string): this {
    cylog(`WorkingHours: select therapist ${therapistName}`);
    this.waitForEditorLoad();
    // The therapist selector is a popover picker (TherapistPicker), not an
    // autocomplete input: open the trigger, then pick the matching row.
    this.openTherapistPicker();
    cy.get(`${this.popoverRoot} .MuiListItemButton-root`)
      .contains(therapistName)
      .click();
    cy.get(this.selectors.therapistTrigger).should('contain.text', therapistName);

    // Wait until the editor has actually loaded THIS therapist's week before
    // proceeding. Selecting is deferred (startTransition) and fetches the week
    // async; acting sooner runs a follow-up clear/draw/template against the
    // previous therapist's draft, which the baseline sync then clobbers when
    // the new week lands. `data-loaded-therapist` names the therapist whose
    // week is currently loaded — deterministic, and immune to the transient
    // loading spinner (which a cached fetch may skip entirely).
    cy.get(this.selectors.editor, { timeout: 30000 })
      .should('have.attr', 'data-loaded-therapist')
      .and('include', therapistName);
    this.waitForIdle();
    cy.get(this.selectors.totalBar, { timeout: 30000 }).should('exist');
    return this;
  }

  /**
   * Open the therapist popover picker and wait until its rows are on screen.
   *
   * autoSelectSelf pre-selects the current user and loads their week the moment
   * the editor mounts; that settling re-render both swallows an early trigger
   * click (popover never opens) and can dismiss a popover that just opened
   * (rows never render). So retry against the end state that matters — visible
   * therapist rows — re-opening only when the popover is actually closed, so a
   * retry never toggles an open-but-still-populating popover shut.
   */
  private openTherapistPicker(maxAttempts = 8): void {
    const rows = `${this.popoverRoot} .MuiListItemButton-root:visible`;
    const attempt = (n: number): void => {
      cy.get('body').then(($body) => {
        if ($body.find(rows).length > 0) return;
        if (n + 1 >= maxAttempts) {
          throw new Error(
            `WorkingHours.openTherapistPicker: therapist rows never appeared after ${maxAttempts} attempts`
          );
        }
        if ($body.find(`${this.popoverRoot}:visible`).length === 0) {
          cy.get(this.selectors.therapistTrigger).click();
        }
        // eslint-disable-next-line cypress/no-unnecessary-waiting -- pacing the open/populate/settle race
        cy.wait(300);
        attempt(n + 1);
      });
    };
    attempt(0);
  }

  drawBlock(dayOfWeek: number, fromTime: string, tillTime: string): this {
    const trackSelector = this.getTrackSelector(dayOfWeek);
    const expectedLabel = `${fromTime} - ${tillTime}`;
    cylog(`WorkingHours: draw block ${dayOfWeek} ${fromTime}-${tillTime}`);

    cy.get(trackSelector).should('be.visible');
    cy.get('body').then(($body) => {
      const blockIndex = $body.find(`[data-testid^="working-hours-block-${dayOfWeek}-"]`).length;
      const blockSelector = this.getBlockSelector(dayOfWeek, blockIndex);

      const draw = (): void => {
        cy.get(trackSelector)
          .should('be.visible')
          .then(($track) => {
            const track = $track[0];
            const rect = track.getBoundingClientRect();
            const y = rect.top + rect.height / 2;
            const fromX = this.clientXForTime(rect, fromTime);
            const tillX = this.clientXForTime(rect, tillTime);

            this.dispatchPointerEvent(track, 'pointerdown', {
              button: 0,
              buttons: 1,
              clientX: fromX,
              clientY: y,
              pointerId: 1,
            });
            // Paces synthetic pointer events (event-loop timing, not app
            // state): the editor attaches its window pointermove/pointerup
            // listeners in a React effect after pointerdown commits, and
            // nothing renders until the first move, so there is no UI state
            // to gate on here.
            // eslint-disable-next-line cypress/no-unnecessary-waiting -- synthetic pointer-event pacing; no UI state to await
            cy.wait(100);
            this.dispatchWindowPointerEvent('pointermove', {
              button: 0,
              buttons: 1,
              clientX: tillX,
              clientY: y,
              pointerId: 1,
            });
            cy.get(this.getGhostSelector(dayOfWeek)).should('be.visible');
            // The editor commits the block on pointerup via a handler that only
            // carries the full-width ghost once its passive re-attach effect has
            // run — which happens after paint, i.e. after the ghost is already
            // visible here. Releasing immediately runs a stale handler that sees
            // a zero-width ghost and commits nothing, so pace the release.
            // eslint-disable-next-line cypress/no-unnecessary-waiting -- synthetic pointer-event pacing; passive-effect re-attach lands after paint
            cy.wait(100);
            this.dispatchWindowPointerEvent('pointerup', {
              button: 0,
              buttons: 0,
              clientX: tillX,
              clientY: y,
              pointerId: 1,
            });
          });
      };

      draw();
      cy.get(blockSelector).should('exist');
      this.selectBlock(dayOfWeek, blockIndex);
      this.openEditTimes();
      this.fillPreciseTimes(fromTime, tillTime);
      this.applyPreciseTimes();
      cy.get(blockSelector).should('contain.text', expectedLabel);
    });

    return this;
  }

  selectBlock(dayOfWeek: number, index: number): this {
    cy.get(this.getBlockSelector(dayOfWeek, index)).should('be.visible');

    const select = (attempt: number): void => {
      cy.get(this.getBlockSelector(dayOfWeek, index)).then(($block) => {
        const block = $block[0];
        const rect = block.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        this.dispatchPointerEvent(block, 'pointerdown', {
          button: 0,
          buttons: 1,
          clientX: x,
          clientY: y,
          pointerId: 1,
        });
        // Pointer-event pacing before release — see drawBlock.
        // eslint-disable-next-line cypress/no-unnecessary-waiting -- synthetic pointer-event pacing; no UI state to await
        cy.wait(100);
        this.dispatchWindowPointerEvent('pointerup', {
          button: 0,
          buttons: 0,
          clientX: x,
          clientY: y,
          pointerId: 1,
        });
      });

      cy.get('body').then(($body) => {
        if ($body.find(this.selectors.selectedToolbar).length > 0) {
          return;
        }
        if (attempt >= 4) {
          throw new Error(
            `selectBlock: toolbar did not appear for block ${dayOfWeek}-${index} after ${attempt + 1} attempts`
          );
        }
        // Bounded retry backoff — a missed pointerdown leaves no UI trace
        // to gate on, so re-press after a short pause.
        // eslint-disable-next-line cypress/no-unnecessary-waiting -- pre-retry backoff; nothing rendered yet to gate on
        cy.wait(100);
        select(attempt + 1);
      });
    };

    select(0);
    cy.get(this.selectors.selectedToolbar).should('be.visible');
    return this;
  }

  resizeBlock(
    dayOfWeek: number,
    index: number,
    edge: 'left' | 'right',
    nextTime: string
  ): this {
    const handleSelector =
      edge === 'left'
        ? `[data-testid="working-hours-resize-left-${dayOfWeek}-${index}"]`
        : `[data-testid="working-hours-resize-right-${dayOfWeek}-${index}"]`;

    cy.get(handleSelector).should('be.visible');
    cy.get(this.getTrackSelector(dayOfWeek)).then(($track) => {
      const trackRect = $track[0].getBoundingClientRect();
      const targetX = this.clientXForTime(trackRect, nextTime);

      cy.get(handleSelector).then(($handle) => {
        const handle = $handle[0];
        const handleRect = handle.getBoundingClientRect();
        const handleX = handleRect.left + handleRect.width / 2;
        const handleY = handleRect.top + handleRect.height / 2;

        this.dispatchPointerEvent(handle, 'pointerdown', {
          button: 0,
          buttons: 1,
          clientX: handleX,
          clientY: handleY,
          pointerId: 1,
        });
        // Pointer-event pacing before the first move — see drawBlock.
        // eslint-disable-next-line cypress/no-unnecessary-waiting -- synthetic pointer-event pacing; no UI state to await
        cy.wait(100);
        this.dispatchWindowPointerEvent('pointermove', {
          button: 0,
          buttons: 1,
          clientX: targetX,
          clientY: handleY,
          pointerId: 1,
        });
        // Resizing updates the block label live — gate the release on it.
        cy.get(this.getBlockSelector(dayOfWeek, index)).should('contain.text', nextTime);
        this.dispatchWindowPointerEvent('pointerup', {
          button: 0,
          buttons: 0,
          clientX: targetX,
          clientY: handleY,
          pointerId: 1,
        });
      });
    });
    cy.get(this.getBlockSelector(dayOfWeek, index)).should('contain.text', nextTime);
    return this;
  }

  openEditTimes(): this {
    cy.get('[data-testid="working-hours-toolbar-edit"]').then(($button) => {
      ($button[0] as HTMLButtonElement).click();
    });
    cy.get(this.selectors.preciseFrom).should('exist');
    return this;
  }

  fillPreciseTimes(fromTime: string, tillTime: string): this {
    cy.get(this.selectors.preciseFrom).clear({ force: true });
    cy.get(this.selectors.preciseFrom).type(fromTime, { force: true });
    cy.get(this.selectors.preciseTill).clear({ force: true });
    cy.get(this.selectors.preciseTill).type(tillTime, { force: true });
    return this;
  }

  applyPreciseTimes(): this {
    cy.get(this.selectors.preciseSave).then(($button) => {
      ($button[0] as HTMLButtonElement).click();
    });
    return this;
  }

  deleteSelectedBlock(): this {
    cy.get('[data-testid="working-hours-toolbar-delete"]')
      .should('be.visible')
      .then(($button) => {
        ($button[0] as HTMLButtonElement).click();
      });
    cy.get(this.selectors.selectedToolbar).should('not.exist');
    return this;
  }

  undoDelete(): this {
    cy.get(this.selectors.undoDelete).should('be.visible').click();
    return this;
  }

  copyDayToTargets(sourceDay: number, targetDays: number[]): this {
    cy.get(`[data-testid="working-hours-copy-day-${sourceDay}"]`).click();
    targetDays.forEach((targetDay) => {
      cy.get(`[data-testid="working-hours-copy-day-target-${targetDay}"]`).click({ force: true });
    });
    cy.get('[data-testid="working-hours-copy-day-submit"]').click();
    return this;
  }

  applyTemplate(templateId: string): this {
    cy.get(this.selectors.templateButton).click();
    cy.get(`[data-testid="working-hours-template-${templateId}"]`).click();
    return this;
  }

  copyFromAnotherTherapist(therapistName: string): this {
    cy.get(this.selectors.copyFromButton).click();
    this.openAutocomplete(this.selectors.copyFromInput);
    cy.get(this.selectors.option, { timeout: 25000 })
      .should('be.visible')
      .contains(therapistName)
      .then(($option) => {
        ($option[0] as HTMLElement).click();
      });
    cy.get(this.selectors.copyFromSubmit).click();
    this.waitForIdle();
    return this;
  }

  clearAllAndConfirm(): this {
    cy.get(this.selectors.clearAllButton).should('be.visible').click();
    // Confirm only once the dialog has fully opened — a click landing mid-open
    // animation is swallowed, leaving the draft uncleared. Then wait for the
    // dialog to fully close: its modal backdrop makes the editor inert, so a
    // following drag would be dropped while it is still animating out.
    cy.get(this.selectors.confirmSubmit).should('be.visible').click();
    cy.get(this.selectors.confirmSubmit).should('not.exist');
    cy.get(this.selectors.totalHours).should('have.text', '0h');
    cy.get(this.selectors.totalDays).should('have.text', '0');
    return this;
  }

  clickSave(): this {
    cylog('WorkingHours: clickSave');
    cy.get(this.selectors.saveButton).click();
    return this;
  }

  saveWeek(): this {
    cylog('WorkingHours: saveWeek');
    this.shouldBeSubmitEnabled();
    this.clickSave();
    // Gate on durable button state, not the success toast (which auto-dismisses
    // before it can be reliably observed). The button reads "Saving..." while the
    // request is in flight; once it settles a successful save leaves the form
    // pristine so the button stays disabled, whereas a failed save re-enables it.
    // Disabled + no longer "Saving..." therefore means the save succeeded.
    // 30s: replace-week saves regularly exceed the 10s default on loaded CI shards.
    cy.get(this.selectors.saveButton, { timeout: 30000 })
      .should('not.contain.text', 'Saving')
      .and('be.disabled');
    return this;
  }

  createWeekBlock(
    therapistName: string,
    dayOfWeek: number,
    fromTime: string,
    tillTime: string
  ): this {
    cylog(`WorkingHours: createWeekBlock ${therapistName} ${dayOfWeek} ${fromTime}-${tillTime}`);
    this.waitForEditorLoad();
    this.selectTherapist(therapistName);
    this.clearAllAndConfirm();
    this.drawBlock(dayOfWeek, fromTime, tillTime);
    return this.saveWeek();
  }

  clickCancel(): this {
    cy.get(this.selectors.cancelButton).click();
    return this;
  }

  shouldBeSubmitDisabled(): this {
    cy.get(this.selectors.saveButton).should('be.disabled');
    return this;
  }

  shouldBeSubmitEnabled(): this {
    cy.get(this.selectors.saveButton).should('not.be.disabled');
    return this;
  }

  shouldHaveBlock(dayOfWeek: number, index: number, labelPart: string): this {
    cy.get(this.getBlockSelector(dayOfWeek, index)).should('contain.text', labelPart);
    return this;
  }

  shouldNotHaveBlock(dayOfWeek: number, index: number): this {
    cy.get(this.getBlockSelector(dayOfWeek, index), { timeout: 10000 }).should('not.exist');
    return this;
  }

  shouldShowText(text: string): this {
    cy.contains(text).should('exist');
    return this;
  }

  shouldNotHaveSaveButton(): this {
    cy.get(this.selectors.saveButton).should('not.exist');
    return this;
  }

  shouldShowFieldLabel(label: string): this {
    cy.get(this.selectors.therapistTrigger).contains(label).should('be.visible');
    return this;
  }

  shouldHavePreciseTimes(fromTime: string, tillTime: string): this {
    cy.get(this.selectors.preciseFrom).should('have.value', fromTime);
    cy.get(this.selectors.preciseTill).should('have.value', tillTime);
    return this;
  }

  shouldTotalHours(text: string): this {
    cy.get(this.selectors.totalHours).should('have.text', text);
    return this;
  }

  shouldTotalDays(text: string): this {
    cy.get(this.selectors.totalDays).should('have.text', text);
    return this;
  }



  private dispatchPointerEvent(target: Element, type: string, init: PointerEventInit): void {
    cy.window().then((win) => {
      const event = new win.PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerType: 'mouse',
        isPrimary: true,
        ...init,
      });
      target.dispatchEvent(event);
    });
  }

  private dispatchWindowPointerEvent(type: string, init: PointerEventInit): void {
    cy.window().then((win) => {
      const event = new win.PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerType: 'mouse',
        isPrimary: true,
        ...init,
      });
      win.dispatchEvent(event);
    });
  }

  private openAutocomplete(inputSelector: string): void {
    this.autocomplete.open(inputSelector);
  }

  private getTrackSelector(dayOfWeek: number): string {
    return `[data-testid="working-hours-track-${dayOfWeek}"]`;
  }

  private getBlockSelector(dayOfWeek: number, index: number): string {
    return `[data-testid="working-hours-block-${dayOfWeek}-${index}"]`;
  }

  private getGhostSelector(dayOfWeek: number): string {
    return `[data-testid="working-hours-ghost-${dayOfWeek}"]`;
  }

  private clientXForTime(rect: DOMRect, time: string): number {
    const minutes = this.timeToMinutes(time);
    const ratio = (minutes - this.axisStartMinutes) / this.axisTotalMinutes;
    return rect.left + rect.width * ratio;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((value) => Number(value));
    return hours * 60 + minutes;
  }
}
