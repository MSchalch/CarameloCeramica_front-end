import { useState, useEffect } from 'react';
import OrderEditModal from '../../components/OrderEditModal';
import { orderService } from '../../services/orderService';
import type { Pedido } from '../../types/order';

const AdminOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderService.listarPedidos(undefined, statusFilter || undefined);
      setOrders(data.content || []);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      await orderService.atualizarPedido({
        ...order,
        status: newStatus,
      });
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      alert('Erro ao alterar status: ' + (err.response?.data || err.message));
    }
  };

  const statusOptions = [
    'EM PROCESSAMENTO',
    'PAGAMENTO REALIZADO',
    'EM TRÂNSITO',
    'ENTREGUE',
    'TROCA SOLICITADA',
    'TROCA ACEITA',
    'TROCA NEGADA',
    'ITEM ENVIADO',
    'ITEM RECEBIDO',
    'TROCA PROCESSADA',
    'CANCELADO',
  ];

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Gerenciar Pedidos</h2>
          <p className="text-muted mb-0">Controle completo de compras, entregas, trocas e estoque</p>
        </div>
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Status: Todos</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="btn btn-outline-dark" onClick={fetchOrders}>
            <i className="bi bi-arrow-clockwise me-1"></i>Atualizar
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
              <p className="text-muted mt-2">Carregando pedidos do servidor...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Código Pedido</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Total</th>
                    <th>Status Atual / Atualizar</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="fw-bold text-muted">
                        #{order.codigoPedido || order.id}
                      </td>
                      <td className="fw-bold">{order.cliente?.nome || 'Cliente'}</td>
                      <td>
                        {order.dataPedido
                          ? new Date(order.dataPedido).toLocaleDateString('pt-BR')
                          : 'Hoje'}
                      </td>
                      <td className="fw-bold text-success">
                        R$ {Number(order.valorTotal || 0).toFixed(2).replace('.', ',')}
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm shadow-none select-status-width"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id!, e.target.value)}
                        >
                          {statusOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-dark"
                          title="Ver Detalhes do Pedido"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <i className="bi bi-eye me-1"></i>Detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-5 text-muted">
                        <i className="bi bi-receipt fs-1 d-block mb-2 text-secondary"></i>
                        Nenhum pedido encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
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
