/// <reference types="cypress" />

import { loginAsAdmin } from './recurring-cashflow-test-utils';
import { RecurringCashflowFormComponent } from '../components-objects/recurring-cashflow-form.component';
import { GridComponent } from '../components-objects/grid.component';
import { NavigationHelper } from '../components-objects/navigation.component';

describe(
  'Recurring Cashflow VALIDATION — Required Fields',
  () => {
    beforeEach(() => {
      loginAsAdmin();
      new NavigationHelper().navigateToRecurringCashflow();
    });

    it('RCF_E2E_13: should show errors when submitting with all fields empty', { tags: '@mutating' }, () => {
      const form = new RecurringCashflowFormComponent();
      const grid = new GridComponent();

      grid.waitForGrid();

      form.clickNew();
      form.waitForFormLoad();

      form.fillName('');
      form.fillAmount('');

      form.addSchedule();

      form.navigateToTab('Basic Information');
      form.submit();

      form.shouldHaveTabError('Basic Information');
      form.shouldHaveFieldError('display-name');
      form.shouldHaveFieldError('amount');

      form.cancel();
    });

    // RCF_E2E_14/_15 (single-field variants), RCF_E2E_17 (zero amount) and
    // RCF_E2E_18 (cancel) migrated to jest — recurring_cashflow_form.test.tsx.
    // RCF_E2E_13 above stays as this form's real-WASM validation smoke test.
  }
);
