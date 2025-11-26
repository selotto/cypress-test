class AuthPage {
  visit() {
    cy.visit('https://front.serverest.dev/');
  }

  clickCadastrar() {
    cy.get('[data-testid="cadastrar"]').click();
  }

  fillNome(name) {
    cy.get('[data-testid="nome"]').type(name);
  }

  fillEmail(email) {
    cy.get('input[type="email"]').type(email);
  }

  fillPassword(password) {
    cy.get('input[type="password"]').type(password);
  }

  checkAdmin() {
    cy.get('[data-testid="checkbox"]').check();
  }

  clickCadastrarButton() {
    cy.contains('button', /cadastrar|registrar|submit/i).click();
  }

  registerUser(email, password, name = 'Test User', isAdmin = false) {
    this.clickCadastrar();
    this.fillNome(name);
    this.fillEmail(email);
    this.fillPassword(password);
    if (isAdmin) {
      this.checkAdmin();
    }
    this.clickCadastrarButton();
  }

  loginUser(email, password) {
    cy.get('[data-testid="email"]').type(email);
    cy.get('[data-testid="senha"]').type(password);
    cy.contains('button', /entrar|login|submit/i).click();
  }
}

export default new AuthPage();