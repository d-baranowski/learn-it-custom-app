/// <reference types="cypress" />

import { NavigationHelper } from '../e2e/components-objects/navigation.component';
import { loginAs, type TestRole } from './test-users';
import { cylog } from './cylog';

/**
 * Shared login+navigate setup — replaces the near-identical
 * setup*ForAdmin/ForAdam helpers each test group used to declare.
 * The navigation callback receives a NavigationHelper whose navigate
 * methods already wait for the destination page state.
 */
export function setupFor(role: TestRole, go: (nav: NavigationHelper) => void): void {
  cylog(`setup as ${role}`);
  loginAs(role);
  go(new NavigationHelper());
}
