import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const Cart = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cepDestino, setCepDestino] = useState('');
  const [freteCalculado, setFreteCalculado] = useState<number | null>(null);

  const handleFinalizarCompra = () => {
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
    const saved = localStorage.getItem('caramelo_cart');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao ler carrinho:', e);
      }
    }
  }, []);

  const updateCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem('caramelo_cart', JSON.stringify(newItems));
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

  // Critério de Frete (RF0034): Base R$ 15,00 + R$ 3,00 por item adicional selecionado
  const calcularFreteCriterio = () => {
    if (items.length === 0) return 0;
    const base = 15.0;
    const extra = Math.max(0, totalItensQtd - 1) * 3.0;
    return base + extra;
  };

  const frete = freteCalculado !== null ? freteCalculado : calcularFreteCriterio();
  const subtotal = items.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const total = subtotal + frete;

  const handleSimularFrete = () => {
    if (cepDestino.replace(/\D/g, '').length !== 8) {
      alert('Informe um CEP válido com 8 dígitos.');
      return;
    }
    const val = calcularFreteCriterio();
    setFreteCalculado(val);
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Seu Carrinho de Compras</h2>
        <Link to="/" className="btn btn-outline-dark btn-sm">
          <i className="bi bi-arrow-left me-1"></i>Continuar Comprando
        </Link>
      </div>

      {items.length === 0 ? (
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
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`d-flex align-items-center py-3 item-carrinho ${
                      idx < items.length - 1 ? 'border-bottom' : ''
                    }`}
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
                    <div className="ms-3 flex-grow-1">
                      <h5 className="fw-bold mb-1 item-nome">{item.nome}</h5>
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
                        value={item.quantidade}
                        min="1"
                        max={item.estoque || 99}
                        onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
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

            {/* Simulação de Frete (RF0034) */}
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-3">
                <h6 className="fw-bold mb-2">
                  <i className="bi bi-truck me-2 text-warning"></i>Simular Frete por CEP (RF0034)
                </h6>
                <div className="input-group" style={{ maxWidth: '350px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Digite seu CEP (Ex: 01310-100)"
                    value={cepDestino}
                    maxLength={9}
                    onChange={(e) => setCepDestino(e.target.value)}
                  />
                  <button className="btn btn-outline-dark" type="button" onClick={handleSimularFrete}>
                    Calcular
                  </button>
                </div>
                <small className="text-muted d-block mt-2">
                  * Critério de Frete: R$ 15,00 base + R$ 3,00 por item adicional selecionado.
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
                  <span className="text-muted">Frete Calculado</span>
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
                  className="btn btn-warning w-100 fw-bold py-2 shadow-sm btn-iniciar-compra"
                >
                  {isAuthenticated ? 'Continuar para o Pagamento' : 'Fazer Login para Finalizar Compra'}{' '}
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
    </div>
  );
};

export default Cart;
