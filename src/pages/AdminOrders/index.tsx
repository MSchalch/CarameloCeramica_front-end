import { useState } from 'react';
import OrderEditModal from '../../components/OrderEditModal';

const AdminOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orders, setOrders] = useState([
    { id: 1004, customer: 'João Silva', date: '21/08/2026', total: 180.90, status: 'EM ABERTO' },
    { id: 1003, customer: 'Maria Oliveira', date: '15/08/2026', total: 250.00, status: 'EM PROCESSAMENTO' },
    { id: 1002, customer: 'Carlos Souza', date: '01/08/2026', total: 95.50, status: 'TROCA SOLICITADA' },
    { id: 1001, customer: 'João Silva', date: '15/07/2026', total: 45.00, status: 'ITEM ENVIADO' },
  ]);

  const handleStatusChange = (orderId: number, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // Se estiver com o modal aberto e mudou de status por ele, atualizamos a referência
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
    }
  };

  const statusOptions = [
    'EM ABERTO', 'EM PROCESSAMENTO', 'PAGAMENTO REALIZADO', 'EM TRÂNSITO', 'ENTREGUE', 
    'TROCA SOLICITADA', 'TROCA ACEITA', 'TROCA NEGADA', 
    'ITEM ENVIADO', 'ITEM RECEBIDO', 'TROCA PROCESSADA', 'CANCELADO'
  ];

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Gerenciar Pedidos</h2>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Pedido ID</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Total (R$)</th>
                  <th>Status Atual / Atualizar</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td className="fw-bold">#{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{order.date}</td>
                    <td>R$ {order.total.toFixed(2).replace('.', ',')}</td>
                    <td>
                      <select 
                        className="form-select form-select-sm shadow-none select-status-width"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-end">
                      <button 
                        className="btn btn-sm btn-outline-dark" 
                        title="Ver Detalhes do Pedido"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <i className="bi bi-eye"></i> Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <OrderEditModal 
        show={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        order={selectedOrder}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default AdminOrders;
