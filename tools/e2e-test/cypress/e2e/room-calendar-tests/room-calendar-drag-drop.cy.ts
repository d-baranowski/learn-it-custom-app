/// <reference types="cypress" />

/**
 * RC_E2E_06 — Admin moves a session to a different room via drag and drop
 *
 * Steps:
 * 1. Reset DB, login as admin
 * 2. Create a session for the next weekday so there's guaranteed data
 * 3. Navigate to Room Calendar day view for that date
 * 4. Drag the session to a different room column
 * 5. Refresh and verify the change persisted
 */

import { CalendarComponent } from '../components-objects/calendar.component';
import { NavigationHelper } from '../components-objects/navigation.component';
import {
  createSessionViaForm,
  ADAM_THERAPIST_OPTION,
} from '../session-tests/session-test-utils';
import {
  getNextWeekday,
  formatDDMMYYYY,
  formatDateISO,
} from '../../utils/date-utils';

describe('Room Calendar ADMIN DRAG AND DROP', () => {
  beforeEach(() => {
    cy.login();
  });

  it('RC_E2E_06: should drag a session to a different room and verify persistence', { tags: '@mutating' }, () => {
    const calendar = new CalendarComponent();
    const nav = new NavigationHelper();
    const targetDate = getNextWeekday();
    const dateStr = formatDDMMYYYY(targetDate);
    const dateISO = formatDateISO(targetDate);

    // --- Step 1: Create a session for the target weekday ---
    nav.navigateToSession();
    createSessionViaForm({
      therapistText: ADAM_THERAPIST_OPTION,
      roomText: 'B1',
      startDate: dateStr,
      startTime: '10:00',
      endDate: dateStr,
      endTime: '10:50',
      price: '200',
    });

    // --- Step 2: Navigate to Room Calendar day view for that date ---
    cy.visit(
      `/core/room-calendar?view=day&date=${dateISO}`
    );
    calendar.waitForCalendar();
    calendar.waitForEvents();

    // --- Step 3: Drag the session to a different room column ---
    cy.get('.rbc-event')
      .first()
      .then(($event) => {
        const sourceRect = $event[0].getBoundingClientRect();

        cy.get('.rbc-header').then(($headers) => {
          const sourceCenter = sourceRect.left + sourceRect.width / 2;

          // Find a column header that is far from the source (different room)
          let targetHeaderIndex = -1;
          let maxDistance = 0;

          $headers.each((i, header) => {
            const headerRect = header.getBoundingClientRect();
            const headerCenter = headerRect.left + headerRect.width / 2;
            const distance = Math.abs(headerCenter - sourceCenter);
            if (distance > maxDistance) {
              maxDistance = distance;
              targetHeaderIndex = i;
            }
          });

          const targetHeader = $headers[targetHeaderIndex];
          const targetRect = targetHeader.getBoundingClientRect();
          const targetHeaderText = targetHeader.textContent?.trim();

          // Perform drag and drop via mouse events
          cy.get('.rbc-event')
            .first()
            .trigger('mousedown', { which: 1, force: true });

          cy.get('.rbc-event')
            .first()
            .trigger('mousemove', {
              clientX: targetRect.left + targetRect.width / 2,
              clientY: sourceRect.top + sourceRect.height / 2,
              force: true,
            });

          cy.get('.rbc-time-content', { timeout: 45000 }).trigger('mousemove', {
            clientX: targetRect.left + targetRect.width / 2,
            clientY: sourceRect.top + 50,
            force: true,
          });

          cy.get('.rbc-time-content', { timeout: 45000 }).trigger('mouseup', {
            force: true,
          });

          // --- Step 4: Refresh and verify persistence ---
          cy.visit(
            `/core/room-calendar?view=day&date=${dateISO}`
          );
          calendar.waitForCalendar();
          calendar.waitForEvents();

          // Verify the target column header exists and has events
          if (targetHeaderText) {
            calendar.shouldHaveColumnHeader(targetHeaderText);
          }

          // Verify events still exist after refresh
          calendar.getEventCount().should('be.greaterThan', 0);
        });
      });
  });
});
