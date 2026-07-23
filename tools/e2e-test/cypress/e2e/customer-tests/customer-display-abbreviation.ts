/// <reference types="cypress" />
import { NavigationHelper } from '../components-objects/navigation.component';
import { FormComponent as CustomerForm } from '../components-objects/form.component';

describe('Session Form DateTime Adornment Tests', () => {
  const navHelper = new NavigationHelper();
  const form = new CustomerForm();

  beforeEach(() => {
    cy.login();
    navHelper.navigateToCustomer();
    form.clickButton('create-item-btn');
  });

  it('suggests display abbreviation when clicking the icon button', () => {
    form.fillInput('first-name', 'John');
    form.fillInput('last-name', 'Doe');

    cy.get('[data-testid="suggest-display-name-btn"]').should('be.visible');
    form.clickButton('suggest-display-name-btn');

    form.getInputValue('display-abbreviation').should('eq', 'JD');

    // Close the form
    form.clickButton('form-cancel-btn');
  });
});
