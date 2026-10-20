/// <reference types="cypress" />

describe('Validação de Cadastro de Peças e Controle de Estoque (Documento de Requisitos)', () => {
  const timestamp = Date.now();
  const nomePeca = `Bowl Artesanal Teste ${timestamp}`;

  beforeEach(() => {
    cy.loginAdmin();
  });

  it('1. RF0011, RNF0021, RN0011, RN0012, RN0013, RN0014: Cadastra peça com múltiplas categorias, SKU automático e valida margem de lucro', () => {
    cy.visit('/product/new');

    cy.get('input[name="nome"]').type(nomePeca);
    cy.get('input[name="artesaoMarca"]').clear().type('Ateliê Caramelo');
    cy.get('select[name="categoria"]').select('Bowls');

    // RN0012: Seleciona categoria adicional
    cy.get('#cat-adic-Pratos').check();

    cy.get('input[name="tipoArgila"]').clear().type('Argila Terracota');
    cy.get('input[name="tipoEsmalte"]').clear().type('Esmalte Reativo');
    cy.get('input[name="altura"]').clear().type('9');
    cy.get('input[name="diametro"]').clear().type('16');
    cy.get('input[name="peso"]').clear().type('450');
    cy.get('input[name="volume"]').clear().type('550');
    cy.get('select[name="grupoPrecificacao"]').select('Premium'); // Margem 50%
    cy.get('input[name="custo"]').clear().type('40'); // Preço mínimo sugerido = R$ 60,00

    // RN0014: Digita valor de venda abaixo da margem (R$ 50,00 < R$ 60,00) -> exibe alerta de autorização de gerente
    cy.get('input[name="valorVenda"]').clear().type('50');
    cy.get('.alerta-margem-gerente').should('be.visible');
    cy.get('.check-autorizacao-gerente').check();

    cy.get('input[name="estoque"]').clear().type('8');
    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 10000 }).should('include', '/admin/products');
    cy.contains('tr', nomePeca).should('be.visible');
  });

  it('2. RF0051, RN0050, RN0051, RN0061, RN0062, RN0064: Realiza Entrada em Estoque com nivelamento pelo maior custo', () => {
    cy.visit('/admin/products');
    cy.contains('tr', nomePeca).within(() => {
      cy.get('.btn-entrada-estoque').click();
    });

    cy.get('.modal-entrada-estoque').should('be.visible');
    cy.get('.input-qtd-entrada').clear().type('5');
    cy.get('.input-custo-entrada').clear().type('50'); // Maior que R$ 40,00 -> com margem 50% (Premium), preço de venda vai para R$ 75,00 (RN0051)
    cy.get('.input-fornecedor-entrada').clear().type('Estúdio Cerâmica Paulista');
    cy.get('.btn-confirmar-entrada-estoque').click();

    cy.get('.modal-entrada-estoque').should('not.exist');
    cy.contains('tr', nomePeca).within(() => {
      cy.contains('13 un.').should('be.visible');
      cy.contains('R$ 75,00').should('be.visible');
    });
  });

  it('3. RF0012, RF0016, RN0015, RN0017: Inativa e reativa peça exigindo justificativa e categoria', () => {
    cy.visit('/admin/products');

    // Inativar (RF0012, RN0015)
    cy.contains('tr', nomePeca).within(() => {
      cy.get('.btn-toggle-status-peca').click();
    });
    cy.get('.modal-status-peca').should('be.visible');
    cy.get('.select-categoria-status-peca').select('PECA_DESCONTINUADA');
    cy.get('.input-justificativa-status-peca').clear().type('Lote encerrado temporariamente (RN0015)');
    cy.get('.btn-confirmar-status-peca').click();

    cy.get('.modal-status-peca').should('not.exist');
    cy.contains('tr', nomePeca).within(() => {
      cy.contains('.badge', 'Inativo').should('be.visible');
      cy.get('.btn-toggle-status-peca').click();
    });

    // Reativar (RF0016, RN0017)
    cy.get('.modal-status-peca').should('be.visible');
    cy.get('.select-categoria-status-peca').select('NOVA_FORNADA');
    cy.get('.input-justificativa-status-peca').clear().type('Nova fornada recebida no ateliê (RN0017)');
    cy.get('.btn-confirmar-status-peca').click();

    cy.get('.modal-status-peca').should('not.exist');
    cy.contains('tr', nomePeca).within(() => {
      cy.contains('.badge', 'Ativo').should('be.visible');
    });
  });
});
