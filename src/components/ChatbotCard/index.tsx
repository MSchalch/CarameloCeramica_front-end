import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { chatService } from '../../services/chatService';
import { cartService } from '../../services/cartService';
import type {
  ChatMensagem,
  PecaRecomendada,
  StatusTreinamentoIA,
  ClientePerfilChat,
} from '../../types/chat';
import { useAuth } from '../../contexts/AuthContext';
import './ChatbotCard.css';

const SUGESTOES_PADRAO = [
  '✨ Me dê uma recomendação personalizada para minha coleção',
  '🔍 Estou buscando peças de vaso ou cachepô para plantas',
  '🔥 Dúvida: as peças podem ir ao forno e micro-ondas?',
  '📚 Sugira conteúdos e guias de mesa posta e conservação',
];

const ChatbotCard: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mensagemInput, setMensagemInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [clienteId, setClienteId] = useState<number>(1);
  const [clientesPerfis, setClientesPerfis] = useState<ClientePerfilChat[]>([]);
  const [mostrarPreferencias, setMostrarPreferencias] = useState(false);
  const [preferenciasTexto, setPreferenciasTexto] = useState('');
  const [mostrarModalTreino, setMostrarModalTreino] = useState(false);
  const [statusTreinamento, setStatusTreinamento] = useState<StatusTreinamentoIA | null>(null);
  const [treinandoModelo, setTreinandoModelo] = useState(false);

  const [mensagens, setMensagens] = useState<ChatMensagem[]>([
    {
      id: '1',
      remetente: 'bot',
      texto:
        'Olá! Sou o **Caramelo Bot**, o consultor com IA Generativa da Caramelo Cerâmicas. 🏺✨\n\nEstou integrado ao seu **histórico de compras**, às suas **preferências de estilo** e ao **modelo treinado continuamente com vendas e feedbacks**. Como posso ajudar hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const carregarStatusTreinamento = async () => {
    try {
      const status = await chatService.obterStatusTreinamento();
      setStatusTreinamento(status);
      if (status.clientesPerfis && status.clientesPerfis.length > 0) {
        setClientesPerfis(status.clientesPerfis);
        const idAlvo = user?.clienteId || clienteId || status.clientesPerfis[0].id;
        const perfilAtivo =
          status.clientesPerfis.find((c) => c.id === idAlvo) || status.clientesPerfis[0];
        setClienteId(perfilAtivo.id);
        setPreferenciasTexto(perfilAtivo.preferenciasEstilo || '');
      }
    } catch (err) {
      console.error('Erro ao carregar status de treinamento da IA:', err);
    }
  };

  useEffect(() => {
    if (user?.clienteId) {
      setClienteId(user.clienteId);
    }
    carregarStatusTreinamento();
  }, [user]);

  const clienteAtivo = clientesPerfis.find((c) => c.id === clienteId);

  const handleTrocarCliente = (novoId: number) => {
    setClienteId(novoId);
    const perfil = clientesPerfis.find((c) => c.id === novoId);
    if (perfil) {
      setPreferenciasTexto(perfil.preferenciasEstilo || '');
      setMensagens((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          remetente: 'bot',
          texto: `Perfil ativo alterado para **${perfil.nome}**.\n• **Histórico de compras:** ${
            perfil.pecasCompradas?.length ? perfil.pecasCompradas.join(', ') : 'Sem compras anteriores'
          }\n• **Preferências:** ${perfil.preferenciasEstilo || 'Padrão'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleSalvarPreferencias = async () => {
    if (!clienteId) return;
    try {
      await chatService.atualizarPreferencias(clienteId, preferenciasTexto);
      toast.success('Preferências atualizadas e modelo recalibrado!', { position: 'bottom-right' });
      await carregarStatusTreinamento();
      setMostrarPreferencias(false);
    } catch (err) {
      toast.error('Erro ao atualizar preferências do cliente.');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [mensagens, carregando, isOpen]);

  const handleEnviar = async (textoParaEnviar?: string) => {
    const texto = (textoParaEnviar || mensagemInput).trim();
    if (!texto || carregando) return;

    const novaMensagemUsuario: ChatMensagem = {
      id: Date.now().toString(),
      remetente: 'usuario',
      texto,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const novoHistorico = [...mensagens, novaMensagemUsuario];
    setMensagens(novoHistorico);
    setMensagemInput('');
    setCarregando(true);

    try {
      const historicoDTO = novoHistorico.slice(-6).map((m) => ({
        remetente: m.remetente,
        texto: m.texto,
      }));

      const resposta = await chatService.enviarMensagem({
        mensagem: texto,
        clienteId: clienteId,
        historico: historicoDTO,
      });

      const novaMensagemBot: ChatMensagem = {
        id: (Date.now() + 1).toString(),
        remetente: 'bot',
        texto: resposta.resposta,
        perguntaOrigem: texto,
        itensRecomendados: resposta.itensRecomendados,
        categoriaFoco: resposta.categoriaFoco,
        versaoModelo: resposta.versaoModelo,
        explicacaoPersonalizacao: resposta.explicacaoPersonalizacao,
        conteudosSugeridos: resposta.conteudosSugeridos,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMensagens((prev) => [...prev, novaMensagemBot]);
    } catch (err) {
      console.error('Erro ao comunicar com a IA do chatbot:', err);
      setMensagens((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          remetente: 'bot',
          texto:
            'Desculpe, tive uma instabilidade momentânea ao buscar suas recomendações. Por favor, tente novamente!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setCarregando(false);
    }
  };

  const handleAvaliarResposta = async (msg: ChatMensagem, avaliacao: 'UTIL' | 'NAO_UTIL') => {
    try {
      const pecasStr =
        msg.itensRecomendados && msg.itensRecomendados.length > 0
          ? msg.itensRecomendados.map((i) => i.nome).join(', ')
          : 'Sem peças específicas';

      await chatService.registrarFeedback({
        clienteId: clienteId,
        perguntaUsuario: msg.perguntaOrigem || 'Interação no Chatbot',
        respostaBot: msg.texto,
        pecasRecomendadas: pecasStr,
        categoriaFoco:
          msg.categoriaFoco ||
          (msg.itensRecomendados && msg.itensRecomendados[0]?.categoria) ||
          'Geral',
        avaliacao,
        comentario:
          avaliacao === 'UTIL'
            ? 'Avaliação positiva registrada no chat pelo cliente'
            : 'Avaliação negativa registrada no chat para reajuste de pesos do modelo',
      });

      setMensagens((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, avaliacaoUsuario: avaliacao } : m))
      );

      await carregarStatusTreinamento();
      toast.success(
        avaliacao === 'UTIL'
          ? '👍 Feedback positivo registrado! Pesos da categoria reforçados no modelo.'
          : '👎 Feedback registrado! O modelo reduziu o peso dessa categoria para você.',
        { position: 'bottom-right' }
      );
    } catch (err) {
      toast.error('Não foi possível registrar a avaliação.');
    }
  };

  const handleExecutarTreinamentoManual = async () => {
    setTreinandoModelo(true);
    try {
      const res = await chatService.executarTreinamento(
        'Treinamento supervisionado e atualização de dataset Fine-Tuning JSONL acionado na interface'
      );
      await carregarStatusTreinamento();
      toast.success(`Modelo atualizado para a versão ${res.versaoModelo}!`, {
        position: 'bottom-right',
      });
    } catch (err) {
      toast.error('Erro ao executar ciclo de treinamento.');
    } finally {
      setTreinandoModelo(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleAddToCart = (peca: PecaRecomendada) => {
    const cart = [...cartService.getCart()];

    const existingIndex = cart.findIndex((i: any) => i.id === peca.id);
    if (existingIndex >= 0) {
      cart[existingIndex].quantidade += 1;
    } else {
      cart.push({
        id: peca.id,
        nome: peca.nome,
        preco: peca.valorVenda,
        imagemUrl:
          peca.imagemUrl ||
          'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80',
        categoria: peca.categoria,
        quantidade: 1,
        estoque: peca.estoque ?? 10,
      });
    }

    cartService.saveCart(cart);
    toast.success(`"${peca.nome}" adicionado ao carrinho!`, { position: 'bottom-right' });
  };

  const handleLimparChat = () => {
    setMensagens([
      {
        id: Date.now().toString(),
        remetente: 'bot',
        texto: 'Conversa reiniciada! Como posso te ajudar a escolher suas peças hoje?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const renderizarTextoFormatado = (texto: string) => {
    const partes = texto.split('\n');
    return partes.map((linha, idx) => {
      const formatado = linha.split(/(\*\*[^*]+\*\*)/g).map((chunk, cIdx) => {
        if (chunk.startsWith('**') && chunk.endsWith('**')) {
          return <strong key={cIdx}>{chunk.slice(2, -2)}</strong>;
        }
        return chunk;
      });

      return (
        <React.Fragment key={idx}>
          {formatado}
          {idx < partes.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="chatbot-wrapper">
      {!isOpen && (
        <button
          data-testid="chatbot-toggle-btn"
          className="btn rounded-circle shadow-lg chatbot-toggle"
          onClick={() => {
            setIsOpen(true);
            carregarStatusTreinamento();
          }}
          title="Falar com o assistente IA"
        >
          <i className="bi bi-chat-heart fs-3"></i>
        </button>
      )}

      {isOpen && (
        <div className="card chatbot-card" data-testid="chatbot-window">
          {/* Cabeçalho */}
          <div className="chatbot-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div
                className="bg-white rounded-circle p-1 d-flex align-items-center justify-content-center"
                style={{ width: 34, height: 34 }}
              >
                <i className="bi bi-robot text-dark fs-5"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-white">Caramelo Bot IA</h6>
                <small
                  className="d-flex align-items-center gap-1"
                  style={{ fontSize: '0.7rem', color: '#e0f2f1' }}
                >
                  <span className="status-dot"></span>
                  <span data-testid="chat-versao-modelo">
                    {statusTreinamento?.versaoAtualModelo || 'ft:gpt-4o-mini:caramelo-v1'}
                  </span>
                </small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                data-testid="btn-abrir-painel-treinamento"
                className="btn btn-sm btn-warning text-dark fw-bold px-2 py-0"
                style={{ fontSize: '0.72rem' }}
                onClick={() => {
                  carregarStatusTreinamento();
                  setMostrarModalTreino(true);
                }}
                title="Ver Arquitetura da IA, Pesos Treinados e Fine-Tuning"
              >
                <i className="bi bi-cpu me-1"></i>IA & Treino
              </button>
              <button
                type="button"
                className="btn btn-sm btn-link text-white text-decoration-none p-1"
                onClick={handleLimparChat}
                title="Reiniciar conversa"
              >
                <i className="bi bi-arrow-counterclockwise fs-6"></i>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-link text-white text-decoration-none p-1"
                onClick={() => setIsOpen(false)}
                title="Fechar chat"
              >
                <i className="bi bi-x-lg fs-6"></i>
              </button>
            </div>
          </div>

          {/* Barra de Perfil do Cliente e Preferências (RNF0044 Critérios 3.a, 3.e, Cenários 2 e 3) */}
          <div className="bg-light border-bottom px-2 py-1" style={{ fontSize: '0.76rem' }}>
            <div className="d-flex align-items-center justify-content-between gap-1">
              <div className="d-flex align-items-center gap-1 flex-grow-1">
                <span className="fw-semibold text-secondary">Cliente:</span>
                <select
                  data-testid="chat-cliente-select"
                  className="form-select form-select-sm py-0 px-2"
                  style={{ fontSize: '0.75rem', height: '24px' }}
                  value={clienteId}
                  onChange={(e) => handleTrocarCliente(Number(e.target.value))}
                >
                  {clientesPerfis.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                data-testid="btn-editar-preferencias"
                className="btn btn-sm btn-outline-secondary py-0 px-2"
                style={{ fontSize: '0.7rem' }}
                onClick={() => setMostrarPreferencias(!mostrarPreferencias)}
              >
                <i className="bi bi-sliders me-1"></i>Preferências
              </button>
            </div>

            {clienteAtivo && (
              <div className="text-muted mt-1 text-truncate" title={clienteAtivo.pecasCompradas?.join(', ')}>
                <strong>Histórico:</strong>{' '}
                <span data-testid="chat-historico-cliente">
                  {clienteAtivo.pecasCompradas?.length
                    ? clienteAtivo.pecasCompradas.join(', ')
                    : 'Sem compras registradas'}
                </span>
              </div>
            )}

            {mostrarPreferencias && (
              <div className="mt-2 p-2 bg-white rounded border">
                <label className="form-label mb-1 fw-bold small">
                  Preferências de Estilo Declaradas (Critério 3.e):
                </label>
                <textarea
                  data-testid="input-preferencias-cliente"
                  className="form-control form-control-sm mb-1"
                  rows={2}
                  style={{ fontSize: '0.74rem' }}
                  value={preferenciasTexto}
                  onChange={(e) => setPreferenciasTexto(e.target.value)}
                />
                <div className="d-flex justify-content-end gap-1">
                  <button
                    type="button"
                    data-testid="btn-salvar-preferencias"
                    className="btn btn-sm btn-success py-0 px-2"
                    style={{ fontSize: '0.72rem' }}
                    onClick={handleSalvarPreferencias}
                  >
                    Salvar e Recalibrar IA
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Corpo do Chat */}
          <div className="card-body chatbot-body overflow-auto" data-testid="chatbot-messages">
            {mensagens.map((msg) => (
              <div
                key={msg.id}
                data-testid={msg.remetente === 'usuario' ? 'chat-msg-user' : 'chat-msg-bot'}
                className={`d-flex flex-column ${
                  msg.remetente === 'usuario' ? 'align-self-end' : 'align-self-start'
                }`}
                style={{ maxWidth: '90%' }}
              >
                <div
                  className={msg.remetente === 'usuario' ? 'chat-bubble-user' : 'chat-bubble-bot'}
                >
                  {msg.explicacaoPersonalizacao && (
                    <div
                      data-testid="chat-explicacao-personalizacao"
                      className="badge bg-warning-subtle text-dark border border-warning-subtle mb-2 text-wrap text-start w-100"
                      style={{ fontSize: '0.68rem', fontWeight: 600 }}
                    >
                      <i className="bi bi-cpu-fill me-1"></i>
                      {msg.explicacaoPersonalizacao}
                    </div>
                  )}

                  {renderizarTextoFormatado(msg.texto)}

                  {/* Cards de Peças Recomendadas */}
                  {msg.itensRecomendados && msg.itensRecomendados.length > 0 && (
                    <div className="mt-3 d-flex flex-column gap-2" data-testid="chat-recomendacoes-lista">
                      <div className="fw-semibold text-secondary small">
                        <i className="bi bi-stars text-warning me-1"></i>Peças Recomendadas:
                      </div>
                      {msg.itensRecomendados.map((item) => (
                        <div
                          key={item.id}
                          data-testid="chat-recommended-item"
                          className="mini-product-card d-flex p-2 gap-2 align-items-center"
                        >
                          <img
                            src={
                              item.imagemUrl ||
                              'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80'
                            }
                            alt={item.nome}
                            className="mini-product-img rounded"
                          />
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div
                              className="fw-bold text-dark text-truncate small"
                              data-testid="chat-recommended-item-name"
                              title={item.nome}
                            >
                              {item.nome}
                            </div>
                            <small
                              className="text-muted d-block"
                              data-testid="chat-recommended-item-category"
                              style={{ fontSize: '0.75rem' }}
                            >
                              {item.categoria} {item.tipoArgila ? `• ${item.tipoArgila}` : ''}
                            </small>
                            <span className="fw-bold text-success small">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(item.valorVenda)}
                            </span>
                          </div>
                          <div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success p-1 px-2"
                              title="Adicionar ao carrinho"
                              onClick={() => handleAddToCart(item)}
                            >
                              <i className="bi bi-cart-plus"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn btn-sm btn-warning w-100 mt-1 fw-semibold py-1"
                        style={{ fontSize: '0.8rem' }}
                        onClick={() => navigate('/cart')}
                      >
                        <i className="bi bi-bag-check me-1"></i>Ir para o Carrinho
                      </button>
                    </div>
                  )}

                  {/* Conteúdos Relevantes Sugeridos (RNF0044 item 2 / Cenário 6) */}
                  {msg.conteudosSugeridos && msg.conteudosSugeridos.length > 0 && (
                    <div
                      data-testid="chat-conteudos-sugeridos"
                      className="mt-2 p-2 rounded bg-light border border-secondary-subtle"
                      style={{ fontSize: '0.73rem' }}
                    >
                      <div className="fw-bold text-dark mb-1">
                        <i className="bi bi-journal-bookmark-fill text-primary me-1"></i>
                        Conteúdos e Guias Relevantes Sugeridos:
                      </div>
                      <ul className="mb-0 ps-3">
                        {msg.conteudosSugeridos.map((c, idx) => (
                          <li key={idx} className="text-secondary">
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Botões de Avaliação da Resposta pelo Usuário (RNF0044 item 3 / Critério 3.d / Cenário 7) */}
                  {msg.remetente === 'bot' && msg.id !== '1' && (
                    <div className="mt-2 pt-2 border-top d-flex align-items-center justify-content-between">
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                        Esta resposta foi útil?
                      </span>
                      {msg.avaliacaoUsuario ? (
                        <span
                          data-testid="feedback-registrado-badge"
                          className={`badge ${
                            msg.avaliacaoUsuario === 'UTIL' ? 'bg-success' : 'bg-danger'
                          }`}
                          style={{ fontSize: '0.68rem' }}
                        >
                          {msg.avaliacaoUsuario === 'UTIL'
                            ? '👍 Útil (Incorporado ao Treino)'
                            : '👎 Não útil (Pesos Ajustados)'}
                        </span>
                      ) : (
                        <div className="d-flex gap-1">
                          <button
                            type="button"
                            data-testid="btn-feedback-util"
                            className="btn btn-sm btn-outline-success py-0 px-2"
                            style={{ fontSize: '0.7rem' }}
                            onClick={() => handleAvaliarResposta(msg, 'UTIL')}
                          >
                            👍 Útil
                          </button>
                          <button
                            type="button"
                            data-testid="btn-feedback-nao-util"
                            className="btn btn-sm btn-outline-danger py-0 px-2"
                            style={{ fontSize: '0.7rem' }}
                            onClick={() => handleAvaliarResposta(msg, 'NAO_UTIL')}
                          >
                            👎 Não útil
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <small
                  className={`mt-1 text-muted ${
                    msg.remetente === 'usuario' ? 'text-end' : 'text-start'
                  }`}
                  style={{ fontSize: '0.68rem' }}
                >
                  {msg.timestamp}
                </small>
              </div>
            ))}

            {carregando && (
              <div className="align-self-start typing-indicator">
                <span className="small text-muted me-1" style={{ fontSize: '0.78rem' }}>
                  Caramelo Bot analisando
                </span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas */}
          <div
            className="bg-light px-3 py-2 border-top d-flex gap-1 overflow-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {SUGESTOES_PADRAO.map((sugestao, i) => (
              <button
                key={i}
                type="button"
                className="quick-topic-badge"
                onClick={() => handleEnviar(sugestao.replace(/^[^\w\s]+/, '').trim())}
              >
                {sugestao}
              </button>
            ))}
          </div>

          {/* Rodapé / Input */}
          <div className="card-footer bg-white border-0 p-2">
            <div className="input-group">
              <input
                type="text"
                data-testid="chat-input"
                className="form-control border-end-0"
                placeholder="Pergunte sobre peças, busca, forno, dicas..."
                value={mensagemInput}
                onChange={(e) => setMensagemInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={carregando}
                style={{ fontSize: '0.9rem' }}
              />
              <button
                data-testid="chat-send-btn"
                className="btn btn-warning border-start-0 px-3"
                type="button"
                onClick={() => handleEnviar()}
                disabled={carregando || !mensagemInput.trim()}
              >
                <i className="bi bi-send-fill text-dark"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Demonstração de Arquitetura da IA, Pesos Supervisionados e Fine-Tuning (Cenários 1 e 8) */}
      {mostrarModalTreino && statusTreinamento && (
        <div
          data-testid="modal-treinamento-ia"
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-cpu-fill text-warning me-2"></i>
                  Arquitetura de IA Generativa, Pesos Supervisionados & Fine-Tuning (RNF0044)
                </h5>
                <button
                  type="button"
                  data-testid="btn-fechar-modal-treinamento"
                  className="btn-close btn-close-white"
                  onClick={() => setMostrarModalTreino(false)}
                />
              </div>
              <div className="modal-body" style={{ fontSize: '0.86rem' }}>
                <div className="alert alert-warning mb-3">
                  <div className="fw-bold mb-1">
                    1) Modelo Integrado e Justificativa da Escolha (Critério 3.b / Cenário 1):
                  </div>
                  <div className="mb-1">
                    <strong>Modelo:</strong>{' '}
                    <span data-testid="ia-modelo-nome">{statusTreinamento.modeloIntegrado}</span> (
                    <code data-testid="ia-versao-atual">{statusTreinamento.versaoAtualModelo}</code>)
                  </div>
                  <div data-testid="ia-justificativa-texto">
                    {statusTreinamento.justificativaEscolhaIa}
                  </div>
                </div>

                <div className="alert alert-info mb-3">
                  <div className="fw-bold mb-1">
                    Obtenção e Documentação das Preferências do Cliente (Critério 3.e):
                  </div>
                  <div data-testid="ia-metodo-preferencias">
                    {statusTreinamento.metodoPreferencias}
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0">
                    8) Pesos do Modelo Treinado com Dados de Vendas + Feedback dos Usuários
                  </h6>
                  <button
                    type="button"
                    data-testid="btn-executar-treinamento"
                    className="btn btn-sm btn-success fw-bold"
                    disabled={treinandoModelo}
                    onClick={handleExecutarTreinamentoManual}
                  >
                    <i className="bi bi-arrow-repeat me-1"></i>
                    {treinandoModelo
                      ? 'Treinando...'
                      : 'Executar Novo Ciclo de Treinamento / Fine-Tuning'}
                  </button>
                </div>

                {statusTreinamento.ultimoCiclo && (
                  <div
                    data-testid="resumo-ultimo-ciclo"
                    className="p-2 mb-3 rounded bg-light border d-flex flex-wrap gap-3"
                  >
                    <span>
                      <strong>Versão:</strong> {statusTreinamento.ultimoCiclo.versaoModelo}
                    </span>
                    <span>
                      <strong>Vendas Processadas:</strong>{' '}
                      {statusTreinamento.ultimoCiclo.totalVendasProcessadas}
                    </span>
                    <span>
                      <strong>Feedbacks Incorporados:</strong>{' '}
                      {statusTreinamento.ultimoCiclo.totalFeedbacksProcessados}
                    </span>
                    <span>
                      <strong>Exemplos JSONL:</strong>{' '}
                      {statusTreinamento.ultimoCiclo.exemplosJsonlGerados}
                    </span>
                  </div>
                )}

                <div className="table-responsive mb-3">
                  <table
                    data-testid="tabela-pesos-modelo"
                    className="table table-sm table-bordered table-striped align-middle mb-0"
                  >
                    <thead className="table-dark">
                      <tr>
                        <th>Cliente</th>
                        <th>Categoria</th>
                        <th className="text-center">Vendas</th>
                        <th className="text-center">👍 Útil</th>
                        <th className="text-center">👎 Não útil</th>
                        <th className="text-center">Peso Vendas</th>
                        <th className="text-center">Peso Feedback</th>
                        <th className="text-center">Score Final IA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusTreinamento.pesosAtuais.map((p) => (
                        <tr key={p.id}>
                          <td className="fw-semibold">{p.clienteNome}</td>
                          <td>{p.categoriaNome}</td>
                          <td className="text-center">{p.totalVendasContabilizadas}</td>
                          <td className="text-center text-success fw-bold">
                            {p.feedbacksPositivos}
                          </td>
                          <td className="text-center text-danger fw-bold">
                            {p.feedbacksNegativos}
                          </td>
                          <td className="text-center">{p.pesoVendas.toFixed(2)}</td>
                          <td className="text-center">{p.pesoFeedback.toFixed(2)}</td>
                          <td className="text-center fw-bold text-primary">
                            {p.scoreFinal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h6 className="fw-bold mb-2">
                  Avaliações Recentes dos Clientes no Chat (Incorporadas ao Modelo)
                </h6>
                <div className="table-responsive mb-3">
                  <table
                    data-testid="tabela-feedbacks-chat"
                    className="table table-sm table-bordered align-middle mb-0"
                  >
                    <thead className="table-secondary">
                      <tr>
                        <th>Cliente</th>
                        <th>Pergunta</th>
                        <th>Categoria Foco</th>
                        <th>Avaliação</th>
                        <th>Status Treino</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusTreinamento.feedbacksRegistrados.slice(0, 8).map((f) => (
                        <tr key={f.id}>
                          <td>{f.clienteNome}</td>
                          <td className="text-truncate" style={{ maxWidth: 220 }}>
                            {f.perguntaUsuario}
                          </td>
                          <td>{f.categoriaFoco}</td>
                          <td>
                            <span
                              className={`badge ${
                                f.avaliacao === 'UTIL' ? 'bg-success' : 'bg-danger'
                              }`}
                            >
                              {f.avaliacao}
                            </span>
                          </td>
                          <td>
                            {f.incorporadoTreinamento ? '✅ Treinado' : '⏳ Pendente'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h6 className="fw-bold mb-1">
                  Dataset Supervisionado Gerado para OpenAI Fine-Tuning (<code>.jsonl</code>)
                </h6>
                <pre
                  data-testid="jsonl-dataset-viewer"
                  className="bg-dark text-light p-2 rounded small mb-0"
                  style={{ maxHeight: 150, overflowY: 'auto', fontSize: '0.72rem' }}
                >
                  {statusTreinamento.datasetFineTuningJsonl.join('\n')}
                </pre>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setMostrarModalTreino(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotCard;
