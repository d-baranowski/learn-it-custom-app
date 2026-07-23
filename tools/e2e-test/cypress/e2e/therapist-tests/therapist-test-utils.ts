/// <reference types="cypress" />
import { cylog } from '../../utils/cylog';
import { ADAM } from '../../utils/test-users';
import { setupFor } from '../../utils/setup';
import { uniqueEmail, uniqueSlug, uniqueToken } from '../../utils/unique';

export interface TherapistData {
  english: { professionalTitle: string; description: string; metaDescription: string };
  polish: { professionalTitle: string; description: string; metaDescription: string };
  contactSettings: {
    userId: string;
    languages: string[];
    contactEmail: string;
    contactPhone: string;
    slug: string;
    profitSharing: string;
    inPersonTherapy: boolean;
    onlineTherapy: boolean;
    acceptingNewClients: boolean;
  };
}

/**
 * Build a valid therapist whose slug, contact email and professional titles are
 * unique to this run — those fields are uniqueness-constrained and would 409 on
 * a re-run against the shared, non-reset DB. Call inside `beforeEach`/`it`.
 */
export function makeValidTherapist(): TherapistData {
  const token = uniqueToken();
  return {
    english: {
      professionalTitle: `E2E CBT Therapist ${token}`,
      description: 'Specializes in cognitive behavioral therapy for E2E testing',
      metaDescription: 'E2E meta description for CBT therapist',
    },
    polish: {
      professionalTitle: `E2E Terapeuta ${token}`,
      description: 'Specjalizuje sie w terapii poznawczo-behawioralnej do testow E2E',
      metaDescription: 'E2E meta opis terapeuty CBT',
    },
    contactSettings: {
      userId: ADAM.fullName,
      languages: ['English'],
      contactEmail: uniqueEmail('e2e-therapist'),
      contactPhone: '+48111222333',
      slug: uniqueSlug('e2e-test-therapist'),
      profitSharing: '50',
      inPersonTherapy: true,
      onlineTherapy: true,
      acceptingNewClients: true,
    },
  };
}

/** Navigate to the therapist list page */
export function navigateToTherapistPage(): void {
  cylog('navigate to therapist page');
  cy.visit('/core/therapist');
  cy.get('[data-testid="rpg-grid-component-wrapper"]', { timeout: 30000 }).should('be.visible');
}

/** Login as admin and navigate to the therapist page. */
export function setupAsAdmin(): void {
  cylog('setup as admin');
  cy.intercept('POST', '**/core.v1.TherapistService/Create').as('createTherapist');
  setupFor('admin', () => navigateToTherapistPage());
}
