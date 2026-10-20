import React, { useState, useEffect } from 'react';
import type { Cliente, Endereco } from '../../types/customer';
import type { Cupom } from '../../types/order';

export interface CartItem {
  id: number;
  nome: string;
  preco: number;
  imagemUrl: string;
  categoria: string;
  quantidade: number;
  estoque: number;
  peso?: number;
}

export interface CartaoPagamentoForm {
  cartaoId?: number;
  numero: string;
  nomeImpresso: string;
  bandeira: string;
  codigoSeguranca: string;
  valor: number | '';
  salvarNoPerfil?: boolean;
}

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  customer: Cliente | null;
  enderecoEntrega: Endereco | undefined;
  modalidadeFrete: string;
  opcaoFrete: any;
  valorFrete: number;
  valorSubtotal: number;
  valorDesconto: number;
  valorTotal: number;
  cupomPromocional: Cupom | null;
  cuponsTroca: Cupom[];
  trocoCupomTroca: number;
  cards: CartaoPagamentoForm[];
  saldoAPagarCartao: number;
  onConfirmOrder: (statusSimulado?: 'APROVADA' | 'REPROVADA') => Promise<void>;
  isSubmittingOrder: boolean;
  modoSimuladorInicial?: 'SUCESSO' | 'RECUSA';
}

