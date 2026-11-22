import { useState, useEffect } from 'react';
import OrderEditModal from '../../components/OrderEditModal';
import { orderService } from '../../services/orderService';
import type { Pedido } from '../../types/order';

const AdminOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [retornarEstoquePorPedido, setRetornarEstoquePorPedido] = useState<{ [orderId: number]: boolean }>({});

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

    const deveRetornarEstoque =
      retornarEstoquePorPedido[orderId] !== undefined ? retornarEstoquePorPedido[orderId] : true;

    try {
      await orderService.atualizarPedido({
        ...order,
        status: newStatus,
        retornarAoEstoque: deveRetornarEstoque,
      });
      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, retornarAoEstoque: deveRetornarEstoque });
      }
    } catch (err: any) {
      alert('Erro ao alterar status: ' + (err.response?.data || err.message));
    }
  };

  const statusOptions = [
    'EM PROCESSAMENTO',
    'APROVADA',
    'REPROVADA',
    'EM TRANSPORTE',
    'ENTREGUE',
    'EM TROCA',
    'TROCA AUTORIZADA',
    'TROCADO',
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
            className="form-select select-filtro-status-admin"
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
          <button className="btn btn-outline-dark btn-atualizar-pedidos-admin" onClick={fetchOrders}>
            <i className="bi bi-arrow-clockwise me-1"></i>Atualizar
          </button>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          {loading && orders.length === 0 ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
              <p className="text-muted mt-2">Carregando pedidos do servidor...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle tabela-pedidos-admin">
                <thead className="table-light">
                  <tr>
                    <th>Código Pedido</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Total</th>
                    <th>Status Atual / Atualizar</th>
                    <th className="text-end">Ações do Fluxo</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="linha-pedido-admin">
                      <td className="fw-bold text-muted codigo-pedido-admin">
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
                          className="form-select form-select-sm shadow-none select-status-width select-status-pedido-admin"
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
                        <div className="d-inline-flex gap-1 flex-wrap justify-content-end">
                          {order.status === 'APROVADA' && (
                            <button
                              className="btn btn-sm btn-primary fw-semibold btn-despachar-pedido"
                              onClick={() => handleStatusChange(order.id!, 'EM TRANSPORTE')}
                              title="Despachar pedido (RF0038 / RN0039)"
                            >
                              <i className="bi bi-truck me-1"></i>Despachar
                            </button>
                          )}
                          {order.status === 'EM TRANSPORTE' && (
                            <button
                              className="btn btn-sm btn-success fw-semibold btn-confirmar-entrega"
                              onClick={() => handleStatusChange(order.id!, 'ENTREGUE')}
                              title="Confirmar entrega (RF0039 / RN0040)"
                            >
                              <i className="bi bi-check2-circle me-1"></i>Confirmar Entrega
                            </button>
                          )}
                          {order.status === 'EM TROCA' && (
                            <button
                              className="btn btn-sm btn-warning fw-bold text-dark btn-autorizar-troca"
                              onClick={() => handleStatusChange(order.id!, 'TROCA AUTORIZADA')}
                              title="Autorizar solicitação de troca e notificar cliente (RF0041 / RNF0046)"
                            >
                              <i className="bi bi-shield-check me-1"></i>Autorizar Troca
                            </button>
                          )}
                          {order.status === 'TROCA AUTORIZADA' && (
                            <div className="d-inline-flex align-items-center gap-2">
                              <div className="form-check form-check-inline mb-0 small" title="RF0044: Definir se as peças devolvidas retornam ao estoque">
                                <input
                                  className="form-check-input check-retornar-estoque-troca"
                                  type="checkbox"
                                  id={`ret-est-${order.id}`}
                                  checked={retornarEstoquePorPedido[order.id!] !== undefined ? retornarEstoquePorPedido[order.id!] : true}
                                  onChange={(e) =>
                                    setRetornarEstoquePorPedido((prev) => ({
                                      ...prev,
                                      [order.id!]: e.target.checked,
                                    }))
                                  }
                                />
                                <label className="form-check-label text-muted" htmlFor={`ret-est-${order.id}`}>
                                  Retornar ao estoque (RF0044)
                                </label>
                              </div>
                              <button
                                className="btn btn-sm btn-success fw-bold btn-confirmar-recebimento-troca"
                                onClick={() => handleStatusChange(order.id!, 'TROCADO')}
                                title="Confirmar recebimento dos itens, gerar cupom e retornar ao estoque (RF0044 / RF0045 / RF0054)"
                              >
                                <i className="bi bi-box-arrow-in-down me-1"></i>Confirmar Recebimento
                              </button>
                            </div>
                          )}
                          <button
                            className="btn btn-sm btn-outline-dark btn-detalhes-pedido-admin"
                            title="Ver Detalhes do Pedido"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <i className="bi bi-eye me-1"></i>Detalhes
                          </button>
                        </div>
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
