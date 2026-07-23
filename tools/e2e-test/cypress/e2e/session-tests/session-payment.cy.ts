/// <reference types="cypress" />
import { NavigationHelper } from '../components-objects/navigation.component';
import { SessionFormComponent } from '../components-objects/session-form.component';
import { GridComponent } from '../components-objects/grid.component';
import {
  createSessionViaForm,
  adjustDateFiltersForTomorrow,
  getTomorrowFormatted,
  MARTA_THERAPIST_OPTION,
} from './session-test-utils';
import { uniquePrice } from '../../utils/unique';

describe('Session Form Payment Tests', () => {
  const navHelper = new NavigationHelper();
  const grid = new GridComponent();

  beforeEach(() => {
    cy.login();
    navHelper.navigateToSession();
  });

  it('SES_PAY_E2E_01: should create payment link and display payment link info', { tags: '@mutating' }, () => {
    const form = new SessionFormComponent();
    const tomorrow = getTomorrowFormatted();
    const price = String(uniquePrice());

    createSessionViaForm({
      therapyText: 'ADHD Diagnosis - Assessment',
      therapistText: MARTA_THERAPIST_OPTION,
      roomText: 'B1',
      startDate: tomorrow,
      startTime: '09:00',
      endDate: tomorrow,
      endTime: '10:00',
      price,
    });

    adjustDateFiltersForTomorrow();
    grid.shouldContainExact(price);
    grid.openRow(price, true);

    form.openPaymentTab();
    form.clickCreatePaymentLink();
    form.waitForPaymentStatus();
    form.shouldNotHaveCreatePaymentLinkButton();
    form.shouldHaveRefreshPaymentLinkButton();
    form.shouldHavePaymentLink();
    form.clickRefreshPaymentLink();
    form.waitForPaymentStatus();
    form.cancel();
  });

  it('SES_PAY_E2E_02: should show copy button when payment link URL is available', { tags: '@mutating' }, () => {
    const form = new SessionFormComponent();
    const tomorrow = getTomorrowFormatted();
    const price = String(uniquePrice());

    createSessionViaForm({
      therapyText: 'ADHD Diagnosis - Assessment',
      therapistText: MARTA_THERAPIST_OPTION,
      roomText: 'B1',
      startDate: tomorrow,
      startTime: '11:00',
      endDate: tomorrow,
      endTime: '12:00',
      price,
    });

    adjustDateFiltersForTomorrow();
    grid.shouldContainExact(price);
    grid.openRow(price, true);

    form.openPaymentTab();
    form.clickCreatePaymentLink();
    form.waitForPaymentStatus();

    // Poll refresh until the URL is populated (async Stripe link generation)
    form.refreshUntilLinkReady(3);

    form.shouldHavePaymentLink();
    form.shouldHaveRefreshPaymentLinkButton();

    // When the link URL is present, copy and open buttons must be visible
    form.getPaymentLinkUrl().then((linkValue) => {
      if (linkValue) {
        form.shouldHaveCopyPaymentLinkButton();
        form.shouldHaveOpenPaymentLinkButton();
        form.clickCopyPaymentLink();
        cy.contains('Copied!').should('be.visible');
      }
    });

    form.cancel();
  });

  it('SES_PAY_E2E_03: should persist payment link after closing and reopening the session form', { tags: '@mutating' }, () => {
    const form = new SessionFormComponent();
    const tomorrow = getTomorrowFormatted();
    const price = String(uniquePrice());

    createSessionViaForm({
      therapyText: 'ADHD Diagnosis - Assessment',
      therapistText: MARTA_THERAPIST_OPTION,
      roomText: 'B1',
      startDate: tomorrow,
      startTime: '13:00',
      endDate: tomorrow,
      endTime: '14:00',
      price,
    });

    adjustDateFiltersForTomorrow();
    grid.shouldContainExact(price);
    grid.openRow(price, true);

    form.openPaymentTab();
    form.clickCreatePaymentLink();
    form.waitForPaymentStatus();
    form.cancel();

    // Re-open and verify the payment link persisted on the server
    grid.openRow(price, true);
    form.openPaymentTab();
    form.waitForPaymentStatus();
    form.shouldNotHaveCreatePaymentLinkButton();
    form.shouldHaveRefreshPaymentLinkButton();
    form.cancel();
  });
});
