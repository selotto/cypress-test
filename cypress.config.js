module.exports = {
  projectId: '2qqngi',
  e2e: {
    //baseUrl: 'http://localhost:3000', // Change this to your application's base URL
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    specPattern: 'cypress/e2e/**/*.cy.js',
    video: false,
  },
  env: {
    // Add any environment variables here
  },
  reporter: 'spec',
  retries: {
    runMode: 2,
    openMode: 0,
  },
};