/// <reference types="cypress" />

describe('Roteiro Mínimo da Apresentação - Fluxo de Compras e Checkout', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/cupons/reset-testes',
      failOnStatusCode: false,
    });
  });

  it('1. Inclusão de mais de um item no carrinho e alteração da quantidade de itens (RF0031, RF0032, RN0031)', () => {
    cy.visit('/');

    // 1.1 Seleciona quantidade no momento da adição no primeiro item (RF0032)
    cy.get('.product-card').first().within(() => {
      cy.get('.input-quantidade-adicao').type('{selectall}2');
      cy.get('.btn-adicionar-carrinho').click();
    });

    // Redireciona para /cart com o primeiro item
    cy.url().should('include', '/cart');
    cy.get('.item-carrinho').should('have.length', 1);
    cy.get('.input-quantidade-carrinho').should('have.value', '2');

    // 1.2 Retorna ao catálogo para adicionar um segundo produto
    cy.contains('a', 'Continuar Comprando').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/');

    cy.get('.product-card').eq(1).within(() => {
      cy.get('.input-quantidade-adicao').type('{selectall}1');
      cy.get('.btn-adicionar-carrinho').click();
    });

    // 1.3 Valida mais de um item no carrinho (RF0031)
    cy.url().should('include', '/cart');
    cy.get('.item-carrinho').should('have.length', 2);

    // 1.4 Altera quantidade na visualização do carrinho (RF0031, RF0032)
    cy.get('.item-carrinho').first().within(() => {
      cy.get('.input-quantidade-carrinho').type('{selectall}3');
    });

    // Valida que o resumo calculou subtotal e frete dinâmico
    cy.get('.resumo-subtotal').should('be.visible');
    cy.get('.resumo-frete').should('be.visible');
    cy.get('.resumo-total').should('be.visible');
  });

  it('2. Uma compra com endereço e cartão previamente cadastrados no perfil (RF0033, RF0035, RF0036, RF0038)', () => {
    // Login prévio com cliente cadastrado
    cy.loginCliente('marina.silva@email.com', '123456');

    // Adiciona peça ao carrinho
    cy.visit('/');
    cy.get('.product-card').first().within(() => {
      cy.get('.btn-adicionar-carrinho').click();
    });

    // Inicia compra a partir do carrinho (RF0033)
    cy.get('.btn-iniciar-compra').click();
    cy.url().should('include', '/checkout');

    // Seleciona endereço de entrega pré-cadastrado (RF0035)
    cy.get('.item-endereco-radio input[type="radio"]').first().should('be.checked');

    // Seleciona cartão pré-cadastrado (RF0036)
    cy.get('.select-cartao-salvo').should('be.visible');
    cy.get('.select-cartao-salvo option').should('have.length.greaterThan', 1);

    // Finaliza compra
    cy.get('.btn-confirmar-pedido').click();

    // Redireciona para pedidos e valida status EM PROCESSAMENTO (RF0038)
    cy.url({ timeout: 10000 }).should('include', '/profile/orders');
    cy.contains('EM PROCESSAMENTO', { timeout: 10000 }).should('be.visible');
  });

  it('3. Compra com novo endereço e novo cartão cadastrados durante o processo, incorporados ao perfil (RF0035, RF0036, RN0023, RN0024, RN0025)', () => {
    cy.loginCliente('lucas.mendes@email.com', '123456');

    cy.visit('/');
    cy.get('.product-card').first().within(() => {
      cy.get('.btn-adicionar-carrinho').click();
    });

    cy.get('.btn-iniciar-compra').click();
    cy.url().should('include', '/checkout');

    // 3.1 Cadastrar novo endereço durante a compra (RF0035, RN0023)
    cy.get('.btn-novo-endereco').click();
    cy.get('.modal').should('be.visible');

    const identificacaoUnica = `Casa Praia ${Date.now()}`;
    cy.get('.input-endereco-identificacao').clear().type(identificacaoUnica);
    cy.get('.select-endereco-tipo-residencia').select('Casa');
    cy.get('.input-endereco-cep').clear().type('11600-000');
    cy.get('.input-endereco-logradouro').clear().type('Avenida Beira Mar');
    cy.get('.input-endereco-numero').clear().type('777');
    cy.get('.input-endereco-bairro').clear().type('Praia Grande');
    cy.get('.input-endereco-cidade').clear().type('São Sebastião');
    cy.get('.input-endereco-estado').clear().type('SP');
    cy.get('.check-incorporar-endereco-perfil').should('be.checked');

    cy.get('.btn-salvar-novo-endereco').click();
    cy.get('.modal').should('not.exist');

    // Confirma que o novo endereço aparece e está selecionado
    cy.contains(identificacaoUnica).should('be.visible');

    // 3.2 Cadastrar novo cartão durante a compra (RF0036, RN0024, RN0025)
    cy.get('.select-cartao-salvo').select(''); // Digitar novo cartão...
    cy.get('.input-cartao-numero').clear().type('4111222233334444');
    cy.get('.input-cartao-nome').clear().type('LUCAS NOVO CARTAO');
    cy.get('.select-cartao-bandeira').select('VISA');
    cy.get('.input-cartao-cvv').clear().type('888');

    // Marca opção para salvar no perfil (RF0036)
    cy.get('.check-salvar-cartao-perfil').check();

    // Finaliza pedido
    cy.get('.btn-confirmar-pedido').click();
    cy.url({ timeout: 10000 }).should('include', '/profile/orders');

    // 3.3 Valida incorporação ao perfil do cliente
    cy.visit('/profile');
    cy.contains('.list-group-item', 'Endereços').click();
    cy.contains(identificacaoUnica).should('be.visible');

    cy.contains('.list-group-item', 'Cartões').click();
    cy.contains('VISA').should('be.visible');
    cy.contains('4111222233334444').should('be.visible');
  });

  it('4. Pagamento com mais de um cartão de crédito, respeitando o valor mínimo de R$ 10,00 por cartão (RN0034)', () => {
    cy.loginCliente('beatriz.rocha@email.com', '123456');

    cy.visit('/');
    // Adiciona peça com valor suficiente
    cy.get('.product-card').first().within(() => {
      cy.get('.input-quantidade-adicao').clear().type('2');
      cy.get('.btn-adicionar-carrinho').click();
    });

    cy.get('.btn-iniciar-compra').click();
    cy.url().should('include', '/checkout');

    // Adiciona segundo cartão
    cy.get('.btn-adicionar-outro-cartao').click();
    cy.get('.card-pagamento-item').should('have.length', 2);

    // Ajusta os valores respeitando o mínimo de R$ 10,00 em cada cartão (RN0034)
    cy.get('.card-pagamento-item').first().within(() => {
      cy.get('.input-cartao-numero').clear().type('5555444433332222');
      cy.get('.input-cartao-nome').clear().type('BEATRIZ CARTAO 1');
      cy.get('.select-cartao-bandeira').select('MASTERCARD');
      cy.get('.input-cartao-cvv').clear().type('123');
      cy.get('.input-cartao-valor').clear().type('30.00');
    });

    // Calcula o restante para o segundo cartão
    cy.get('.resumo-checkout-total').invoke('text').then((totalText) => {
      const totalNum = parseFloat(totalText.replace('R$', '').replace('.', '').replace(',', '.').trim());
      const restante = (totalNum - 30.0).toFixed(2);

      cy.get('.card-pagamento-item').eq(1).within(() => {
        cy.get('.input-cartao-numero').clear().type('4111222233334444');
        cy.get('.input-cartao-nome').clear().type('BEATRIZ CARTAO 2');
        cy.get('.select-cartao-bandeira').select('VISA');
        cy.get('.input-cartao-cvv').clear().type('456');
        cy.get('.input-cartao-valor').clear().type(restante);
      });

      cy.get('.btn-confirmar-pedido').click();
      cy.url({ timeout: 10000 }).should('include', '/profile/orders');
      cy.contains('EM PROCESSAMENTO', { timeout: 10000 }).should('be.visible');
    });
  });

  it('5. Pagamento com cartão de crédito e cupons, com valor inferior a R$ 10,00 no cartão (RN0035)', () => {
    cy.loginCliente('marina.silva@email.com', '123456');

    cy.visit('/');
    cy.get('.product-card').first().within(() => {
      cy.get('.btn-adicionar-carrinho').click();
    });

    cy.get('.btn-iniciar-compra').click();
    cy.url().should('include', '/checkout');

    // Aplica cupom de troca previamente carregado na base (RN0035)
    cy.get('.input-codigo-cupom-troca').type('TROCA-50');
    cy.get('.btn-aplicar-cupom-troca').click();
    cy.get('.linha-cupom-troca').should('contain', 'TROCA-50');

    // Aplica cupom promocional adicional de R$ 20,00 (CARAMELO20) para deixar saldo residual pequeno
    cy.get('.input-cupom-promocional').type('CARAMELO20');
    cy.get('.btn-aplicar-cupom-promocional').click();
    cy.get('.resumo-checkout-desconto').should('contain', '20,00');

    // Saldo restante no cartão é calculado automaticamente
    // RN0035 permite valor < R$ 10,00 no cartão quando combinado com cupons
    cy.get('.btn-confirmar-pedido').click();
    cy.url({ timeout: 10000 }).should('include', '/profile/orders');
    cy.contains('EM PROCESSAMENTO', { timeout: 10000 }).should('be.visible');
  });

  it('6. Uso de cupons cujo valor supere o da compra com emissão de cupom de troca e bloqueio de desnecessários (RN0036)', () => {
    cy.loginCliente('lucas.mendes@email.com', '123456');

    cy.visit('/');
    cy.get('.product-card').first().within(() => {
      cy.get('.btn-adicionar-carrinho').click();
    });

    cy.get('.btn-iniciar-compra').click();
    cy.url().should('include', '/checkout');

    // Aplica cupom de troca de R$ 200,00 (TROCA-200), que supera o valor da compra
    cy.get('.input-codigo-cupom-troca').type('TROCA-200');
    cy.get('.btn-aplicar-cupom-troca').click();
    cy.get('.linha-cupom-troca').should('contain', 'TROCA-200');

    // RN0036: Valida exibição do aviso de emissão de cupom de troca para o troco/diferença
    cy.get('.alert-troco-cupom').should('be.visible').and('contain', 'Regra RN0036');

    // RN0036: Tenta adicionar cupom de troca desnecessário quando a compra já está coberta
    cy.get('.input-codigo-cupom-troca').type('TROCA-15');
    cy.get('.btn-aplicar-cupom-troca').click();
    cy.get('.alert-cupom-troca').should('contain', 'desnecessário');

    // Finaliza pedido sem necessidade de pagamento com cartão
    cy.get('.btn-confirmar-pedido').click();
    cy.url({ timeout: 10000 }).should('include', '/profile/orders');
    cy.contains('EM PROCESSAMENTO', { timeout: 10000 }).should('be.visible');
  });

  it('7. O pedido finalizado é registrado com status EM PROCESSAMENTO (RF0038)', () => {
    cy.loginCliente('beatriz.rocha@email.com', '123456');

    cy.visit('/');
    cy.get('.product-card').first().within(() => {
      cy.get('.btn-adicionar-carrinho').click();
    });

    cy.get('.btn-iniciar-compra').click();
    cy.url().should('include', '/checkout');

    cy.get('.btn-confirmar-pedido').click();
    cy.url({ timeout: 10000 }).should('include', '/profile/orders');

    // RF0038: Validação obrigatória do status inicial
    cy.contains('EM PROCESSAMENTO', { timeout: 10000 }).should('be.visible');
  });
});
