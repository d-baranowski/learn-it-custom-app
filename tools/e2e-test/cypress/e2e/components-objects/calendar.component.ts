/// <reference types="cypress" />

import { closeWindowIfOpen } from './form.component';
import { cylog } from '../../utils/cylog';

/**
 * Component Object for Calendar views (Therapist Calendar & Room Calendar)
 *
 * Uses react-big-calendar CSS classes and text-based button selectors.
 * TODO: add data-testid attributes to calendar controls in UI
 */
export class CalendarComponent {
  readonly selectors = {
    // TODO: add data-testid to UI for calendar controls
    timeContent: '.rbc-time-content',
    event: '.rbc-event',
    eventContent: '.rbc-event-content',
    header: '.rbc-header',
    // TODO: add data-testid to UI for filter button
    filterButton: 'button[title="Filter"]',
    todayButton: '[data-testid="calendar-today-btn"]',
    prevButton: '[data-testid="calendar-prev-btn"]',
    nextButton: '[data-testid="calendar-next-btn"]',
    toolbar: '.rbc-toolbar',
    toolbarLabel: '.rbc-toolbar-label',
    priceInput: 'input[data-testid="price"]',
    roomInput: 'input[data-testid="room-id"]',
    therapistInput: 'input[data-testid="therapist-id"]',
    therapistFilterInput: 'input[data-testid="therapist-ids"]',
    therapistFilterTrigger: '[data-testid="therapist-filter-trigger"]',
    roomFilterInput: 'input[data-testid="room-ids"]',
    roomResourceHeader: '.rbc-row.rbc-row-resource .rbc-header',
    roomFilterOption: 'ul[role="listbox"] li[role="option"]',
    roomFilterListbox: 'ul[role="listbox"]',
  };

  /**
   * Dismiss the Next.js dev-mode error overlay if it is visible.
   * In Next.js 16+ the overlay is rendered inside custom elements
   * (nextjs-portal, nextjs-dev-overlay, etc.) that may block interactions.
   */
  dismissNextjsOverlay(): this {
    cy.window({ log: false }).then((win) => {
      const doc = win.document;
      // Remove all nextjs-* custom elements that form the error overlay
      const selectors = [
        'nextjs-portal',
        'nextjs-dev-overlay',
        'next-dev-overlay',
        '[data-nextjs-dialog-overlay]',
        '[data-nextjs-dialog]',
        '[data-nextjs-toast]',
      ];
      selectors.forEach((sel) => {
        doc.querySelectorAll(sel).forEach((el) => el.remove());
      });
      // Also try to remove any fixed-position overlays with high z-index
      // that might be the error overlay container
      doc.querySelectorAll('body > div').forEach((el) => {
        const style = win.getComputedStyle(el);
        if (
          style.position === 'fixed' &&
          style.zIndex &&
          parseInt(style.zIndex) > 9000 &&
          !el.querySelector('.rbc-calendar')
        ) {
          el.remove();
        }
      });
    });
    return this;
  }

  /** Wait for the calendar grid to render. */
  waitForCalendar(timeout: number = 30000): this {
    this.dismissNextjsOverlay();
    cy.get(this.selectors.timeContent, { timeout }).should('exist');
    cy.get('.rbc-toolbar', { timeout: 10000 }).should('exist');
    // Wait for the async event fetch to settle: the calendar container swaps
    // its class from `rpg-calendar-loading` to `rpg-calendar` when the fetch
    // resolves. Acting while loading re-renders the toolbar and detaches its
    // buttons mid-click (RC_E2E_05 flaked at exactly this — Today button).
    cy.get('.rpg-calendar-loading', { timeout }).should('not.exist');
    return this;
  }

  /** Wait for at least one event to appear on the calendar. */
  waitForEvents(timeout: number = 30000): this {
    cy.get(this.selectors.event, { timeout }).should(
      'have.length.greaterThan',
      0
    );
    return this;
  }

