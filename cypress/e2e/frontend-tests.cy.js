import authPage from '../support/pages/authPage';

describe('Serverest Frontend smoke tests', () => {
  const url = 'https://front.serverest.dev/';

  it.only('logs in a user', () => {
    authPage.visit();
    authPage.loginUser('testuser@example.com', 'Password123!');
    cy.log('User login completed');
  });

  it('registers an Admin new user', () => {
    authPage.visit();
    authPage.registerUser('testuseradmin@example.com', 'Password123!', 'Test User Admin', true);
    cy.log('User admin registration completed');
  });

  it('registers a new user', () => {
    authPage.visit();
    authPage.registerUser('testuser@example.com', 'Password123!', 'Test User', false);
    cy.log('User registration completed');
  });

  it('responds 200', () => {
    cy.request({ url, failOnStatusCode: false }).its('status').should('eq', 200);
  });

  it('loads and has a non-empty title', () => {
    authPage.visit();
    cy.title().should('not.be.empty');
  });
});