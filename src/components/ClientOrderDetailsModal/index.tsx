interface ClientOrderDetailsModalProps {
  show: boolean;
  onClose: () => void;
  order: any;
}

const ClientOrderDetailsModal = ({ show, onClose, order }: ClientOrderDetailsModalProps) => {
  if (!show || !order) return null;

  return (
    <div className="modal fade show custom-modal-overlay" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-scrollable modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-light border-0">
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-box2-heart fs-4 text-warning me-2"></i>
              Detalhes do Pedido #{order.id}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            
            <div className="row mb-4">
              <div className="col-md-6">
                <p className="mb-1 text-muted small">Status Atual</p>
                <h6 className={`fw-bold ${order.status === 'CANCELADO' ? 'text-danger' : 'text-success'}`}>{order.status}</h6>
              </div>
              <div className="col-md-6 text-md-end">
                <p className="mb-1 text-muted small">Data da Compra</p>
                <h6 className="fw-bold">{order.date}</h6>
              </div>
            </div>

            <div className="card border-0 bg-light mb-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Resumo da Compra (Mock)</h6>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>1x Tigela Rústica Caramelo</span>
                  <span className="fw-bold">R$ 89,90</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>2x Xícara de Café Expresso</span>
                  <span className="fw-bold">R$ 91,00</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2 text-muted">
                  <span>Frete</span>
                  <span className="fw-bold">R$ 15,00</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold fs-5">Total Pago</span>
                  <span className="fw-bold fs-5 text-success">R$ {(order.total + 15).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold">Endereço de Entrega</h6>
                <p className="text-muted small mb-0">Rua das Flores, 123 - Apto 45</p>
                <p className="text-muted small">São Paulo - SP, 01234-567</p>
              </div>
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold">Forma de Pagamento</h6>
                <p className="text-muted small mb-0">Cartão de Crédito final 4321</p>
                <p className="text-muted small">Parcelado em 2x</p>
              </div>
            </div>

          </div>
          <div className="modal-footer border-0">
            <button type="button" className="btn btn-dark" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOrderDetailsModal;
