module.exports = {
  projectId: '2qqngi',
  e2e: {
    //baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    specPattern: 'cypress/e2e/**/*.cy.js',
    excludeSpecPattern: ['**/node_modules/**', '**/*.node', '**/node*/**'],
    video: false,
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
      return config;
    },
  },
  env: {},
  reporter: 'spec',
  retries: { runMode: 2, openMode: 0 },
};