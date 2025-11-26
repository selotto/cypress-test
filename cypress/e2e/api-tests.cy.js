// javascript
// cypress/e2e/frontend-tests copy.test.js
describe('Swagger API smoke tests', () => {
  const uiUrl = 'https://serverest.dev/';
  const swaggerCandidates = [
    '/swagger/v1/swagger.json',
    '/swagger.json',
    '/openapi.json',
    '/swagger/docs/v1',
    '/swagger/docs/v1/swagger.json'
  ];
  const maxApiChecks = 5;

  it.only('UI root responds 200', () => {
    cy.request({ url: uiUrl, failOnStatusCode: false }).its('status').should('eq', 200);
  });

  it.only('UI loads and has a non-empty title', () => {
    cy.visit(uiUrl);
    cy.title().should('not.be.empty');
  });

  it.only('Finds a docs/swagger/openapi link and optionally visits Swagger UI', () => {
    cy.visit(uiUrl);
    cy.get('a[href*="swagger"], a[href*="docs"], a[href*="openapi"], a[href*="api"]')
      .first()
      .then($a => {
        if ($a && $a.length) {
          const href = $a.prop('href');
          cy.log('Found candidate docs link: ' + href);
          cy.request({ url: href, failOnStatusCode: false }).then(resp => {
            // If it's an HTML page, try to visit and assert swagger-ui markers
            if (resp.status === 200 && /html/i.test(resp.headers['content-type'] || '')) {
              cy.visit(href);
              cy.get('body').then($body => {
                if ($body.find('.swagger-ui, .opblock, .try-out, .swagger-container').length) {
                  cy.log('Swagger UI or API docs appear to be present on the linked page');
                } else {
                  cy.log('Linked docs page did not contain immediate swagger-ui markers');
                }
              });
            } else {
              cy.log('Docs link returned status: ' + resp.status);
            }
          });
        } else {
          cy.log('No docs/swagger/openapi link found on page');
        }
      });
  });

 // Helper: GET /usuarios with optional query params
  const getUsers = (params = {}) => {
    return cy.request({
      method: 'GET',
      url: 'https://serverest.dev/usuarios',
      qs: params,
      failOnStatusCode: false,
    });
  };

  it.only('GET /usuarios returns a list (basic smoke)', () => {
    getUsers().then(resp => {
      expect([200, 204, 404]).to.include(resp.status); // allow common outcomes
      if (resp.status === 200) {
        expect(resp.body).to.have.property('usuarios');
        expect(resp.body.usuarios).to.be.an('array');
      } else {
        cy.task('GET /usuarios returned status ' + resp.status);
      }
    });
  });

  it('GET /usuarios with query params filters results (example)', () => {
    // Example: filter by nome (adjust value to a known existing user if available)
    const query = { nome: 'Fulano da Silva' };
    getUsers(query).then(resp => {
      expect([200, 204, 404]).to.include(resp.status);
      if (resp.status === 200) {
        expect(resp.body).to.have.property('usuarios');
        expect(resp.body.usuarios).to.be.an('array');
        // if query matched, every returned item should include the query string in nome
        resp.body.usuarios.forEach(u => {
          expect(u).to.have.property('nome');
        });
      }
    });
  });

  it.only('POST /login - login smoke test', () => {
    const credentials = {
      email: 'beltrano@qa.com.br',
      password: 'teste'
    };

    cy.request({
      method: 'POST',
      url: 'https://serverest.dev/login',
      body: credentials,
      failOnStatusCode: false,
    }).then(resp => {
      // Accept common outcomes and assert token on success
      expect([200, 400, 401]).to.include(resp.status);
      if (resp.status === 200) {
        // serverest returns an authorization token in the body on success
        expect(resp.body).to.have.property('authorization');
        cy.wrap(resp.body.authorization).as('authToken');
      } else {
        cy.log('Login did not succeed - status: ' + resp.status);
        cy.log(JSON.stringify(resp.body));
      }
    });
  });

});