  clickToday(): this {
    // The Today button is disabled when the view already shows today. Clicking
    // a disabled button errors in Cypress, so click only when enabled — if it's
    // disabled we're already on today, which is the intended end state.
    cy.get(this.selectors.todayButton).then(($btn) => {
      if ($btn.prop('disabled')) return;
      // Re-query at click time instead of wrapping the captured node: the
      // calendar's event fetch re-renders the toolbar, and a wrapped subject
      // would detach mid-click. A fresh query lets Cypress re-query on detach.
      cy.get(this.selectors.todayButton).click();
    });
    return this;
  }

  clickNext(): this {
    // Assert actionable before clicking: after a `switchViewViaUrl` reload the
    // toolbar renders (SSR) before React attaches its handlers, so an immediate
    // click is a no-op and the date never advances (RC_E2E_02). The visibility
    // gate adds a retryable settle so the click lands on a hydrated button.
    cy.get(this.selectors.nextButton).should('be.visible').and('not.be.disabled').click();
    return this;
  }

  clickPrevious(): this {
    cy.get(this.selectors.prevButton).should('be.visible').and('not.be.disabled').click();
    return this;
  }

  clickRefresh(): this {
    cy.get('.rbc-refresh-btn', { timeout: 10000 }).click();
    return this;
  }

  private selectViewFromMenu(viewName: string): this {
    cy.get('.rbc-view-dropdown-btn', { timeout: 10000 }).should('be.visible').click();
    cy.get('.MuiMenu-paper', { timeout: 10000 }).should('be.visible');
    cy.get('.MuiMenuItem-root').contains(viewName).click();
    cy.get('.MuiMenu-paper').should('not.exist');
    return this;
  }

  clickDayView(): this {
    this.selectViewFromMenu('Day');
    return this;
  }

  clickWeekView(): this {
    this.selectViewFromMenu('Week');
    return this;
  }

  clickMonthView(): this {
    this.selectViewFromMenu('Month');
    cy.url().should('include', 'view=month');
    return this;
  }

  clickCompactView(): this {
    this.selectViewFromMenu('Compact');
    cy.url().should('include', 'view=compact');
    return this;
  }

  /** Wait for a view button to become active after clicking it. */
  waitForActiveView(text: string): this {
    cy.get('.rbc-view-dropdown-btn', { timeout: 15000 }).should(
      'contain.text',
      text
    );
    return this;
  }

  /**
   * Switch the calendar view via URL parameter. Reliable in headless mode
   * where toolbar button clicks may not trigger the React handler.
   */
  switchViewViaUrl(view: 'day' | 'week' | 'month' | 'compact'): this {
    cy.url().then((url) => {
      const u = new URL(url);
      u.searchParams.set('view', view);
      cy.visit(u.toString());
    });
    return this;
  }

  /** Verify a column header exists (therapist name or room code). */
  shouldHaveColumnHeader(text: string): this {
    cy.get(this.selectors.header)
      .contains(text, { timeout: 15000 })
      .should('exist');
    return this;
  }

  /** Verify a column header does NOT exist. */
  shouldNotHaveColumnHeader(text: string): this {
    cy.get(this.selectors.header).should('not.contain.text', text);
    return this;
  }

  /** Get the calendar toolbar text (date header). */
  getToolbarLabel(): Cypress.Chainable<string> {
    return cy.get(this.selectors.toolbarLabel).invoke('text');
  }

  /** Verify the toolbar label contains specific text (e.g. date). */
  shouldHaveToolbarLabel(text: string): this {
    cy.get(this.selectors.toolbarLabel).should('contain.text', text);
    return this;
  }

  /** Click a calendar event that contains the given text. */
  clickEvent(text: string): this {
    cy.get(this.selectors.event, { timeout: 30000 })
      .contains(text)
      .click({ force: true });
    return this;
  }

