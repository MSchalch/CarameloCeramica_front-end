/// <reference types="cypress" />

describe('[ONLINE] Análise de Vendas: Gráfico de Linhas por Categoria (Roteiro de Demonstração 1 a 8)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/cupons/reset-testes',
      failOnStatusCode: false,
    });
  });

  it('1) Consulta de uma categoria em um período válido, com valores mensais iguais à soma das vendas ENTREGUE registradas na base', () => {
    cy.loginAdmin();
    cy.visit('/dashboard');

    cy.get('.input-data-inicio-dashboard').clear().type('2026-05-01');
    cy.get('.input-data-fim-dashboard').clear().type('2026-09-30');

    // Seleciona apenas uma categoria: Bowls
    cy.contains('button', 'Limpar').click();
    cy.contains('button', 'Bowls').click();
    cy.get('.btn-aplicar-filtros-dashboard').click();

    // Calcula a soma das vendas ENTREGUE de Bowls na base para cada mês e confere com os valores exibidos
    cy.request('http://localhost:8080/api/pedidos?size=200').then((resPedidos) => {
      const pedidos = resPedidos.body.content || [];
      let somaSetembroBowls = 0;

      pedidos.forEach((p: any) => {
        if (p.status === 'ENTREGUE' && p.dataPedido && String(p.dataPedido).startsWith('2026-09')) {
          (p.itens || []).forEach((item: any) => {
            if (item.peca?.categoria === 'Bowls') {
              somaSetembroBowls += Number(item.valorTotal || 0);
            }
          });
        }
      });

      cy.get('tr.linha-mes-dashboard[data-mes="09/2026"]')
        .find('td.celula-valor-categoria[data-categoria="Bowls"]')
        .should('have.attr', 'data-valor', somaSetembroBowls.toFixed(2));
    });
  });

  it('2) Comparação entre duas ou mais categorias no período', () => {
    cy.loginAdmin();
    cy.visit('/dashboard');

    cy.get('.input-data-inicio-dashboard').clear().type('2026-05-01');
    cy.get('.input-data-fim-dashboard').clear().type('2026-09-30');

    // Seleciona 3 categorias para comparação: Bowls, Pratos e Xícaras
    cy.contains('button', 'Limpar').click();
    cy.contains('button', 'Bowls').click();
    cy.contains('button', 'Pratos').click();
    cy.contains('button', 'Xícaras').click();
    cy.get('.btn-aplicar-filtros-dashboard').click();

    cy.get('svg.recharts-surface').should('be.visible');
    cy.get('.recharts-line').should('have.length', 3);
    cy.get('.tabela-historico-mensal thead').within(() => {
      cy.contains('th', 'Bowls').should('be.visible');
      cy.contains('th', 'Pratos').should('be.visible');
      cy.contains('th', 'Xícaras').should('be.visible');
    });
  });

  it('3) Apresentação do resultado em gráfico de linhas, com valores em reais agrupados por mês', () => {
    cy.loginAdmin();
    cy.visit('/dashboard');

    cy.get('.input-data-inicio-dashboard').clear().type('2026-05-01');
    cy.get('.input-data-fim-dashboard').clear().type('2026-10-31');
    cy.get('.btn-aplicar-filtros-dashboard').click();

    // Verifica que o componente Recharts LineChart está visível com eixo Y em R$ e eixo X agrupado em MM/yyyy
    cy.get('.recharts-responsive-container').should('be.visible');
    cy.get('svg.recharts-surface').should('be.visible');
    cy.get('.recharts-line').should('have.length.greaterThan', 0);
    cy.contains('.recharts-cartesian-axis-tick-value', '05/2026').should('be.visible');
    cy.contains('.recharts-cartesian-axis-tick-value', '09/2026').should('be.visible');
    cy.contains('.recharts-cartesian-axis-tick-value', 'R$').should('be.visible');
  });

  it('4) Alteração da data de início ou de fim resultando em um novo resultado no gráfico', () => {
    cy.loginAdmin();
    cy.visit('/dashboard');

    // Período 1: 05/2026 a 09/2026 (5 meses)
    cy.get('.input-data-inicio-dashboard').clear().type('2026-05-01');
    cy.get('.input-data-fim-dashboard').clear().type('2026-09-30');
    cy.get('.btn-aplicar-filtros-dashboard').click();

    cy.get('tr.linha-mes-dashboard').should('have.length', 5);
    cy.get('tr.linha-mes-dashboard[data-mes="05/2026"]').should('exist');

    // Período 2: Altera data de início para 08/2026 (2 meses: 08/2026 e 09/2026)
    cy.get('.input-data-inicio-dashboard').clear().type('2026-08-01');
    cy.get('.btn-aplicar-filtros-dashboard').click();

    cy.get('tr.linha-mes-dashboard').should('have.length', 2);
    cy.get('tr.linha-mes-dashboard[data-mes="05/2026"]').should('not.exist');
    cy.get('tr.linha-mes-dashboard[data-mes="08/2026"]').should('exist');
    cy.get('tr.linha-mes-dashboard[data-mes="09/2026"]').should('exist');
  });

  it('5) Compra com status diferente de ENTREGUE não contabilizada no gráfico', () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mesAnoAtual = `${mes}/${ano}`;
    const inicioMes = `${ano}-${mes}-01`;
    const fimMes = `${ano}-${mes}-${dia}`;

    cy.request('http://localhost:8080/api/pecas?page=0&size=10').then((resPecas) => {
      const pecaTeste = resPecas.body.content.find((p: any) => p.ativo && p.estoque >= 2);
      const categoriaAlvo = pecaTeste.categoria;

      cy.request(
        `http://localhost:8080/api/dashboard/analise?dataInicio=${inicioMes}&dataFim=${fimMes}&categorias=${encodeURIComponent(categoriaAlvo)}`
      ).then((resDashAntes) => {
        const pontoAntes = (resDashAntes.body.dadosGraficoLinhas || []).find(
          (p: any) => p.data === mesAnoAtual
        );
        const valorAntes = Number(pontoAntes ? pontoAntes[categoriaAlvo] || 0 : 0);

        // Realiza compra que fica com status APROVADA (diferente de ENTREGUE)
        cy.intercept('GET', '**/api/clientes/*').as('carregarClienteCheckout');
        cy.loginCliente('marina.silva@email.com', '123456');
        cy.visit('/');
        cy.contains('.product-card', pecaTeste.nome).within(() => {
          cy.get('.input-quantidade-adicao').type('{selectall}1');
          cy.get('.btn-adicionar-carrinho').click();
        });
        cy.get('.btn-iniciar-compra').click();
        cy.wait('@carregarClienteCheckout');
        cy.get('.btn-confirmar-pedido').should('not.be.disabled').click();
        cy.get('.modal-confirmacao-compra').should('be.visible');
        cy.get('.btn-autorizar-pagamento').click();
        cy.url({ timeout: 10000 }).should('include', '/profile/orders');
        cy.get('.card-pedido-cliente').first().find('.badge-status-pedido').should('contain', 'APROVADA');

        // Verifica no Dashboard que a compra APROVADA não alterou o valor do gráfico
        cy.intercept('GET', '**/api/dashboard/analise*').as('consultarAnalise');
        cy.loginAdmin();
        cy.visit('/dashboard');
        cy.wait('@consultarAnalise');
        cy.get('.input-data-inicio-dashboard').clear().type(inicioMes);
        cy.get('.input-data-fim-dashboard').clear().type(fimMes);
        cy.contains('button', 'Limpar').click();
        cy.contains('button', categoriaAlvo).click();
        cy.get('.btn-aplicar-filtros-dashboard').click();
        cy.wait('@consultarAnalise');

        cy.get(`tr.linha-mes-dashboard[data-mes="${mesAnoAtual}"]`)
          .find(`td.celula-valor-categoria[data-categoria="${categoriaAlvo}"]`)
          .should('have.attr', 'data-valor', valorAntes.toFixed(2));
      });
    });
  });

  it('6) Compra que passa a ENTREGUE dentro do período refletida na consulta seguinte', () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mesAnoAtual = `${mes}/${ano}`;
    const inicioMes = `${ano}-${mes}-01`;
    const fimMes = `${ano}-${mes}-${dia}`;

    cy.request('http://localhost:8080/api/pecas?page=0&size=10').then((resPecas) => {
      const pecaTeste = resPecas.body.content.find((p: any) => p.ativo && p.estoque >= 2);
      const categoriaAlvo = pecaTeste.categoria;

      cy.request(
        `http://localhost:8080/api/dashboard/analise?dataInicio=${inicioMes}&dataFim=${fimMes}&categorias=${encodeURIComponent(categoriaAlvo)}`
      ).then((resDashAntes) => {
        const pontoAntes = (resDashAntes.body.dadosGraficoLinhas || []).find(
          (p: any) => p.data === mesAnoAtual
        );
        const valorAntes = Number(pontoAntes ? pontoAntes[categoriaAlvo] || 0 : 0);

        // Cliente realiza uma compra (APROVADA)
        cy.intercept('GET', '**/api/clientes/*').as('carregarClienteCheckout');
        cy.loginCliente('marina.silva@email.com', '123456');
        cy.visit('/');
        cy.contains('.product-card', pecaTeste.nome).within(() => {
          cy.get('.input-quantidade-adicao').type('{selectall}1');
          cy.get('.btn-adicionar-carrinho').click();
        });
        cy.get('.btn-iniciar-compra').click();
        cy.wait('@carregarClienteCheckout');
        cy.get('.btn-confirmar-pedido').should('not.be.disabled').click();
        cy.get('.modal-confirmacao-compra').should('be.visible');
        cy.get('.btn-autorizar-pagamento').click();
        cy.url({ timeout: 10000 }).should('include', '/profile/orders');

        cy.get('.card-pedido-cliente')
          .first()
          .find('.codigo-pedido-cliente')
          .invoke('text')
          .then((textoCodigo) => {
            const codigoPedido = textoCodigo.replace('Pedido #', '').trim();

            // Admin altera status da compra para EM TRANSPORTE e depois para ENTREGUE
            cy.intercept('PUT', '**/api/pedidos').as('atualizarPedido');
            cy.loginAdmin();
            cy.visit('/admin/orders');
            cy.contains('tr.linha-pedido-admin', codigoPedido).find('.btn-despachar-pedido').click();
            cy.wait('@atualizarPedido');
            cy.contains('tr.linha-pedido-admin', codigoPedido)
              .find('.select-status-pedido-admin')
              .should('have.value', 'EM TRANSPORTE');

            cy.contains('tr.linha-pedido-admin', codigoPedido).find('.btn-confirmar-entrega').click();
            cy.wait('@atualizarPedido');
            cy.contains('tr.linha-pedido-admin', codigoPedido)
              .find('.select-status-pedido-admin')
              .should('have.value', 'ENTREGUE');

            // Na consulta seguinte ao Dashboard, o valor da compra ENTREGUE está somado no mês!
            const valorEsperadoAposEntrega = valorAntes + Number(pecaTeste.valorVenda);
            cy.intercept('GET', '**/api/dashboard/analise*').as('consultarAnalise');
            cy.visit('/dashboard');
            cy.wait('@consultarAnalise');
            cy.get('.input-data-inicio-dashboard').clear().type(inicioMes);
            cy.get('.input-data-fim-dashboard').clear().type(fimMes);
            cy.contains('button', 'Limpar').click();
            cy.contains('button', categoriaAlvo).click();
            cy.get('.btn-aplicar-filtros-dashboard').click();
            cy.wait('@consultarAnalise');

            cy.get(`tr.linha-mes-dashboard[data-mes="${mesAnoAtual}"]`)
              .find(`td.celula-valor-categoria[data-categoria="${categoriaAlvo}"]`)
              .should('have.attr', 'data-valor', valorEsperadoAposEntrega.toFixed(2));
          });
      });
    });
  });

  it('7) Acesso ao gráfico permitido ao administrador e negado a outros perfis', () => {
    // 1. Usuário não autenticado é redirecionado para /login
    cy.clearLocalStorage();
    cy.visit('/dashboard');
    cy.url().should('include', '/login');

    // 2. Perfil Cliente logado tem acesso negado com tela de Acesso Restrito
    cy.loginCliente('marina.silva@email.com', '123456');
    cy.visit('/dashboard');
    cy.contains('Acesso Restrito').should('be.visible');
    cy.contains('Apenas usuários administradores têm permissão para acessar esta página').should('be.visible');

    // 3. Perfil Administrador tem acesso permitido ao gráfico
    cy.loginAdmin();
    cy.visit('/dashboard');
    cy.contains('Painel Analítico de Vendas').should('be.visible');
    cy.get('svg.recharts-surface').should('be.visible');
  });

  it('8) Tempo de resposta da consulta de até 1 segundo (RNF0011)', () => {
    const inicio = performance.now();
    cy.request('http://localhost:8080/api/dashboard/analise?dataInicio=2026-05-01&dataFim=2026-10-31').then(
      (response) => {
        const duracaoMs = performance.now() - inicio;
        expect(response.status).to.eq(200);
        expect(duracaoMs).to.be.lessThan(1000);
      }
    );

    cy.loginAdmin();
    cy.visit('/dashboard');
    cy.get('.badge-tempo-resposta-dashboard').should('be.visible').and('contain', 'RNF0011');
  });
});
