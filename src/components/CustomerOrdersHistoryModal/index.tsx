interface CustomerOrdersHistoryModalProps {
  show: boolean;
  onClose: () => void;
  customer: any;
}

const CustomerOrdersHistoryModal = ({ show, onClose, customer }: CustomerOrdersHistoryModalProps) => {
  if (!show || !customer) return null;

  // Mock
  const mockOrders = [
    { id: 1005, date: '15/08/2026', total: 250.00, status: 'ENTREGUE' },
    { id: 980, date: '10/05/2026', total: 89.90, status: 'ENTREGUE' },
    { id: 855, date: '02/02/2026', total: 450.00, status: 'CANCELADO' }
  ];

  return (
    <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
      <div className="modal-dialog modal-dialog-scrollable modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-light border-0">
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="bi bi-clock-history fs-4 text-warning me-2"></i>
              Histórico de Pedidos: {customer.name}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Pedido ID</th>
                    <th>Data</th>
                    <th>Total Pago</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockOrders.map(order => (
                    <tr key={order.id}>
                      <td className="fw-bold">#{order.id}</td>
                      <td>{order.date}</td>
                      <td>R$ {order.total.toFixed(2).replace('.', ',')}</td>
                      <td>
                        <span className={`badge ${order.status === 'ENTREGUE' ? 'bg-success' : 'bg-danger'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {mockOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted">Nenhum pedido encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrdersHistoryModal;
