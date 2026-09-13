import type { Pedido } from '../../types/order';

interface ClientOrderDetailsModalProps {
  show: boolean;
  onClose: () => void;
  order: Pedido | null;
}

const ClientOrderDetailsModal = ({ show, onClose, order }: ClientOrderDetailsModalProps) => {
  if (!show || !order) return null;

  return (
    <div className="modal fade show custom-modal-overlay d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-scrollable modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-light border-0">
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-box2-heart fs-4 text-warning me-2"></i>
              Detalhes do Pedido #{order.codigoPedido || order.id}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <div className="row mb-4">
              <div className="col-md-6">
                <p className="mb-1 text-muted small">Status Atual</p>
                <h6
                  className={`fw-bold ${
                    order.status === 'CANCELADO'
                      ? 'text-danger'
                      : order.status === 'ENTREGUE'
                      ? 'text-success'
                      : 'text-warning'
                  }`}
                >
                  {order.status}
                </h6>
              </div>
              <div className="col-md-6 text-md-end">
                <p className="mb-1 text-muted small">Data da Compra</p>
                <h6 className="fw-bold">
                  {order.dataPedido ? new Date(order.dataPedido).toLocaleString('pt-BR') : 'Hoje'}
                </h6>
              </div>
            </div>

            <div className="card border-0 bg-light mb-4">
              <div className="card-body">
                <h6 className="fw-bold mb-3">Itens Comprados</h6>
                {order.itens && order.itens.length > 0 ? (
                  order.itens.map((item, idx) => (
                    <div key={idx} className="d-flex justify-content-between align-items-center mb-2">
                      <span>
                        {item.quantidade}x {item.peca?.nome || 'Peça de Cerâmica'}
                      </span>
                      <span className="fw-bold">
                        R$ {Number(item.valorTotal || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted small">Nenhum item listado.</p>
                )}
                <div className="d-flex justify-content-between align-items-center mb-2 text-muted">
                  <span>Frete</span>
                  <span className="fw-bold">
                    R$ {Number(order.valorFrete || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {order.cupomPromocional && (
                  <div className="d-flex justify-content-between align-items-center mb-2 text-success">
                    <span>Cupom ({order.cupomPromocional.codigo})</span>
                    <span className="fw-bold">
                      - R$ {Number(order.valorDesconto || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
                <hr />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold fs-5">Total Pago</span>
                  <span className="fw-bold fs-5 text-success">
                    R$ {Number(order.valorTotal || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold">Pagamentos Utilizados</h6>
                {order.pagamentos && order.pagamentos.length > 0 ? (
                  order.pagamentos.map((pag, idx) => (
                    <p key={idx} className="text-muted small mb-1">
                      • {pag.formaPagamento === 'CARTAO' ? 'Cartão' : 'Cupom'}: R${' '}
                      {Number(pag.valorPago || 0).toFixed(2).replace('.', ',')}
                    </p>
                  ))
                ) : (
                  <p className="text-muted small">Cartão de Crédito</p>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button type="button" className="btn btn-dark" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientOrderDetailsModal;
