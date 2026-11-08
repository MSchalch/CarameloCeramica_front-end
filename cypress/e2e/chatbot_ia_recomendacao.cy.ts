/// <reference types="cypress" />

describe('Roteiro Presencial: Chatbot de Recomendação com IA Generativa (RNF0044)', () => {
  const apiUrl = 'http://localhost:8080/api';
  let marinaId = 4;
  let lucasId = 5;

  before(() => {
    // Reseta a massa de testes de clientes, preferências, feedbacks e roda o ciclo base de treinamento
    cy.request('POST', `${apiUrl}/chat/reset-testes`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('versaoModelo');
      if (res.body.marinaId) marinaId = res.body.marinaId;
      if (res.body.lucasId) lucasId = res.body.lucasId;
    });
  });

  it('1) Demonstração da integração com a IA generativa escolhida e justificativa da escolha (Critérios 3.b, 3.e, 4.a)', () => {
    cy.visit('/');
    cy.get('[data-testid="chatbot-toggle-btn"]').should('be.visible').click();
    cy.get('[data-testid="chatbot-window"]').should('be.visible');

    // Abre o painel de Arquitetura da IA, Pesos Supervisionados e Fine-Tuning
    cy.get('[data-testid="btn-abrir-painel-treinamento"]').click();
    cy.get('[data-testid="modal-treinamento-ia"]').should('be.visible');

    // Verifica o modelo integrado, a justificativa da escolha (Critério 3.b) e o método de preferências (Critério 3.e)
    cy.get('[data-testid="ia-modelo-nome"]').should('contain.text', 'OpenAI GPT-4o-mini');
    cy.get('[data-testid="ia-justificativa-texto"]')
      .should('contain.text', 'Fine-Tuning JSONL')
      .and('contain.text', 'ia_pesos_modelo');
    cy.get('[data-testid="ia-metodo-preferencias"]')
      .should('contain.text', 'Abordagem Híbrida Documentada')
      .and('contain.text', 'preferencias_estilo');

    cy.get('[data-testid="btn-fechar-modal-treinamento"]').click();
  });

  it('2) Recomendação personalizada para um cliente, coerente com seu histórico de compras e preferências (RNF0044 item 1)', () => {
    cy.visit('/');
    cy.get('[data-testid="chatbot-toggle-btn"]').click();

    // Seleciona Marina Lima Silva pelo nome visível no seletor
    cy.get('[data-testid="chat-cliente-select"]').select('Marina Lima Silva');
    cy.get('[data-testid="chat-historico-cliente"]').should('contain.text', 'Bowl');

    cy.get('[data-testid="chat-input"]').type('Me dê uma recomendação personalizada para minha coleção');
    cy.get('[data-testid="chat-send-btn"]').click();

    cy.get('[data-testid="chat-msg-bot"]').last().within(() => {
      cy.get('[data-testid="chat-explicacao-personalizacao"]')
        .should('contain.text', 'Marina Lima Silva')
        .invoke('text')
        .should('match', /Xícaras|Bowls/);
      cy.get('[data-testid="chat-recommended-item"]').should('have.length.at.least', 1);
      cy.get('[data-testid="chat-recommended-item-category"]')
        .first()
        .invoke('text')
        .should('match', /Xícaras|Bowls/);
    });
  });

  it('3) Recomendações diferentes para dois clientes com históricos distintos (Marina vs. Lucas)', () => {
    // Valida via API e UI que a mesma pergunta gera recomendações distintas para Marina e Lucas
    const perguntaComum = 'Me dê uma recomendação personalizada para minha coleção';

    cy.request('POST', `${apiUrl}/chat/recomendar`, {
      mensagem: perguntaComum,
      clienteId: marinaId,
      historico: [],
    }).then((resMarina) => {
      expect(resMarina.status).to.eq(200);
      const categoriaMarina = resMarina.body.categoriaFoco;
      const primeiraPecaMarina = resMarina.body.itensRecomendados[0]?.nome;

      cy.request('POST', `${apiUrl}/chat/recomendar`, {
        mensagem: perguntaComum,
        clienteId: lucasId,
        historico: [],
      }).then((resLucas) => {
        expect(resLucas.status).to.eq(200);
        const categoriaLucas = resLucas.body.categoriaFoco;
        const primeiraPecaLucas = resLucas.body.itensRecomendados[0]?.nome;

        // Marina (Bowls / Xícaras) != Lucas (Vasos / Pratos / Travessas)
        expect(categoriaMarina).to.not.eq(categoriaLucas);
        expect(primeiraPecaMarina).to.not.eq(primeiraPecaLucas);
      });
    });

    // Demonstra também na interface trocando para Lucas Mendes Oliveira
    cy.visit('/');
    cy.get('[data-testid="chatbot-toggle-btn"]').click();
    cy.get('[data-testid="chat-cliente-select"]').select('Lucas Mendes Oliveira');
    cy.get('[data-testid="chat-historico-cliente"]').should('contain.text', 'Vaso Ânfora Escultural');

    cy.get('[data-testid="chat-input"]').type(perguntaComum);
    cy.get('[data-testid="chat-send-btn"]').click();

    cy.get('[data-testid="chat-msg-bot"]').last().within(() => {
      cy.get('[data-testid="chat-explicacao-personalizacao"]').should('contain.text', 'Lucas Mendes Oliveira');
      cy.get('[data-testid="chat-recommended-item-category"]')
        .first()
        .invoke('text')
        .should('match', /Vasos|Pratos|Travessas/);
    });
  });

  it('4) Ajuda na busca por produtos pelo chat (RNF0044 item 2)', () => {
    cy.visit('/');
    cy.get('[data-testid="chatbot-toggle-btn"]').click();

    cy.get('[data-testid="chat-input"]').type('Estou buscando peças de vaso ou cachepô para plantas até R$ 200');
    cy.get('[data-testid="chat-send-btn"]').click();

    cy.get('[data-testid="chat-msg-bot"]').last().within(() => {
      cy.get('[data-testid="chat-recommended-item"]').should('have.length.at.least', 1);
      cy.get('[data-testid="chat-recommended-item-category"]').first().should('contain.text', 'Vasos');
    });
  });

  it('5) Resposta a dúvidas sobre produtos ou temas relacionados (forno, micro-ondas e argilas) (RNF0044 item 2)', () => {
    cy.visit('/');
    cy.get('[data-testid="chatbot-toggle-btn"]').click();

    cy.get('[data-testid="chat-input"]').type(
      'Dúvida: as peças podem ir ao forno e micro-ondas? Qual a diferença das argilas?'
    );
    cy.get('[data-testid="chat-send-btn"]').click();

    cy.get('[data-testid="chat-msg-bot"]')
      .last()
      .should('contain.text', '1240°C')
      .and('contain.text', 'Forno e Micro-ondas')
      .and('contain.text', 'Argila Terracota');
  });

  it('6) Sugestão de conteúdos relevantes durante a conversa (RNF0044 item 2)', () => {
    cy.visit('/');
    cy.get('[data-testid="chatbot-toggle-btn"]').click();

    cy.get('[data-testid="chat-input"]').type('Sugira conteúdos e guias sobre mesa posta e conservação');
    cy.get('[data-testid="chat-send-btn"]').click();

    cy.get('[data-testid="chat-msg-bot"]').last().within(() => {
      cy.get('[data-testid="chat-conteudos-sugeridos"]').should('be.visible');
      cy.get('[data-testid="chat-conteudos-sugeridos"] li').should('have.length.at.least', 2);
    });
  });

  it('7) Registro de avaliação da resposta pelo usuário no chat (👍 Útil / 👎 Não útil) (Critério 3.d, 4.d)', () => {
    cy.visit('/');
    cy.get('[data-testid="chatbot-toggle-btn"]').click();

    cy.get('[data-testid="chat-input"]').type('Quero recomendações de xícaras para café [TESTE-E2E]');
    cy.get('[data-testid="chat-send-btn"]').click();

    cy.get('[data-testid="chat-msg-bot"]').last().within(() => {
      cy.get('[data-testid="btn-feedback-util"]').should('be.visible').click();
      cy.get('[data-testid="feedback-registrado-badge"]')
        .should('be.visible')
        .and('contain.text', 'Útil');
    });
  });

  it('8) Demonstração de como os dados de vendas e o feedback são usados no treinamento/ajuste fino contínuo do modelo (Critério 3.c, 4.e)', () => {
    // 1. Consulta o score inicial da categoria 'Xícaras' para Marina
    cy.request('GET', `${apiUrl}/chat/treinamento-status?clienteId=${marinaId}`).then((statusAntes) => {
      const pesoAntes = statusAntes.body.pesosAtuais.find(
        (p: any) => p.categoriaNome === 'Xícaras'
      );
      expect(pesoAntes).to.not.be.undefined;
      const scoreInicial = pesoAntes.scoreFinal;

      // 2. Registra um feedback positivo adicional [TESTE-E2E] para comprovar que o modelo recalibra os pesos matematicamente
      cy.request('POST', `${apiUrl}/chat/feedback`, {
        clienteId: marinaId,
        perguntaUsuario: 'Recomendação para café expresso [TESTE-E2E]',
        respostaBot: 'Sugestão de Xícara de Café Espresso Rústica',
        pecasRecomendadas: 'Xícara de Café Espresso Rústica',
        categoriaFoco: 'Xícaras',
        avaliacao: 'UTIL',
        comentario: 'Teste automatizado de recalibração de pesos [TESTE-E2E]',
      }).then((fbRes) => {
        expect(fbRes.status).to.eq(200);

        // 3. Verifica que o scoreFinal da categoria subiu após o treinamento contínuo e que o dataset JSONL foi atualizado
        cy.request('GET', `${apiUrl}/chat/treinamento-status?clienteId=${marinaId}`).then((statusDepois) => {
          const pesoDepois = statusDepois.body.pesosAtuais.find(
            (p: any) => p.categoriaNome === 'Xícaras'
          );
          expect(pesoDepois.scoreFinal).to.be.greaterThan(scoreInicial);
          expect(statusDepois.body.datasetFineTuningJsonl.length).to.be.greaterThan(0);
        });
      });
    });

    // 4. Demonstra visualmente no modal de Treinamento & Fine-Tuning da UI
    cy.visit('/');
    cy.get('[data-testid="chatbot-toggle-btn"]').click();
    cy.get('[data-testid="btn-abrir-painel-treinamento"]').click();

    cy.get('[data-testid="tabela-pesos-modelo"] tbody tr').should('have.length.at.least', 4);
    cy.get('[data-testid="tabela-feedbacks-chat"] tbody tr').should('have.length.at.least', 4);
    cy.get('[data-testid="jsonl-dataset-viewer"]').should('contain.text', '"messages"');

    // Aciona um novo ciclo de treinamento/fine-tuning na interface
    cy.get('[data-testid="btn-executar-treinamento"]').click();
    cy.get('[data-testid="resumo-ultimo-ciclo"]').should('contain.text', 'ft:gpt-4o-mini:caramelo-v1.');

    // Limpa feedbacks temporários [TESTE-E2E] ao final
    cy.request('POST', `${apiUrl}/chat/reset-testes`);
  });
});