  /** Double-click the first visible calendar event. */
  dblClickFirstEvent(): this {
    cy.get(this.selectors.event, { timeout: 30000 })
      .first()
      .dblclick({ force: true });
    return this;
  }

  /**
   * Double-click the first calendar event and open the Edit Session panel,
   * retrying the dblclick with a decreasing per-attempt wait if the panel
   * didn't appear. Under heavy CI load (16-shard parallel cypress + docker
   * stacks sharing one agent) the calendar's dblclick handler occasionally
   * drops the event when it fires during a layout reflow — same shape of
   * flake the autocomplete listbox helper handles.
   *
   * Asserts on `[data-testid="session-form"]` rather than the literal text
   * "Edit Session" — the title is constructed in `use-dialog.ts` as
   * `Edit ${subject}` (untranslated), so future i18n on that hook would
   * silently break a text-based assertion.
   *
   * Waits on the form appearing (a bounded DOM poll that returns the instant
   * it shows), never a fixed sleep, and re-dblclicks if it didn't open within
   * the window.
   */
  dblClickFirstEventToOpenEditPanel(): this {
    const form = '[data-testid="session-form"]';
    const MAX_ATTEMPTS = 3;
    const OUTCOME_WINDOW_MS = 10000;
    const POLL_MS = 250;

    const dblClickFirstEvent = () => {
      cy.get(this.selectors.event, { timeout: 30000 })
        .first()
        .dblclick({ force: true });
    };

    const waitForFormOrRetry = (attempt: number, remainingMs: number) => {
      cy.get('body').then(($body) => {
        if ($body.find(`${form}:visible`).length > 0) {
          return;
        }
        if (remainingMs <= 0) {
          if (attempt >= MAX_ATTEMPTS) {
            throw new Error(
              `calendar: edit session form did not open after ${attempt} dblclick attempts`
            );
          }
          cylog(`calendar: event dblclick ${attempt} did not open the form, retrying...`);
          dblClickFirstEvent();
          waitForFormOrRetry(attempt + 1, OUTCOME_WINDOW_MS);
          return;
        }
        // Bounded state poll — resolves as soon as the form renders rather than
        // sleeping a fixed amount.
        // eslint-disable-next-line cypress/no-unnecessary-waiting -- bounded poll interval between DOM state checks
        cy.wait(POLL_MS);
        waitForFormOrRetry(attempt, remainingMs - POLL_MS);
      });
    };

    dblClickFirstEvent();
    waitForFormOrRetry(1, OUTCOME_WINDOW_MS);
    cy.get(form).should('be.visible');
    return this;
  }

  /** Double-click a calendar event that contains the given text. */
  dblClickEvent(text: string): this {
    cy.get(this.selectors.event, { timeout: 30000 })
      .contains(text)
      .dblclick({ force: true });
    return this;
  }

  /**
   * Open the create-session form from an empty time slot via the hover "+"
   * affordance (`calendar-slot-create`). The slot prefills date/time; the
   * caller fills the rest. Force-clicks because the button is `opacity:0`
   * until hover, and picks the first slot (earliest time) — least likely to
   * collide with a seeded session.
   *
   * Retries the click if the session form didn't open — same flake shape as
   * `dblClickFirstEventToOpenEditPanel`, where a click fired during a layout
   * reflow is occasionally dropped. Waits on the form appearing (a bounded DOM
   * poll that returns the instant it shows), never a fixed sleep.
   */
  openCreateFromFirstSlot(): this {
    const slot = '[data-testid="calendar-slot-create"]';
    const form = '[data-form-entity="session"]';
    const MAX_ATTEMPTS = 3;
    const OUTCOME_WINDOW_MS = 8000;
    const POLL_MS = 250;

    const clickFirstSlot = () => {
      cy.get(slot, { timeout: 30000 }).first().click({ force: true });
    };

    const waitForFormOrRetry = (attempt: number, remainingMs: number) => {
      cy.get('body').then(($body) => {
        if ($body.find(`${form}:visible`).length > 0) {
          return;
        }
        if (remainingMs <= 0) {
          if (attempt >= MAX_ATTEMPTS) {
            throw new Error(
              `calendar: session form did not open after ${attempt} slot-click attempts`
            );
          }
          cylog(`calendar: slot click ${attempt} did not open the form, retrying...`);
          clickFirstSlot();
          waitForFormOrRetry(attempt + 1, OUTCOME_WINDOW_MS);
          return;
        }
        waitForFormOrRetry(attempt, remainingMs - POLL_MS);
      });
    };

    clickFirstSlot();
    waitForFormOrRetry(1, OUTCOME_WINDOW_MS);
    cy.get(form).should('be.visible');
    return this;
  }

