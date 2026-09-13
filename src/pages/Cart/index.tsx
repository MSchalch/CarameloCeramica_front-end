import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

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
  const [items, setItems] = useState<CartItem[]>([]);

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
    const updated = items.map(i => (i.id === id ? { ...i, quantidade: qty } : i));
    updateCart(updated);
  };

  const handleRemove = (id: number) => {
    const updated = items.filter(i => i.id !== id);
    updateCart(updated);
  };

  const subtotal = items.reduce((acc, item) => acc + item.preco * item.quantidade, 0);
  const freteFixo = items.length > 0 ? 25.00 : 0.00;
  const total = subtotal + freteFixo;

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
                    className={`d-flex align-items-center py-3 ${
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
                      <h5 className="fw-bold mb-1">{item.nome}</h5>
                      <span className="badge bg-light text-dark border mb-1">{item.categoria}</span>
                      <p className="text-muted mb-0 small">
                        Estoque disponível: <strong>{item.estoque} un.</strong>
                      </p>
                    </div>
                    <div className="d-flex align-items-center">
                      <input
                        type="number"
                        className="form-control me-2 text-center"
                        style={{ width: '70px' }}
                        value={item.quantidade}
                        min="1"
                        max={item.estoque || 99}
                        onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                      />
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleRemove(item.id)}
                        title="Remover item"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                    <div className="ms-4 text-end" style={{ minWidth: '110px' }}>
                      <span className="fw-bold fs-5 text-success">
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
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm border-0 bg-light">
              <div className="card-body p-4">
                <h5 className="card-title fw-bold mb-4">Resumo do Pedido</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal ({items.length} itens)</span>
                  <span className="fw-bold">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Frete Estimado</span>
                  <span className="fw-bold">R$ {freteFixo.toFixed(2).replace('.', ',')}</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between mb-4 fw-bold fs-5 text-dark">
                  <span>Total</span>
                  <span className="text-success">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <Link to="/checkout" className="btn btn-warning w-100 fw-bold py-2 shadow-sm">
                  Continuar para o Pagamento <i className="bi bi-arrow-right ms-1"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
