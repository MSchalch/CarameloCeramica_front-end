/// <reference types="cypress" />
import { gerarCpfValido } from '../support/commands';

describe('Gestão de Clientes - Fluxo Completo E2E', () => {
  const timestamp = Date.now();
  const nomeCliente = `Cliente Teste Cypress ${timestamp}`;
  const nomeClienteAtualizado = `Cliente Teste Cypress Atualizado ${timestamp}`;
  const emailCliente = `cypress.${timestamp}@caramelo.com`;
  const cpfCliente = gerarCpfValido();
  const telefoneCliente = '(11) 98765-4321';

  beforeEach(() => {
    // Efetua login como Administrador antes de cada teste
    cy.loginAdmin();
  });

  it('1. Deve cadastrar um novo cliente com sucesso preenchendo todos os dados obrigatórios', () => {
    // Acessa a página de cadastro de novo cliente
    cy.visit('/customer/new');
    cy.contains('h3', 'Novo Cliente').should('be.visible');

    // 1. Dados Pessoais
    cy.get('input[name="nome"]').type(nomeCliente);
    cy.get('input[name="email"]').type(emailCliente);
    cy.get('input[name="cpf"]').type(cpfCliente);
    cy.get('input[name="telefone"]').type(telefoneCliente);
    cy.get('input[name="dataNascimento"]').type('1992-08-20');
    cy.get('select[name="genero"]').select('Feminino');
    cy.get('input[name="senha"]').type('SenhaForte@123');
    cy.get('input[name="confirmarSenha"]').type('SenhaForte@123');

    // 2. Endereço Obrigatório Inicial
    cy.get('input[name="identificacao"]').type('Residência Principal');
    cy.get('select[name="tipoResidencia"]').select('Casa');
    cy.get('input[name="cep"]').type('01001-000');
    cy.get('input[name="logradouro"]').type('Praça da Sé');
    cy.get('input[name="numero"]').type('100');
    cy.get('input[name="bairro"]').type('Sé');
    cy.get('input[name="cidade"]').type('São Paulo');
    cy.get('input[name="estado"]').clear().type('SP');
    cy.get('select[name="tipoEndereco"]').select('AMBOS');

    // Submete o formulário
    cy.get('button[type="submit"]').contains('Cadastrar Cliente').click();

    // Valida mensagem de sucesso
    cy.get('.alert-success', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'sucesso');

    // Aguarda o redirecionamento automático para a lista de clientes
    cy.url({ timeout: 10000 }).should('include', '/admin/customers');

    // Valida se o cliente aparece na tabela
    cy.contains('td', nomeCliente).should('be.visible');
  });

  it('2. Deve buscar e editar os dados do cliente cadastrado', () => {
    cy.visit('/admin/customers');

    // Filtra pelo cliente criado
    cy.get('input[placeholder*="Buscar por nome"]').clear().type(nomeCliente);
    cy.get('button').contains('Buscar').click();

    // Localiza a linha do cliente e clica no botão Editar
    cy.contains('tr', nomeCliente)
      .should('be.visible')
      .within(() => {
        cy.get('button[title="Ver Detalhes / Editar"]').click();
      });

    // Modal de edição deve abrir
    cy.get('.modal').should('be.visible');
    cy.contains('.modal-title', 'Gerenciar Perfil').should('be.visible');

    // Altera o nome do cliente
    cy.get('.modal input[name="nome"]').clear().type(nomeClienteAtualizado);

    // Clica em Salvar Alterações
    cy.get('.modal button[type="submit"]').contains('Salvar Alterações').click();

    // Valida mensagem de sucesso no modal
    cy.get('.modal .alert-success')
      .should('be.visible')
      .and('contain', 'sucesso');

    // Fecha o modal
    cy.get('.modal .btn-close').first().click();
    cy.get('.modal').should('not.exist');

    // Limpa a busca e pesquisa pelo novo nome
    cy.get('input[placeholder*="Buscar por nome"]').clear().type(nomeClienteAtualizado);
    cy.get('button').contains('Buscar').click();

    // Confirma que o nome foi atualizado na tabela
    cy.contains('td', nomeClienteAtualizado).should('be.visible');
  });

  it('3. Deve inativar e reativar o cliente com sucesso', () => {
    cy.visit('/admin/customers');

    // Busca o cliente pelo nome atualizado
    cy.get('input[placeholder*="Buscar por nome"]').clear().type(nomeClienteAtualizado);
    cy.get('button').contains('Buscar').click();

    // Intercepta a caixa de confirmação do navegador confirmando com OK
    cy.on('window:confirm', () => true);

    // Inativa o cliente
    cy.contains('tr', nomeClienteAtualizado).within(() => {
      // Confirma que atualmente está Ativo
      cy.get('.badge').contains('Ativo').should('be.visible');

      // Clica no botão de inativar
      cy.get('button[title="Inativar Cliente"]').click();

      // Verifica se o badge alterou para Inativo
      cy.get('.badge').contains('Inativo').should('be.visible');
    });

    // Reativa o cliente
    cy.contains('tr', nomeClienteAtualizado).within(() => {
      // Clica no botão de reativar
      cy.get('button[title="Reativar Cliente"]').click();

      // Verifica se o badge retornou para Ativo
      cy.get('.badge').contains('Ativo').should('be.visible');
    });
  });
});
