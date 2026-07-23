/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';

// Scratch fields the optimistic-pending watcher hangs off the app window so a
// browser-side poll can capture the sub-100ms pending window (see
// beginOptimisticPendingWatch).
type GridPollWindow = Window & {
  __pendingSeen?: boolean;
  __pendingPollerId?: number;
};

const MAX_SELECT_ATTEMPTS = 3;

/**
 * Component Object for Therapy Grid
 * Encapsulates all interactions with the therapy grid component
 */
export class GridComponent {
  selectors: {
    gridWrapper: string;
    actionsButton: string;
    actionsMenu: string;
    deleteMenuItem: string;
    tbody: string;
    row: string;
    checkbox: string;
    displayNameFilter: string;
    breadcrumb: string;
  };

  /**
   * @param scope Optional CSS prefix that scopes the grid wrapper. Use when
   *   the grid is nested inside another form/component (e.g. the Sessions
   *   tab inside a Therapy form: `new GridComponent('[data-form-entity="therapy"]')`).
   */
  constructor(scope?: string) {
    const wrapper = scope
      ? `${scope} [data-testid="rpg-grid-component-wrapper"]`
      : '[data-testid="rpg-grid-component-wrapper"]';
    this.selectors = {
      gridWrapper: wrapper,

      actionsButton: '[data-testid="grid-actions-button"]',
      actionsMenu: '[data-testid="grid-actions-menu"]',
      deleteMenuItem: '[data-testid="delete-menu-item"]',
      tbody: 'tbody',
      row: 'tr',
      checkbox: 'input[type="checkbox"]',
      displayNameFilter: '[data-testid="filter-displayName"]',
      breadcrumb: 'nav[aria-label="breadcrumb"]',
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

  /** Assert the grid's "New / create item" button is present (permission check). */
  shouldHaveCreateButton(): this {
    cy.get('[data-testid="create-item-btn"]').should('exist');
    return this;
  }

  /**
   * Fill any text input by its data-testid attribute
   * @param dataTestId - The data-testid value of the input
   * @param value - The value to type
   * @param clear - Whether to clear the field before typing (default: true)
   */
  fillInput(dataTestId: string, value: string, clear: boolean = true): this {
    const selector = `input[data-testid="${dataTestId}"]`;
    if (clear) {
      cy.get(selector).clear();
      // Only type if value is not empty
      if (value !== '') {
        cy.get(selector).type(value);
      }
    } else {
      cy.get(selector).type(value);
    }
    return this;
  }

  /**
   * Get the current value of an input by its data-testid
   * @param dataTestId - The data-testid value of the input
   */
  getInputValue(dataTestId: string): Cypress.Chainable<string> {
    return cy.get(`input[data-testid="${dataTestId}"]`).invoke('val');
  }

  /**
   * Fill a grid filter by its data-testid
   * @param dataTestId - The data-testid value (e.g., 'filter-displayName')
   * @param value - The value to type
   * @param clear - Whether to clear the field before typing (default: true)
   */
  fillFilter(dataTestId: string, value: string, clear: boolean = true): this {
    return this.fillInput(dataTestId, value, clear);
  }

  /**
   * Get the current value of a filter by its data-testid
   * @param dataTestId - The data-testid value (e.g., 'filter-displayName')
   */
  getFilterValue(dataTestId: string): Cypress.Chainable<string> {
    return this.getInputValue(dataTestId);
  }

  /**
   * Clear a filter by its data-testid
   * @param dataTestId - The data-testid value (e.g., 'filter-displayName')
   */
  clearFilter(dataTestId: string): this {
    return this.fillFilter(dataTestId, '', true);
  }

  /**
   * Get the number of rows in the grid
   */
  getRowCount(): Cypress.Chainable<number> {
    return cy
      .get(this.selectors.gridWrapper)
      .find(this.selectors.tbody)
      .find(this.selectors.row)
      .then(($rows) => $rows.length);
  }

  /**
   * Find a row by display name. Auto-waits for any optimistic pending
   * rows to clear first — without this, a freshly-saved entity (whose
   * temp `optimistic_*` row still lingers in the loading window) would
   * be matched by the temp instead of the real row, and any subsequent
   * `dblclick` is a no-op (pure-grid blocks interactions on pending rows).
   * @param displayName - The display name to search for
   * @param exact - When true, match the cell text exactly (anchored regex); default false
   */
  findRow(
    displayName: string,
    exact: boolean = false
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    this.waitForNoPendingRows();
    const textSelector = exact ? new RegExp(`^${displayName}$`) : displayName;
    return cy
      .get(this.selectors.gridWrapper)
      .find(this.selectors.tbody)
      .find(this.selectors.row)
      .contains(textSelector, { timeout: 30000 })
      .closest(this.selectors.row);
  }

  /**
   * Wait until the grid finishes loading and renders real rows (not MRT
   * skeleton placeholders). MRT shows `.MuiSkeleton-root` cells while
   * `isLoading` is true; we wait for those to disappear before treating
   * the rendered rows as truthful, because skeleton rows otherwise carry
   * `data-id` values like "0"/"1" derived from row index, not entity id.
   */
  waitForRowsLoaded(timeout: number = 15000): this {
    cy.get(this.selectors.gridWrapper).within(() => {
      cy.get('.MuiSkeleton-root', { timeout }).should('not.exist');
    });
    return this;
  }

  /**
   * Wait until any in-flight fetch settles. MRT shows a `<LinearProgress>`
   * (controlled by our `isFetching && !isLoading`) above the table while
   * a list/refilter request is running. Use after triggering a filter
   * change so content assertions run against the post-fetch render rather
   * than the pre-fetch DOM.
   */
  waitForFetchSettled(timeout: number = 30000): this {
    cy.get(this.selectors.gridWrapper).within(() => {
      cy.get('.MuiLinearProgress-root', { timeout }).should('not.exist');
    });
    return this;
  }

  /**
   * Read the `data-id` of the first real row. Use when row text isn't
   * unique enough for `findRow(displayName)` (e.g. session rows that
   * share dates and times across a therapy).
   */
  getFirstRowDataId(timeout: number = 15000): Cypress.Chainable<string> {
    this.waitForRowsLoaded(timeout);
    return cy
      .get(this.selectors.gridWrapper)
      .find(`${this.selectors.tbody} ${this.selectors.row}[data-id]`, { timeout })
      .should('have.length.gte', 1)
      .first()
      .invoke('attr', 'data-id')
      .then((id) => {
        expect(id, 'first row must expose data-id').to.be.a('string').and.not.be
          .empty;
        return id as string;
      });
  }

  /**
   * Open the first real row by double-click — the same precaution as
   * `THR_E2E_SES_EDIT`: `.trigger('dblclick')` instead of `.dblclick()` to
   * avoid MUI's selection toggle re-mounting the row between firings and
   * leaving entityId=null.
   */
  openFirstRow(timeout: number = 15000): this {
    this.waitForRowsLoaded(timeout);
    cy.get(this.selectors.gridWrapper)
      .find(`${this.selectors.tbody} ${this.selectors.row}[data-id]`, { timeout })
      .first()
      .trigger('dblclick', { bubbles: true });
    return this;
  }

  /**
   * Read the row's domain ID (the `data-id` attribute set by the grid library
   * from `getRowId: row => row.id`).
   *
   * Useful for capturing a row's identity before mutating it (delete/edit) so
   * the assertion afterwards can target the exact entity rather than relying
   * on uniqueness of cell content (e.g. price), which collides with bootstrap data.
   */
  getRowDataId(
    displayName: string,
    exact: boolean = false
  ): Cypress.Chainable<string> {
    return this.findRow(displayName, exact)
      .invoke('attr', 'data-id')
      .then((id) => {
        expect(
          id,
          `row matching "${displayName}" must expose data-id`,
        ).to.be.a('string').and.not.be.empty;
        return id as string;
      });
  }

  /**
   * Assert that AT LEAST one row in the grid is in the optimistic-pending
   * state (carries `data-optimistic-pending="true"` because pure-grid sees
   * the `__optimisticPending` flag or the synthetic `optimistic_*` id).
   * Use right after a Save click to verify the new row appeared instantly.
   */
  assertPendingRowVisible(timeout: number = 5000): this {
    cy.get(this.selectors.gridWrapper)
      .find(`${this.selectors.tbody} ${this.selectors.row}[data-optimistic-pending="true"]`, {
        timeout,
      })
      .should('have.length.gte', 1);
    return this;
  }

  /**
   * Start a browser-side poll that records whether an optimistic-pending row
   * ever appears in the grid. The optimistic window can be shorter than
   * Cypress's command cadence (sub-100ms), so we watch from inside the page
   * rather than via retried assertions that could race straight past it.
   * Call this BEFORE the save action, then {@link assertOptimisticPendingObserved}
   * after the save has settled.
   */
  beginOptimisticPendingWatch(): this {
    const pendingSelector =
      `${this.selectors.gridWrapper} ${this.selectors.tbody} ` +
      `${this.selectors.row}[data-optimistic-pending="true"]`;
    cy.window().then((win) => {
      const w = win as GridPollWindow;
      w.__pendingSeen = false;
      w.__pendingPollerId = w.setInterval(() => {
        if (w.document.querySelectorAll(pendingSelector).length > 0) {
          w.__pendingSeen = true;
        }
      }, 50);
    });
    return this;
  }

  /**
   * Stop the {@link beginOptimisticPendingWatch} poll and assert that a
   * pending row was observed at some point during the save flow.
   */
  assertOptimisticPendingObserved(): this {
    cy.window().then((win) => {
      const w = win as GridPollWindow;
      if (w.__pendingPollerId !== undefined) w.clearInterval(w.__pendingPollerId);
      expect(
        w.__pendingSeen,
        'an optimistic-pending row should have appeared in the grid during the save flow',
      ).to.equal(true);
    });
    return this;
  }

  /**
   * Wait until no rows in the grid are in the pending state — i.e. the
   * server response has arrived and the temp row was replaced by the
   * authoritative entity. Tests should call this before interacting with
   * the freshly-created row.
   */
  waitForNoPendingRows(timeout: number = 15000): this {
    cy.get(this.selectors.gridWrapper)
      .find(`${this.selectors.tbody} ${this.selectors.row}[data-optimistic-pending="true"]`, {
        timeout,
      })
      .should('have.length', 0);
    return this;
  }

  /**
   * Assert the row with the given domain id contains the given text.
   * Pinpoints assertions to a specific entity (by `data-id`) rather than
   * leaning on cell-text uniqueness across paginated/filtered views.
   *
   * Used by optimistic-update tests to verify a row reflects the new value
   * while the save is still in flight.
   */
  assertRowContains(id: string, text: string): this {
    cy.get(this.selectors.gridWrapper)
      .find(`${this.selectors.row}[data-id="${id}"]`, { timeout: 15000 })
      .should('contain.text', text);
    return this;
  }

  /**
   * Assert that no row in the grid has the given domain ID.
   * Used after a delete to verify the *specific* entity is gone — independent
   * of any other rows that might happen to share visible content.
   */
  shouldNotHaveRowWithId(id: string): this {
    cy.get(this.selectors.gridWrapper)
      .find(`${this.selectors.row}[data-id="${id}"]`, { timeout: 30000 })
      .should('not.exist');
    return this;
  }

  /**
   * Double-click to open edit form for a row
   * @param displayName - The display name of the row to open
   * @param exact - When true, match the cell text exactly; default false
   */
  openRow(displayName: string, exact: boolean = false): this {
    this.findRow(displayName, exact).scrollIntoView().dblclick({ force: true });
    return this;
  }

  /**
   * Select checkbox for a specific row
   * @param displayName - The display name of the row to select
   * @param exact - When true, match the cell text exactly; default false
   */
  selectRow(displayName: string, exact: boolean = false): this {
    return this.selectRows([displayName], exact);
  }

  /**
   * Select checkboxes for multiple rows, then assert exactly that many rows
   * are selected — proving the expected rows and no strays are checked.
   * @param displayNames - The display names of the rows to select
   * @param exact - When true, match the cell text exactly; default false
   */
  selectRows(displayNames: string[], exact: boolean = false): this {
    displayNames.forEach((displayName) => {
      cylog(`grid: selecting row "${displayName}"`);
      this.checkRowUntilSelected(displayName, exact, 1);
    });

    cy.get(this.selectors.gridWrapper)
      .find(`${this.selectors.tbody} ${this.selectors.checkbox}:checked`)
      .should('have.length', displayNames.length);

    return this;
  }

  // A force-click landing before MRT finishes wiring row selection is silently
  // dropped, and a trailing .should('be.checked') would only retry the
  // assertion — never the click. Re-click until the row is actually selected.
  private checkRowUntilSelected(
    displayName: string,
    exact: boolean,
    attempt: number
  ): void {
    this.findRow(displayName, exact)
      .find(this.selectors.checkbox)
      .click({ force: true })
      .then(($checkbox) => {
        if ($checkbox.is(':checked')) return;
        if (attempt >= MAX_SELECT_ATTEMPTS) {
          throw new Error(
            `grid: row "${displayName}" did not select after ${attempt} attempts`
          );
        }
        cylog(`grid: select attempt ${attempt} did not stick, retrying...`);
        this.checkRowUntilSelected(displayName, exact, attempt + 1);
      });
  }

  /**
   * Type in a filter to search/filter the grid
   * @param dataTestId - The data-testid of the filter (e.g., 'filter-displayName')
   * @param query - The search query
   */
  search(dataTestId: string, query: string): this {
    this.fillFilter(dataTestId, query);
    return this;
  }

  /**
   * Clear a filter
   * @param dataTestId - The data-testid of the filter (e.g., 'filter-displayName')
   */
  clearSearch(dataTestId: string): this {
    this.clearFilter(dataTestId);
    return this;
  }

  /**
   * Get all visible row elements
   */
  getVisibleRows(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .get(this.selectors.gridWrapper)
      .find(this.selectors.tbody)
      .find(this.selectors.row);
  }

  /**
   * Wait for the grid to load
   * @param timeout - Optional timeout in milliseconds
   */
  waitForGrid(timeout: number = 30000): this {

    cylog('grid: waiting for grid to load');
    cy.get(this.selectors.gridWrapper, { timeout }).should('exist');
    return this;
  }

  refresh(): this {
    cy.get('[data-testid="refresh-grid-btn"]').click();
    cy.get(this.selectors.gridWrapper)
      .find('.MuiLinearProgress-root', { timeout: 5000 })
      .should('exist');
    cy.get(this.selectors.gridWrapper)
      .find('.MuiLinearProgress-root', { timeout: 30000 })
      .should('not.exist');
    return this;
  }

  /**
   * Check if a row with given display name exists
   * @param displayName - The display name to check for
   */
  hasRow(displayName: string): Cypress.Chainable<boolean> {
    return cy
      .get(this.selectors.gridWrapper)
      .find(this.selectors.tbody)
      .find(this.selectors.row)
      .contains(displayName)
      .then(($el) => $el.length > 0);
  }

  /**
   * Verify grid contains text. Auto-waits for any optimistic pending rows
   * to clear first so the assertion only matches the authoritative
   * server-confirmed row, not a temp that's about to be replaced — racing
   * past the post-save refetch leaves subsequent filter operations using
   * pre-save cache state.
   */
  shouldContain(text: string): this {
    this.waitForNoPendingRows();
    cy.get(this.selectors.gridWrapper)
      .find(this.selectors.tbody)
      .contains(text, { timeout: 30000 });
    return this;
  }

  shouldContainExact(text: string): this {
    this.waitForNoPendingRows();
    const regex = new RegExp(`^${text}$`);
    cy.get(this.selectors.gridWrapper)
      .find(this.selectors.tbody)
      .contains(regex, { timeout: 30000 });
    return this;
  }

  /**
   * Assert that the grid does NOT contain a cell whose text is exactly the given string.
   */
  shouldNotContainExact(text: string): this {
    const regex = new RegExp(`^${text}$`);
    cy.get(this.selectors.gridWrapper)
      .find(this.selectors.tbody)
      .contains(regex, { timeout: 30000 })
      .should('not.exist');
    return this;
  }

  /**
   * Verify grid does not contain text
   * @param text - The text to verify
   */
  shouldNotContain(text: string): this {
    cy.get(this.selectors.gridWrapper)
      .find(this.selectors.tbody)
      .find(this.selectors.row, { timeout: 30000 })
      .should('not.contain.text', text);
    return this;
  }

  /**
   * Verify breadcrumb contains text
   * @param text - The text to verify in breadcrumb
   */
  shouldHaveBreadcrumb(text: string): this {
    cy.get(this.selectors.breadcrumb).should('contain.text', text);
    return this;
  }

  /**
   * Reveal a column hidden by default via MRT's "Show/Hide Columns" toolbar
   * menu. Matches the column by its exact header text (anchored) so a header
   * that is a substring of another (e.g. "Cancelled By User" vs "Cancelled By
   * User Id") doesn't toggle the wrong column. Closes the menu afterwards.
   * @param header - The exact column header label as rendered in the menu
   */
  showColumn(header: string): this {

    cylog(`grid: showing column "${header}"`);
    cy.get('[data-testid="column-manager-btn"]').click();
    const exact = new RegExp(`^${header}$`);
    cy.contains('[data-testid^="column-row-"]', exact).click();
    cy.get('body').click(0, 0);
    cy.get(this.selectors.gridWrapper)
      .contains('th', header, { timeout: 10000 })
      .should('exist');
    return this;
  }

  /**
   * Click a column header's sort button to toggle sort direction.
   * MRT renders an aria-label like "Sort by Date ascending" on the
   * TableSortLabel span. After clicking, waits for the fetch to settle.
   * @param columnHeader - The column header text (e.g. "Date", "Room")
   */
  sortByColumn(columnHeader: string): this {
    cy.get(this.selectors.gridWrapper)
      .find('th')
      .contains(columnHeader)
      .closest('th')
      .find('.MuiTableSortLabel-root')
      .click({ force: true });
    this.waitForFetchSettled();
    return this;
  }

  /**
   * Assert that the column has an active ascending sort indicator.
   */
  assertSortedAsc(columnHeader: string): this {
    cy.get(this.selectors.gridWrapper)
      .find('th')
      .contains(columnHeader)
      .closest('th')
      .find('.MuiTableSortLabel-root')
      .should('have.attr', 'aria-label')
      .and('match', /sorted.*ascending|Sorted.*ascending/i);
    return this;
  }

  /**
   * Assert the visible cell values in a column appear in the expected order.
   * @param columnHeader - The column header text
   * @param expectedOrder - Array of expected cell values (first N rows)
   */
  assertColumnOrder(columnHeader: string, expectedOrder: string[]): this {
    cy.get(this.selectors.gridWrapper)
      .find('th')
      .contains(columnHeader)
      .invoke('index')
      .then((colIndex) => {
        expectedOrder.forEach((expected, rowIdx) => {
          cy.get(this.selectors.gridWrapper)
            .find(`${this.selectors.tbody} ${this.selectors.row}[data-id]`)
            .eq(rowIdx)
            .find('td')
            .eq(colIndex)
            .should('contain.text', expected);
        });
      });
    return this;
  }

  /**
   * Resolve the 0-based cell index of a column by its exact header label.
   * Matches on MRT's header content wrapper so a header that is a substring
   * of another (e.g. "Room" vs "Room Id") can't resolve to the wrong column.
   */
  columnIndex(columnHeader: string): Cypress.Chainable<number> {
    return cy
      .get(this.selectors.gridWrapper)
      .find('thead th')
      .then(($ths) => {
        const idx = $ths.toArray().findIndex((th) => {
          const label = th
            .querySelector('.Mui-TableHeadCell-Content-Wrapper')
            ?.textContent?.trim();
          return label === columnHeader;
        });
        expect(idx, `column "${columnHeader}" exists`).to.be.gte(0);
        return idx;
      });
  }

  /**
   * Retryable whole-grid assertion: every visible row's cell in the given
   * column satisfies the predicate. The callback re-queries the DOM on
   * every retry, so it survives full grid re-renders after a filter change
   * (no detached-element races) and needs no network intercepts.
   */
  expectEveryRowCell(
    colIndex: number,
    description: string,
    predicate: (cellText: string) => boolean
  ): this {
    cy.get(this.selectors.gridWrapper)
      .find(`${this.selectors.tbody} ${this.selectors.row}`)
      .should(($rows) => {
        expect($rows.length, 'grid has rows').to.be.greaterThan(0);
        $rows.each((_, row) => {
          const text = (
            row.querySelectorAll('td')[colIndex]?.textContent ?? ''
          ).trim();
          expect(text, description).to.satisfy(predicate);
        });
      });
    return this;
  }

  /**
   * Retryable assertion on the number of visible rows.
   */
  expectRowCount(count: number): this {
    cy.get(this.selectors.gridWrapper)
      .find(`${this.selectors.tbody} ${this.selectors.row}`)
      .should('have.length', count);
    return this;
  }

  /**
   * Collect text values from the first N rows of a given column.
   */
  getColumnValues(columnHeader: string, count: number): Cypress.Chainable<string[]> {
    this.waitForRowsLoaded();
    this.waitForFetchSettled();
    return cy.get(this.selectors.gridWrapper)
      .find('th')
      .contains(columnHeader)
      .closest('th')
      .then(($th) => {
        const colIndex = $th.index();
        // Wait until the first data row's target cell has non-empty text
        cy.get(this.selectors.gridWrapper)
          .find(`${this.selectors.tbody} ${this.selectors.row}[data-id]`)
          .first()
          .find(`td:eq(${colIndex})`)
          .should('not.have.text', '');
        const values: string[] = [];
        cy.get(this.selectors.gridWrapper)
          .find(`${this.selectors.tbody} ${this.selectors.row}[data-id]`)
          .each(($row, idx) => {
            if (idx < count) {
              values.push($row.find('td').eq(colIndex).text().trim());
            }
          });
        return cy.then(() => values);
      });
  }

  /**
   * Read MRT's pagination summary ("1-100 of 604") and parse it into the
   * numeric range. Locale-agnostic: captures the two page bounds around the
   * dash and the trailing total, ignoring the connective word ("of" / "z").
   */
  getPaginationSummary(): Cypress.Chainable<{
    start: number;
    end: number;
    total: number;
  }> {
    this.waitForRowsLoaded();
    this.waitForFetchSettled();
    return cy
      .get(this.selectors.gridWrapper)
      .contains(/\d[\d,]*\s*[–-]\s*\d[\d,]*\s+\S+\s+\d[\d,]*/, { timeout: 15000 })
      .invoke('text')
      .then((text) => {
        const m = text.match(/([\d,]+)\s*[–-]\s*([\d,]+)\s+\S+\s+([\d,]+)/);
        expect(m, `pagination summary parseable from "${text}"`).to.not.be.null;
        const num = (s: string): number => parseInt(s.replace(/,/g, ''), 10);
        return { start: num(m![1]), end: num(m![2]), total: num(m![3]) };
      });
  }

  /**
   * Click MRT's "next page" control. Selected via the MUI `ChevronRightIcon`
   * data-testid rather than the localized `aria-label`, so the selector is
   * independent of both wording and app locale. Asserts the control is
   * enabled first (a broken pager that disables it surfaces here), then waits
   * for the refetch to settle.
   */
  goToNextPage(): this {
    cy.get(this.selectors.gridWrapper)
      .find('[data-testid="ChevronRightIcon"]')
      .closest('button')
      .should('not.be.disabled')
      .click();
    this.waitForFetchSettled();
    this.waitForRowsLoaded();
    return this;
  }

  /** Symmetric counterpart to {@link goToNextPage} for the previous page. */
  goToPreviousPage(): this {
    cy.get(this.selectors.gridWrapper)
      .find('[data-testid="ChevronLeftIcon"]')
      .closest('button')
      .should('not.be.disabled')
      .click();
    this.waitForFetchSettled();
    this.waitForRowsLoaded();
    return this;
  }

  /**
   * Collect the `data-id` of the first `count` real rows on the current page.
   * Used to prove the row set actually changes between pages rather than
   * relying on cell text (which repeats across a large session list).
   */
  getPageRowIds(count: number): Cypress.Chainable<string[]> {
    this.waitForRowsLoaded();
    const ids: string[] = [];
    cy.get(this.selectors.gridWrapper)
      .find(`${this.selectors.tbody} ${this.selectors.row}[data-id]`)
      .each(($row, idx) => {
        if (idx < count) {
          const id = $row.attr('data-id');
          if (id) ids.push(id);
        }
      });
    return cy.then(() => ids);
  }

  openActionsMenu(): this {
    // Use force:true to bypass MUI invisible backdrop that may persist after modal dialogs
    cy.get(`[data-testid="grid-actions-button"]`).click({ force: true });
    return this;
  }

  clickDeleteMenuItem(): this {
    // Use force:true to bypass MUI invisible backdrop that may persist after modal dialogs
    cy.get('[data-testid="delete-menu-item"]').click({ force: true });
    return this;
  }

  /**
   * Clear any selected rows by clicking the "Clear selection" link if present.
   */
  clearSelection(): this {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Clear selection')) {
        cy.contains('Clear selection').click();
      }
    });
    return this;
  }

  deleteSelected(): this {
    cylog('grid: deleting selected rows');
    this.openActionsMenu();
    this.clickDeleteMenuItem();
    return this;
  }
}
