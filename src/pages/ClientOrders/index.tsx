import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClientOrderDetailsModal from '../../components/ClientOrderDetailsModal';
import { orderService } from '../../services/orderService';
import { customerService } from '../../services/customerService';
import type { Pedido } from '../../types/order';

const ClientOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClientOrders = async () => {
    setLoading(true);
    try {
      const customersData = await customerService.listarClientes('', 0, 1);
      if (customersData.content && customersData.content.length > 0) {
        const clienteId = customersData.content[0].id!;
        const pedidosData = await orderService.listarPedidos(clienteId);
        setOrders(pedidosData.content || []);
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos do cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientOrders();
  }, []);

  const handleAction = async (order: Pedido, newStatus: string) => {
    try {
      await orderService.atualizarPedido({
        ...order,
        status: newStatus,
      });
      alert(`Status atualizado para: ${newStatus}`);
      fetchClientOrders();
    } catch (err: any) {
      alert('Erro ao atualizar pedido: ' + (err.response?.data || err.message));
    }
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-10 offset-lg-1">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-bold mb-0">Histórico de Pedidos</h3>
            <button className="btn btn-outline-dark btn-sm" onClick={fetchClientOrders}>
              <i className="bi bi-arrow-clockwise me-1"></i>Atualizar
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
              <p className="text-muted mt-2">Carregando pedidos...</p>
            </div>
          ) : orders.length > 0 ? (
            orders.map(order => (
              <div key={order.id} className="card shadow-sm border-0 mb-3">
                <div className="card-body p-4">
                  <div className="row align-items-center">
                    {/* Coluna 1: Info Básica */}
                    <div className="col-md-5 mb-3 mb-md-0">
                      <h5 className="fw-bold mb-1">Pedido #{order.codigoPedido || order.id}</h5>
                      <p className="text-muted mb-1 small">
                        Realizado em {order.dataPedido ? new Date(order.dataPedido).toLocaleDateString('pt-BR') : 'Hoje'}
                      </p>
                      <p className="fw-bold mb-0 text-success fs-5">
                        Total: R$ {Number(order.valorTotal || 0).toFixed(2).replace('.', ',')}
                      </p>
                    </div>

                    {/* Coluna 2: Status */}
                    <div className="col-md-3 mb-3 mb-md-0 d-flex align-items-center">
                      <span
                        className={`badge ${
                          order.status === 'ENTREGUE'
                            ? 'bg-success'
                            : order.status === 'CANCELADO'
                            ? 'bg-danger'
                            : 'bg-warning text-dark'
                        } w-100 py-2 fs-6`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Coluna 3: Ações */}
                    <div className="col-md-4 d-flex justify-content-start justify-content-md-end flex-wrap gap-2 mt-3 mt-md-0">
                      {order.status === 'EM PROCESSAMENTO' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleAction(order, 'CANCELADO')}
                        >
                          Cancelar Pedido
                        </button>
                      )}
                      {order.status === 'EM TRÂNSITO' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleAction(order, 'ENTREGUE')}
                        >
                          Confirmar Recebimento
                        </button>
                      )}
                      {order.status === 'ENTREGUE' && (
                        <button
                          className="btn btn-warning btn-sm fw-bold"
                          onClick={() => handleAction(order, 'TROCA SOLICITADA')}
                        >
                          Solicitar Troca
                        </button>
                      )}

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-box-seam fs-1 text-muted mb-3 d-block"></i>
              <h5 className="text-muted">Você ainda não fez nenhum pedido.</h5>
              <Link to="/" className="btn btn-dark mt-3">
                Ir para o Catálogo
              </Link>
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
