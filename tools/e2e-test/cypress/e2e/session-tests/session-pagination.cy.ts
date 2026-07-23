/// <reference types="cypress" />

import { GridComponent } from '../components-objects/grid.component';
import { setupSessionTestForAdmin } from './session-test-utils';

/**
 * Regression cover for the grid pager: advancing to page 2 must load the next
 * block of rows, not re-show page 1. Bootstrap seeds several hundred sessions,
 * so with the default page size of 100 there is always a populated page 2.
 */
describe('Session grid pagination', () => {
  const grid = new GridComponent();

  before(() => {
    setupSessionTestForAdmin();
  });

  it('SES_PAGE_E2E_01: advances to page 2 showing a distinct block of rows, then returns to page 1', () => {
    grid.waitForGrid();

    grid.getPageRowIds(10).then((page1Ids) => {
      expect(page1Ids, 'page 1 renders a full block of rows').to.have.length(10);

      grid.getPaginationSummary().then((p1) => {
        expect(p1.start, 'page 1 starts at row 1').to.eq(1);
        expect(p1.end, 'page 1 is a full 100-row page').to.eq(100);
        expect(
          p1.total,
          'seed data must span more than one page for this test to be meaningful',
        ).to.be.greaterThan(100);

        const expectedPage2End = Math.min(200, p1.total);

        grid.goToNextPage();

        grid.getPaginationSummary().then((p2) => {
          expect(p2.start, 'page 2 starts at row 101').to.eq(101);
          expect(p2.end, 'page 2 ends at the next block boundary').to.eq(
            expectedPage2End,
          );
          expect(p2.total, 'total row count is stable across pages').to.eq(
            p1.total,
          );
        });

        grid.getPageRowIds(10).then((page2Ids) => {
          expect(page2Ids, 'page 2 renders rows').to.have.length(10);
          const overlap = page2Ids.filter((id) => page1Ids.includes(id));
          expect(
            overlap,
            'page 2 rows must be entirely distinct from page 1',
          ).to.deep.eq([]);
        });

        grid.goToPreviousPage();
        grid.getPaginationSummary().then((back) => {
          expect(back.start, 'previous returns to page 1').to.eq(1);
        });
      });
    });
  });
});
