import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { orderService } from '../../services/orderService';
import type { Cliente, CartaoCredito } from '../../types/customer';
import type { Pedido, ItemPedido, PagamentoPedido, Cupom } from '../../types/order';
import { useAuth } from '../../contexts/AuthContext';

interface CartItem {
  id: number;
  nome: string;
  preco: number;
  imagemUrl: string;
  categoria: string;
  quantidade: number;
  estoque: number;
}

interface CartaoPagamentoForm {
  cartaoId?: number;
  numero: string;
  nomeImpresso: string;
  bandeira: string;
  codigoSeguranca: string;
  valor: number;
}

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Cliente | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Cupons
  const [cupomInput, setCupomInput] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<Cupom | null>(null);
  const [cupomMsg, setCupomMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Pagamentos com cartão
  const [cards, setCards] = useState<CartaoPagamentoForm[]>([
    { numero: '', nomeImpresso: '', bandeira: 'MASTERCARD', codigoSeguranca: '', valor: 0 },
  ]);

  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    // Carregar itens do carrinho
    const savedCart = localStorage.getItem('caramelo_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }

    // Carregar cliente ativo para endereço e cartões
    const carregarCliente = async () => {
      try {
        let clienteEncontrado: Cliente | null = null;
        if (user?.clienteId) {
          clienteEncontrado = await customerService.buscarPorId(user.clienteId);
        } else {
          const data = await customerService.listarClientes('', 0, 1);
          if (data.content && data.content.length > 0) {
            clienteEncontrado = await customerService.buscarPorId(data.content[0].id!);
          }
        }

        if (clienteEncontrado) {
          setCurrentCustomer(clienteEncontrado);
          if (clienteEncontrado.enderecos && clienteEncontrado.enderecos.length > 0) {
            setSelectedAddressId(clienteEncontrado.enderecos[0].id!);
          }
          if (clienteEncontrado.cartoes && clienteEncontrado.cartoes.length > 0) {
            setCards([
              {
                cartaoId: clienteEncontrado.cartoes[0].id,
                numero: clienteEncontrado.cartoes[0].numero,
                nomeImpresso: clienteEncontrado.cartoes[0].nomeImpresso,
                bandeira: clienteEncontrado.cartoes[0].bandeira,
                codigoSeguranca: clienteEncontrado.cartoes[0].codigoSeguranca,
                valor: 0,
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do cliente no checkout:', err);
      }
    };

    carregarCliente();
  }, [user]);

  const subtotal = items.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const frete = items.length > 0 ? 25.00 : 0.00;
  const desconto = cupomAplicado ? cupomAplicado.valor : 0.00;
  const total = Math.max(0, subtotal - desconto + frete);

  // Ajustar valor padrão se for apenas 1 cartão
  useEffect(() => {
    if (cards.length === 1) {
      setCards(prev => [{ ...prev[0], valor: total }]);
    }
  }, [total, cards.length]);

  const handleValidarCupom = async () => {
    if (!cupomInput.trim()) return;
    setCupomMsg(null);
    try {
      const cupom = await orderService.validarCupom(cupomInput.trim());
      setCupomAplicado(cupom);
      setCupomMsg({
        type: 'success',
        text: `Cupom ${cupom.codigo} aplicado! Desconto de R$ ${cupom.valor.toFixed(2).replace('.', ',')}`,
      });
    } catch (err: any) {
      const msg = err.response?.data || err.message || 'Cupom inválido ou expirado.';
      setCupomMsg({ type: 'danger', text: typeof msg === 'string' ? msg : JSON.stringify(msg) });
    }
  };

  const handleAddCard = () => {
    setCards([
      ...cards,
      { numero: '', nomeImpresso: '', bandeira: 'MASTERCARD', codigoSeguranca: '', valor: 10 },
    ]);
  };

  const handleRemoveCard = (index: number) => {
    if (cards.length > 1) {
      setCards(cards.filter((_, i) => i !== index));
    }
  };

  const handleSelectExistingCard = (index: number, cardId: number) => {
    const card = currentCustomer?.cartoes?.find(c => c.id === cardId);
    if (card) {
      const updated = [...cards];
      updated[index] = {
        ...updated[index],
        cartaoId: card.id,
        numero: card.numero,
        nomeImpresso: card.nomeImpresso,
        bandeira: card.bandeira,
        codigoSeguranca: card.codigoSeguranca,
      };
      setCards(updated);
    }
  };

  const handleConfirmOrder = async () => {
    if (!currentCustomer) {
      alert('Nenhum cliente selecionado para a compra.');
      return;
    }

    if (items.length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }

    setLoading(true);
    setOrderError(null);

    // Itens do pedido
    const itensPedido: ItemPedido[] = items.map(item => ({
      peca: { id: item.id } as any,
      quantidade: item.quantidade,
      valorUnitario: item.preco,
      valorTotal: item.preco * item.quantidade,
    }));

    // Pagamentos com cartão
    const pagamentos: PagamentoPedido[] = cards.map(c => ({
      formaPagamento: 'CARTAO',
      cartao: {
        id: c.cartaoId,
        numero: c.numero,
        nomeImpresso: c.nomeImpresso,
        bandeira: c.bandeira,
        codigoSeguranca: c.codigoSeguranca,
        preferencial: false,
      } as CartaoCredito,
      valorPago: c.valor,
    }));

    const pedidoPayload: Pedido = {
      cliente: { id: currentCustomer.id } as Cliente,
      enderecoEntregaId: selectedAddressId || undefined,
      valorSubtotal: subtotal,
      valorFrete: frete,
      valorDesconto: desconto,
      valorTotal: total,
      cupomPromocional: cupomAplicado || undefined,
      itens: itensPedido,
      pagamentos: pagamentos,
    };

    try {
      await orderService.criarPedido(pedidoPayload);
      localStorage.removeItem('caramelo_cart');
      alert('🎉 Pedido realizado com sucesso e estoque baixado!');
      navigate('/profile/orders');
    } catch (err: any) {
      console.error('Erro ao fechar pedido:', err);
      const msg = err.response?.data || err.message || 'Erro ao processar pedido no servidor.';
      setOrderError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Finalizar Compra</h2>

      {orderError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Não foi possível concluir o pedido:</strong> {orderError}
          <button type="button" className="btn-close" onClick={() => setOrderError(null)}></button>
        </div>
      )}

      <div className="row">
        <div className="col-lg-8">
          {/* Endereço de Entrega */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white fw-bold fs-5">1. Endereço de Entrega</div>
            <div className="card-body">
              {currentCustomer?.enderecos && currentCustomer.enderecos.length > 0 ? (
                currentCustomer.enderecos.map((end) => (
                  <div className="form-check mb-3" key={end.id}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="selectedAddress"
                      id={`end-${end.id}`}
                      checked={selectedAddressId === end.id}
                      onChange={() => setSelectedAddressId(end.id!)}
                    />
                    <label className="form-check-label" htmlFor={`end-${end.id}`}>
                      <strong>{end.identificacao}</strong> - {end.logradouro}, {end.numero} - {end.bairro} ({end.cidade}/{end.estado} - CEP {end.cep})
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-muted">
                  Nenhum endereço encontrado para este cliente.{' '}
                  <Link to="/profile">Cadastre um endereço no seu perfil</Link>.
                </div>
              )}
            </div>
          </div>

          {/* Pagamento com Cartões */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white fw-bold fs-5 d-flex justify-content-between align-items-center">
              2. Pagamento com Cartão
              <button className="btn btn-sm btn-outline-dark" onClick={handleAddCard}>
                <i className="bi bi-plus-lg me-1"></i>Pagar com dois ou mais cartões
              </button>
            </div>
            <div className="card-body">
              {cards.map((card, index) => (
                <div key={index} className={`p-3 mb-3 border rounded ${index > 0 ? 'bg-light' : ''}`}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">Cartão {index + 1}</h6>
                    {cards.length > 1 && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleRemoveCard(index)}
                      >
                        Remover Cartão
                      </button>
                    )}
                  </div>

                  {currentCustomer?.cartoes && currentCustomer.cartoes.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label small text-muted">Usar cartão salvo:</label>
                      <select
                        className="form-select"
                        value={card.cartaoId || ''}
                        onChange={(e) => handleSelectExistingCard(index, Number(e.target.value))}
                      >
                        <option value="">Digitar outro cartão...</option>
                        {currentCustomer.cartoes.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.bandeira} - Nº: {c.numero} ({c.nomeImpresso})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="row mb-3">
                    <div className="col-md-7">
                      <label className="form-label">Número do Cartão *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="0000 0000 0000 0000"
                        value={card.numero}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCards(prev => prev.map((c, i) => i === index ? { ...c, numero: val } : c));
                        }}
                        required
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label">Nome Impresso *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="NOME IMPRESSO"
                        value={card.nomeImpresso}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCards(prev => prev.map((c, i) => i === index ? { ...c, nomeImpresso: val } : c));
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <label className="form-label">Bandeira *</label>
                      <select
                        className="form-select"
                        value={card.bandeira}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCards(prev => prev.map((c, i) => i === index ? { ...c, bandeira: val } : c));
                        }}
                      >
                        <option value="MASTERCARD">Mastercard</option>
                        <option value="VISA">Visa</option>
                        <option value="ELO">Elo</option>
                        <option value="AMEX">Amex</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">CVV *</label>
                      <input
                        type="text"
                        className="form-control"
                        maxLength={4}
                        placeholder="123"
                        value={card.codigoSeguranca}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCards(prev => prev.map((c, i) => i === index ? { ...c, codigoSeguranca: val } : c));
                        }}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-bold text-success">Valor neste cartão (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control fw-bold border-success"
                        value={card.valor || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCards(prev => prev.map((c, i) => i === index ? { ...c, valor: val } : c));
                        }}
                        required
                      />
                      {cards.length > 1 && (
                        <small className="text-muted">Mínimo R$ 10,00 por cartão</small>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumo do Pedido & Cupons */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 bg-light sticky-top" style={{ top: '90px' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4">Resumo do Pedido</h5>

              <div className="mb-4">
                <label className="form-label small fw-bold">Cupom Promocional (Ex: BEMVINDO10)</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Insira o código"
                    value={cupomInput}
                    onChange={(e) => setCupomInput(e.target.value)}
                  />
                  <button className="btn btn-dark" type="button" onClick={handleValidarCupom}>
                    Aplicar
                  </button>
                </div>
                {cupomMsg && (
                  <div className={`text-${cupomMsg.type} small mt-1`}>
                    {cupomMsg.text}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal ({items.length} itens)</span>
                <span className="fw-bold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 text-success">
                <span>Desconto (Cupom)</span>
                <span className="fw-bold">- R$ {desconto.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Frete</span>
                <span className="fw-bold">R$ {frete.toFixed(2).replace('.', ',')}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4 fw-bold fs-4 text-warning-emphasis">
                <span>Total</span>
                <span className="text-success">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>

              <button
                className="btn btn-warning w-100 fw-bold shadow-sm py-3 fs-5"
                onClick={handleConfirmOrder}
                disabled={loading || items.length === 0}
              >
                {loading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processando...
                  </span>
                ) : (
                  'Confirmar Pedido'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