  /** Verify at least one event contains the given text. */
  shouldHaveEvent(text: string): this {
    cy.get(this.selectors.event, { timeout: 30000 })
      .contains(text)
      .should('exist');
    return this;
  }

  /** Verify no event contains the given text. */
  shouldNotHaveEvent(text: string): this {
    cy.get(this.selectors.event).should('not.contain.text', text);
    return this;
  }

  /** Get the count of visible events. */
  getEventCount(): Cypress.Chainable<number> {
    return cy.get(this.selectors.event).its('length');
  }

  // ── Room resource-column methods ─────────────────────────────────────────────

  /**
   * Assert the calendar shows at least `n` room resource columns. Use a
   * superset (>=) rather than an exact count: rooms created by other specs
   * accumulate without a DB reset and may add columns.
   */
  assertRoomColumnCountAtLeast(n: number, timeout: number = 10000): this {
    cy.get(this.selectors.roomResourceHeader, { timeout }).should(
      'have.length.gte',
      n
    );
    return this;
  }

  /** Assert the calendar shows at most `n` room resource columns. */
  assertRoomColumnCountAtMost(n: number, timeout: number = 10000): this {
    cy.get(this.selectors.roomResourceHeader, { timeout }).should(
      'have.length.lte',
      n
    );
    return this;
  }

  /** Assert a specific room code appears as a resource column. */
  shouldHaveRoomColumn(code: string): this {
    cy.get(this.selectors.roomResourceHeader).contains(code).should('exist');
    return this;
  }

  /**
   * Toggle a room in the inline toolbar room filter (the `room-ids`
   * autocomplete). Calling it once applies the filter; calling it again with
   * the same code clears it.
   */
  toggleInlineRoomFilter(code: string): this {
    cy.get(this.selectors.roomFilterInput).first().as('roomFilterInput');
    cy.get('@roomFilterInput').click({ force: true });
    cy.get('@roomFilterInput').type('{downarrow}', { force: true });
    cy.get('@roomFilterInput').should('have.attr', 'aria-expanded', 'true');
    cy.get(this.selectors.roomFilterListbox, { timeout: 25000 }).should('be.visible');
    cy.get(this.selectors.roomFilterOption, { timeout: 25000 })
      .contains(code)
      .click({ force: true });
    return this;
  }

  // ── Filter methods ──────────────────────────────────────────────────────────

  /**
   * Open the filter popover by clicking the Filter button.
   * The popover contains MuiAutocomplete inputs for filtering.
   * TODO: add data-testid to UI for filter button
   */
  openFilter(): this {
    cy.get('.MuiPopover-root').should('not.exist');
    cy.get(this.selectors.filterButton).click({ force: true });
    cy.get('.MuiPopover-root', { timeout: 10000 }).should('exist');
    return this;
  }

  /**
   * Apply a therapist filter by selecting a therapist from the autocomplete.
   * Opens filter popover -> clicks therapist autocomplete -> selects option.
   */
  applyTherapistFilter(therapistName: string): this {
    this.openFilter();
    cy.get(this.selectors.therapistFilterInput).click({ force: true });
    cy.get('[role="option"]', { timeout: 25000 })
      .should('be.visible')
      .contains(therapistName)
      .click();
    return this;
  }

