interface OrderEditModalProps {
  show: boolean;
  onClose: () => void;
  order: any;
  onStatusChange: (id: number, status: string) => void;
}

const statusOptions = [
  'EM ABERTO', 'EM PROCESSAMENTO', 'PAGAMENTO REALIZADO', 'EM TRÂNSITO', 'ENTREGUE', 
  'TROCA SOLICITADA', 'TROCA ACEITA', 'TROCA NEGADA', 
  'ITEM ENVIADO', 'ITEM RECEBIDO', 'TROCA PROCESSADA', 'CANCELADO'
];

const OrderEditModal = ({ show, onClose, order, onStatusChange }: OrderEditModalProps) => {
  if (!show || !order) return null;

  return (
    <div className="modal fade show custom-modal-overlay" tabIndex={-1}>
      <div className="modal-dialog modal-dialog-scrollable modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-light border-0">
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-receipt fs-4 text-warning me-2"></i>
              Detalhes do Pedido #{order.id}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            
            <div className="row mb-4">
              <div className="col-md-6">
                <p className="mb-1 text-muted small">Cliente</p>
                <h6 className="fw-bold">{order.customer}</h6>
              </div>
              <div className="col-md-6 text-md-end">
                <p className="mb-1 text-muted small">Data da Compra</p>
                <h6 className="fw-bold">{order.date}</h6>
              </div>
            </div>

            <div className="card border-0 bg-light mb-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Itens do Pedido (Mock)</h6>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>1x Tigela Rústica Caramelo</span>
                  <span className="fw-bold">R$ 89,90</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>2x Xícara de Café Expresso</span>
                  <span className="fw-bold">R$ 91,00</span>
                </div>
                <hr />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold fs-5">Total Pago</span>
                  <span className="fw-bold fs-5 text-success">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>

            <h6 className="fw-bold mb-3">Atualizar Status</h6>
            <div className="row align-items-center">
              <div className="col-md-8">
                <select 
                  className="form-select"
                  value={order.status}
                  onChange={(e) => onStatusChange(order.id, e.target.value)}
                >
                  {statusOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4 text-end mt-3 mt-md-0">
                <button className="btn btn-warning fw-bold w-100" onClick={onClose}>Concluir</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEditModal;
