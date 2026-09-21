/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Realiza login no sistema com a credencial padrão de Administrador
       */
      loginAdmin(): Chainable<void>;
    }
  }
}

/**
 * Função utilitária para calcular e gerar um CPF válido aleatório
 */
export function gerarCpfValido(): string {
  const aleatorio = (n: number) => Math.floor(Math.random() * n);

  const n: number[] = [];
  for (let i = 0; i < 9; i++) {
    n.push(aleatorio(10));
  }

  // Primeiro dígito verificador
  let d1 = 0;
  for (let i = 0; i < 9; i++) {
    d1 += n[i] * (10 - i);
  }
  let resto1 = d1 % 11;
  let digito1 = resto1 < 2 ? 0 : 11 - resto1;
  n.push(digito1);

  // Segundo dígito verificador
  let d2 = 0;
  for (let i = 0; i < 10; i++) {
    d2 += n[i] * (11 - i);
  }
  let resto2 = d2 % 11;
  let digito2 = resto2 < 2 ? 0 : 11 - resto2;
  n.push(digito2);

  // Formata como 000.000.000-00
  return `${n[0]}${n[1]}${n[2]}.${n[3]}${n[4]}${n[5]}.${n[6]}${n[7]}${n[8]}-${n[9]}${n[10]}`;
}

Cypress.Commands.add('loginAdmin', () => {
  cy.clearLocalStorage();
  cy.visit('/login');
  cy.get('input[name="login"]').clear().type('Admin');
  cy.get('input[name="senha"]').clear().type('123456');
  cy.get('button[type="submit"]').click();

  // Aguarda autenticar e redirecionar para fora da página de login
  cy.url({ timeout: 10000 }).should('not.include', '/login');
});
