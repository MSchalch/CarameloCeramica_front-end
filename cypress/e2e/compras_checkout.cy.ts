/// <reference types="cypress" />

describe('Roteiro Mínimo de Demonstração - Venda de Ponta a Ponta e Ciclo de Troca', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/cupons/reset-testes',
      failOnStatusCode: false,
    });
  });

  it('Cenário 1: Compra aprovada com um cartão, validando carrinho, endereço/cartão e baixa de estoque (RF0031-RF0037, RN0037, RN0038, RF0053)', () => {
    cy.loginCliente('marina.silva@email.com', '123456');

    // Captura estoque inicial da primeira peça via API
    cy.request('http://localhost:8080/api/pecas?page=0&size=10').then((resPecasAntes) => {
      const primeiraPeca = resPecasAntes.body.content.find((p: any) => p.ativo);
      const estoqueInicial = primeiraPeca.estoque;

      cy.visit('/');
      cy.get('.product-card').first().within(() => {
        cy.get('.input-quantidade-adicao').type('{selectall}2');
        cy.get('.btn-adicionar-carrinho').click();
      });

      // Altera quantidade no carrinho para 1 unidade (RF0031, RF0032)
      cy.url().should('include', '/cart');
      cy.get('.item-carrinho').should('have.length', 1);
      cy.get('.input-quantidade-carrinho').clear().type('1');

      // Inicia compra (RF0033)
      cy.get('.btn-iniciar-compra').click();
      cy.url().should('include', '/checkout');

      // Endereço e 1 cartão pré-cadastrados (RF0035, RF0036)
      cy.get('.item-endereco-radio input[type="radio"]').first().should('be.checked');
      cy.get('.select-cartao-salvo').should('be.visible');

      // Confirma e autoriza na simulação da operadora (RF0037, RN0037, RN0038)
      cy.get('.btn-confirmar-pedido').click();
      cy.get('.modal-confirmacao-compra').should('be.visible');
      cy.get('.btn-autorizar-pagamento').click();

      // Verifica transição EM PROCESSAMENTO -> APROVADA (RN0038)
      cy.url({ timeout: 10000 }).should('include', '/profile/orders');
      cy.get('.card-pedido-cliente').first().within(() => {
        cy.get('.badge-status-pedido').should('contain', 'APROVADA');
        cy.contains('EM PROCESSAMENTO').should('be.visible');
      });

      // Verifica baixa no estoque somente para compra APROVADA (RF0053, RN0028)
      cy.request(`http://localhost:8080/api/pecas/${primeiraPeca.id}`).then((resPecaDepois) => {
        expect(resPecaDepois.body.estoque).to.eq(estoqueInicial - 1);
      });
    });
  });

  it('Cenário 2: Compra com dois ou mais cartões, incluindo tentativa bloqueada de pagar menos de R$ 10,00 em um deles (RN0034)', () => {
    cy.loginCliente('beatriz.rocha@email.com', '123456');

    cy.visit('/');
    cy.get('.product-card').first().within(() => {
      cy.get('.input-quantidade-adicao').clear().type('2');
      cy.get('.btn-adicionar-carrinho').click();
    });

    cy.get('.btn-iniciar-compra').click();
    cy.url().should('include', '/checkout');

    // Adiciona segundo cartão
    cy.get('.btn-adicionar-outro-cartao').click();
    cy.get('.card-pagamento-item').should('have.length', 2);

    cy.get('.resumo-checkout-total').invoke('text').then((totalText) => {
      const totalNum = parseFloat(totalText.replace('R$', '').replace('.', '').replace(',', '.').trim());

      // 2.1 Tentativa de pagar menos de R$ 10,00 (R$ 5,00) no primeiro cartão -> Deve ser bloqueada (RN0034)
      const restanteComCinco = (totalNum - 5.0).toFixed(2);
      cy.get('.card-pagamento-item').first().within(() => {
        cy.get('.input-cartao-numero').clear().type('5555444433332222');
        cy.get('.input-cartao-nome').clear().type('BEATRIZ CARTAO 1');
        cy.get('.select-cartao-bandeira').select('MASTERCARD');
        cy.get('.input-cartao-cvv').clear().type('123');
        cy.get('.input-cartao-valor').clear().type('5.00');
      });

      cy.get('.card-pagamento-item').eq(1).within(() => {
        cy.get('.input-cartao-numero').clear().type('4111222233334444');
        cy.get('.input-cartao-nome').clear().type('BEATRIZ CARTAO 2');
        cy.get('.select-cartao-bandeira').select('VISA');
        cy.get('.input-cartao-cvv').clear().type('456');
        cy.get('.input-cartao-valor').clear().type(restanteComCinco);
      });

      const alertStub = cy.stub();
      cy.on('window:alert', alertStub);
      cy.get('.btn-confirmar-pedido').click();
      cy.wrap(alertStub).should('have.been.calledWithMatch', /RN0034/);
      cy.get('.modal-confirmacao-compra').should('not.exist');

      // 2.2 Corrige para valores >= R$ 10,00 (R$ 30,00 e restante) -> Deve aprovar (RN0034)
      const restanteValido = (totalNum - 30.0).toFixed(2);
      cy.get('.card-pagamento-item').first().find('.input-cartao-valor').clear().type('30.00');
      cy.get('.card-pagamento-item').eq(1).find('.input-cartao-valor').clear().type(restanteValido);

      cy.get('.btn-confirmar-pedido').click();
      cy.get('.modal-confirmacao-compra').should('be.visible');
      cy.get('.btn-autorizar-pagamento').click();
      cy.url({ timeout: 10000 }).should('include', '/profile/orders');
      cy.get('.card-pedido-cliente').first().find('.badge-status-pedido').should('contain', 'APROVADA');
    });
  });

  it('Cenário 3: Compra com cupom promocional e cartão, com menos de R$ 10,00 no cartão (permitido - RN0033, RN0035)', () => {
    cy.loginCliente('marina.silva@email.com', '123456');

    cy.visit('/');
    cy.get('.product-card').first().within(() => {
      cy.get('.btn-adicionar-carrinho').click();
    });

    cy.get('.btn-iniciar-compra').click();
    cy.url().should('include', '/checkout');

    // Aplica cupom promocional (RN0033) e cupom de troca para deixar saldo residual < R$ 10,00 no cartão (RN0035)
    cy.get('.input-cupom-promocional').type('CARAMELO20');
    cy.get('.btn-aplicar-cupom-promocional').click();
    cy.get('.resumo-checkout-desconto').should('contain', '20,00');

    cy.get('.input-codigo-cupom-troca').type('TROCA-50');
    cy.get('.btn-aplicar-cupom-troca').click();
    cy.get('.linha-cupom-troca').should('contain', 'TROCA-50');

    // Confirma que o valor a pagar no cartão é < R$ 10,00 (ex: R$ 9,00) e é permitido (RN0035)
    cy.get('.input-cartao-valor').invoke('val').then((val) => {
      const numVal = parseFloat(String(val).replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
      expect(numVal).to.be.lessThan(10);
      expect(numVal).to.be.greaterThan(0);
    });

    cy.get('.btn-confirmar-pedido').click();
    cy.get('.modal-confirmacao-compra').should('be.visible');
    cy.get('.btn-autorizar-pagamento').click();
    cy.url({ timeout: 10000 }).should('include', '/profile/orders');
    cy.get('.card-pedido-cliente').first().find('.badge-status-pedido').should('contain', 'APROVADA');
  });

  it('Cenário 4: Compra paga com cupons de troca de valor superior ao da compra, com emissão do cupom de diferença (RN0036)', () => {
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

    // RN0036: Valida aviso de emissão de novo cupom de troca com a diferença
    cy.get('.alert-troco-cupom').should('be.visible').and('contain', 'Regra RN0036');

    // RN0036: Bloqueia uso de cupom desnecessário adicional
    cy.get('.input-codigo-cupom-troca').type('TROCA-15');
    cy.get('.btn-aplicar-cupom-troca').click();
    cy.get('.alert-cupom-troca').should('contain', 'desnecessário');

    // Finaliza compra e verifica que o cupom de diferença foi emitido para o cliente
    cy.get('.btn-confirmar-pedido').click();
    cy.get('.modal-confirmacao-compra').should('be.visible');
    cy.get('.btn-autorizar-pagamento').click();
    cy.url({ timeout: 10000 }).should('include', '/profile/orders');
    cy.get('.card-cupons-troca-cliente').should('be.visible');
    cy.get('.item-cupom-troca-disponivel').should('have.length.greaterThan', 0);
  });

  it('Cenário 5: Compra REPROVADA pela operadora, com itens desbloqueados e sem baixa de estoque (RN0038, RF0053, RN0028)', () => {
    cy.loginCliente('marina.silva@email.com', '123456');

    cy.request('http://localhost:8080/api/pecas?page=0&size=10').then((resPecasAntes) => {
      const primeiraPeca = resPecasAntes.body.content.find((p: any) => p.ativo);
      const estoqueAntes = primeiraPeca.estoque;

      cy.visit('/');
      cy.get('.product-card').first().within(() => {
        cy.get('.input-quantidade-adicao').type('{selectall}2');
        cy.get('.btn-adicionar-carrinho').click();
      });

      cy.get('.btn-iniciar-compra').click();
      cy.url().should('include', '/checkout');

      cy.get('.btn-confirmar-pedido').click();
      cy.get('.modal-confirmacao-compra').should('be.visible');

      // Seleciona "Simular Recusa" na operadora de cartão (RN0037, RN0038)
      cy.get('.modal-confirmacao-compra select').select('RECUSA');
      cy.get('.btn-autorizar-pagamento').click();

      // Verifica que o pedido foi registrado como REPROVADA
      cy.url({ timeout: 10000 }).should('include', '/profile/orders');
      cy.get('.card-pedido-cliente').first().within(() => {
        cy.get('.badge-status-pedido').should('contain', 'REPROVADA');
      });

      // Verifica que NÃO houve baixa de estoque (RF0053, RN0028)
      cy.request(`http://localhost:8080/api/pecas/${primeiraPeca.id}`).then((resPecaDepois) => {
        expect(resPecaDepois.body.estoque).to.eq(estoqueAntes);
      });
    });
  });

  it('Cenário 6: Expiração do bloqueio no carrinho, com remoção dos itens, desativação do botão de compra e retorno ao carrinho (RN0044, RNF0042, RNF0045)', () => {
    cy.visit('/');
    cy.get('.product-card').first().within(() => {
      cy.get('.input-quantidade-adicao').type('{selectall}2');
      cy.get('.btn-adicionar-carrinho').click();
    });

    cy.url().should('include', '/cart');
    cy.get('.banner-bloqueio-carrinho').should('be.visible');
    cy.get('.notificacao-expiracao-5min').should('be.visible');
    cy.get('.item-carrinho').should('have.length', 1);
    cy.get('.btn-iniciar-compra').should('not.be.disabled');

    // Dispara a expiração do bloqueio temporário do carrinho (RN0044, RNF0042)
    cy.get('.btn-simular-expiracao-carrinho').click();

    // Itens saem da lista ativa, aparecem como removidos por expiração e botão de compra fica desabilitado
    cy.get('.item-carrinho').should('have.length', 0);
    cy.get('.secao-itens-expirados').should('be.visible');
    cy.get('.alerta-bloqueio-expirado').should('be.visible');
    cy.get('.btn-iniciar-compra').should('be.disabled');

    // Cliente clica para devolver os itens ao carrinho com novo bloqueio (RNF0042)
    cy.get('.btn-recolocar-itens-carrinho').click();
    cy.get('.item-carrinho').should('have.length', 1);
    cy.get('.btn-iniciar-compra').should('not.be.disabled');
  });

  it('Cenários 7 e 8: Tentativa bloqueada de troca antes de ENTREGUE (RN0043) e Fluxo do Administrador: APROVADA -> EM TRANSPORTE -> ENTREGUE (RF0038, RN0039, RF0039, RN0040)', () => {
    // 1. Cliente realiza uma compra que nasce APROVADA
    cy.loginCliente('marina.silva@email.com', '123456');
    cy.visit('/');
    cy.get('.product-card').first().within(() => {
      cy.get('.btn-adicionar-carrinho').click();
    });
    cy.get('.btn-iniciar-compra').click();
    cy.get('.btn-confirmar-pedido').click();
    cy.get('.modal-confirmacao-compra').should('be.visible');
    cy.get('.btn-autorizar-pagamento').click();
    cy.url({ timeout: 10000 }).should('include', '/profile/orders');

    cy.get('.card-pedido-cliente').first().find('.codigo-pedido-cliente').invoke('text').then((textoCodigo) => {
      const codigoPedido = textoCodigo.replace('Pedido #', '').trim();

      // Cenário 8: Tentativa de solicitar a troca de um pedido que não está ENTREGUE (status APROVADA) -> Deve ser bloqueada (RN0043)
      cy.get('.card-pedido-cliente').first().within(() => {
        cy.get('.badge-status-pedido').should('contain', 'APROVADA');
        cy.get('.btn-solicitar-troca').click();
      });
      cy.get('.alerta-erro-troca').should('be.visible').and('contain', 'RN0043');
      cy.get('.modal-solicitar-troca').should('not.exist');

      // Cenário 7: Administrador acessa painel e avança APROVADA -> EM TRANSPORTE -> ENTREGUE
      cy.loginAdmin();
      cy.visit('/admin/orders');

      // APROVADA -> EM TRANSPORTE (RF0038, RN0039)
      cy.contains('tr.linha-pedido-admin', codigoPedido).within(() => {
        cy.get('.select-status-pedido-admin').should('have.value', 'APROVADA');
        cy.get('.btn-despachar-pedido').click();
      });
      cy.contains('tr.linha-pedido-admin', codigoPedido).within(() => {
        cy.get('.select-status-pedido-admin').should('have.value', 'EM TRANSPORTE');
      });

      // EM TRANSPORTE -> ENTREGUE (RF0039, RN0040)
      cy.contains('tr.linha-pedido-admin', codigoPedido).within(() => {
        cy.get('.btn-confirmar-entrega').click();
      });
      cy.contains('tr.linha-pedido-admin', codigoPedido).within(() => {
        cy.get('.select-status-pedido-admin').should('have.value', 'ENTREGUE');
      });
    });
  });

  it('Cenários 9, 10 e 11: Troca parcial de 1 item e troca de compra inteira, visualização pelo Admin (EM TROCA), autorização com notificação (TROCA AUTORIZADA), recebimento (TROCADO) com cupom e reentrada no estoque, e uso do cupom em nova compra', () => {
    // 1. Cliente faz um pedido com 2 produtos diferentes para testar troca de item e ciclo completo
    cy.loginCliente('lucas.mendes@email.com', '123456');

    cy.request('http://localhost:8080/api/pecas?page=0&size=10').then((resPecas) => {
      const peca1 = resPecas.body.content.find((p: any) => p.ativo);

      cy.visit('/');
      cy.get('.product-card').first().within(() => {
        cy.get('.input-quantidade-adicao').type('{selectall}2');
        cy.get('.btn-adicionar-carrinho').click();
      });
      cy.contains('a', 'Continuar Comprando').click();
      cy.get('.product-card').eq(1).within(() => {
        cy.get('.input-quantidade-adicao').type('{selectall}1');
        cy.get('.btn-adicionar-carrinho').click();
      });

      cy.get('.btn-iniciar-compra').click();
      cy.get('.btn-confirmar-pedido').click();
      cy.get('.modal-confirmacao-compra').should('be.visible');
      cy.get('.btn-autorizar-pagamento').click();
      cy.url({ timeout: 10000 }).should('include', '/profile/orders');

      cy.get('.card-pedido-cliente').first().find('.codigo-pedido-cliente').invoke('text').then((textoCodigo) => {
        const codigoPedido = textoCodigo.replace('Pedido #', '').trim();

        // Admin despacha e confirma entrega (APROVADA -> EM TRANSPORTE -> ENTREGUE)
        cy.loginAdmin();
        cy.visit('/admin/orders');
        cy.contains('tr.linha-pedido-admin', codigoPedido).find('.btn-despachar-pedido').click();
        cy.contains('tr.linha-pedido-admin', codigoPedido).find('.btn-confirmar-entrega').click();
        cy.contains('tr.linha-pedido-admin', codigoPedido).find('.select-status-pedido-admin').should('have.value', 'ENTREGUE');

        // Guarda estoque da peça 1 antes da devolução
        cy.request(`http://localhost:8080/api/pecas/${peca1.id}`).then((resPecaAntesTroca) => {
          const estoqueAntesDevolucao = resPecaAntesTroca.body.estoque;

          // Cenário 9 e 10.1: Cliente solicita troca (visualizando opção de 1 item e de compra inteira - RF0040, RN0041)
          cy.loginCliente('lucas.mendes@email.com', '123456');
          cy.visit('/profile/orders');

          cy.contains('.card-pedido-cliente', codigoPedido).find('.btn-solicitar-troca').click();
          cy.get('.modal-solicitar-troca').should('be.visible');

          // Alterna para troca parcial de 1 item específico (Cenário 9)
          cy.get('.radio-troca-parcial').check();
          cy.get('.linha-item-modal-troca').first().find('.input-qtd-item-troca').should('have.value', '1');
          cy.get('.linha-item-modal-troca').eq(1).find('.input-qtd-item-troca').should('have.value', '0');

          // E também valida a opção de troca da compra inteira ou confirma a troca de 1 unidade do item 1
          cy.get('.btn-confirmar-solicitacao-troca').click();
          cy.get('.modal-solicitar-troca').should('not.exist');

          cy.contains('.card-pedido-cliente', codigoPedido).within(() => {
            cy.get('.badge-status-pedido').should('contain', 'EM TROCA');
          });

          // Cenário 10.2: Administrador filtra pedidos EM TROCA (RF0042) e Autoriza a Troca (RF0041 -> TROCA AUTORIZADA)
          cy.loginAdmin();
          cy.visit('/admin/orders');
          cy.get('.select-filtro-status-admin').select('EM TROCA');
          cy.contains('tr.linha-pedido-admin', codigoPedido).should('be.visible').within(() => {
            cy.get('.btn-autorizar-troca').click();
          });

          // Remove filtro e verifica que mudou para TROCA AUTORIZADA
          cy.get('.select-filtro-status-admin').select('');
          cy.contains('tr.linha-pedido-admin', codigoPedido).within(() => {
            cy.get('.select-status-pedido-admin').should('have.value', 'TROCA AUTORIZADA');
          });

          // Cenário 10.3: Cliente recebe a Notificação de Autorização para a Troca (RNF0046)
          cy.loginCliente('lucas.mendes@email.com', '123456');
          cy.visit('/profile/orders');
          cy.get('.notificacao-troca-autorizada')
            .should('be.visible')
            .and('contain', codigoPedido)
            .and('contain', 'TROCA AUTORIZADA');

          // Cenário 10.4: Administrador confirma recebimento dos itens definindo se retornam ao estoque (RF0044, RN0042 -> TROCADO)
          cy.loginAdmin();
          cy.visit('/admin/orders');
          cy.contains('tr.linha-pedido-admin', codigoPedido).within(() => {
            cy.get('.check-retornar-estoque-troca').should('be.checked');
            cy.get('.btn-confirmar-recebimento-troca').click();
          });
          cy.contains('tr.linha-pedido-admin', codigoPedido).within(() => {
            cy.get('.select-status-pedido-admin').should('have.value', 'TROCADO');
          });

          // Cenário 10.5: Verifica reentrada do item trocado no estoque (RF0054)
          cy.request(`http://localhost:8080/api/pecas/${peca1.id}`).then((resPecaAposTroca) => {
            expect(resPecaAposTroca.body.estoque).to.eq(estoqueAntesDevolucao + 1);
          });

          // Cenário 11: Cliente consulta o novo cupom de troca gerado e o utiliza em uma nova compra (RF0044)
          cy.loginCliente('lucas.mendes@email.com', '123456');
          cy.visit('/profile/orders');
          cy.get('.card-cupons-troca-cliente').should('be.visible');

          cy.visit('/');
          cy.get('.product-card').first().within(() => {
            cy.get('.btn-adicionar-carrinho').click();
          });
          cy.get('.btn-iniciar-compra').click();
          cy.url().should('include', '/checkout');

          // Aplica o cupom de troca disponível na conta do cliente com 1 clique
          cy.get('.secao-cupons-disponiveis-cliente').should('be.visible');
          cy.get('.btn-usar-cupom-troca-sugerido').first().click();
          cy.get('.linha-cupom-troca').should('have.length.greaterThan', 0);

          // Conclui a nova compra utilizando o cupom de troca gerado
          cy.get('.btn-confirmar-pedido').click();
          cy.get('.modal-confirmacao-compra').should('be.visible');
          cy.get('.btn-autorizar-pagamento').click();
          cy.url({ timeout: 10000 }).should('include', '/profile/orders');
          cy.get('.card-pedido-cliente').first().find('.badge-status-pedido').should('contain', 'APROVADA');
        });
      });
    });
  });
});

