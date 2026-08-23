import { useState } from 'react';

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
}

const ClientOrders = () => {
  const [orders, setOrders] = useState<Order[]>([
    { id: '1004', date: '21/08/2026', status: 'EM ABERTO', total: 180.90 },
    { id: '1003', date: '15/08/2026', status: 'EM TRÂNSITO', total: 250.00 },
    { id: '1002', date: '01/08/2026', status: 'ENTREGUE', total: 95.50 },
    { id: '1001', date: '15/07/2026', status: 'TROCA ACEITA', total: 45.00 },
  ]);

  const handleAction = (orderId: string, action: string) => {
    alert(`Ação '${action}' realizada no pedido ${orderId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EM ABERTO':
      case 'EM PROCESSAMENTO': return 'bg-secondary';
      case 'PAGAMENTO REALIZADO': return 'bg-success';
      case 'EM TRÂNSITO': return 'bg-warning text-dark';
      case 'ENTREGUE': return 'bg-success';
      case 'TROCA SOLICITADA': return 'bg-warning text-dark';
      case 'TROCA ACEITA': return 'bg-warning text-dark';
      default: return 'bg-dark';
    }
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Meus Pedidos</h2>
      
      <div className="row">
        {orders.map(order => (
          <div className="col-12 mb-3" key={order.id}>
            <div className="card shadow-sm border-0">
              <div className="card-body row align-items-center gy-3 gy-md-0">
                
                <div className="col-md-5">
                  <h5 className="fw-bold mb-1">Pedido #{order.id}</h5>
                  <p className="text-muted mb-0 small">Realizado em: {order.date} • Total: R$ {order.total.toFixed(2).replace('.', ',')}</p>
                </div>
                
                <div className="col-md-3 text-md-end text-start">
                  <span className={`badge ${getStatusBadge(order.status)} px-3 py-2 fs-6`}>{order.status}</span>
                </div>
                
                <div className="col-md-4 d-flex gap-2 justify-content-md-end">
                  {(order.status === 'EM ABERTO' || order.status === 'EM PROCESSAMENTO') && (
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
                  
                  <button className="btn btn-secondary btn-sm">Ver Detalhes</button>
                </div>

              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientOrders;
