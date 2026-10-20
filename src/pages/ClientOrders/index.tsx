import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClientOrderDetailsModal from '../../components/ClientOrderDetailsModal';
import { orderService } from '../../services/orderService';
import { customerService } from '../../services/customerService';
import type { Pedido, Cupom } from '../../types/order';
import { useAuth } from '../../contexts/AuthContext';

const ClientOrders = () => {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [cuponsTroca, setCuponsTroca] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(false);
  const [erroTrocaMsg, setErroTrocaMsg] = useState<string | null>(null);

  // Estado do Modal de Solicitação de Troca (RF0040, RN0041, RN0043)
  const [orderParaTroca, setOrderParaTroca] = useState<Pedido | null>(null);
  const [modoTroca, setModoTroca] = useState<'TOTAL' | 'PARCIAL'>('TOTAL');
  const [qtdsTrocaSelecionadas, setQtdsTrocaSelecionadas] = useState<{ [idx: number]: number }>({});

  const fetchClientOrders = async () => {
    setLoading(true);
    try {
      let clienteId: number | null = null;
      if (user?.clienteId) {
        clienteId = user.clienteId;
      } else {
        const customersData = await customerService.listarClientes('', 0, 1);
        if (customersData.content && customersData.content.length > 0) {
          clienteId = customersData.content[0].id!;
        }
      }

      if (clienteId) {
        const pedidosData = await orderService.listarPedidos(clienteId);
        setOrders(pedidosData.content || []);

        try {
          const cuponsData = await orderService.listarCuponsCliente(clienteId);
          setCuponsTroca(cuponsData.filter((c: Cupom) => c.tipo === 'TROCA' && c.ativo));
        } catch (e) {
          console.error('Erro ao buscar cupons de troca:', e);
        }
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

  // Inicia solicitação de troca validando RN0043 (apenas pedidos ENTREGUE)
  const handleIniciarSolicitacaoTroca = (order: Pedido) => {
    setErroTrocaMsg(null);
    if (order.status !== 'ENTREGUE') {
      const msg = `Operação bloqueada (RN0043): A solicitação de troca só é permitida para pedidos com status ENTREGUE. Status atual do pedido #${order.codigoPedido || order.id}: ${order.status}.`;
      setErroTrocaMsg(msg);
      alert(msg);
      return;
    }

    const inicial: { [idx: number]: number } = {};
    (order.itens || []).forEach((item, idx) => {
      inicial[idx] = item.quantidade;
    });
    setQtdsTrocaSelecionadas(inicial);
    setModoTroca('TOTAL');
    setOrderParaTroca(order);
  };

  const handleSelecionarModoTroca = (modo: 'TOTAL' | 'PARCIAL') => {
    setModoTroca(modo);
    if (!orderParaTroca) return;
    const novoMapa: { [idx: number]: number } = {};
    (orderParaTroca.itens || []).forEach((item, idx) => {
      if (modo === 'TOTAL') {
        novoMapa[idx] = item.quantidade;
      } else {
        // Por padrão no modo parcial, seleciona 1 unidade apenas do primeiro item
        novoMapa[idx] = idx === 0 ? 1 : 0;
      }
    });
    setQtdsTrocaSelecionadas(novoMapa);
  };

  const handleConfirmarSolicitacaoTroca = async () => {
    if (!orderParaTroca) return;

    const itensAtualizados = (orderParaTroca.itens || []).map((item, idx) => ({
      ...item,
      quantidadeTroca: modoTroca === 'TOTAL' ? item.quantidade : (qtdsTrocaSelecionadas[idx] || 0),
    }));

    const totalPecasTroca = itensAtualizados.reduce((acc, i) => acc + (i.quantidadeTroca || 0), 0);
    if (totalPecasTroca <= 0) {
      alert('Selecione pelo menos 1 item para solicitar a troca (RF0040).');
      return;
    }

    try {
      await orderService.atualizarPedido({
        ...orderParaTroca,
        status: 'EM TROCA',
        itens: itensAtualizados,
      });
      setOrderParaTroca(null);
      alert('Solicitação de troca registrada com sucesso! Status alterado para: EM TROCA (RF0040).');
      fetchClientOrders();
    } catch (err: any) {
      const msg = err.response?.data || err.message;
      setErroTrocaMsg(String(msg));
      alert('Erro ao solicitar troca: ' + msg);
    }
  };

  const pedidosComTrocaAutorizada = orders.filter((o) => o.status === 'TROCA AUTORIZADA');

  const getBadgeClass = (status?: string) => {
    switch (status) {
      case 'ENTREGUE':
      case 'APROVADA':
        return 'bg-success';
      case 'REPROVADA':
      case 'CANCELADO':
        return 'bg-danger';
      case 'TROCA AUTORIZADA':
      case 'EM TRANSPORTE':
        return 'bg-info text-dark';
      case 'TROCADO':
        return 'bg-secondary';
      default:
        return 'bg-warning text-dark';
    }
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-10 offset-lg-1">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-bold mb-0">Histórico de Pedidos</h3>
            <button className="btn btn-outline-dark btn-sm btn-atualizar-pedidos-cliente" onClick={fetchClientOrders}>
              <i className="bi bi-arrow-clockwise me-1"></i>Atualizar
            </button>
          </div>

          {/* RNF0046: Notificação ao cliente quando a troca for autorizada */}
          {pedidosComTrocaAutorizada.length > 0 && (
            <div className="alert alert-info border-info shadow-sm p-3 mb-4 rounded-3 notificacao-troca-autorizada" role="alert">
              <div className="d-flex align-items-start gap-3">
                <i className="bi bi-bell-fill fs-3 text-primary"></i>
                <div>
                  <h6 className="fw-bold mb-1 text-dark">
                    Notificação de Autorização de Troca (RNF0046)
                  </h6>
                  <p className="mb-1 small text-dark">
                    Sua solicitação de troca para{' '}
                    <strong>
                      {pedidosComTrocaAutorizada.map((p) => `#${p.codigoPedido || p.id}`).join(', ')}
                    </strong>{' '}
                    foi <strong>AUTORIZADA</strong> pelo administrador (<span className="badge bg-info text-dark">TROCA AUTORIZADA</span>)!
                  </p>
                  <small className="text-muted">
                    Por favor, envie os itens solicitados para nossa central. Assim que o recebimento for confirmado, seu cupom de troca será gerado automaticamente.
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Alerta de bloqueio de troca fora de ENTREGUE (RN0043) */}
          {erroTrocaMsg && (
            <div className="alert alert-danger alert-dismissible fade show alerta-erro-troca mb-4" role="alert">
              <i className="bi bi-shield-exclamation me-2"></i>
              <strong>{erroTrocaMsg}</strong>
              <button type="button" className="btn-close" onClick={() => setErroTrocaMsg(null)}></button>
            </div>
          )}

          {cuponsTroca.length > 0 && (
            <div className="card border-0 bg-success-subtle text-success-emphasis p-3 mb-4 rounded-3 shadow-sm card-cupons-troca-cliente">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h6 className="fw-bold mb-1 d-flex align-items-center text-success">
                    <i className="bi bi-ticket-perforated-fill me-2 fs-5"></i>
                    Você tem {cuponsTroca.length} Cupom(ns) de Troca Disponível(is)! (RF0044)
                  </h6>
                  <p className="small mb-0 text-muted">
                    Utilize o código abaixo no Checkout para abater no valor da sua próxima compra (RN0035 / RF0044).
                  </p>
                </div>
              </div>
              <div className="d-flex gap-2 flex-wrap mt-3">
                {cuponsTroca.map((cupom) => (
                  <div
                    key={cupom.id || cupom.codigo}
                    className="badge bg-white text-dark border p-2 d-flex align-items-center gap-2 shadow-sm item-cupom-troca-disponivel"
                    style={{ fontSize: '0.85rem' }}
                  >
                    <span className="font-monospace fw-bold text-success codigo-cupom-gerado">{cupom.codigo}</span>
                    <span className="badge bg-success text-white valor-cupom-gerado">
                      R$ {Number(cupom.valor).toFixed(2).replace('.', ',')}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary py-0 px-1 border-0"
                      title="Copiar código do cupom"
                      onClick={() => {
                        navigator.clipboard?.writeText(cupom.codigo);
                        alert(`Código ${cupom.codigo} copiado para a área de transferência!`);
                      }}
                    >
                      <i className="bi bi-clipboard"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status"></div>
              <p className="text-muted mt-2">Carregando pedidos...</p>
            </div>
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="card shadow-sm border-0 mb-3 card-pedido-cliente">
                <div className="card-body p-4">
                  <div className="row align-items-center">
                    {/* Coluna 1: Info Básica */}
                    <div className="col-md-5 mb-3 mb-md-0">
                      <h5 className="fw-bold mb-1 codigo-pedido-cliente">
                        Pedido #{order.codigoPedido || order.id}
                      </h5>
                      <p className="text-muted mb-1 small">
                        Realizado em {order.dataPedido ? new Date(order.dataPedido).toLocaleDateString('pt-BR') : 'Hoje'}
                      </p>
                      <p className="fw-bold mb-0 text-success fs-5">
                        Total: R$ {Number(order.valorTotal || 0).toFixed(2).replace('.', ',')}
                      </p>
                    </div>

                    {/* Coluna 2: Status */}
                    <div className="col-md-3 mb-3 mb-md-0 text-center">
                      <span className={`badge ${getBadgeClass(order.status)} w-100 py-2 fs-6 badge-status-pedido`}>
                        {order.status}
                      </span>
                      {order.status !== 'EM PROCESSAMENTO' && (
                        <small className="text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>
                          Origem: EM PROCESSAMENTO ➔ {order.status}
                        </small>
                      )}
                    </div>

                    {/* Coluna 3: Ações */}
                    <div className="col-md-4 d-flex justify-content-start justify-content-md-end flex-wrap gap-2 mt-3 mt-md-0">
                      {(order.status === 'ENTREGUE' ||
                        order.status === 'APROVADA' ||
                        order.status === 'EM TRANSPORTE' ||
                        order.status === 'EM PROCESSAMENTO') && (
                        <button
                          className={`btn btn-sm fw-bold btn-solicitar-troca ${
                            order.status === 'ENTREGUE' ? 'btn-warning' : 'btn-outline-secondary'
                          }`}
                          onClick={() => handleIniciarSolicitacaoTroca(order)}
                          title={
                            order.status === 'ENTREGUE'
                              ? 'Solicitar troca de um item ou de toda a compra (RF0040)'
                              : 'A troca só é permitida para pedidos ENTREGUE (RN0043)'
                          }
                        >
                          Solicitar Troca
                        </button>
                      )}

                      <button
                        className="btn btn-secondary btn-sm btn-ver-detalhes-pedido"
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

      {/* Modal de Solicitação de Troca (RF0040, RN0041, RN0043: 1 item ou compra inteira) */}
      {orderParaTroca && (
        <div
          className="modal fade show d-block modal-solicitar-troca"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-arrow-left-right text-warning me-2"></i>
                  Solicitar Troca — Pedido #{orderParaTroca.codigoPedido || orderParaTroca.id} (RF0040)
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setOrderParaTroca(null)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted small mb-3">
                  Você pode solicitar a troca de <strong>toda a compra</strong> ou de <strong>itens específicos</strong>{' '}
                  deste pedido entregue (RN0041, RN0043).
                </p>

                <div className="d-flex gap-3 mb-4">
                  <div className="form-check">
                    <input
                      className="form-check-input radio-troca-total"
                      type="radio"
                      name="modoTroca"
                      id="modoTrocaTotal"
                      checked={modoTroca === 'TOTAL'}
                      onChange={() => handleSelecionarModoTroca('TOTAL')}
                    />
                    <label className="form-check-label fw-bold" htmlFor="modoTrocaTotal">
                      Trocar toda a compra (Todos os itens)
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input radio-troca-parcial"
                      type="radio"
                      name="modoTroca"
                      id="modoTrocaParcial"
                      checked={modoTroca === 'PARCIAL'}
                      onChange={() => handleSelecionarModoTroca('PARCIAL')}
                    />
                    <label className="form-check-label fw-bold" htmlFor="modoTrocaParcial">
                      Selecionar item(ns) específico(s) para troca
                    </label>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Selecionar</th>
                        <th>Produto</th>
                        <th className="text-center">Qtd. Comprada</th>
                        <th className="text-center" style={{ width: '130px' }}>Qtd. p/ Troca</th>
                        <th className="text-end">Valor de Troca</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(orderParaTroca.itens || []).map((item, idx) => {
                        const qtdTroca =
                          modoTroca === 'TOTAL' ? item.quantidade : (qtdsTrocaSelecionadas[idx] ?? 0);
                        const selecionado = qtdTroca > 0;
                        return (
                          <tr key={idx} className="linha-item-modal-troca">
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input check-item-troca"
                                disabled={modoTroca === 'TOTAL'}
                                checked={selecionado}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setQtdsTrocaSelecionadas((prev) => ({
                                    ...prev,
                                    [idx]: checked ? 1 : 0,
                                  }));
                                }}
                              />
                            </td>
                            <td className="fw-semibold">{item.peca?.nome || 'Peça de Cerâmica'}</td>
                            <td className="text-center">{item.quantidade} un.</td>
                            <td className="text-center">
                              <input
                                type="number"
                                className="form-control form-control-sm text-center input-qtd-item-troca"
                                min={0}
                                max={item.quantidade}
                                disabled={modoTroca === 'TOTAL'}
                                value={qtdTroca}
                                onChange={(e) => {
                                  const val = Math.max(
                                    0,
                                    Math.min(item.quantidade, parseInt(e.target.value, 10) || 0)
                                  );
                                  setQtdsTrocaSelecionadas((prev) => ({
                                    ...prev,
                                    [idx]: val,
                                  }));
                                }}
                              />
                            </td>
                            <td className="text-end fw-bold text-success">
                              R$ {(Number(item.valorUnitario || 0) * qtdTroca).toFixed(2).replace('.', ',')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="alert alert-warning py-2 px-3 small mb-0">
                  <i className="bi bi-info-circle-fill me-1"></i>
                  Valor estimado do Cupom de Troca após confirmação de recebimento:{' '}
                  <strong className="valor-estimado-cupom-troca">
                    R${' '}
                    {(orderParaTroca.itens || [])
                      .reduce((acc, item, idx) => {
                        const q = modoTroca === 'TOTAL' ? item.quantidade : (qtdsTrocaSelecionadas[idx] || 0);
                        return acc + Number(item.valorUnitario || 0) * q;
                      }, 0)
                      .toFixed(2)
                      .replace('.', ',')}
                  </strong>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setOrderParaTroca(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-warning fw-bold btn-confirmar-solicitacao-troca"
                  onClick={handleConfirmarSolicitacaoTroca}
                >
                  Confirmar Solicitação de Troca (EM TROCA)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ClientOrderDetailsModal
        show={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
};

export default ClientOrders;
