import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { chatService } from '../../services/chatService';
import type { ChatMensagem, PecaRecomendada } from '../../types/chat';
import './ChatbotCard.css';

const SUGESTOES_RAPIDAS = [
  '☕ Peças para café da manhã',
  '🍲 Bowls para sopas e caldos',
  '🎁 Ideias de presentes',
  '🏺 Vasos e decoração artesanal',
];

const ChatbotCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mensagemInput, setMensagemInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagens, setMensagens] = useState<ChatMensagem[]>([
    {
      id: '1',
      remetente: 'bot',
      texto: 'Olá! Sou o Caramelo Bot, o consultor inteligente da Caramelo Cerâmicas. 🏺✨\n\nEstou aqui para ajudar você a encontrar a peça artesanal ideal para o seu dia a dia, mesa posta ou presentes. O que você gostaria de explorar hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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
      // Montar histórico para a requisição
      const historicoDTO = novoHistorico.slice(-6).map(m => ({
        remetente: m.remetente,
        texto: m.texto,
      }));

      const resposta = await chatService.enviarMensagem({
        mensagem: texto,
        historico: historicoDTO,
      });

      const novaMensagemBot: ChatMensagem = {
        id: (Date.now() + 1).toString(),
        remetente: 'bot',
        texto: resposta.resposta,
        itensRecomendados: resposta.itensRecomendados,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMensagens(prev => [...prev, novaMensagemBot]);
    } catch (err) {
      console.error('Erro ao comunicar com a IA do chatbot:', err);
      setMensagens(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          remetente: 'bot',
          texto: 'Desculpe, tive uma instabilidade momentânea ao buscar suas recomendações. Por favor, tente novamente!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setCarregando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleAddToCart = (peca: PecaRecomendada) => {
    const saved = localStorage.getItem('caramelo_cart');
    let cart: any[] = saved ? JSON.parse(saved) : [];

    const existingIndex = cart.findIndex((i: any) => i.id === peca.id);
    if (existingIndex >= 0) {
      cart[existingIndex].quantidade += 1;
    } else {
      cart.push({
        id: peca.id,
        nome: peca.nome,
        preco: peca.valorVenda,
        imagemUrl: peca.imagemUrl || 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80',
        categoria: peca.categoria,
        quantidade: 1,
        estoque: peca.estoque ?? 10,
      });
    }

    localStorage.setItem('caramelo_cart', JSON.stringify(cart));
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
    // Formata quebras de linha e negrito básico **texto**
    const partes = texto.split('\n');
    return partes.map((linha, idx) => {
      // Regex para negrito **palavra**
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
          className="btn rounded-circle shadow-lg chatbot-toggle"
          onClick={() => setIsOpen(true)}
          title="Falar com o assistente IA"
        >
          <i className="bi bi-chat-heart fs-3"></i>
        </button>
      )}

      {isOpen && (
        <div className="card chatbot-card">
          {/* Cabeçalho */}
          <div className="chatbot-header d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-white rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: 34, height: 34 }}>
                <i className="bi bi-robot text-dark fs-5"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-white">Caramelo Bot</h6>
                <small className="d-flex align-items-center gap-1" style={{ fontSize: '0.72rem', color: '#e0f2f1' }}>
                  <span className="status-dot"></span> Recomendações com IA
                </small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1">
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

          {/* Corpo do Chat */}
          <div className="card-body chatbot-body overflow-auto">
            {mensagens.map((msg) => (
              <div
                key={msg.id}
                className={`d-flex flex-column ${
                  msg.remetente === 'usuario' ? 'align-self-end' : 'align-self-start'
                }`}
                style={{ maxWidth: '88%' }}
              >
                <div className={msg.remetente === 'usuario' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
                  {renderizarTextoFormatado(msg.texto)}

                  {/* Cards de Peças Recomendadas */}
                  {msg.itensRecomendados && msg.itensRecomendados.length > 0 && (
                    <div className="mt-3 d-flex flex-column gap-2">
                      <div className="fw-semibold text-secondary small">
                        <i className="bi bi-stars text-warning me-1"></i>Peças Selecionadas:
                      </div>
                      {msg.itensRecomendados.map((item) => (
                        <div key={item.id} className="mini-product-card d-flex p-2 gap-2 align-items-center">
                          <img
                            src={item.imagemUrl || 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80'}
                            alt={item.nome}
                            className="mini-product-img rounded"
                          />
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="fw-bold text-dark text-truncate small" title={item.nome}>
                              {item.nome}
                            </div>
                            <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                              {item.categoria} {item.tipoArgila ? `• ${item.tipoArgila}` : ''}
                            </small>
                            <span className="fw-bold text-success small">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorVenda)}
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
                </div>
                <small
                  className={`mt-1 text-muted ${msg.remetente === 'usuario' ? 'text-end' : 'text-start'}`}
                  style={{ fontSize: '0.68rem' }}
                >
                  {msg.timestamp}
                </small>
              </div>
            ))}

            {/* Digitando... */}
            {carregando && (
              <div className="align-self-start typing-indicator">
                <span className="small text-muted me-1" style={{ fontSize: '0.78rem' }}>Caramelo Bot analisando</span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas */}
          <div className="bg-light px-3 py-2 border-top d-flex gap-1 overflow-auto" style={{ scrollbarWidth: 'none' }}>
            {SUGESTOES_RAPIDAS.map((sugestao, i) => (
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
                className="form-control border-end-0"
                placeholder="Pergunte sobre peças, estilos..."
                value={mensagemInput}
                onChange={(e) => setMensagemInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={carregando}
                style={{ fontSize: '0.9rem' }}
              />
              <button
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
    </div>
  );
};

export default ChatbotCard;