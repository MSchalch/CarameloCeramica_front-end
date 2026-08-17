const Checkout = () => {
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white fw-bold fs-5">Endereço de Entrega</div>
            <div className="card-body">
              <form>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">CEP</label>
                    <input type="text" className="form-control" placeholder="00000-000" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Endereço</label>
                  <input type="text" className="form-control" />
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Cidade</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Estado</label>
                    <input type="text" className="form-control" />
                  </div>
                </div>
              </form>
            </div>
          </div>
          
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white fw-bold fs-5">Pagamento</div>
            <div className="card-body">
              <form>
                <div className="mb-3">
                  <label className="form-label">Número do Cartão</label>
                  <input type="text" className="form-control" placeholder="0000 0000 0000 0000" />
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Validade</label>
                    <input type="text" className="form-control" placeholder="MM/AA" />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">CVV</label>
                    <input type="text" className="form-control" placeholder="123" />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
           <div className="card shadow-sm border-0 bg-light sticky-top" style={{ top: '90px' }}>
            <div className="card-body">
              <h5 className="card-title fw-bold mb-4">Resumo</h5>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>R$ 180,90</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Frete</span>
                <span>R$ 25,00</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4 fw-bold fs-5 text-warning-emphasis">
                <span>Total</span>
                <span>R$ 205,90</span>
              </div>
              <button className="btn btn-warning w-100 fw-bold shadow-sm">Confirmar Pedido</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
