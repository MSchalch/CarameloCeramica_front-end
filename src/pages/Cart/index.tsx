import { Link } from 'react-router-dom';

const Cart = () => {
  return (
    <div className="container py-5">
      <h2 className="mb-4 fw-bold">Seu Carrinho</h2>
      <div className="row">
        <div className="col-lg-8">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body p-4">
                
                <div className="d-flex align-items-center mb-4 pb-4 border-bottom">
                  <img src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=100&q=80" alt="Tigela Rústica" className="rounded cart-item-img" />
                  <div className="ms-3 flex-grow-1">
                    <h5 className="fw-bold mb-1">Tigela Rústica Caramelo</h5>
                    <p className="text-muted mb-0 small">Categoria: Utilitários</p>
                  </div>
                  <div className="d-flex align-items-center">
                    <input type="number" className="form-control me-2 cart-qty-input" defaultValue="1" min="1" />
                    <button className="btn btn-outline-danger btn-sm"><i className="bi bi-trash"></i></button>
                  </div>
                  <div className="ms-4 text-end" style={{ minWidth: '100px' }}>
                    <span className="fw-bold fs-5">R$ 89,90</span>
                  </div>
                </div>

                <div className="d-flex align-items-center mb-2">
                  <img src="https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=100&q=80" alt="Xícara de Café" className="rounded cart-item-img" />
                  <div className="ms-3 flex-grow-1">
                    <h5 className="fw-bold mb-1">Xícara de Café Expresso</h5>
                    <p className="text-muted mb-0 small">Categoria: Utilitários</p>
                  </div>
                  <div className="d-flex align-items-center">
                    <input type="number" className="form-control me-2 cart-qty-input" defaultValue="2" min="1" />
                    <button className="btn btn-outline-danger btn-sm"><i className="bi bi-trash"></i></button>
                  </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 bg-light">
            <div className="card-body">
              <h5 className="card-title fw-bold mb-4">Resumo do Pedido</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>R$ 180,90</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Frete</span>
                <span>A calcular</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4 fw-bold fs-5">
                <span>Total</span>
                <span>R$ 180,90</span>
              </div>
              <Link to="/checkout" className="btn btn-dark w-100 fw-bold">Continuar para o Pagamento</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