  /**
   * Apply a room filter by selecting a room from the autocomplete.
   * Opens filter popover -> clicks room autocomplete -> selects option.
   */
  applyRoomFilter(roomCode: string): this {
    this.openFilter();
    cy.get(this.selectors.roomFilterInput).click({ force: true });
    cy.get('[role="option"]', { timeout: 25000 })
      .should('be.visible')
      .contains(roomCode)
      .click();
    return this;
  }

  /**
   * Clear the filter by clicking the autocomplete clear button, then closing the popover.
   */
  clearFilter(): this {
    cy.get('.MuiAutocomplete-clearIndicator').click({ force: true });
    cy.get(this.selectors.timeContent).click({ force: true });
    return this;
  }

  /** Close the filter popover by pressing Escape. */
  closeFilterPopover(): this {
    cy.get('body').type('{esc}');
    cy.get('.MuiPopover-root').should('not.exist');
    return this;
  }

  openTherapistFilter(): this {
    cy.get(this.selectors.therapistFilterTrigger).click();
    cy.get('.MuiPopover-root', { timeout: 10000 }).should('be.visible');
    return this;
  }

  selectTherapistInFilter(name: string): this {
    cy.get('.MuiPopover-root .MuiListItemButton-root', { timeout: 10000 })
      .contains(name)
      .click();
    return this;
  }

  clickTherapistFilterClear(): this {
    cy.get('.MuiPopover-root').contains('Clear').click();
    return this;
  }

  // ── Edit Session panel methods ──────────────────────────────────────────────

  /** Wait for the edit session panel to open. */
  waitForEditPanel(timeout: number = 15000): this {
    cy.contains('Edit Session', { timeout }).should('be.visible');
    return this;
  }

  /**
   * Wait for the edit panel to close after Save/Cancel.
   *
   * Since UTR-000168 the window manager keeps UPDATE forms open after a
   * successful save (only CREATE forms auto-close). Mirror the pattern used
   * by every other form page object — dismiss any open dialog first via
   * `closeWindowIfOpen`, then assert the title is gone.
   */
  waitForEditPanelClose(): this {
    closeWindowIfOpen();
    cy.contains('Edit Session', { timeout: 15000 }).should('not.exist');
    return this;
  }

  /** Fill the Price input in the edit panel. Uses {selectall} because MUI clear() is unreliable. */
  editPanelFillPrice(price: string): this {
    cy.get(this.selectors.priceInput).click();
    cy.get(this.selectors.priceInput).type('{selectall}' + price);
    return this;
  }

  /** Get the price value from the edit panel. */
  editPanelGetPrice(): Cypress.Chainable<string> {
    return cy.get(this.selectors.priceInput).invoke('val');
  }

  /**
   * Select a room in the calendar edit panel.
   * NOTE: Do NOT send {esc} here — it would close the Edit Session dialog.
   */
  editPanelSelectRoom(roomText: string): this {
    cy.get(this.selectors.roomInput).click();
    cy.get('[role="option"]', { timeout: 25000 })
      .should('be.visible')
      .contains(roomText)
      .click();
    return this;
  }

  /** Verify the edit panel therapist field contains expected text. */
  editPanelShouldHaveTherapist(text: string): this {
    cy.get(this.selectors.therapistInput).invoke('val').should('contain', text);
    return this;
  }

  /** Verify the edit panel therapist field is not empty. */
  editPanelShouldHaveTherapistPopulated(): this {
    cy.get(this.selectors.therapistInput).invoke('val').should('not.be.empty');
    return this;
  }

  /** Click Save in the edit panel. */
  editPanelSave(): this {
    cy.contains('button', 'Save').click({ force: true });
    return this;
  }

  /** Close the edit panel via Cancel button. */
  editPanelCancel(): this {
    cy.contains('button', 'Cancel').click({ force: true });
    return this;
  }
}
