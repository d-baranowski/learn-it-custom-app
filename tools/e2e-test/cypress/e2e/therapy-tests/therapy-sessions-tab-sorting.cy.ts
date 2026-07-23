/// <reference types="cypress" />

import { loginAsAdmin } from './therapy-test-utils';
import {
  createTherapyWithFrequency,
  openTherapyToFrequencyTab,
} from './therapy-frequency-test-helpers';
import { GridComponent } from '../components-objects/grid.component';
import { TherapyFormComponent } from '../components-objects/therapy-form.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import { SessionGenerateComponent } from '../components-objects/session-generate.component';

const SCOPE = '[data-form-entity="therapy"]';

describe('Therapy → Sessions Tab → Sorting', () => {
  it('THPY_SES_SORT_01: generate sessions then verify column sorting', { tags: '@mutating' }, () => {
    loginAsAdmin();
    const nav = new NavigationHelper();
    const outerGrid = new GridComponent();
    const innerGrid = new GridComponent(SCOPE);
    const form = new TherapyFormComponent();
    const sessionGen = new SessionGenerateComponent();

    // Create a dedicated therapy so session generation always produces fresh
    // rows — regenerating the shared seeded therapy would create nothing on a
    // second run against the non-reset DB and leave Confirm disabled.
    const therapyName = createTherapyWithFrequency(nav, form, outerGrid, {
      namePrefix: 'SortTest',
    });
    openTherapyToFrequencyTab(outerGrid, form, therapyName);

    // Generate sessions — auto-previews on open
    cy.get(`${SCOPE} [data-testid="generate-sessions-btn"]`).click();
    sessionGen.waitForWindow();
    sessionGen.selectMonths(2);
    sessionGen.waitForSessionList();
    sessionGen.shouldBeConfirmEnabled();
    sessionGen.clickConfirm();
    sessionGen.waitForWindowClose();

    // Navigate to Sessions tab and verify rows exist
    form.goToSessionsTab();
    innerGrid.waitForRowsLoaded();

    // Sort by Date ascending
    innerGrid.sortByColumn('Date');
    innerGrid.getColumnValues('Date', 5).then((ascDates) => {
      const sortedAsc = [...ascDates].sort();
      expect(ascDates, 'dates should be ascending after first click').to.deep.equal(sortedAsc);

      // Sort by Date descending
      innerGrid.sortByColumn('Date');
      innerGrid.getColumnValues('Date', 5).then((descDates) => {
        const sortedDesc = [...descDates].sort().reverse();
        expect(descDates, 'dates should be descending after second click').to.deep.equal(sortedDesc);
        expect(ascDates, 'asc and desc should differ').to.not.deep.equal(descDates);
      });
    });

    form.closeWindow();
  });
});
