/// <reference types="cypress" />

describe('Fluxo de Usuário Deslogado no Carrinho e Validação do Dashboard', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/cupons/reset-testes',
      failOnStatusCode: false,
    });
  });

  it('1. Usuário deslogado monta carrinho, é solicitado a fazer login ao finalizar, mantém carrinho e conclui compra', () => {
    // 1.1 Acessa o catálogo sem estar logado
    cy.visit('/');

    // 1.2 Adiciona produto ao carrinho com quantidade 2
    cy.get('.product-card').first().within(() => {
      cy.get('.input-quantidade-adicao').type('{selectall}2');
      cy.get('.btn-adicionar-carrinho').click();
    });

    // 1.3 Vai para o carrinho deslogado e valida que pode alterar itens e simular frete
    cy.url().should('include', '/cart');
    cy.get('.item-carrinho').should('have.length', 1);
    cy.get('.input-quantidade-carrinho').should('have.value', '2');

    // Altera a quantidade para 3 no carrinho
    cy.get('.item-carrinho').first().within(() => {
      cy.get('.input-quantidade-carrinho').type('{selectall}3');
    });

    // Simula frete
    cy.get('input[placeholder*="CEP"]').type('01310-100');
    cy.contains('button', 'Calcular').click();
    cy.get('.resumo-frete').should('be.visible');

    // Valida aviso de login exibido no resumo do carrinho
    cy.get('.aviso-login-carrinho').should('be.visible');

    // 1.4 Clica em finalizar compra -> Deve exigir o login
    cy.get('.btn-iniciar-compra').click();

    // 1.5 Deve ser redirecionado para a tela de login
    cy.url().should('include', '/login');
    cy.get('.aviso-login-checkout').should('be.visible');
    cy.get('.aviso-login-checkout').should('contain.text', 'Faça login para finalizar a compra do seu pedido');

    // 1.6 Tentar acessar /checkout diretamente deslogado também deve redirecionar para /login
    cy.visit('/checkout');
    cy.url().should('include', '/login');

    // 1.7 Realiza login com o cliente
    cy.get('input[name="login"]').clear().type('marina.silva@email.com');
    cy.get('input[name="senha"]').clear().type('123456');
    cy.get('button[type="submit"]').click();

    // 1.8 Após o login bem-sucedido, deve ser redirecionado de volta para /checkout com os itens preservados!
    cy.url().should('include', '/checkout');
    cy.get('.secao-resumo-pedido').should('be.visible');
    cy.get('.resumo-checkout-subtotal').should('be.visible');
    cy.get('.btn-confirmar-pedido').should('be.visible');

    // 1.9 Finaliza o pedido logado
    cy.get('.btn-confirmar-pedido').click();
    cy.get('.modal-confirmacao-compra').should('be.visible');
    cy.get('.btn-autorizar-pagamento').click();
    cy.url({ timeout: 10000 }).should('include', '/profile/orders');
    cy.contains('APROVADA', { timeout: 10000 }).should('be.visible');
  });

  it('2. Validação das funcionalidades e métricas do Dashboard com dados históricos da Migration V9', () => {
    // 2.1 Login como administrador
    cy.loginAdmin();

    // 2.2 Acessa a rota do Dashboard
    cy.visit('/dashboard');
    cy.url().should('include', '/dashboard');

    // 2.3 Valida os cabeçalhos e títulos
    cy.contains('Painel Analítico de Vendas').should('be.visible');

    // 2.4 Valida que os cards de totais por categoria e o total do período carregaram com valores reais
    cy.get('.card-total-categoria').should('have.length.greaterThan', 0);
    cy.get('.card-total-geral-periodo').should('be.visible');
    cy.contains('Total no Período').should('be.visible');

    // 2.5 Valida a presença dos filtros de período e categorias
    cy.get('input[type="date"]').should('have.length', 2);
    cy.contains('Categorias de Produtos para Análise').should('be.visible');
    cy.contains('Bowls').should('be.visible');
    cy.contains('Pratos').should('be.visible');
    cy.contains('Xícaras').should('be.visible');
    cy.contains('Vasos').should('be.visible');
    cy.contains('Travessas').should('be.visible');

    // 2.6 Valida a renderização do gráfico interativo do Recharts
    cy.get('.recharts-responsive-container').should('exist');
    cy.get('svg.recharts-surface').should('be.visible');

    // 2.7 Valida filtragem por categorias
    cy.contains('button', 'Limpar').click();
    cy.contains('button', 'Vasos').click();
    cy.contains('button', 'Aplicar Filtros').click();
    cy.get('.recharts-responsive-container').should('exist');

    // 2.8 Restaura todas as categorias
    cy.contains('button', 'Selecionar Todas').click();
    cy.contains('button', 'Aplicar Filtros').click();
    cy.get('.recharts-responsive-container').should('exist');
  });
});
