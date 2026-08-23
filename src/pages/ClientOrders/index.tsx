import { useState } from 'react';
import { Link } from 'react-router-dom';
import ClientOrderDetailsModal from '../../components/ClientOrderDetailsModal';

const ClientOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orders] = useState([
    { id: 1004, date: '21/08/2026', total: 180.90, status: 'EM ABERTO' },
    { id: 1003, date: '15/08/2026', total: 250.00, status: 'EM PROCESSAMENTO' },
    { id: 1002, date: '01/08/2026', total: 95.50, status: 'ENTREGUE' },
    { id: 1001, date: '15/07/2026', total: 45.00, status: 'CANCELADO' },
  ]);

  const handleAction = (orderId: number, action: string) => {
    alert(`Ação "${action}" solicitada para o pedido #${orderId} (MOCK)`);
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-10 offset-lg-1">
          <h3 className="fw-bold mb-4">Histórico de Pedidos</h3>

          {orders.map(order => (
            <div key={order.id} className="card shadow-sm border-0 mb-3">
              <div className="card-body">
                <div className="row align-items-center">
                  
                  {/* Coluna 1: Info Básica */}
                  <div className="col-md-5 mb-3 mb-md-0">
                    <h5 className="fw-bold mb-1">Pedido #{order.id}</h5>
                    <p className="text-muted mb-1 small">Realizado em {order.date}</p>
                    <p className="fw-bold mb-0">Total: R$ {order.total.toFixed(2).replace('.', ',')}</p>
                  </div>

                  {/* Coluna 2: Status */}
                  <div className="col-md-3 mb-3 mb-md-0 d-flex align-items-center">
                    <span className={`badge ${order.status === 'ENTREGUE' ? 'bg-success' : order.status === 'CANCELADO' ? 'bg-danger' : 'bg-warning text-dark'} w-100 py-2 fs-6`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Coluna 3: Ações */}
                  <div className="col-md-4 d-flex flex-column gap-2">
                    {order.status === 'EM ABERTO' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction(order.id, 'Cancelar Pedido')}>Cancelar Pedido</button>
                    )}
                    {order.status === 'EM TRÂNSITO' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleAction(order.id, 'Confirmar Recebimento')}>Confirmar Recebimento</button>
                    )}
                    {order.status === 'ENTREGUE' && (
                      <button className="btn btn-warning btn-sm fw-bold" onClick={() => handleAction(order.id, 'Solicitar Troca')}>Solicitar Troca</button>
                    )}
                    {order.status === 'TROCA ACEITA' && (
                      <button className="btn btn-warning btn-sm fw-bold" onClick={() => handleAction(order.id, 'Informar Despacho')}>Informar Despacho</button>
                    )}
                    
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedOrder(order)}>Ver Detalhes</button>
                  </div>

                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-box-seam fs-1 text-muted mb-3 d-block"></i>
              <h5 className="text-muted">Você ainda não fez nenhum pedido.</h5>
              <Link to="/" className="btn btn-dark mt-3">Ir para o Catálogo</Link>
            </div>
          )}

        </div>
      </div>

      <ClientOrderDetailsModal
        show={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
};

export default ClientOrders;
