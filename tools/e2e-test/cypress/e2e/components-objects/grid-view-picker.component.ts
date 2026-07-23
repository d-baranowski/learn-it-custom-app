/// <reference types="cypress" />

/**
 * Page object for the grid View pill + popover. The pill replaces the
 * legacy Autocomplete-based view toolbar. All selectors are scoped to
 * data-testid attributes set in app/ui/src/_lib/grid/view/*.
 */
export class GridViewPickerComponent {
  private readonly pill = '[data-testid="grid-view-pill"]';
  private readonly saveIcon = '[data-testid="grid-view-save"]';
  private readonly saveAsIcon = '[data-testid="grid-view-save-as"]';
  private readonly popoverAsNew = '[data-testid="grid-view-popover-as-new"]';
  private readonly copyShareLinkBtn = '[data-testid="grid-view-copy-share-link"]';

  open(): this {
    cy.get(this.pill).click();
    return this;
  }

  close(): this {
    // Popover closes on outside click — escape via Esc keeps focus stable
    cy.get('body').type('{esc}');
    return this;
  }

  selectView(name: string): this {
    cy.get(`[data-testid="grid-view-row-${name}"]`).click();
    return this;
  }

  saveDirty(): this {
    cy.get(this.saveIcon).click();
    return this;
  }

  /**
   * Click "As new" inside the open popover, fill the name, submit. The
   * popover MUST be open (call `open()` first) — the pill's save-as icon
   * sits behind the popover and is unreachable while it's open.
   */
  saveAsNew(newName: string, fromCurrentLayout: boolean = true): this {
    cy.get(this.popoverAsNew).click();
    cy.get('[data-testid="grid-view-name-input"]').clear();
    cy.get('[data-testid="grid-view-name-input"]').type(newName);
    if (!fromCurrentLayout) {
      cy.get('[data-testid="grid-view-from-current"]').click();
    }
    cy.get('[data-testid="grid-view-name-submit"]').click();
    return this;
  }

  openRowMenu(name: string): this {
    cy.get(`[data-testid="grid-view-row-menu-${name}"]`).click({ force: true });
    return this;
  }

  rename(currentName: string, newName: string): this {
    this.openRowMenu(currentName);
    cy.get(`[data-testid="grid-view-rename-${currentName}"]`).click();
    cy.get('[data-testid="grid-view-name-input"]').clear();
    cy.get('[data-testid="grid-view-name-input"]').type(newName);
    cy.get('[data-testid="grid-view-name-submit"]').click();
    return this;
  }

  duplicate(name: string): this {
    this.openRowMenu(name);
    cy.get(`[data-testid="grid-view-duplicate-${name}"]`).click();
    return this;
  }

  setFavourite(name: string): this {
    this.openRowMenu(name);
    cy.get(`[data-testid="grid-view-set-favourite-${name}"]`).click();
    return this;
  }

  deleteView(name: string): this {
    this.openRowMenu(name);
    cy.get(`[data-testid="grid-view-delete-${name}"]`).click();
    cy.contains('button', /^Delete$/).click();
    return this;
  }

  toggleAutoSave(activeViewName: string): this {
    cy.get(`[data-testid="grid-view-autosave-${activeViewName}"]`).click();
    return this;
  }

  copyShareLink(): this {
    cy.get(this.copyShareLinkBtn).click();
    return this;
  }

  assertActiveLabel(name: string): this {
    cy.get(this.pill).should('contain.text', name);
    return this;
  }

  assertDirty(): this {
    cy.get(this.saveIcon).should('exist');
    return this;
  }

  assertClean(): this {
    cy.get(this.saveIcon).should('not.exist');
    return this;
  }

  assertRowVisible(name: string): this {
    cy.get(`[data-testid="grid-view-row-${name}"]`).should('exist');
    return this;
  }

  assertRowAbsent(name: string): this {
    cy.get(`[data-testid="grid-view-row-${name}"]`).should('not.exist');
    return this;
  }

  /**
   * Wait until the named view is flushed to localStorage with its favourite
   * flag set. The Redux store persists with an 800ms debounce (see app/ui
   * grid state store), so a reload racing the flush would hydrate a stale
   * snapshot — poll the persisted blob instead of waiting a fixed time.
   */
  assertFavouritePersisted(name: string): this {
    cy.window().should((win) => {
      const raw = win.localStorage.getItem('rpg-redux-grids-store') ?? '{}';
      const views = Object.values(
        (JSON.parse(raw).grids?.views ?? {}) as Record<
          string,
          Array<{ viewName?: string; isFavourite?: boolean }>
        >
      ).flat();
      const target = views.find((view) => view.viewName === name);
      expect(
        target?.isFavourite,
        `view "${name}" persisted with isFavourite`
      ).to.equal(true);
    });
    return this;
  }
}
