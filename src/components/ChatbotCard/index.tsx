import React, { useState, useRef, useEffect } from 'react';
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
  {
    label: '✨ Recomendação para mim',
    prompt: 'Me dê uma recomendação personalizada para minha coleção',
  },
  {
    label: '🔍 Buscar vasos e peças',
    prompt: 'Estou buscando peças de vaso ou cachepô para plantas',
  },
  {
    label: '🔥 Forno e micro-ondas',
    prompt: 'Dúvida: as peças podem ir ao forno e micro-ondas?',
  },
  {
    label: '📚 Guias de mesa posta',
    prompt: 'Sugira conteúdos e guias de mesa posta e conservação',
  },
];

const MENSAGEM_BOAS_VINDAS: ChatMensagem = {
  id: '1',
  remetente: 'bot',
  texto:
    'Olá! Sou o **Caramelo Bot**, seu consultor com IA Generativa. 🏺✨\n\nOfereço **recomendações personalizadas** com base no seu histórico e preferências, ajudo na **busca de peças**, tiro **dúvidas técnicas** e sugiro **guias de cuidado e mesa posta**.',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const ChatbotCard: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [expandido, setExpandido] = useState(false);
  const [mensagemInput, setMensagemInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [clienteId, setClienteId] = useState<number>(1);
  const [clientesPerfis, setClientesPerfis] = useState<ClientePerfilChat[]>([]);
  const [mostrarPreferencias, setMostrarPreferencias] = useState(false);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(true);
  const [preferenciasTexto, setPreferenciasTexto] = useState('');
  const [mostrarModalTreino, setMostrarModalTreino] = useState(false);
  const [statusTreinamento, setStatusTreinamento] = useState<StatusTreinamentoIA | null>(null);
  const [treinandoModelo, setTreinandoModelo] = useState(false);

  const [mensagens, setMensagens] = useState<ChatMensagem[]>([MENSAGEM_BOAS_VINDAS]);

  const clienteIdRef = useRef<number>(user?.clienteId || 4);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const atualizarClienteAtivo = (id: number, textoPref?: string) => {
    clienteIdRef.current = id;
    setClienteId(id);
    if (textoPref !== undefined) {
      setPreferenciasTexto(textoPref);
    }
  };

  const carregarStatusTreinamento = async (idPreferencial?: number) => {
    try {
      const status = await chatService.obterStatusTreinamento();
      setStatusTreinamento(status);
      if (status.clientesPerfis && status.clientesPerfis.length > 0) {
        setClientesPerfis(status.clientesPerfis);

        const perfilPorEmail = user?.login
          ? status.clientesPerfis.find((c) => c.email.toLowerCase() === user.login.toLowerCase())
          : undefined;
        const perfilMarina = status.clientesPerfis.find(
          (c) => c.email === 'marina.silva@email.com' || c.nome.includes('Marina Lima')
        );

        const idAlvo =
          idPreferencial ||
          user?.clienteId ||
          perfilPorEmail?.id ||
          (perfilMarina ? perfilMarina.id : status.clientesPerfis[0].id);

        const perfilAtivo =
          status.clientesPerfis.find((c) => c.id === idAlvo) || status.clientesPerfis[0];

        atualizarClienteAtivo(perfilAtivo.id, perfilAtivo.preferenciasEstilo || '');
      }
    } catch (err) {
      console.error('Erro ao carregar status de treinamento da IA:', err);
    }
  };

  useEffect(() => {
    const idUsuarioLogado = user?.clienteId ?? undefined;
    if (idUsuarioLogado) {
      atualizarClienteAtivo(idUsuarioLogado);
    }
    carregarStatusTreinamento(idUsuarioLogado);
    setMensagens([
      {
        ...MENSAGEM_BOAS_VINDAS,
        id: '1',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setMostrarSugestoes(true);
  }, [user?.id, user?.clienteId, user?.login]);

  const clienteAtivo = clientesPerfis.find((c) => c.id === clienteId);

  const handleSalvarPreferencias = async () => {
    if (!clienteIdRef.current) return;
    try {
      await chatService.atualizarPreferencias(clienteIdRef.current, preferenciasTexto);
      toast.success('Preferências atualizadas e modelo recalibrado!', { position: 'bottom-right' });
      await carregarStatusTreinamento();
      setMostrarPreferencias(false);
    } catch (err) {
      toast.error('Erro ao atualizar preferências do cliente.');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    if (carregando) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (mensagens.length > 1) {
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [mensagens, carregando, isOpen]);

  const handleEnviar = async (textoParaEnviar?: string) => {
    const texto = (textoParaEnviar || mensagemInput).trim();
    if (!texto || carregando) return;

    const idClienteEnvio = clienteIdRef.current || clienteId;

    const novaMensagemUsuario: ChatMensagem = {
      id: Date.now().toString(),
      remetente: 'usuario',
      texto,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const novoHistorico = [...mensagens, novaMensagemUsuario];
    setMensagens(novoHistorico);
    setMensagemInput('');
    setMostrarSugestoes(false);
    setCarregando(true);

    try {
      const historicoDTO = novoHistorico
        .filter((m) => !m.id.startsWith('notice-'))
        .slice(-6)
        .map((m) => ({
          remetente: m.remetente,
          texto: m.texto,
        }));

      const resposta = await chatService.enviarMensagem({
        mensagem: texto,
        clienteId: idClienteEnvio,
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
        clienteId: clienteIdRef.current || clienteId,
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
        tipoArgila: peca.tipoArgila,
        tipoEsmalte: peca.tipoEsmalte,
      });
    }

    cartService.saveCart(cart);
    toast.success(`"${peca.nome}" adicionado ao carrinho!`, { position: 'bottom-right' });
  };

  const handleLimparChat = () => {
    setMensagens([
      {
        ...MENSAGEM_BOAS_VINDAS,
        id: '1',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setMostrarSugestoes(true);
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
          className="btn rounded-circle chatbot-toggle"
          onClick={() => {
            setIsOpen(true);
            if (!statusTreinamento) {
              carregarStatusTreinamento();
            }
          }}
          title="Falar com o Caramelo Bot IA"
        >
          <i className="bi bi-chat-heart-fill fs-3"></i>
        </button>
      )}

      {isOpen && (
        <div
          className={`card chatbot-card ${expandido ? 'chatbot-card-expanded' : ''}`}
          data-testid="chatbot-window"
        >
          {/* Cabeçalho Limpo e Elegante */}
          <div className="chatbot-header d-flex justify-content-between align-items-center gap-2">
            <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
              <div className="chatbot-avatar">
                <i className="bi bi-stars text-warning fs-5"></i>
              </div>
              <div style={{ minWidth: 0 }}>
                <h6 className="chatbot-title">Caramelo Bot</h6>
                <div className="chatbot-subtitle">
                  <span className="status-dot"></span>
                  <span>Consultor Virtual IA</span>
                  <span data-testid="chat-versao-modelo" className="d-none">
                    {statusTreinamento?.versaoAtualModelo || 'ft:gpt-4o-mini:caramelo-v1'}
                  </span>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-1 flex-shrink-0">
              <button
                type="button"
                data-testid="btn-abrir-painel-treinamento"
                className="btn btn-ia-treino"
                onClick={() => {
                  carregarStatusTreinamento();
                  setMostrarModalTreino(true);
                }}
                title="Ver Arquitetura da IA, Pesos Treinados e Fine-Tuning"
              >
                <i className="bi bi-cpu-fill"></i>
                <span>IA & Treino</span>
              </button>
              <button
                type="button"
                className="btn btn-link text-decoration-none btn-header-icon"
                onClick={() => setExpandido(!expandido)}
                title={expandido ? 'Tamanho padrão' : 'Expandir janela do chat'}
              >
                <i className={`bi ${expandido ? 'bi-arrows-angle-contract' : 'bi-arrows-angle-expand'} fs-6`}></i>
              </button>
              <button
                type="button"
                className="btn btn-link text-decoration-none btn-header-icon"
                onClick={handleLimparChat}
                title="Reiniciar conversa"
              >
                <i className="bi bi-arrow-counterclockwise fs-5"></i>
              </button>
              <button
                type="button"
                className="btn btn-link text-decoration-none btn-header-icon"
                onClick={() => setIsOpen(false)}
                title="Fechar chat"
              >
                <i className="bi bi-x-lg fs-6"></i>
              </button>
            </div>
          </div>

          {/* Barra de Perfil do Cliente Logado e Preferências (RNF0044 Critérios 3.a, 3.e, Cenários 2 e 3) */}
          <div className="chatbot-profile-bar">
            <div className="d-flex align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                <i className="bi bi-person-check-fill text-success fs-5 flex-shrink-0"></i>
                <div className="text-truncate">
                  <span className="text-muted small me-1">Cliente:</span>
                  <strong
                    data-testid="chat-cliente-ativo"
                    className="text-dark"
                    style={{ fontSize: '0.92rem' }}
                  >
                    {user?.perfil === 'CLIENTE'
                      ? user.nome
                      : clienteAtivo?.nome || 'Visitante'}
                  </strong>
                </div>
              </div>
              <button
                type="button"
                data-testid="btn-editar-preferencias"
                className={`btn btn-preferencias-toggle ${mostrarPreferencias ? 'active' : ''}`}
                onClick={() => setMostrarPreferencias(!mostrarPreferencias)}
              >
                <i className="bi bi-sliders"></i>
                <span>Preferências</span>
              </button>
            </div>

            {clienteAtivo && (
              <div
                className="chatbot-history-line text-truncate"
                title={clienteAtivo.pecasCompradas?.join(', ')}
              >
                <i className="bi bi-bag-check-fill text-success flex-shrink-0"></i>
                <strong className="flex-shrink-0">Histórico:</strong>
                <span data-testid="chat-historico-cliente" className="text-truncate">
                  {clienteAtivo.pecasCompradas?.length
                    ? clienteAtivo.pecasCompradas.join(', ')
                    : 'Sem compras registradas'}
                </span>
              </div>
            )}

            {mostrarPreferencias && (
              <div className="mt-2 p-3 bg-white rounded-3 border shadow-sm">
                <label className="form-label mb-1 fw-bold text-dark" style={{ fontSize: '0.86rem' }}>
                  Preferências de Estilo do Cliente (Critério 3.e):
                </label>
                <textarea
                  data-testid="input-preferencias-cliente"
                  className="form-control mb-2"
                  rows={2}
                  style={{ fontSize: '0.88rem' }}
                  value={preferenciasTexto}
                  onChange={(e) => setPreferenciasTexto(e.target.value)}
                />
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border"
                    style={{ fontSize: '0.83rem' }}
                    onClick={() => setMostrarPreferencias(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    data-testid="btn-salvar-preferencias"
                    className="btn btn-sm btn-success fw-semibold px-3"
                    style={{ fontSize: '0.83rem' }}
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
            {mensagens.map((msg, index) => {
              const isNotice = msg.id.startsWith('notice-');
              const isWelcome = msg.id === '1';
              const isLast = index === mensagens.length - 1;

              return (
                <div
                  key={msg.id}
                  ref={isLast ? lastMessageRef : null}
                  data-testid={msg.remetente === 'usuario' ? 'chat-msg-user' : 'chat-msg-bot'}
                  className={`d-flex flex-column ${
                    msg.remetente === 'usuario' ? 'align-self-end' : 'align-self-start'
                  }`}
                  style={{ maxWidth: msg.remetente === 'usuario' ? '86%' : '96%' }}
                >
                  <div
                    className={
                      msg.remetente === 'usuario'
                        ? 'chat-bubble-user'
                        : isNotice
                        ? 'chat-bubble-bot-notice'
                        : 'chat-bubble-bot'
                    }
                  >
                    {msg.explicacaoPersonalizacao && (
                      <div
                        data-testid="chat-explicacao-personalizacao"
                        className="personalization-banner"
                      >
                        <i className="bi bi-cpu-fill me-1"></i>
                        {msg.explicacaoPersonalizacao}
                      </div>
                    )}

                    <div>{renderizarTextoFormatado(msg.texto)}</div>

                    {/* Cards de Peças Recomendadas */}
                    {msg.itensRecomendados && msg.itensRecomendados.length > 0 && (
                      <div
                        className="mt-3 d-flex flex-column gap-2"
                        data-testid="chat-recomendacoes-lista"
                      >
                        <div className="fw-bold text-secondary" style={{ fontSize: '0.84rem' }}>
                          <i className="bi bi-stars text-warning me-1"></i>Peças Recomendadas para Você:
                        </div>
                        {msg.itensRecomendados.map((item) => (
                          <div
                            key={item.id}
                            data-testid="chat-recommended-item"
                            className="mini-product-card d-flex gap-3 align-items-center"
                          >
                            <img
                              src={
                                item.imagemUrl ||
                                'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80'
                              }
                              alt={item.nome}
                              className="mini-product-img"
                            />
                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                              <div
                                className="mini-product-title text-truncate"
                                data-testid="chat-recommended-item-name"
                                title={item.nome}
                              >
                                {item.nome}
                              </div>
                              <div
                                className="mini-product-meta"
                                data-testid="chat-recommended-item-category"
                              >
                                {item.categoria} {item.tipoArgila ? `• ${item.tipoArgila}` : ''}
                              </div>
                              <div className="mini-product-price mt-1">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(item.valorVenda)}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <button
                                type="button"
                                className="btn btn-outline-success btn-add-cart-chat"
                                title="Adicionar ao carrinho"
                                onClick={() => handleAddToCart(item)}
                              >
                                <i className="bi bi-cart-plus me-1"></i>Adicionar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Conteúdos Relevantes Sugeridos (RNF0044 item 2 / Cenário 6) */}
                    {msg.conteudosSugeridos && msg.conteudosSugeridos.length > 0 && (
                      <div
                        data-testid="chat-conteudos-sugeridos"
                        className="suggested-contents-box"
                      >
                        <div className="fw-bold text-dark mb-1">
                          <i className="bi bi-journal-bookmark-fill text-success me-1"></i>
                          Conteúdos e Guias Relevantes:
                        </div>
                        <ul className="mb-0 ps-3">
                          {msg.conteudosSugeridos.map((c, idx) => (
                            <li key={idx} className="text-secondary mb-1">
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Botões de Avaliação da Resposta pelo Usuário (RNF0044 item 3 / Critério 3.d / Cenário 7) */}
                    {msg.remetente === 'bot' &&
                      !isWelcome &&
                      !isNotice &&
                      msg.categoriaFoco !== 'Conversa' && (
                        <div className="feedback-bar">
                        <span className="feedback-question">Esta resposta foi útil?</span>
                        {msg.avaliacaoUsuario ? (
                          <span
                            data-testid="feedback-registrado-badge"
                            className={`badge ${
                              msg.avaliacaoUsuario === 'UTIL' ? 'bg-success' : 'bg-danger'
                            }`}
                            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                          >
                            {msg.avaliacaoUsuario === 'UTIL'
                              ? '👍 Útil (Incorporado ao Treino)'
                              : '👎 Não útil (Pesos Ajustados)'}
                          </span>
                        ) : (
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              data-testid="btn-feedback-util"
                              className="btn btn-outline-success btn-feedback-choice"
                              onClick={() => handleAvaliarResposta(msg, 'UTIL')}
                            >
                              👍 Útil
                            </button>
                            <button
                              type="button"
                              data-testid="btn-feedback-nao-util"
                              className="btn btn-outline-danger btn-feedback-choice"
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
                    style={{ fontSize: '0.76rem' }}
                  >
                    {msg.timestamp}
                  </small>
                </div>
              );
            })}

            {carregando && (
              <div className="align-self-start typing-indicator">
                <span className="text-muted me-1" style={{ fontSize: '0.88rem' }}>
                  Caramelo Bot consultando IA
                </span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas em Grid 2x2 (visíveis no início ou quando acionadas pelo usuário) */}
          {mostrarSugestoes && (
            <div className="chatbot-suggestions">
              {SUGESTOES_PADRAO.map((sugestao, i) => (
                <button
                  key={i}
                  type="button"
                  className="quick-topic-badge"
                  title={sugestao.prompt}
                  onClick={() => handleEnviar(sugestao.prompt)}
                >
                  {sugestao.label}
                </button>
              ))}
            </div>
          )}

          {/* Rodapé / Input */}
          <div className="chatbot-footer">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className={`btn ${mostrarSugestoes ? 'btn-secondary' : 'btn-outline-secondary'}`}
                style={{
                  borderRadius: '12px',
                  height: '44px',
                  padding: '0 12px',
                  fontSize: '0.88rem',
                  flexShrink: 0,
                }}
                onClick={() => setMostrarSugestoes(!mostrarSugestoes)}
                title={mostrarSugestoes ? 'Ocultar sugestões rápidas' : 'Ver sugestões rápidas'}
              >
                <i className="bi bi-magic"></i>
              </button>
              <div className="input-group">
                <input
                  type="text"
                  data-testid="chat-input"
                  className="form-control chatbot-input"
                  placeholder="Digite sua dúvida ou peça recomendações..."
                  value={mensagemInput}
                  onChange={(e) => setMensagemInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={carregando}
                />
                <button
                  data-testid="chat-send-btn"
                  className="btn chatbot-send-btn"
                  type="button"
                  onClick={() => handleEnviar()}
                  disabled={carregando || !mensagemInput.trim()}
                >
                  <i className="bi bi-send-fill fs-6"></i>
                </button>
              </div>
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
              <div className="modal-body" style={{ fontSize: '0.92rem' }}>
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
                    className="btn btn-sm btn-success fw-bold px-3 py-2"
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
                  style={{ maxHeight: 160, overflowY: 'auto', fontSize: '0.8rem' }}
                >
                  {statusTreinamento.datasetFineTuningJsonl.join('\n')}
                </pre>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
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
