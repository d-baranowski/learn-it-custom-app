export function cylog(message: string): void {
  const now = new Date();
  const ts = now.toTimeString().slice(0, 8);
  cy.task('log', `[${ts}] [cy] ${message}`, { log: false });
}
