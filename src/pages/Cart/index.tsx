import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  calcularOpcoesFrete,
  calcularOpcoesFreteSincrono,
  type OpcaoFrete,
  type CotacaoFreteResultado,
} from '../../services/shippingService';
import { cartService, type CartItem } from '../../services/cartService';
import { productService } from '../../services/productService';

const Cart = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>(() => cartService.getCart());
  const [expiredItems, setExpiredItems] = useState<CartItem[]>(() => cartService.getExpiredItems());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);
  const [alertaEstoqueRN0032, setAlertaEstoqueRN0032] = useState<string | null>(null);
  const [cepDestino, setCepDestino] = useState('');
  const [freteCalculado, setFreteCalculado] = useState<number | null>(null);
  const [cotacao, setCotacao] = useState<CotacaoFreteResultado | null>(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<OpcaoFrete | null>(null);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [erroFrete, setErroFrete] = useState<string | null>(null);
  const [qtyDraft, setQtyDraft] = useState<{ [id: number]: string }>({});
  const [pecaDetalheModal, setPecaDetalheModal] = useState<CartItem | null>(null);

  const handleAbrirDetalhesProduto = async (item: CartItem) => {
    setPecaDetalheModal(item);
    try {
      const pecaCompleta = await productService.buscarPorId(item.id);
      if (pecaCompleta) {
        setPecaDetalheModal((prev) =>
          prev && prev.id === item.id
            ? {
                ...prev,
                sku: pecaCompleta.sku || prev.sku,
                nome: pecaCompleta.nome || prev.nome,
                artesaoMarca: pecaCompleta.artesaoMarca || prev.artesaoMarca,
                preco: Number(pecaCompleta.valorVenda ?? prev.preco),
                categoria: pecaCompleta.categoria || prev.categoria,
                categoriasAdicionais: pecaCompleta.categoriasAdicionais || prev.categoriasAdicionais,
                estoque: pecaCompleta.estoque ?? prev.estoque,
                peso: pecaCompleta.peso ?? prev.peso,
                altura: pecaCompleta.altura ?? prev.altura,
                diametro: pecaCompleta.diametro ?? prev.diametro,
                volume: pecaCompleta.volume ?? prev.volume,
                tipoArgila: pecaCompleta.tipoArgila || prev.tipoArgila,
                tipoEsmalte: pecaCompleta.tipoEsmalte || prev.tipoEsmalte,
                vaiAoForno: pecaCompleta.vaiAoForno ?? prev.vaiAoForno,
                vaiAoMicroondas: pecaCompleta.vaiAoMicroondas ?? prev.vaiAoMicroondas,
                imagemUrl: pecaCompleta.imagemUrl || prev.imagemUrl,
              }
            : prev
        );
      }
    } catch {
      // Mantém os dados já presentes no item do carrinho caso a consulta falhe
    }
  };

  const handleFinalizarCompra = async () => {
    if (items.length === 0) return;

    // RN0032: Revalidar o estoque entre a adição ao carrinho e a finalização da compra
    try {
      const updatedItems: CartItem[] = [];
      const mensagensMudanca: string[] = [];

      for (const item of items) {
        try {
          const pecaAtual = await productService.buscarPorId(item.id);
          const estoqueReal = pecaAtual?.estoque ?? item.estoque;
          if (!pecaAtual || !pecaAtual.ativo || estoqueReal <= 0) {
            mensagensMudanca.push(`O item '${item.nome}' ficou sem estoque e foi removido do carrinho.`);
          } else if (estoqueReal < item.quantidade) {
            mensagensMudanca.push(
              `O estoque de '${item.nome}' mudou para ${estoqueReal} un. A quantidade no carrinho foi ajustada.`
            );
            updatedItems.push({ ...item, quantidade: estoqueReal, estoque: estoqueReal });
          } else {
            updatedItems.push({ ...item, estoque: estoqueReal });
          }
        } catch {
          updatedItems.push(item);
        }
      }

      if (mensagensMudanca.length > 0) {
        const msgCompleta = `Atenção (RN0032 - Revalidação de Estoque): ${mensagensMudanca.join(' ')}`;
        setAlertaEstoqueRN0032(msgCompleta);
        updateCart(updatedItems);
        alert(msgCompleta);
        if (updatedItems.length === 0) return;
      }
    } catch {}

    if (items.length > 0) {
      const cotacaoSincrona = calcularOpcoesFreteSincrono(
        cotacao?.cep || '01310-100',
        items,
        cotacao?.uf || 'SP'
      );
      const opcaoAtual = opcaoSelecionada || cotacaoSincrona.opcoes[0];
      localStorage.setItem(
        'caramelo_frete_opcao',
        JSON.stringify({
          cep: cotacao?.cep || '01310-100',
          cidade: cotacao?.cidade || 'São Paulo',
          uf: cotacao?.uf || 'SP',
          opcao: {
            ...opcaoAtual,
            valor: freteCalculado !== null ? freteCalculado : opcaoAtual.valor,
          },
        })
      );
    }

    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: { pathname: '/checkout' },
          message: 'Faça login para finalizar a compra do seu pedido. Seus itens foram mantidos no carrinho!'
        }
      });
      return;
    }
    navigate('/checkout');
  };

  useEffect(() => {
    const syncState = () => {
      setItems(cartService.getCart());
      setExpiredItems(cartService.getExpiredItems());
    };
    syncState();

    window.addEventListener('cartUpdated', syncState);
    return () => {
      window.removeEventListener('cartUpdated', syncState);
    };
  }, []);

  // Monitoramento em tempo real do bloqueio temporário do carrinho (RN0044, RNF0045, RNF0042)
  useEffect(() => {
    if (items.length === 0) return;

    const timer = setInterval(() => {
      const exp = cartService.getExpiresAt();
      if (exp) {
        const diffSec = Math.max(0, Math.ceil((exp - Date.now()) / 1000));
        setRemainingSeconds(diffSec);
        if (Date.now() >= exp) {
          const removed = cartService.expireCartNow();
          setItems([]);
          setExpiredItems(removed);
        }
      }
    }, 500);

    return () => clearInterval(timer);
  }, [items]);

  const handleExpirarBloqueioAgora = () => {
    const removed = cartService.expireCartNow();
    setItems([]);
    setExpiredItems(removed);
  };

  const handleRecolocarItensExpirados = () => {
    const restored = cartService.restoreExpiredItemsToCart();
    setItems(restored);
    setExpiredItems([]);
  };

  const updateCart = (newItems: CartItem[]) => {
    setItems(newItems);
    cartService.saveCart(newItems);
  };

  const handleLimparCarrinho = () => {
    if (window.confirm('Deseja realmente esvaziar todos os itens do carrinho?')) {
      cartService.clearCart();
      setItems([]);
      setExpiredItems([]);
      setFreteCalculado(null);
      setCotacao(null);
      setOpcaoSelecionada(null);
    }
  };

  const handleQtyChange = (id: number, qty: number) => {
    if (qty < 1) return;
    const item = items.find((i) => i.id === id);
    if (item && qty > item.estoque) {
      alert(`Quantidade máxima disponível para '${item.nome}' é ${item.estoque} un. (RN0031)`);
      qty = item.estoque;
    }
    const updated = items.map((i) => (i.id === id ? { ...i, quantidade: qty } : i));
    updateCart(updated);
  };

  const handleRemove = (id: number) => {
    const updated = items.filter((i) => i.id !== id);
    updateCart(updated);
  };

  const totalItensQtd = items.reduce((acc, item) => acc + item.quantidade, 0);

  // Frete padrão sincronizado (RF0034 - Opção 1: PAC base R$ 15,00)
  const cotacaoPadrao = calcularOpcoesFreteSincrono('01310-100', items, 'SP');
  const fretePadrao = cotacaoPadrao.opcoes[0].valor;
  const frete = freteCalculado !== null ? freteCalculado : (items.length > 0 ? fretePadrao : 0);
  const subtotal = items.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const total = subtotal + frete;

  const handleSimularFrete = async () => {
    const limpo = cepDestino.replace(/\D/g, '');
    if (limpo.length !== 8) {
      setErroFrete('Informe um CEP válido com 8 dígitos.');
      return;
    }
    setErroFrete(null);
    setCalculandoFrete(true);
    try {
      const res = await calcularOpcoesFrete(limpo, items);
      setCotacao(res);
      const selecionada = res.opcoes[0]; // PAC por padrão
      setOpcaoSelecionada(selecionada);
      setFreteCalculado(selecionada.valor);
      localStorage.setItem(
        'caramelo_frete_opcao',
        JSON.stringify({
          cep: res.cep,
          cidade: res.cidade,
          uf: res.uf,
          opcao: selecionada,
        })
      );
    } catch {
      setErroFrete('Não foi possível calcular o frete para o CEP informado.');
    } finally {
      setCalculandoFrete(false);
    }
  };

  const handleSelecionarOpcaoFrete = (op: OpcaoFrete) => {
    setOpcaoSelecionada(op);
    setFreteCalculado(op.valor);
    if (cotacao) {
      localStorage.setItem(
        'caramelo_frete_opcao',
        JSON.stringify({
          cep: cotacao.cep,
          cidade: cotacao.cidade,
          uf: cotacao.uf,
          opcao: op,
        })
      );
    }
  };

  useEffect(() => {
    if (cotacao && items.length > 0) {
      calcularOpcoesFrete(cotacao.cep, items, cotacao.uf).then((novaCotacao) => {
        setCotacao(novaCotacao);
        const mantida =
          novaCotacao.opcoes.find((o) => o.id === opcaoSelecionada?.id) ||
          novaCotacao.opcoes[0];
        setOpcaoSelecionada(mantida);
        setFreteCalculado(mantida.valor);
      });
    }
  }, [items]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Seu Carrinho de Compras</h2>
        <div className="d-flex align-items-center gap-2">
          {items.length > 0 && (
            <>
              <button
                type="button"
                className="btn btn-outline-warning text-dark btn-sm btn-simular-expiracao-carrinho"
                onClick={handleExpirarBloqueioAgora}
                title="Simular expiração do tempo de bloqueio do carrinho (RN0044 / RNF0042)"
              >
                <i className="bi bi-hourglass-bottom me-1"></i>Simular Expiração do Bloqueio
              </button>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm btn-esvaziar-carrinho"
                onClick={handleLimparCarrinho}
                title="Remover todos os itens do carrinho"
              >
                <i className="bi bi-trash3 me-1"></i>Esvaziar Carrinho
              </button>
            </>
          )}
          <Link to="/" className="btn btn-outline-dark btn-sm">
            <i className="bi bi-arrow-left me-1"></i>Continuar Comprando
          </Link>
        </div>
      </div>

      {alertaEstoqueRN0032 && (
        <div className="alert alert-warning alert-dismissible fade show alerta-revalidacao-estoque" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {alertaEstoqueRN0032}
          <button type="button" className="btn-close" onClick={() => setAlertaEstoqueRN0032(null)}></button>
        </div>
      )}

      {items.length > 0 && (
        <div className="alert alert-info py-2 px-3 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2 banner-bloqueio-carrinho">
          <div className="small">
            <i className="bi bi-shield-lock-fill me-2 text-primary"></i>
            <strong>Reserva temporária de estoque ativa (RN0044 / RN0045):</strong> Seus itens estão bloqueados por{' '}
            <span className="badge bg-dark font-monospace timer-bloqueio-carrinho">{formatTimer(remainingSeconds)}</span>{' '}
            a partir do último item incluído.
          </div>
          {remainingSeconds <= 300 && remainingSeconds > 0 && (
            <span className="badge bg-warning text-dark notificacao-expiracao-5min">
              <i className="bi bi-bell-fill me-1"></i>
              Aviso (RN0044): Faltam 5 minutos ou menos para sua reserva expirar!
            </span>
          )}
        </div>
      )}

      {items.length === 0 && expiredItems.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5">
          <div className="card-body">
            <i className="bi bi-cart-x fs-1 text-muted d-block mb-3"></i>
            <h4 className="fw-bold text-muted">Seu carrinho está vazio</h4>
            <p className="text-muted">Aproveite para escolher belas peças artesanais em nosso catálogo.</p>
            <Link to="/" className="btn btn-warning fw-bold px-4 py-2 mt-2">
              Explorar Catálogo
            </Link>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-lg-8">
            {/* Exibição dos itens removidos por expiração do bloqueio (RNF0042, RN0044) */}
            {expiredItems.length > 0 && (
              <div className="card shadow-sm border-danger mb-4 secao-itens-expirados">
                <div className="card-header bg-danger text-white fw-bold d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-clock-history me-2"></i>
                    Itens Removidos por Expiração do Bloqueio (RN0044 / RNF0042)
                  </span>
                </div>
                <div className="card-body p-4">
                  <div className="alert alert-danger py-2 small alerta-bloqueio-expirado">
                    O tempo parametrizado de bloqueio do carrinho expirou! Os produtos abaixo foram desbloqueados no
                    estoque e retirados do carrinho ativo. A opção de compra está desabilitada até que os itens voltem
                    ao carrinho.
                  </div>
                  {expiredItems.map((item) => (
                    <div
                      key={item.id}
                      className="d-flex align-items-center justify-content-between py-2 border-bottom item-expirado-carrinho"
                    >
                      <div className="d-flex align-items-center">
                        <img
                          src={
                            item.imagemUrl ||
                            'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=100&q=80'
                          }
                          alt={item.nome}
                          className="rounded opacity-50"
                          style={{ width: 55, height: 55, objectFit: 'cover' }}
                        />
                        <div className="ms-3">
                          <h6 className="fw-bold mb-0 text-muted">{item.nome}</h6>
                          <small className="text-danger">
                            Bloqueio expirado ({item.quantidade} un. liberadas ao estoque)
                          </small>
                        </div>
                      </div>
                      <span className="badge bg-secondary">Removido</span>
                    </div>
                  ))}
                  <div className="mt-3 text-end">
                    <button
                      type="button"
                      className="btn btn-warning fw-bold btn-recolocar-itens-carrinho"
                      onClick={handleRecolocarItensExpirados}
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>
                      Devolver Itens ao Carrinho (RNF0042)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {items.length > 0 && (
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body p-4">
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`d-flex align-items-center py-3 item-carrinho ${
                        idx < items.length - 1 ? 'border-bottom' : ''
                      }`}
                    >
                      <div
                        className="position-relative d-inline-block"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleAbrirDetalhesProduto(item)}
                        title="Clique para ver detalhes e ficha técnica da peça"
                        data-testid={`cart-item-img-trigger-${item.id}`}
                      >
                        <img
                          src={
                            item.imagemUrl ||
                            'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=100&q=80'
                          }
                          alt={item.nome}
                          className="rounded"
                          style={{ width: 80, height: 80, objectFit: 'cover' }}
                        />
                        <span
                          className="badge bg-dark bg-opacity-75 text-white position-absolute bottom-0 end-0 m-1 px-1 py-0"
                          style={{ fontSize: '0.68rem', fontWeight: 500 }}
                        >
                          <i className="bi bi-eye"></i>
                        </span>
                      </div>
                      <div className="ms-3 flex-grow-1">
                        <h5
                          className="fw-bold mb-1 item-nome"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleAbrirDetalhesProduto(item)}
                          title="Clique para ver detalhes da peça"
                        >
                          {item.nome}
                        </h5>
                        <span className="badge bg-light text-dark border mb-1">{item.categoria}</span>
                        <p className="text-muted mb-0 small">
                          Estoque disponível: <strong className="estoque-disponivel">{item.estoque} un.</strong>
                        </p>
                      </div>
                      <div className="d-flex align-items-center">
                        <input
                          type="number"
                          className="form-control me-2 text-center input-quantidade-carrinho"
                          style={{ width: '75px' }}
                          value={
                            qtyDraft[item.id] !== undefined
                              ? qtyDraft[item.id]
                              : item.quantidade
                          }
                          min="1"
                          max={item.estoque || 99}
                          onChange={(e) => {
                            const raw = e.target.value;
                            setQtyDraft((prev) => ({ ...prev, [item.id]: raw }));
                            if (raw !== '') {
                              const parsed = parseInt(raw, 10);
                              if (!isNaN(parsed) && parsed >= 1) {
                                handleQtyChange(item.id, parsed);
                              }
                            }
                          }}
                          onBlur={() => {
                            setQtyDraft((prev) => {
                              const next = { ...prev };
                              delete next[item.id];
                              return next;
                            });
                          }}
                        />
                        <button
                          className="btn btn-outline-danger btn-sm btn-remover-item"
                          onClick={() => handleRemove(item.id)}
                          title="Remover item"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                      <div className="ms-4 text-end" style={{ minWidth: '110px' }}>
                        <span className="fw-bold fs-5 text-success item-subtotal">
                          R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                        </span>
                        <br />
                        <small className="text-muted">
                          R$ {item.preco.toFixed(2).replace('.', ',')} un.
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Simulação e Cotação de Frete (RF0034 - Opção 1: Peso Real + Região + PAC/SEDEX) */}
            <div className="card shadow-sm border-0 mb-4 secao-cotacao-frete">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-3 d-flex align-items-center">
                  <i className="bi bi-truck me-2 text-warning fs-5"></i>
                  Cálculo de Frete e Prazo de Entrega (RF0034)
                </h6>

                <div className="input-group mb-2" style={{ maxWidth: '420px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Digite seu CEP (Ex: 01310-100)"
                    value={cepDestino}
                    maxLength={9}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length > 5) {
                        val = `${val.substring(0, 5)}-${val.substring(5, 8)}`;
                      }
                      setCepDestino(val);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSimularFrete();
                      }
                    }}
                  />
                  <button
                    className="btn btn-dark fw-semibold"
                    type="button"
                    onClick={handleSimularFrete}
                    disabled={calculandoFrete}
                  >
                    {calculandoFrete ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Calculando...
                      </>
                    ) : (
                      'Calcular'
                    )}
                  </button>
                </div>

                {erroFrete && (
                  <div className="alert alert-danger py-2 small mb-3 mt-2">{erroFrete}</div>
                )}

                {/* Exibição detalhada da Cotação com Opções PAC e SEDEX */}
                {cotacao && (
                  <div className="mt-3 p-3 bg-light rounded-3 border resultado-cotacao-frete">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
                      <span className="small text-muted">
                        <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                        Destino: <strong>{cotacao.cidade} - {cotacao.uf}</strong>
                      </span>
                      <span className="small text-muted">
                        <i className="bi bi-box-seam text-secondary me-1"></i>
                        Peso Total: <strong>{cotacao.pesoTotalKg.toFixed(2).replace('.', ',')} kg</strong> ({totalItensQtd} peças)
                      </span>
                    </div>

                    <div className="row g-2">
                      {cotacao.opcoes.map((opcao) => {
                        const isAtiva = opcaoSelecionada?.id === opcao.id;
                        return (
                          <div className="col-12 col-md-6" key={opcao.id}>
                            <div
                              onClick={() => handleSelecionarOpcaoFrete(opcao)}
                              className={`card h-100 p-3 cursor-pointer border transition-all ${
                                isAtiva ? 'border-warning bg-white shadow-sm' : 'bg-white'
                              }`}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <div className="form-check mb-0">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="opcaoFreteCarrinho"
                                    id={`opcao-${opcao.id}`}
                                    checked={isAtiva}
                                    onChange={() => handleSelecionarOpcaoFrete(opcao)}
                                  />
                                  <label
                                    className="form-check-label fw-bold"
                                    htmlFor={`opcao-${opcao.id}`}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {opcao.nome}
                                  </label>
                                </div>
                                <span className="fw-bold text-success fs-6">
                                  R$ {opcao.valor.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                              <div className="small text-muted ms-4">
                                <i className="bi bi-clock me-1 text-primary"></i>
                                Prazo estimado: <strong>{opcao.prazoDias}</strong>
                              </div>
                              <small className="text-secondary ms-4 mt-1 d-block" style={{ fontSize: '0.75rem' }}>
                                {opcao.descricao}
                              </small>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <small className="text-muted d-block mt-2" style={{ fontSize: '0.8rem' }}>
                  * Cálculo calculado conforme a região do CEP e o peso das peças de cerâmica com embalagem protetora reforçada.
                </small>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm border-0 bg-light">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">Resumo do Pedido</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal ({totalItensQtd} peças)</span>
                  <span className="fw-bold resumo-subtotal">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">
                    {opcaoSelecionada
                      ? `Frete (${opcaoSelecionada.nome})`
                      : 'Frete Calculado'}
                  </span>
                  <span className="fw-bold resumo-frete">R$ {frete.toFixed(2).replace('.', ',')}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4 fw-bold fs-5 text-dark">
                  <span>Total</span>
                  <span className="text-success resumo-total">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <button
                  type="button"
                  onClick={handleFinalizarCompra}
                  disabled={items.length === 0}
                  className="btn btn-warning w-100 fw-bold py-2 shadow-sm btn-iniciar-compra"
                >
                  {items.length === 0
                    ? 'Compra Desabilitada (Bloqueio Expirado)'
                    : isAuthenticated
                    ? 'Continuar para o Pagamento'
                    : 'Fazer Login para Finalizar Compra'}{' '}
                  <i className="bi bi-arrow-right ms-1"></i>
                </button>
                {!isAuthenticated && (
                  <div className="alert alert-info p-2 small mt-3 mb-0 d-flex align-items-center aviso-login-carrinho">
                    <i className="bi bi-info-circle-fill me-2 fs-6"></i>
                    <span>Você não está conectado. Ao finalizar, solicitaremos seu login ou cadastro para entrega.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes e Ficha Técnica da Peça no Carrinho (igual ao Catálogo) */}
      {pecaDetalheModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}
          onClick={() => setPecaDetalheModal(null)}
          data-testid="product-details-modal"
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white border-0">
                <div>
                  <h5 className="modal-title fw-bold mb-0">{pecaDetalheModal.nome}</h5>
                  {pecaDetalheModal.artesaoMarca && (
                    <small className="text-white-50">
                      Artesão / Ateliê: <strong>{pecaDetalheModal.artesaoMarca}</strong>
                      {pecaDetalheModal.sku ? ` • SKU: ${pecaDetalheModal.sku}` : ''}
                    </small>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setPecaDetalheModal(null)}
                  aria-label="Fechar"
                />
              </div>

              <div className="modal-body p-4">
                <div className="row g-4 align-items-center">
                  <div className="col-md-5">
                    <img
                      src={
                        pecaDetalheModal.imagemUrl ||
                        'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80'
                      }
                      alt={pecaDetalheModal.nome}
                      className="img-fluid rounded-3 shadow-sm w-100"
                      style={{ maxHeight: '320px', objectFit: 'cover' }}
                    />
                  </div>

                  <div className="col-md-7">
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                      <span className="badge bg-secondary">{pecaDetalheModal.categoria}</span>
                      {pecaDetalheModal.categoriasAdicionais &&
                        pecaDetalheModal.categoriasAdicionais
                          .filter((c) => c !== pecaDetalheModal.categoria)
                          .map((cat, i) => (
                            <span key={i} className="badge bg-light text-dark border">
                              {cat}
                            </span>
                          ))}
                      {(pecaDetalheModal.estoque ?? 0) <= 0 ? (
                        <span className="badge bg-danger">Esgotado</span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">
                          {pecaDetalheModal.estoque} unidades em estoque
                        </span>
                      )}
                    </div>

                    <h3 className="fw-bold text-success mb-3">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(pecaDetalheModal.preco)}
                    </h3>

                    <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">
                      <i className="bi bi-sliders me-2 text-warning"></i>
                      Ficha Técnica Artesanal
                    </h6>

                    <div className="row g-2 mb-3" style={{ fontSize: '0.92rem' }}>
                      <div className="col-6">
                        <div className="p-2 rounded bg-light border">
                          <small className="text-muted d-block">Tipo de Argila</small>
                          <strong>{pecaDetalheModal.tipoArgila || 'Cerâmica Artesanal'}</strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-light border">
                          <small className="text-muted d-block">Acabamento / Esmalte</small>
                          <strong>{pecaDetalheModal.tipoEsmalte || 'Esmalte Mineral'}</strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-light border">
                          <small className="text-muted d-block">Dimensões (Alt. × Diâm.)</small>
                          <strong>
                            {pecaDetalheModal.altura ? `${pecaDetalheModal.altura} cm` : '-'} ×{' '}
                            {pecaDetalheModal.diametro ? `${pecaDetalheModal.diametro} cm` : '-'}
                          </strong>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-light border">
                          <small className="text-muted d-block">Peso / Capacidade</small>
                          <strong>
                            {pecaDetalheModal.peso ? `${pecaDetalheModal.peso} g` : '-'}
                            {pecaDetalheModal.volume && pecaDetalheModal.volume > 0
                              ? ` • ${pecaDetalheModal.volume} ml`
                              : ''}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex flex-wrap gap-2 mb-4">
                      <span
                        className={`badge px-3 py-2 ${
                          pecaDetalheModal.vaiAoForno
                            ? 'bg-success-subtle text-success border border-success-subtle'
                            : 'bg-secondary-subtle text-secondary border'
                        }`}
                      >
                        <i
                          className={`bi ${
                            pecaDetalheModal.vaiAoForno ? 'bi-check-circle-fill' : 'bi-x-circle'
                          } me-1`}
                        ></i>
                        Forno: {pecaDetalheModal.vaiAoForno ? 'Sim (até 1240°C)' : 'Não indicado'}
                      </span>

                      <span
                        className={`badge px-3 py-2 ${
                          pecaDetalheModal.vaiAoMicroondas
                            ? 'bg-success-subtle text-success border border-success-subtle'
                            : 'bg-secondary-subtle text-secondary border'
                        }`}
                      >
                        <i
                          className={`bi ${
                            pecaDetalheModal.vaiAoMicroondas
                              ? 'bi-check-circle-fill'
                              : 'bi-x-circle'
                          } me-1`}
                        ></i>
                        Micro-ondas: {pecaDetalheModal.vaiAoMicroondas ? 'Sim' : 'Não indicado'}
                      </span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between bg-light p-2 rounded-3 border mb-3">
                      <span className="small text-muted">
                        Quantidade no seu carrinho: <strong>{pecaDetalheModal.quantidade} un.</strong>
                      </span>
                      <span className="small fw-bold text-success">
                        Subtotal:{' '}
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(pecaDetalheModal.preco * pecaDetalheModal.quantidade)}
                      </span>
                    </div>

                    <div className="d-flex justify-content-end">
                      <button
                        type="button"
                        onClick={() => setPecaDetalheModal(null)}
                        className="btn btn-outline-secondary px-4 py-2"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