type EtapaSimulacao = 'REVISAO' | 'ENVIANDO' | 'PROCESSANDO' | 'AUTORIZADO' | 'RECUSADO';

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  isOpen,
  onClose,
  items,
  customer,
  enderecoEntrega,
  modalidadeFrete,
  opcaoFrete,
  valorFrete,
  valorSubtotal,
  valorDesconto,
  valorTotal,
  cupomPromocional,
  cuponsTroca,
  trocoCupomTroca,
  cards,
  saldoAPagarCartao,
  onConfirmOrder,
  isSubmittingOrder,
  modoSimuladorInicial = 'SUCESSO',
}) => {
  const [etapa, setEtapa] = useState<EtapaSimulacao>('REVISAO');
  const [codigoAutorizacao, setCodigoAutorizacao] = useState<string>('');
  const [nsuTransacao, setNsuTransacao] = useState<string>('');
  const [modoSimulador, setModoSimulador] = useState<'SUCESSO' | 'RECUSA'>(modoSimuladorInicial);
  const [progresso, setProgresso] = useState<number>(0);

  // Reseta estado sempre que o modal abre
  useEffect(() => {
    if (isOpen) {
      setEtapa('REVISAO');
      setProgresso(0);
      setCodigoAutorizacao('');
      setNsuTransacao('');
      setModoSimulador(modoSimuladorInicial);
    }
  }, [isOpen, modoSimuladorInicial]);

  if (!isOpen) return null;

  // Mascara número do cartão: "1234 **** **** 3456"
  const mascararCartao = (num: string) => {
    const limpo = num.replace(/\D/g, '');
    if (limpo.length >= 4) {
      return `**** **** **** ${limpo.slice(-4)}`;
    }
    return '**** **** **** ****';
  };

  // Inicia o mecanismo de simulação de autorização do cartão
  const handleIniciarAutorizacao = () => {
    // Se a compra for 100% coberta por cupons, finaliza direto sem simular cartão
    if (saldoAPagarCartao <= 0) {
      onConfirmOrder('APROVADA');
      return;
    }

    setEtapa('ENVIANDO');
    setProgresso(30);

    // Etapa 1: Enviando dados para adquirente (400ms)
    setTimeout(() => {
      setEtapa('PROCESSANDO');
      setProgresso(70);

      // Etapa 2: Validando dados e limite (mais 500ms)
      setTimeout(() => {
        if (modoSimulador === 'RECUSA') {
          setEtapa('RECUSADO');
          setProgresso(100);

          // RN0038, RF0053, RN0028: Registrar pedido como REPROVADA no sistema (sem baixa de estoque e desbloqueando itens)
          setTimeout(async () => {
            try {
              await onConfirmOrder('REPROVADA');
            } catch (err) {
              console.error('Erro ao registrar pedido reprovado:', err);
              setEtapa('REVISAO');
            }
          }, 800);
        } else {
          const authCode = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
          const nsu = `${Math.floor(100000000 + Math.random() * 900000000)}`;
          setCodigoAutorizacao(authCode);
          setNsuTransacao(nsu);
          setEtapa('AUTORIZADO');
          setProgresso(100);

          // Após autorização confirmada, efetiva a criação do pedido no backend (EM PROCESSAMENTO -> APROVADA)
          setTimeout(async () => {
            try {
              await onConfirmOrder('APROVADA');
            } catch (err) {
              console.error('Erro ao registrar pedido após autorização:', err);
              setEtapa('REVISAO');
            }
          }, 800);
        }
      }, 500);
    }, 400);
  };

  return (
    <div
      className="modal fade show d-block modal-confirmacao-compra"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}
      tabIndex={-1}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Cabeçalho */}
          <div className="modal-header bg-dark text-white py-3 px-4">
            <h5 className="modal-title fw-bold d-flex align-items-center">
              {etapa === 'REVISAO' ? (
                <>
                  <i className="bi bi-shield-check text-warning me-2 fs-4"></i>
                  Revisão e Confirmação da Compra
                </>
              ) : (
                <>
                  <i className="bi bi-credit-card-2-front-fill text-warning me-2 fs-4"></i>
                  Simulador de Cartão de Crédito - Caramelo Pay
                </>
              )}
            </h5>
            {etapa === 'REVISAO' && (
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onClose}
                disabled={isSubmittingOrder}
              ></button>
            )}
          </div>

          {/* Corpo do Modal */}
          <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {/* FASE 1: REVISÃO DOS DETALHES DA COMPRA */}
            {etapa === 'REVISAO' && (
              <div>
                {/* 1. Itens do Pedido */}
                <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                  <h6 className="fw-bold mb-3 d-flex align-items-center text-dark">
                    <i className="bi bi-bag-check me-2 text-warning fs-5"></i>
                    Itens do Pedido ({items.reduce((acc, i) => acc + i.quantidade, 0)} itens)
                  </h6>
                  <div className="list-group list-group-flush">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="list-group-item bg-transparent px-0 py-2 d-flex align-items-center justify-content-between"
                      >
                        <div className="d-flex align-items-center gap-3">
                          {item.imagemUrl && (
                            <img
                              src={item.imagemUrl}
                              alt={item.nome}
                              className="rounded-2 object-fit-cover shadow-sm"
                              style={{ width: '45px', height: '45px' }}
                            />
                          )}
                          <div>
                            <div className="fw-bold text-dark">{item.nome}</div>
                            <small className="text-muted">
                              {item.quantidade}x R$ {item.preco.toFixed(2).replace('.', ',')}
                            </small>
                          </div>
                        </div>
                        <span className="fw-bold text-dark">
                          R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Endereço e Frete */}
                <div className="row g-3 mb-3">
                  <div className="col-md-7">
                    <div className="card h-100 border-0 bg-light rounded-3 p-3">
                      <h6 className="fw-bold mb-2 text-dark d-flex align-items-center">
                        <i className="bi bi-geo-alt-fill text-danger me-2"></i>
                        Endereço de Entrega
                      </h6>
                      {enderecoEntrega ? (
                        <div className="small text-secondary">
                          <strong className="text-dark d-block">
                            {enderecoEntrega.identificacao} ({enderecoEntrega.tipoResidencia})
                          </strong>
                          <div>
                            {enderecoEntrega.logradouro}, nº {enderecoEntrega.numero}
                            {enderecoEntrega.observacoes ? ` - ${enderecoEntrega.observacoes}` : ''}
                          </div>
                          <div>
                            {enderecoEntrega.bairro} - {enderecoEntrega.cidade}/{enderecoEntrega.estado}
                          </div>
                          <div>CEP: {enderecoEntrega.cep}</div>
                        </div>
                      ) : (
                        <span className="text-muted small">Nenhum endereço selecionado</span>
                      )}
                    </div>
                  </div>

                  <div className="col-md-5">
                    <div className="card h-100 border-0 bg-light rounded-3 p-3">
                      <h6 className="fw-bold mb-2 text-dark d-flex align-items-center">
                        <i className="bi bi-truck text-primary me-2"></i>
                        Frete & Prazo
                      </h6>
                      <div className="small text-secondary">
                        <strong className="text-dark d-block">
                          {modalidadeFrete} {opcaoFrete?.prazoDias ? `(${opcaoFrete.prazoDias} dias úteis)` : ''}
                        </strong>
                        <div className="fw-bold text-success mt-1 fs-6">
                          R$ {valorFrete.toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Forma de Pagamento e Cupons */}
                <div className="card border-0 bg-light rounded-3 p-3 mb-3">
                  <h6 className="fw-bold mb-3 text-dark d-flex align-items-center">
                    <i className="bi bi-wallet2 text-success me-2 fs-5"></i>
                    Forma de Pagamento
                  </h6>

                  {/* Cupons aplicados */}
                  {(cupomPromocional || cuponsTroca.length > 0) && (
                    <div className="mb-3 p-2 bg-white rounded-2 border">
                      <div className="small fw-bold text-muted mb-2">Cupons Utilizados:</div>
                      {cupomPromocional && (
                        <div className="d-flex justify-content-between small text-success mb-1">
                          <span>
                            <i className="bi bi-tag-fill me-1"></i>Cupom Promocional ({cupomPromocional.codigo}):
                          </span>
                          <strong>- R$ {cupomPromocional.valor.toFixed(2).replace('.', ',')}</strong>
                        </div>
                      )}
                      {cuponsTroca.map((ct) => (
                        <div key={ct.id} className="d-flex justify-content-between small text-success mb-1">
                          <span>
                            <i className="bi bi-ticket-perforated-fill me-1"></i>Cupom de Troca ({ct.codigo}):
                          </span>
                          <strong>- R$ {ct.valor.toFixed(2).replace('.', ',')}</strong>
                        </div>
                      ))}
                      {trocoCupomTroca > 0 && (
                        <div className="alert alert-warning py-1 px-2 mt-2 mb-0 small rounded-2">
                          <i className="bi bi-info-circle-fill me-1"></i>
                          O excedente de <strong>R$ {trocoCupomTroca.toFixed(2).replace('.', ',')}</strong> será
                          emitido como um novo cupom de troca (RN0036).
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cartões de Crédito */}
                  {saldoAPagarCartao > 0 ? (
                    <div>
                      <div className="small fw-bold text-muted mb-2">
                        Pagamento no Cartão de Crédito (Saldo: R$ {saldoAPagarCartao.toFixed(2).replace('.', ',')}):
                      </div>
                      <div className="row g-2">
                        {cards.map((c, idx) => (
                          <div key={idx} className="col-12">
                            <div className="p-3 bg-white border rounded-3 d-flex align-items-center justify-content-between shadow-sm">
                              <div className="d-flex align-items-center gap-3">
                                <div className="badge bg-dark px-3 py-2 fs-6">
                                  {c.bandeira || 'CARTÃO'}
                                </div>
                                <div>
                                  <div className="fw-bold text-dark">
                                    {mascararCartao(c.numero)}
                                  </div>
                                  <small className="text-muted">
                                    Titular: {c.nomeImpresso || customer?.nome || 'NÃO INFORMADO'}
                                  </small>
                                </div>
                              </div>
                              <div className="text-end">
                                <small className="text-muted d-block">Valor a Cobrar</small>
                                <span className="fs-5 fw-bold text-success">
                                  R$ {Number(c.valor || 0).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-success py-2 px-3 mb-0 small rounded-3">
                      <i className="bi bi-check-circle-fill me-1"></i>
                      Compra 100% coberta pelos cupons de troca. Não há valor a pagar em cartão de crédito!
                    </div>
                  )}
                </div>

                {/* 4. Resumo Financeiro Final */}
                <div className="p-3 bg-warning-subtle text-warning-emphasis rounded-3 border border-warning-subtle">
                  <div className="d-flex justify-content-between small mb-1">
                    <span>Subtotal dos Produtos:</span>
                    <span>R$ {valorSubtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  {valorDesconto > 0 && (
                    <div className="d-flex justify-content-between small text-danger mb-1">
                      <span>Desconto Promocional:</span>
                      <span>- R$ {valorDesconto.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {cuponsTroca.length > 0 && (
                    <div className="d-flex justify-content-between small text-success mb-1">
                      <span>Total em Cupons de Troca:</span>
                      <span>
                        - R${' '}
                        {cuponsTroca
                          .reduce((acc, c) => acc + c.valor, 0)
                          .toFixed(2)
                          .replace('.', ',')}
                      </span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between small mb-2">
                    <span>Frete:</span>
                    <span>R$ {valorFrete.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <hr className="my-2 border-warning" />
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-bold fs-5 text-dark">Total da Compra:</span>
                    <span className="fw-bold fs-3 text-success">
                      R$ {valorTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* FASE 2: SIMULADOR DE CARTÃO DE CRÉDITO EM TEMPO REAL */}
            {etapa !== 'REVISAO' && (
              <div className="py-3 px-2 text-center">
                <div className="mb-4">
                  <div
                    className="p-3 rounded-4 shadow-sm mx-auto mb-3"
                    style={{
                      maxWidth: '380px',
                      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                      color: 'white',
                      textAlign: 'left',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="badge bg-warning text-dark px-2 py-1 fw-bold">
                        {cards[0]?.bandeira || 'MASTERCARD'}
                      </span>
                      <i className="bi bi-wifi fs-4 text-secondary"></i>
                    </div>
                    <div className="fs-5 font-monospace mb-3 tracking-wide">
                      {mascararCartao(cards[0]?.numero || '4111222233334444')}
                    </div>
                    <div className="d-flex justify-content-between align-items-end small">
                      <div>
                        <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                          TITULAR DO CARTÃO
                        </div>
                        <div className="fw-bold text-uppercase">
                          {cards[0]?.nomeImpresso || customer?.nome || 'CLIENTE'}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-secondary" style={{ fontSize: '0.7rem' }}>
                          VALOR
                        </div>
                        <div className="fw-bold text-success fs-6">
                          R$ {saldoAPagarCartao.toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barra de Progresso da Comunicação com a Operadora */}
                <div className="mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
                  <div className="progress rounded-pill shadow-sm" style={{ height: '14px' }}>
                    <div
                      className={`progress-bar progress-bar-striped progress-bar-animated ${
                        etapa === 'AUTORIZADO'
                          ? 'bg-success'
                          : etapa === 'RECUSADO'
                          ? 'bg-danger'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${progresso}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between small text-muted mt-2">
                    <span>1. Envio</span>
                    <span>2. Processamento</span>
                    <span>3. Autorização</span>
                  </div>
                </div>

                {/* Mensagens de Status Dinâmicas */}
                {etapa === 'ENVIANDO' && (
                  <div className="py-3">
                    <div className="spinner-border text-primary mb-3" role="status"></div>
                    <h5 className="fw-bold text-primary mb-1">Enviando dados para a Adquirente...</h5>
                    <p className="text-muted small">
                      Estabelecendo conexão segura TLS com a rede autorizadora da bandeira{' '}
                      {cards[0]?.bandeira || 'do cartão'}.
                    </p>
                  </div>
                )}

                {etapa === 'PROCESSANDO' && (
                  <div className="py-3">
                    <div className="spinner-grow text-warning mb-3" role="status"></div>
                    <h5 className="fw-bold text-dark mb-1">Validando Limite e Código de Segurança...</h5>
                    <p className="text-muted small">
                      A autorizadora está verificando o limite de crédito disponível e os parâmetros antifraude.
                    </p>
                  </div>
                )}

                {etapa === 'AUTORIZADO' && (
                  <div className="py-3">
                    <div
                      className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center shadow-lg mb-3"
                      style={{ width: '70px', height: '70px' }}
                    >
                      <i className="bi bi-check-lg fs-1"></i>
                    </div>
                    <h4 className="fw-bold text-success mb-2">Transação Aprovada com Sucesso!</h4>
                    <p className="text-muted mb-3">
                      A operadora autorizou o pagamento de{' '}
                      <strong className="text-dark">R$ {saldoAPagarCartao.toFixed(2).replace('.', ',')}</strong>.
                    </p>

                    <div className="bg-light border p-3 rounded-3 d-inline-block text-start shadow-sm mb-3">
                      <div className="small text-muted mb-1">
                        <strong>Status:</strong> <span className="badge bg-success">AUTORIZADO (CÓD. 00)</span>
                      </div>
                      <div className="small text-muted mb-1">
                        <strong>Código de Autorização:</strong>{' '}
                        <span className="font-monospace text-dark fw-bold">{codigoAutorizacao}</span>
                      </div>
                      <div className="small text-muted">
                        <strong>NSU Transação:</strong>{' '}
                        <span className="font-monospace text-dark">{nsuTransacao}</span>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-center gap-2 text-primary small">
                      <div className="spinner-border spinner-border-sm" role="status"></div>
                      <span>Registrando pedido no sistema com status EM PROCESSAMENTO...</span>
                    </div>
                  </div>
                )}

                {etapa === 'RECUSADO' && (
                  <div className="py-3">
                    <div
                      className="rounded-circle bg-danger text-white d-inline-flex align-items-center justify-content-center shadow-lg mb-3"
                      style={{ width: '70px', height: '70px' }}
                    >
                      <i className="bi bi-x-lg fs-1"></i>
                    </div>
                    <h4 className="fw-bold text-danger mb-2">Transação Negada pela Emissora</h4>
                    <p className="text-muted mb-3">
                      A operadora do cartão recusou a transação (Código 51: Saldo ou limite de crédito insuficiente).
                    </p>
                    <button
                      className="btn btn-outline-dark rounded-pill px-4"
                      onClick={() => setEtapa('REVISAO')}
                    >
                      Voltar e Tentar Outro Cartão
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rodapé do Modal */}
          {etapa === 'REVISAO' && (
            <div className="modal-footer bg-light px-4 py-3 d-flex justify-content-between align-items-center">
              {/* Seletor didático de teste de simulação (permite demonstrar sucesso ou recusa) */}
              <div className="d-flex align-items-center gap-2">
                <small className="text-muted fw-bold">Modo Simulador:</small>
                <select
                  className="form-select form-select-sm"
                  style={{ width: '190px' }}
                  value={modoSimulador}
                  onChange={(e) => setModoSimulador(e.target.value as 'SUCESSO' | 'RECUSA')}
                >
                  <option value="SUCESSO">✓ Simular Aprovação</option>
                  <option value="RECUSA">✗ Simular Recusa</option>
                </select>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClose}
                  disabled={isSubmittingOrder}
                >
                  Voltar e Ajustar
                </button>
                <button
                  type="button"
                  className="btn btn-success fw-bold px-4 btn-autorizar-pagamento"
                  onClick={handleIniciarAutorizacao}
                  disabled={isSubmittingOrder}
                >
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {saldoAPagarCartao > 0 ? 'Autorizar e Concluir Pedido' : 'Concluir Pedido'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
