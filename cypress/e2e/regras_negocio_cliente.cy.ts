/// <reference types="cypress" />
import { gerarCpfValido } from '../support/commands';

describe('Validação Rigorosa das Regras de Negócio de Clientes (Documento de Requisitos)', () => {
  const timestamp = Date.now();
  const nomeCliente = `Cliente Requisitos ${timestamp}`;
  const emailCliente = `requisitos.${timestamp}@caramelo.com`;
  const cpfCliente = gerarCpfValido();
  const telefoneCliente = '(11) 98765-4321';

  beforeEach(() => {
    cy.loginAdmin();
  });

  it('RNF0032: Deve impedir cadastro quando as senhas de confirmação não coincidirem', () => {
    cy.visit('/customer/new');

    cy.get('input[name="nome"]').type('Cliente Teste Invalido');
    cy.get('input[name="email"]').type(`invalido.${Date.now()}@email.com`);
    cy.get('input[name="cpf"]').type(gerarCpfValido());
    cy.get('input[name="telefone"]').type('(11) 91234-5678');
    cy.get('input[name="dataNascimento"]').type('1990-01-01');
    cy.get('select[name="genero"]').select('Feminino');

    // Senhas diferentes
    cy.get('input[name="senha"]').type('SenhaForte@123');
    cy.get('input[name="confirmarSenha"]').type('SenhaDiferente@999');

    // Alerta em tempo real no campo
    cy.get('.invalid-feedback')
      .should('be.visible')
      .and('contain', 'As senhas não coincidem');

    // Ao tentar submeter, dispara window:alert e não redireciona
    cy.on('window:alert', (text) => {
      expect(text).to.contain('não coincidem');
    });

    cy.get('button[type="submit"]').contains('Cadastrar Cliente').click();
    cy.url().should('include', '/customer/new');
  });

  it('RNF0031: Deve impedir cadastro quando a senha for fraca (sem maiúscula, minúscula, especial ou menos de 8 dígitos)', () => {
    cy.visit('/customer/new');

    cy.get('input[name="nome"]').type('Cliente Senha Fraca');
    cy.get('input[name="email"]').type(`senhafraca.${Date.now()}@email.com`);
    cy.get('input[name="cpf"]').type(gerarCpfValido());
    cy.get('input[name="telefone"]').type('(11) 91234-5678');
    cy.get('input[name="dataNascimento"]').type('1990-01-01');
    cy.get('select[name="genero"]').select('Feminino');

    // 1. Senha com menos de 8 caracteres
    cy.get('input[name="senha"]').type('Fraca@1');
    cy.get('input[name="confirmarSenha"]').type('Fraca@1');
    cy.contains('.invalid-feedback', 'A senha deve conter no mínimo 8 caracteres').should('be.visible');

    // 2. Senha sem caractere especial
    cy.get('input[name="senha"]').clear().type('SenhaSemEspecial123');
    cy.get('input[name="confirmarSenha"]').clear().type('SenhaSemEspecial123');
    cy.contains('.invalid-feedback', 'A senha deve conter no mínimo 8 caracteres').should('be.visible');

    // Ao tentar submeter com senha fraca, exibe alerta e bloqueia o envio
    cy.on('window:alert', (text) => {
      expect(text).to.contain('Senha fraca');
    });

    cy.get('button[type="submit"]').contains('Cadastrar Cliente').click();
    cy.url().should('include', '/customer/new');
  });

  it('RF0021, RN0026 e RNF0035: Deve cadastrar cliente com todos os dados obrigatórios e gerar Código Único', () => {
    cy.visit('/customer/new');

    // RN0026: Gênero, Nome, Data de Nascimento, CPF, Telefone, e-mail, senha, endereço
    cy.get('input[name="nome"]').type(nomeCliente);
    cy.get('input[name="email"]').type(emailCliente);
    cy.get('input[name="cpf"]').type(cpfCliente);
    cy.get('input[name="telefone"]').type(telefoneCliente);
    cy.get('input[name="dataNascimento"]').type('1994-06-15');
    cy.get('select[name="genero"]').select('Masculino');
    cy.get('input[name="senha"]').type('SenhaForte@123');
    cy.get('input[name="confirmarSenha"]').type('SenhaForte@123');

    // RN0021, RN0022 e RN0023: Endereço com composição completa e tipo AMBOS
    cy.get('input[name="identificacao"]').type('Residência Principal');
    cy.get('select[name="tipoResidencia"]').select('Apartamento');
    cy.get('input[name="cep"]').type('04538-133');
    cy.get('input[name="logradouro"]').type('Avenida Brigadeiro Faria Lima');
    cy.get('input[name="numero"]').type('3477');
    cy.get('input[name="bairro"]').type('Itaim Bibi');
    cy.get('input[name="cidade"]').type('São Paulo');
    cy.get('input[name="estado"]').clear().type('SP');
    cy.get('select[name="tipoEndereco"]').select('AMBOS');

    cy.get('button[type="submit"]').contains('Cadastrar Cliente').click();

    cy.get('.alert-success', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'sucesso');

    cy.url({ timeout: 10000 }).should('include', '/admin/customers');

    // RNF0035: Valida que o cliente recebeu um Código de Cliente único na tabela
    cy.contains('tr', nomeCliente, { timeout: 10000 }).within(() => {
      cy.get('td').contains('CLI-').should('be.visible');
    });
  });

  it('RF0026 e RNF0034: Deve adicionar novo endereço de entrega com frase curta sem alterar outros dados', () => {
    cy.visit('/admin/customers');

    cy.get('input[placeholder*="Buscar por nome"]').clear().type(nomeCliente);
    cy.get('button').contains('Buscar').click();

    cy.contains('tr', nomeCliente).within(() => {
      cy.get('button[title="Ver Detalhes / Editar"]').click();
    });

    cy.get('.modal').should('be.visible');

    // Acessa aba Endereços
    cy.contains('button.nav-link', 'Endereços').click();

    // Clica em Novo Endereço (RF0026)
    cy.contains('button', 'Novo Endereço').click();

    // Preenche novo endereço de entrega com nome/frase curta (RF0026)
    cy.get('input[name="identificacao"]').clear().type('Escritório Comercial');
    cy.get('select[name="tipoResidencia"]').select('Comercial');
    cy.get('input[name="cep"]').clear().type('01310-100');
    cy.get('input[name="logradouro"]').clear().type('Avenida Paulista');
    cy.get('input[name="numero"]').clear().type('1000');
    cy.get('input[name="bairro"]').clear().type('Bela Vista');
    cy.get('input[name="cidade"]').clear().type('São Paulo');
    cy.get('input[name="estado"]').clear().type('SP');
    cy.get('select[name="tipoEndereco"]').select('ENTREGA');

    cy.get('.modal button').contains('Salvar Endereço').click();

    // Valida que o endereço foi associado ao cliente
    cy.contains('Escritório Comercial').should('be.visible');
    cy.contains('Avenida Paulista').should('be.visible');

    // Fecha o modal
    cy.get('.modal .btn-close').first().click();
    cy.get('.modal').should('not.exist');
  });

  it('RF0027, RN0024 e RN0025: Deve associar cartão de crédito com bandeira permitida e preferencial', () => {
    cy.visit('/admin/customers');

    cy.get('input[placeholder*="Buscar por nome"]').clear().type(nomeCliente);
    cy.get('button').contains('Buscar').click();

    cy.contains('tr', nomeCliente).within(() => {
      cy.get('button[title="Ver Detalhes / Editar"]').click();
    });

    cy.get('.modal').should('be.visible');

    // Acessa aba Cartões
    cy.contains('button.nav-link', 'Cartões').click();

    // Clica em Novo Cartão
    cy.contains('button', 'Novo Cartão').click();

    // RN0024: Nº, Nome Impresso, Bandeira, Código de Segurança. RN0025: Bandeira permitida
    cy.get('.modal input[name="numero"]').type('5412751234123456');
    cy.get('.modal input[name="nomeImpresso"]').type('CLIENTE REQUISITOS');
    cy.get('.modal select[name="bandeira"]').select('MASTERCARD');
    cy.get('.modal input[name="codigoSeguranca"]').type('321');

    // RF0027: Cartão configurado como preferencial
    cy.get('.modal input#preferencial').check();

    cy.get('.modal button').contains('Salvar Cartão').click();

    // Confirma que o cartão aparece listado com status Preferencial
    cy.contains('MASTERCARD').should('be.visible');
    cy.contains('span', 'Preferencial').should('be.visible');

    cy.get('.modal .btn-close').first().click();
    cy.get('.modal').should('not.exist');
  });

  it('RF0028: Deve permitir a alteração apenas de senha sem alterar outros dados cadastrais', () => {
    cy.visit('/admin/customers');

    cy.get('input[placeholder*="Buscar por nome"]').clear().type(nomeCliente);
    cy.get('button').contains('Buscar').click();

    cy.contains('tr', nomeCliente).within(() => {
      cy.get('button[title="Ver Detalhes / Editar"]').click();
    });

    cy.get('.modal').should('be.visible');

    // Preenche apenas a nova senha e confirmação
    cy.get('.modal input[name="senha"]').clear().type('NovaSenhaSegura@2026');
    cy.get('.modal input[name="confirmarSenha"]').clear().type('NovaSenhaSegura@2026');

    cy.get('.modal button[type="submit"]').contains('Salvar Alterações').click();

    cy.get('.modal .alert-success', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'sucesso');

    cy.get('.modal .btn-close').first().click();
  });

  it('RF0025: Deve disponibilizar no cadastro de clientes a consulta de todas as transações', () => {
    cy.visit('/admin/customers');

    cy.get('input[placeholder*="Buscar por nome"]').clear().type(nomeCliente);
    cy.get('button').contains('Buscar').click();

    // Clica no botão de Histórico de Pedidos / Transações
    cy.contains('tr', nomeCliente).within(() => {
      cy.get('button[title="Histórico de Pedidos"]').click();
    });

    // Modal de histórico de pedidos deve abrir
    cy.get('.modal').should('be.visible');
    cy.contains('Histórico de Pedidos').should('be.visible');
    cy.contains(nomeCliente).should('be.visible');

    cy.get('.modal .btn-close').click();
    cy.get('.modal').should('not.exist');
  });

  it('RF0024: Consulta de clientes com base em filtro definido pelo usuário', () => {
    cy.visit('/admin/customers');

    // Consulta por CPF
    cy.get('input[placeholder*="Buscar por nome"]').clear().type(cpfCliente);
    cy.get('button').contains('Buscar').click();
    cy.contains('td', nomeCliente).should('be.visible');

    // Consulta por E-mail
    cy.get('input[placeholder*="Buscar por nome"]').clear().type(emailCliente);
    cy.get('button').contains('Buscar').click();
    cy.contains('td', nomeCliente).should('be.visible');
  });

  it('RF0023: Deve inativar e reativar o cadastro do cliente', () => {
    cy.visit('/admin/customers');

    cy.get('input[placeholder*="Buscar por nome"]').clear().type(nomeCliente);
    cy.get('button').contains('Buscar').click();

    cy.on('window:confirm', () => true);

    cy.contains('tr', nomeCliente).within(() => {
      cy.get('.badge').contains('Ativo').should('be.visible');
      cy.get('button[title="Inativar Cliente"]').click();
      cy.get('.badge').contains('Inativo').should('be.visible');

      cy.get('button[title="Reativar Cliente"]').click();
      cy.get('.badge').contains('Ativo').should('be.visible');
    });
  });
});
