/// <reference types="cypress" />

describe('Análise de Vendas: Gráfico de Linhas por Categoria (Roteiro Completo - 8 Cenários)', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/cupons/reset-testes',
      failOnStatusCode: false,
    });
  });

  it('Cenário 1 e 3: Consulta de uma categoria em período válido, com valores mensais em R$ iguais à soma das vendas ENTREGUE na base e gráfico de linhas (RF0055, RNF0043)', () => {
    cy.loginAdmin();
    cy.visit('/dashboard');

    // Seleciona período de Maio/2026 a Setembro/2026
    cy.get('.input-data-inicio-dashboard').clear().type('2026-05-01');
    cy.get('.input-data-fim-dashboard').clear().type('2026-09-30');

    // Seleciona apenas 1 categoria: Bowls
    cy.contains('button', 'Limpar').click();
    cy.contains('button', 'Bowls').click();
    cy.get('.btn-aplicar-filtros-dashboard').click();

    // Cenário 3: Verifica renderização do Gráfico de Linhas agrupado por mês (MM/yyyy) e em R$
    cy.get('.recharts-responsive-container').should('be.visible');
    cy.get('svg.recharts-surface').should('be.visible');
    cy.get('.recharts-line').should('have.length', 1);

    // Cenário 1: Calcula a soma exata das vendas ENTREGUE de Bowls na base via API de pedidos e confere com os valores mensais do gráfico
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

      // Verifica na tabela consolidada do gráfico que o mês 09/2026 possui exatamente a soma de vendas ENTREGUE da base
      cy.get('tr.linha-mes-dashboard[data-mes="09/2026"]')
        .find('td.celula-valor-categoria[data-categoria="Bowls"]')
        .should('have.attr', 'data-valor', somaSetembroBowls.toFixed(2));
    });
  });

  it('Cenário 2: Comparação simultânea entre duas ou mais categorias no período (RF0055, RNF0043)', () => {
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

    // Valida que 3 linhas são exibidas simultaneamente no gráfico para comparação
    cy.get('svg.recharts-surface').should('be.visible');
    cy.get('.recharts-line').should('have.length', 3);
    cy.get('.tabela-historico-mensal thead').within(() => {
      cy.contains('th', 'Bowls').should('be.visible');
      cy.contains('th', 'Pratos').should('be.visible');
      cy.contains('th', 'Xícaras').should('be.visible');
    });
  });

  it('Cenário 4: Alteração da data de início ou de fim resultando em um novo resultado no gráfico (RF0055)', () => {
    cy.loginAdmin();
    cy.visit('/dashboard');

    // 1ª Consulta: Maio/2026 a Setembro/2026 (5 meses: 05/2026, 06/2026, 07/2026, 08/2026, 09/2026)
    cy.get('.input-data-inicio-dashboard').clear().type('2026-05-01');
    cy.get('.input-data-fim-dashboard').clear().type('2026-09-30');
    cy.get('.btn-aplicar-filtros-dashboard').click();

    cy.get('tr.linha-mes-dashboard').should('have.length', 5);
    cy.get('tr.linha-mes-dashboard[data-mes="05/2026"]').should('exist');

    // 2ª Consulta: Altera data de início para Agosto/2026 (2 meses: 08/2026 e 09/2026)
    cy.get('.input-data-inicio-dashboard').clear().type('2026-08-01');
    cy.get('.btn-aplicar-filtros-dashboard').click();

    cy.get('tr.linha-mes-dashboard').should('have.length', 2);
    cy.get('tr.linha-mes-dashboard[data-mes="05/2026"]').should('not.exist');
    cy.get('tr.linha-mes-dashboard[data-mes="08/2026"]').should('exist');
    cy.get('tr.linha-mes-dashboard[data-mes="09/2026"]').should('exist');
  });

  it('Cenários 5 e 6: Compra com status diferente de ENTREGUE não é contabilizada no gráfico, e passa a ser refletida na consulta seguinte ao mudar para ENTREGUE', () => {
    const hoje = new Date();
    const mesAnoAtual = `${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
    const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`;
    const fimMes = hoje.toISOString().split('T')[0];

    // 1. Consulta o valor atual no gráfico para a categoria da primeira peça no mês corrente
    cy.request('http://localhost:8080/api/pecas?page=0&size=10').then((resPecas) => {
      const pecaTeste = resPecas.body.content.find((p: any) => p.ativo && p.estoque >= 2);
      const categoriaAlvo = pecaTeste.categoria;

      cy.request(
        `http://localhost:8080/api/dashboard/analise?dataInicio=${inicioMes}&dataFim=${fimMes}&categorias=${encodeURIComponent(categoriaAlvo)}`
      ).then((resDashInicial) => {
        const pontoInicial = (resDashInicial.body.dadosGraficoLinhas || []).find(
          (p: any) => p.data === mesAnoAtual
        );
        const valorAntes = Number(pontoInicial ? pontoInicial[categoriaAlvo] || 0 : 0);

        // 2. Cliente realiza uma nova compra (status nasce APROVADA, diferente de ENTREGUE)
        cy.loginCliente('marina.silva@email.com', '123456');
        cy.visit('/');
        cy.contains('.product-card', pecaTeste.nome).within(() => {
          cy.get('.input-quantidade-adicao').type('{selectall}1');
          cy.get('.btn-adicionar-carrinho').click();
        });
        cy.get('.btn-iniciar-compra').click();
        cy.get('.btn-confirmar-pedido').click();
        cy.get('.modal-confirmacao-compra').should('be.visible');
        cy.get('.btn-autorizar-pagamento').click();
        cy.url({ timeout: 10000 }).should('include', '/profile/orders');

        cy.get('.card-pedido-cliente')
          .first()
          .find('.codigo-pedido-cliente')
          .invoke('text')
          .then((textoCodigo) => {
            const codigoPedido = textoCodigo.replace('Pedido #', '').trim();

            // Cenário 5: Com status APROVADA (diferente de ENTREGUE), consulta o gráfico e verifica que o valor NÃO mudou
            cy.loginAdmin();
            cy.visit('/dashboard');
            cy.get('.input-data-inicio-dashboard').clear().type(inicioMes);
            cy.get('.input-data-fim-dashboard').clear().type(fimMes);
            cy.contains('button', 'Limpar').click();
            cy.contains('button', categoriaAlvo).click();
            cy.get('.btn-aplicar-filtros-dashboard').click();

            cy.get(`tr.linha-mes-dashboard[data-mes="${mesAnoAtual}"]`)
              .find(`td.celula-valor-categoria[data-categoria="${categoriaAlvo}"]`)
              .should('have.attr', 'data-valor', valorAntes.toFixed(2));

            // Cenário 6: Admin despacha (EM TRANSPORTE) e confirma entrega (ENTREGUE)
            cy.visit('/admin/orders');
            cy.contains('tr.linha-pedido-admin', codigoPedido).find('.btn-despachar-pedido').click();
            cy.contains('tr.linha-pedido-admin', codigoPedido).find('.btn-confirmar-entrega').click();
            cy.contains('tr.linha-pedido-admin', codigoPedido)
              .find('.select-status-pedido-admin')
              .should('have.value', 'ENTREGUE');

            // Consulta novamente o gráfico e verifica que a compra agora ENTREGUE está refletida!
            const valorEsperadoAposEntrega = valorAntes + Number(pecaTeste.valorVenda);
            cy.visit('/dashboard');
            cy.get('.input-data-inicio-dashboard').clear().type(inicioMes);
            cy.get('.input-data-fim-dashboard').clear().type(fimMes);
            cy.contains('button', 'Limpar').click();
            cy.contains('button', categoriaAlvo).click();
            cy.get('.btn-aplicar-filtros-dashboard').click();

            cy.get(`tr.linha-mes-dashboard[data-mes="${mesAnoAtual}"]`)
              .find(`td.celula-valor-categoria[data-categoria="${categoriaAlvo}"]`)
              .should('have.attr', 'data-valor', valorEsperadoAposEntrega.toFixed(2));
          });
      });
    });
  });

  it('Cenário 7: Acesso ao gráfico permitido ao administrador e negado a outros perfis', () => {
    // 1. Usuário deslogado tentando acessar /dashboard é redirecionado para /login
    cy.clearLocalStorage();
    cy.visit('/dashboard');
    cy.url().should('include', '/login');

    // 2. Perfil Cliente logado tentando acessar /dashboard recebe bloqueio de Acesso Restrito
    cy.loginCliente('marina.silva@email.com', '123456');
    cy.visit('/dashboard');
    cy.contains('Acesso Restrito').should('be.visible');
    cy.contains('Apenas usuários administradores têm permissão para acessar esta página').should('be.visible');

    // 3. Perfil Administrador acessa /dashboard normalmente
    cy.loginAdmin();
    cy.visit('/dashboard');
    cy.contains('Painel Analítico de Vendas').should('be.visible');
    cy.get('svg.recharts-surface').should('be.visible');
  });

  it('Cenário 8: Tempo de resposta da consulta de até 1 segundo (RNF0011 <= 1000 ms)', () => {
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
