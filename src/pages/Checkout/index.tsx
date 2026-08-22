import { useState } from 'react';

const Checkout = () => {
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [cards, setCards] = useState([{ id: 1, value: '' }]);

  const handleAddCard = () => {
    setCards([...cards, { id: cards.length + 1, value: '' }]);
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Finalizar Compra</h2>
      <div className="row">
        <div className="col-lg-8">
          {/* Endereço de Entrega */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white fw-bold fs-5">Endereço de Entrega</div>
            <div className="card-body">
              
              <div className="mb-3">
                <div className="form-check mb-2">
                  <input className="form-check-input" type="radio" name="address" id="addr1" defaultChecked onChange={() => setUseNewAddress(false)} />
                  <label className="form-check-label" htmlFor="addr1">
                    <strong>Casa</strong> - Rua das Flores, 123, São Paulo - SP
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="radio" name="address" id="addr2" onChange={() => setUseNewAddress(false)} />
                  <label className="form-check-label" htmlFor="addr2">
                    <strong>Trabalho</strong> - Av. Paulista, 1000, São Paulo - SP
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input className="form-check-input" type="radio" name="address" id="addr3" onChange={() => setUseNewAddress(true)} />
                  <label className="form-check-label text-warning fw-bold" htmlFor="addr3">
                    Usar um novo endereço
                  </label>
                </div>
              </div>

              {useNewAddress && (
                <form className="bg-light p-3 rounded border">
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
              )}

            </div>
          </div>
          
          {/* Pagamento */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white fw-bold fs-5 d-flex justify-content-between align-items-center">
              Pagamento com Cartão
              <button className="btn btn-sm btn-outline-dark" onClick={handleAddCard}>
                <i className="bi bi-plus-lg me-1"></i>Pagar com dois ou mais cartões
              </button>
            </div>
            <div className="card-body">
              {cards.map((card, index) => (
                <div key={card.id} className={`p-3 mb-3 border rounded ${index > 0 ? 'bg-light' : ''}`}>
                  {cards.length > 1 && <h6 className="fw-bold">Cartão {index + 1}</h6>}
                  <div className="mb-3">
                    <label className="form-label">Selecione um cartão salvo ou insira um novo:</label>
                    <select className="form-select mb-3">
                      <option value="">Inserir novo cartão...</option>
                      <option value="1">Mastercard - Final 4321</option>
                    </select>
                  </div>
                  <div className="row mb-3">
                    <div className="col-12">
                      <label className="form-label">Número do Cartão</label>
                      <input type="text" className="form-control" placeholder="0000 0000 0000 0000" />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <label className="form-label">Validade</label>
                      <input type="text" className="form-control" placeholder="MM/AA" />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">CVV</label>
                      <input type="text" className="form-control" placeholder="123" />
                    </div>
                    {cards.length > 1 && (
                      <div className="col-md-4">
                        <label className="form-label text-success fw-bold">Valor neste cartão (R$)</label>
                        <input type="text" className="form-control border-success" placeholder="0,00" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        
        <div className="col-lg-4">
           <div className="card shadow-sm border-0 bg-light sticky-top" style={{ top: '90px' }}>
            <div className="card-body">
              <h5 className="card-title fw-bold mb-4">Resumo do Pedido</h5>
              
              <div className="mb-4">
                <label className="form-label small fw-bold">Cupom de Troca / Promocional</label>
                <div className="input-group">
                  <input type="text" className="form-control" placeholder="Insira o código" />
                  <button className="btn btn-dark">Aplicar</button>
                </div>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>R$ 180,90</span>
              </div>
              <div className="d-flex justify-content-between mb-2 text-success">
                <span>Descontos (Cupom)</span>
                <span>- R$ 0,00</span>
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
              <button className="btn btn-warning w-100 fw-bold shadow-sm py-2">Confirmar Pedido</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
