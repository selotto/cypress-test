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

  it.only('Finds swagger/openapi JSON and exercises a few GET endpoints', () => {
    // Helper to try candidate swagger JSON endpoints sequentially
    function tryCandidates(candidates) {
      if (!candidates.length) {
        throw new Error('No swagger/openapi JSON found at known candidate paths.');
      }
      const candidate = candidates[0];
      const full = uiUrl.replace(/\/$/, '') + candidate;
      return cy.request({ url: full, failOnStatusCode: false }).then(resp => {
        if (resp.status === 200) {
          // Try to parse JSON body
          let spec = resp.body;
          // If body is a string, attempt JSON.parse
          if (typeof spec === 'string') {
            try {
              spec = JSON.parse(spec);
            } catch (e) {
              // not JSON
              throw new Error('Found content at ' + full + ' but it was not valid JSON');
            }
          }
          cy.wrap({ spec, full }).as('swaggerPackage');
          return cy.wrap({ spec, full });
        } else {
          // try next candidate
          return tryCandidates(candidates.slice(1));
        }
      });
    }

    // Start trying candidates
    tryCandidates(swaggerCandidates).then(() => {
      cy.get('@swaggerPackage').then(({ spec, full }) => {
        expect(spec).to.be.an('object');
        expect(spec).to.satisfy(s => !!(s.openapi || s.swagger), 'spec should include "openapi" or "swagger"');
        expect(spec.paths).to.be.an('object');

        // Resolve base URL for API calls
        let apiBase = uiUrl.replace(/\/$/, '');
        if (spec.servers && Array.isArray(spec.servers) && spec.servers.length) {
          // OpenAPI v3
          apiBase = (spec.servers[0].url || apiBase).replace(/\/$/, '');
        } else if (spec.host) {
          // Swagger v2
          const scheme = (spec.schemes && spec.schemes[0]) || 'https';
          apiBase = scheme + '://' + spec.host + (spec.basePath || '');
          apiBase = apiBase.replace(/\/$/, '');
        }

        // Collect candidate GET operations without required parameters
        const ops = [];
        Object.entries(spec.paths).forEach(([pathKey, methods]) => {
          Object.entries(methods).forEach(([method, op]) => {
            if (method.toLowerCase() !== 'get') return;
            const params = op.parameters || [];
            const hasRequired = params.some(p => p && p.required === true);
            if (!hasRequired) {
              ops.push({ path: pathKey, method: 'GET', operationId: op.operationId || op.summary || `${method} ${pathKey}` });
            }
          });
        });

        if (!ops.length) {
          cy.log('No safe GET operations found in swagger spec to exercise.');
          return;
        }

        const toCheck = ops.slice(0, maxApiChecks);
        cy.log('Will exercise ' + toCheck.length + ' GET endpoints from swagger spec found at ' + full);

        // For each endpoint, do a GET and ensure it does not return server error
        toCheck.forEach(op => {
          // replace path params if any (we filtered required params, but just in case replace {param} with 1)
          const urlPath = op.path.replace(/\{[^}]+\}/g, '1');
          const reqUrl = apiBase + (urlPath.startsWith('/') ? urlPath : '/' + urlPath);
          cy.request({ url: encodeURI(reqUrl), method: 'GET', failOnStatusCode: false }).then(r => {
            // Assert no 5xx server error
            expect(r.status).to.be.lessThan(500, `Endpoint ${op.method} ${reqUrl} returned a server error`);
            cy.log(`${op.method} ${reqUrl} -> ${r.status}`);
          });
        });
      });
    });
  });
});