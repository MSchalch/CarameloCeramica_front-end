import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { orderService } from '../../services/orderService';
import { viaCepService } from '../../services/viaCepService';
import type { Cliente, CartaoCredito, Endereco } from '../../types/customer';
import type { Pedido, ItemPedido, PagamentoPedido, Cupom } from '../../types/order';
import { useAuth } from '../../contexts/AuthContext';

interface CartItem {
  id: number;
  nome: string;
  preco: number;
  imagemUrl: string;
  categoria: string;
  quantidade: number;
  estoque: number;
}

interface CartaoPagamentoForm {
  cartaoId?: number;
  numero: string;
  nomeImpresso: string;
  bandeira: string;
  codigoSeguranca: string;
  valor: number;
  salvarNoPerfil?: boolean;
}

const Checkout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<Cliente | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Novo endereço durante a compra (RF0035, RN0023)
  const [showNovoEnderecoModal, setShowNovoEnderecoModal] = useState(false);
  const [salvarEnderecoPerfil, setSalvarEnderecoPerfil] = useState(true);
  const [novoEndereco, setNovoEndereco] = useState<Endereco>({
    identificacao: 'Endereço Alternativo',
    tipoResidencia: 'Casa',
    logradouro: '',
    numero: '',
    bairro: '',
    cep: '',
    cidade: '',
    estado: 'SP',
    pais: 'Brasil',
    observacoes: '',
    tipoEndereco: 'ENTREGA',
  });

  // Cupom Promocional (RN0033: apenas 1)
  const [cupomInput, setCupomInput] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<Cupom | null>(null);
  const [cupomMsg, setCupomMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Cupons de Troca (RN0035, RN0036)
  const [cupomTrocaInput, setCupomTrocaInput] = useState('');
  const [cuponsTrocaAplicados, setCuponsTrocaAplicados] = useState<Cupom[]>([]);
  const [cupomTrocaMsg, setCupomTrocaMsg] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Pagamentos com Cartão (RF0036, RN0024, RN0025, RN0034, RN0035)
  const [cards, setCards] = useState<CartaoPagamentoForm[]>([
    {
      numero: '',
      nomeImpresso: '',
      bandeira: 'MASTERCARD',
      codigoSeguranca: '',
      valor: 0,
      salvarNoPerfil: false,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    // Carregar carrinho
    const savedCart = localStorage.getItem('caramelo_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }

    // Carregar cliente
    const carregarCliente = async () => {
      try {
        let clienteEncontrado: Cliente | null = null;
        if (user?.clienteId) {
          clienteEncontrado = await customerService.buscarPorId(user.clienteId);
        } else {
          const data = await customerService.listarClientes('', 0, 1);
          if (data.content && data.content.length > 0) {
            clienteEncontrado = await customerService.buscarPorId(data.content[0].id!);
          }
        }

        if (clienteEncontrado) {
          setCurrentCustomer(clienteEncontrado);
          if (clienteEncontrado.enderecos && clienteEncontrado.enderecos.length > 0) {
            setSelectedAddressId(clienteEncontrado.enderecos[0].id!);
          }
          if (clienteEncontrado.cartoes && clienteEncontrado.cartoes.length > 0) {
            const primeiroCartao = clienteEncontrado.cartoes[0];
            setCards([
              {
                cartaoId: primeiroCartao.id,
                numero: primeiroCartao.numero,
                nomeImpresso: primeiroCartao.nomeImpresso,
                bandeira: primeiroCartao.bandeira,
                codigoSeguranca: primeiroCartao.codigoSeguranca,
                valor: Number(saldoAPagarCartao.toFixed(2)),
                salvarNoPerfil: false,
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados do cliente no checkout:', err);
      }
    };

    carregarCliente();
  }, [user]);

  // Total de itens e subtotal
  const totalItensQtd = items.reduce((acc, item) => acc + item.quantidade, 0);
  const subtotal = items.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  // Cálculo de Frete Dinâmico (RF0034) baseado na UF do endereço de entrega e na quantidade de itens
  const calcularFretePorEndereco = (uf?: string) => {
    if (items.length === 0) return 0;
    const estado = (uf || 'SP').toUpperCase().trim();
    let baseFrete = 15.0; // Sudeste padrão
    if (['SP'].includes(estado)) baseFrete = 15.0;
    else if (['RJ', 'MG', 'ES'].includes(estado)) baseFrete = 18.0;
    else if (['PR', 'SC', 'RS'].includes(estado)) baseFrete = 22.0;
    else if (['MS', 'MT', 'GO', 'DF'].includes(estado)) baseFrete = 25.0;
    else if (['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'].includes(estado)) baseFrete = 28.0;
    else if (['AM', 'PA', 'RO', 'AC', 'RR', 'AP', 'TO'].includes(estado)) baseFrete = 32.0;

    const adicionalItens = Math.max(0, totalItensQtd - 1) * 3.0;
    return baseFrete + adicionalItens;
  };

  const enderecoSelecionado = currentCustomer?.enderecos?.find((e) => e.id === selectedAddressId);
  const frete = calcularFretePorEndereco(enderecoSelecionado?.estado);
  const desconto = cupomAplicado ? cupomAplicado.valor : 0.0;
  const valorComDescontoEFrete = Math.max(0, subtotal - desconto + frete);

  // Soma dos cupons de troca aplicados
  const totalCuponsTroca = cuponsTrocaAplicados.reduce((acc, c) => acc + c.valor, 0);

  // Troco excedente de cupom de troca (RN0036)
  const trocoCupomTroca = Math.max(0, totalCuponsTroca - valorComDescontoEFrete);

  // Saldo final a pagar no cartão de crédito
  const saldoAPagarCartao = Math.max(0, valorComDescontoEFrete - totalCuponsTroca);

  // Atualizar valor do cartão automaticamente se houver apenas 1 cartão
  useEffect(() => {
    if (cards.length === 1 && saldoAPagarCartao > 0) {
      setCards((prev) => {
        if (prev.length === 1 && prev[0].valor !== Number(saldoAPagarCartao.toFixed(2))) {
          return [{ ...prev[0], valor: Number(saldoAPagarCartao.toFixed(2)) }];
        }
        return prev;
      });
    }
  }, [saldoAPagarCartao, cards.length]);

  // Validar e Aplicar Cupom Promocional (RN0033: apenas 1)
  const handleValidarCupom = async () => {
    if (!cupomInput.trim()) return;
    setCupomMsg(null);
    try {
      const cupom = await orderService.validarCupom(cupomInput.trim());
      if (cupom.tipo !== 'PROMOCIONAL') {
        setCupomMsg({ type: 'danger', text: 'O código informado não é um cupom promocional.' });
        return;
      }
      setCupomAplicado(cupom);
      setCupomMsg({
        type: 'success',
        text: `Cupom ${cupom.codigo} aplicado! Desconto de R$ ${cupom.valor.toFixed(2).replace('.', ',')}`,
      });
    } catch (err: any) {
      const msg = err.response?.data || err.message || 'Cupom inválido ou expirado.';
      setCupomMsg({ type: 'danger', text: typeof msg === 'string' ? msg : JSON.stringify(msg) });
    }
  };

  // Validar e Adicionar Cupom de Troca (RN0036 e RN0035)
  const handleAdicionarCupomTroca = async () => {
    if (!cupomTrocaInput.trim()) return;
    setCupomTrocaMsg(null);

    // RN0036: Não permitir cupons de troca desnecessários se a compra já estiver totalmente coberta
    if (saldoAPagarCartao === 0 && cuponsTrocaAplicados.length > 0) {
      setCupomTrocaMsg({
        type: 'danger',
        text: 'Regra RN0036: Cupom desnecessário. O valor da compra já está totalmente coberto por cupons.',
      });
      return;
    }

    const codNormalizado = cupomTrocaInput.trim().toUpperCase();
    if (cuponsTrocaAplicados.some((c) => c.codigo.toUpperCase() === codNormalizado)) {
      setCupomTrocaMsg({ type: 'danger', text: 'Este cupom de troca já foi adicionado.' });
      return;
    }

    try {
      const cupom = await orderService.validarCupom(codNormalizado);
      if (cupom.tipo !== 'TROCA') {
        setCupomTrocaMsg({ type: 'danger', text: 'O código informado não é um cupom de troca.' });
        return;
      }

      setCuponsTrocaAplicados([...cuponsTrocaAplicados, cupom]);
      setCupomTrocaInput('');
      setCupomTrocaMsg({
        type: 'success',
        text: `Cupom de troca ${cupom.codigo} (R$ ${cupom.valor.toFixed(2).replace('.', ',')}) aplicado com sucesso!`,
      });
    } catch (err: any) {
      const msg = err.response?.data || err.message || 'Cupom de troca inválido ou indisponível.';
      setCupomTrocaMsg({ type: 'danger', text: typeof msg === 'string' ? msg : JSON.stringify(msg) });
    }
  };

  const handleRemoverCupomTroca = (codigo: string) => {
    setCuponsTrocaAplicados(cuponsTrocaAplicados.filter((c) => c.codigo !== codigo));
  };

  // Buscar CEP via ViaCEP para novo endereço
  const handleBuscarCep = async (cep: string) => {
    const limpo = cep.replace(/\D/g, '');
    setNovoEndereco((prev) => ({ ...prev, cep }));
    if (limpo.length === 8) {
      try {
        const dados = await viaCepService.buscarEnderecoPorCep(limpo);
        if (dados && !dados.erro) {
          setNovoEndereco((prev) => ({
            ...prev,
            logradouro: dados.logradouro || '',
            bairro: dados.bairro || '',
            cidade: dados.localidade || '',
            estado: dados.uf || 'SP',
          }));
        }
      } catch (e) {
        console.error('Erro ao consultar CEP:', e);
      }
    }
  };

  // Salvar Novo Endereço (RF0035, RN0023)
  const handleSalvarNovoEndereco = async () => {
    if (!currentCustomer) return;
    if (
      !novoEndereco.identificacao.trim() ||
      !novoEndereco.cep.trim() ||
      !novoEndereco.logradouro.trim() ||
      !novoEndereco.numero.trim() ||
      !novoEndereco.bairro.trim() ||
      !novoEndereco.cidade.trim() ||
      !novoEndereco.estado.trim()
    ) {
      alert('Preencha todos os campos obrigatórios do endereço (RN0023).');
      return;
    }

    try {
      if (salvarEnderecoPerfil) {
        // Incorpora ao perfil do cliente (RF0035)
        const enderecosAtualizados = [...(currentCustomer.enderecos || []), novoEndereco];
        const payload: Cliente = {
          ...currentCustomer,
          enderecos: enderecosAtualizados,
        };
        await customerService.atualizarCliente(payload);
        const reloaded = await customerService.buscarPorId(currentCustomer.id!);
        setCurrentCustomer(reloaded);
        const enderecoCriado = reloaded.enderecos?.[reloaded.enderecos.length - 1];
        if (enderecoCriado?.id) {
          setSelectedAddressId(enderecoCriado.id);
        }
      } else {
        // Usa em memória para a compra
        const tempId = Date.now();
        const enderecoTemp = { ...novoEndereco, id: tempId };
        setCurrentCustomer({
          ...currentCustomer,
          enderecos: [...(currentCustomer.enderecos || []), enderecoTemp],
        });
        setSelectedAddressId(tempId);
      }
      setShowNovoEnderecoModal(false);
      alert('Endereço adicionado com sucesso!');
    } catch (err: any) {
      alert('Erro ao cadastrar endereço: ' + (err.response?.data || err.message));
    }
  };

  // Gerenciamento de Cartões
  const handleAddCard = () => {
    setCards([
      ...cards,
      {
        numero: '',
        nomeImpresso: '',
        bandeira: 'MASTERCARD',
        codigoSeguranca: '',
        valor: 10,
        salvarNoPerfil: true,
      },
    ]);
  };

  const handleRemoveCard = (index: number) => {
    if (cards.length > 1) {
      setCards(cards.filter((_, i) => i !== index));
    }
  };

  const handleSelectExistingCard = (index: number, cardId: number) => {
    const card = currentCustomer?.cartoes?.find((c) => c.id === cardId);
    const updated = [...cards];
    if (card) {
      updated[index] = {
        ...updated[index],
        cartaoId: card.id,
        numero: card.numero,
        nomeImpresso: card.nomeImpresso,
        bandeira: card.bandeira,
        codigoSeguranca: card.codigoSeguranca,
        salvarNoPerfil: false,
      };
    } else {
      updated[index] = {
        ...updated[index],
        cartaoId: undefined,
        numero: '',
        nomeImpresso: '',
        bandeira: 'VISA',
        codigoSeguranca: '',
        salvarNoPerfil: true,
      };
    }
    setCards(updated);
  };

  // Finalizar Compra (RF0038)
  const handleConfirmOrder = async () => {
    if (!currentCustomer) {
      alert('Nenhum cliente selecionado para a compra.');
      return;
    }

    if (items.length === 0) {
      alert('Seu carrinho está vazio.');
      return;
    }

    if (!selectedAddressId) {
      alert('Selecione um endereço de entrega (RF0035).');
      return;
    }

    // Validação de pagamento no front
    if (saldoAPagarCartao > 0) {
      if (cards.length === 1) {
        cards[0].valor = Number(saldoAPagarCartao.toFixed(2));
      }

      const somaCards = cards.reduce((acc, c) => acc + (c.valor || 0), 0);
      if (Math.abs(somaCards - saldoAPagarCartao) > 0.05) {
        alert(
          `A soma dos cartões (R$ ${somaCards.toFixed(2)}) deve cobrir exatamente o saldo restante de R$ ${saldoAPagarCartao.toFixed(2)}.`
        );
        return;
      }

      // Validação RN0034 (mínimo de R$ 10,00 por cartão se múltiplos cartões e sem cupons)
      if (cards.length > 1 && cuponsTrocaAplicados.length === 0) {
        for (const c of cards) {
          if (c.valor < 10) {
            alert('Regra RN0034: Cada cartão de crédito deve possuir valor mínimo de R$ 10,00.');
            return;
          }
        }
      }
    }

    setLoading(true);
    setOrderError(null);

    try {
      // Se houver novos cartões com "Salvar no meu perfil" marcado, incorpora ao perfil do cliente (RF0036)
      const novosCartoesParaSalvar = cards.filter(
        (c) => c.salvarNoPerfil && !c.cartaoId && c.numero && c.nomeImpresso
      );
      if (novosCartoesParaSalvar.length > 0) {
        const cartoesAtualizados: CartaoCredito[] = [
          ...(currentCustomer.cartoes || []),
          ...novosCartoesParaSalvar.map((c) => ({
            numero: c.numero,
            nomeImpresso: c.nomeImpresso,
            bandeira: c.bandeira,
            codigoSeguranca: c.codigoSeguranca,
            preferencial: false,
          })),
        ];
        await customerService.atualizarCliente({
          ...currentCustomer,
          cartoes: cartoesAtualizados,
        });
      }

      // Itens do pedido
      const itensPedido: ItemPedido[] = items.map((item) => ({
        peca: { id: item.id } as any,
        quantidade: item.quantidade,
        valorUnitario: item.preco,
        valorTotal: item.preco * item.quantidade,
      }));

      // Pagamentos combinados: Cupons de Troca + Cartões de Crédito
      const pagamentos: PagamentoPedido[] = [];

      // Adiciona pagamentos por cupom de troca
      cuponsTrocaAplicados.forEach((cupom) => {
        pagamentos.push({
          formaPagamento: 'CUPOM_TROCA',
          cupomTroca: cupom,
          valorPago: cupom.valor,
        });
      });

      // Adiciona pagamentos por cartão (se houver saldo a pagar)
      if (saldoAPagarCartao > 0) {
        cards.forEach((c) => {
          pagamentos.push({
            formaPagamento: 'CARTAO',
            cartao: {
              id: c.cartaoId,
              numero: c.numero,
              nomeImpresso: c.nomeImpresso,
              bandeira: c.bandeira,
              codigoSeguranca: c.codigoSeguranca,
              preferencial: false,
            } as CartaoCredito,
            valorPago: c.valor,
          });
        });
      }

      const pedidoPayload: Pedido = {
        cliente: { id: currentCustomer.id } as Cliente,
        enderecoEntregaId: selectedAddressId,
        valorSubtotal: subtotal,
        valorFrete: frete,
        valorDesconto: desconto,
        valorTotal: valorComDescontoEFrete,
        cupomPromocional: cupomAplicado || undefined,
        itens: itensPedido,
        pagamentos: pagamentos,
      };

      await orderService.criarPedido(pedidoPayload);
      localStorage.removeItem('caramelo_cart');
      alert('🎉 Pedido realizado com sucesso! Status: EM PROCESSAMENTO (RF0038)');
      navigate('/profile/orders');
    } catch (err: any) {
      console.error('Erro ao fechar pedido:', err);
      const msg = err.response?.data || err.message || 'Erro ao processar pedido no servidor.';
      setOrderError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <h2 className="fw-bold mb-4">Finalizar Compra</h2>

      {orderError && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Não foi possível concluir o pedido:</strong> {orderError}
          <button type="button" className="btn-close" onClick={() => setOrderError(null)}></button>
        </div>
      )}

      <div className="row">
        <div className="col-lg-8">
          {/* 1. Endereço de Entrega (RF0035, RN0023) */}
          <div className="card shadow-sm border-0 mb-4 secao-endereco-entrega">
            <div className="card-header bg-white fw-bold fs-5 d-flex justify-content-between align-items-center">
              <span>1. Endereço de Entrega (RF0035)</span>
              <button
                className="btn btn-sm btn-outline-dark btn-novo-endereco"
                type="button"
                onClick={() => setShowNovoEnderecoModal(true)}
              >
                <i className="bi bi-plus-lg me-1"></i>+ Cadastrar Novo Endereço
              </button>
            </div>
            <div className="card-body">
              {currentCustomer?.enderecos && currentCustomer.enderecos.length > 0 ? (
                currentCustomer.enderecos.map((end) => (
                  <div className="form-check mb-3 item-endereco-radio" key={end.id}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="selectedAddress"
                      id={`end-${end.id}`}
                      checked={selectedAddressId === end.id}
                      onChange={() => setSelectedAddressId(end.id!)}
                    />
                    <label className="form-check-label" htmlFor={`end-${end.id}`}>
                      <strong>{end.identificacao}</strong> - {end.logradouro}, {end.numero} - {end.bairro} ({end.cidade}/{end.estado} - CEP {end.cep})
                      <span className="badge bg-light text-muted ms-2 border">{end.tipoResidencia}</span>
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-muted">
                  Nenhum endereço cadastrado.{' '}
                  <button
                    className="btn btn-link p-0"
                    onClick={() => setShowNovoEnderecoModal(true)}
                  >
                    Cadastre um novo endereço aqui
                  </button>
                  .
                </div>
              )}
            </div>
          </div>

          {/* 2. Cupons de Troca (RN0035, RN0036) */}
          <div className="card shadow-sm border-0 mb-4 secao-cupons-troca">
            <div className="card-header bg-white fw-bold fs-5 d-flex justify-content-between align-items-center">
              <span>2. Cupons de Troca (RN0035 e RN0036)</span>
            </div>
            <div className="card-body">
              <p className="text-muted small mb-3">
                Você pode utilizar cupons de troca obtidos em devoluções anteriores. Se o valor do cupom superar a compra, um novo cupom de troca será gerado com a diferença (RN0036).
              </p>
              <div className="input-group mb-3" style={{ maxWidth: '420px' }}>
                <input
                  type="text"
                  className="form-control input-codigo-cupom-troca"
                  placeholder="Código do Cupom de Troca (Ex: TROCA-100)"
                  value={cupomTrocaInput}
                  onChange={(e) => setCupomTrocaInput(e.target.value)}
                />
                <button
                  className="btn btn-outline-dark btn-aplicar-cupom-troca"
                  type="button"
                  onClick={handleAdicionarCupomTroca}
                >
                  Adicionar
                </button>
              </div>

              {cupomTrocaMsg && (
                <div className={`alert alert-${cupomTrocaMsg.type} py-2 px-3 small mb-3 alert-cupom-troca`}>
                  {cupomTrocaMsg.text}
                </div>
              )}

              {cuponsTrocaAplicados.length > 0 && (
                <div className="table-responsive">
                  <table className="table table-sm align-middle table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Código</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th className="text-end">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cuponsTrocaAplicados.map((c) => (
                        <tr key={c.codigo} className="linha-cupom-troca">
                          <td className="fw-bold">{c.codigo}</td>
                          <td>
                            <span className="badge bg-info text-dark">Troca</span>
                          </td>
                          <td className="text-success fw-bold">
                            R$ {c.valor.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-danger btn-remover-cupom-troca"
                              onClick={() => handleRemoverCupomTroca(c.codigo)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {trocoCupomTroca > 0 && (
                <div className="alert alert-success mt-2 py-2 px-3 small alert-troco-cupom">
                  <i className="bi bi-gift-fill me-1"></i>
                  <strong>Regra RN0036:</strong> O valor dos cupons supera a compra em{' '}
                  <strong>R$ {trocoCupomTroca.toFixed(2).replace('.', ',')}</strong>. Um novo cupom de troca será emitido para você com esse saldo residual!
                </div>
              )}
            </div>
          </div>

          {/* 3. Pagamento com Cartão de Crédito (RF0036, RN0024, RN0025, RN0034, RN0035) */}
          <div className="card shadow-sm border-0 mb-4 secao-pagamento-cartao">
            <div className="card-header bg-white fw-bold fs-5 d-flex justify-content-between align-items-center">
              <span>3. Pagamento com Cartão de Crédito</span>
              {saldoAPagarCartao > 0 && (
                <button
                  className="btn btn-sm btn-outline-dark btn-adicionar-outro-cartao"
                  onClick={handleAddCard}
                >
                  <i className="bi bi-plus-lg me-1"></i>Pagar com dois ou mais cartões (RN0034)
                </button>
              )}
            </div>
            <div className="card-body">
              {saldoAPagarCartao === 0 ? (
                <div className="alert alert-info mb-0">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  O valor da compra está 100% coberto por cupons de troca! Nenhum cartão de crédito é necessário.
                </div>
              ) : (
                <>
                  <p className="text-muted small mb-3">
                    Saldo restante a pagar no cartão:{' '}
                    <strong className="text-dark fs-6">
                      R$ {saldoAPagarCartao.toFixed(2).replace('.', ',')}
                    </strong>
                    {cuponsTrocaAplicados.length > 0 && saldoAPagarCartao < 10 && (
                      <span className="badge bg-warning text-dark ms-2">
                        RN0035: Valor residual &lt; R$ 10,00 permitido
                      </span>
                    )}
                  </p>

                  {cards.map((card, index) => (
                    <div
                      key={index}
                      className={`p-3 mb-3 border rounded card-pagamento-item ${
                        index > 0 ? 'bg-light' : ''
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold mb-0">Cartão {index + 1}</h6>
                        {cards.length > 1 && (
                          <button
                            className="btn btn-sm btn-outline-danger btn-remover-cartao"
                            onClick={() => handleRemoveCard(index)}
                          >
                            Remover Cartão
                          </button>
                        )}
                      </div>

                      {currentCustomer?.cartoes && currentCustomer.cartoes.length > 0 && (
                        <div className="mb-3">
                          <label className="form-label small text-muted">Usar cartão salvo:</label>
                          <select
                            className="form-select select-cartao-salvo"
                            value={card.cartaoId || ''}
                            onChange={(e) => handleSelectExistingCard(index, Number(e.target.value))}
                          >
                            <option value="">Digitar novo cartão...</option>
                            {currentCustomer.cartoes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.bandeira} - Nº: {c.numero} ({c.nomeImpresso})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="row mb-3">
                        <div className="col-md-7">
                          <label className="form-label">Número do Cartão *</label>
                          <input
                            type="text"
                            className="form-control input-cartao-numero"
                            placeholder="0000 0000 0000 0000"
                            maxLength={19}
                            value={card.numero}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCards((prev) =>
                                prev.map((c, i) => (i === index ? { ...c, numero: val } : c))
                              );
                            }}
                            required
                          />
                        </div>
                        <div className="col-md-5">
                          <label className="form-label">Nome Impresso *</label>
                          <input
                            type="text"
                            className="form-control input-cartao-nome"
                            placeholder="NOME IMPRESSO"
                            value={card.nomeImpresso}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCards((prev) =>
                                prev.map((c, i) => (i === index ? { ...c, nomeImpresso: val } : c))
                              );
                            }}
                            required
                          />
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-4">
                          <label className="form-label">Bandeira * (RN0025)</label>
                          <select
                            className="form-select select-cartao-bandeira"
                            value={card.bandeira}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCards((prev) =>
                                prev.map((c, i) => (i === index ? { ...c, bandeira: val } : c))
                              );
                            }}
                          >
                            <option value="MASTERCARD">Mastercard</option>
                            <option value="VISA">Visa</option>
                            <option value="ELO">Elo</option>
                            <option value="AMEX">Amex</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">CVV * (RN0024)</label>
                          <input
                            type="text"
                            className="form-control input-cartao-cvv"
                            maxLength={4}
                            placeholder="123"
                            value={card.codigoSeguranca}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCards((prev) =>
                                prev.map((c, i) =>
                                  i === index ? { ...c, codigoSeguranca: val } : c
                                )
                              );
                            }}
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-bold text-success">
                            Valor neste cartão (R$) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control fw-bold border-success input-cartao-valor"
                            value={card.valor || ''}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setCards((prev) =>
                                prev.map((c, i) => (i === index ? { ...c, valor: val } : c))
                              );
                            }}
                            required
                          />
                          {cards.length > 1 && cuponsTrocaAplicados.length === 0 && (
                            <small className="text-muted d-block mt-1">
                              Mínimo R$ 10,00 (RN0034)
                            </small>
                          )}
                        </div>
                      </div>

                      {/* Opção para incorporar novo cartão ao perfil (RF0036) */}
                      {!card.cartaoId && (
                        <div className="form-check mt-2">
                          <input
                            className="form-check-input check-salvar-cartao-perfil"
                            type="checkbox"
                            id={`salvarCartao-${index}`}
                            checked={card.salvarNoPerfil || false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setCards((prev) =>
                                prev.map((c, i) =>
                                  i === index ? { ...c, salvarNoPerfil: checked } : c
                                )
                              );
                            }}
                          />
                          <label
                            className="form-check-label small text-muted"
                            htmlFor={`salvarCartao-${index}`}
                          >
                            Salvar este cartão no meu perfil para compras futuras (RF0036)
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Resumo do Pedido & Cupons Promocionais */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 bg-light sticky-top secao-resumo-pedido" style={{ top: '90px' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-4">Resumo do Pedido</h5>

              {/* Cupom Promocional (RN0033: apenas 1 por compra) */}
              <div className="mb-4">
                <label className="form-label small fw-bold">Cupom Promocional (RN0033)</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control input-cupom-promocional"
                    placeholder="Ex: BEMVINDO10"
                    value={cupomInput}
                    onChange={(e) => setCupomInput(e.target.value)}
                  />
                  <button
                    className="btn btn-dark btn-aplicar-cupom-promocional"
                    type="button"
                    onClick={handleValidarCupom}
                  >
                    Aplicar
                  </button>
                </div>
                {cupomMsg && (
                  <div className={`text-${cupomMsg.type} small mt-1 alert-cupom-promocional`}>
                    {cupomMsg.text}
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal ({totalItensQtd} itens)</span>
                <span className="fw-bold resumo-checkout-subtotal">
                  R$ {subtotal.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2 text-success">
                <span>Desconto Promocional</span>
                <span className="fw-bold resumo-checkout-desconto">
                  - R$ {desconto.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">
                  Frete ({enderecoSelecionado?.estado || 'SP'})
                </span>
                <span className="fw-bold resumo-checkout-frete">
                  R$ {frete.toFixed(2).replace('.', ',')}
                </span>
              </div>
              {totalCuponsTroca > 0 && (
                <div className="d-flex justify-content-between mb-2 text-info">
                  <span>Cupons de Troca ({cuponsTrocaAplicados.length})</span>
                  <span className="fw-bold resumo-checkout-cupons-troca">
                    - R$ {totalCuponsTroca.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
              <hr />
              <div className="d-flex justify-content-between mb-4 fw-bold fs-4 text-warning-emphasis">
                <span>Total Compra</span>
                <span className="text-success resumo-checkout-total">
                  R$ {valorComDescontoEFrete.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <button
                className="btn btn-warning w-100 fw-bold shadow-sm py-3 fs-5 btn-confirmar-pedido"
                onClick={handleConfirmOrder}
                disabled={loading || items.length === 0}
              >
                {loading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processando...
                  </span>
                ) : (
                  'Confirmar Pedido'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro de Novo Endereço (RF0035, RN0023) */}
      {showNovoEnderecoModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Novo Endereço de Entrega (RN0023)</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowNovoEnderecoModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Identificação / Frase Curta * (RF0026)</label>
                    <input
                      type="text"
                      className="form-control input-endereco-identificacao"
                      placeholder="Ex: Minha Casa de Praia"
                      value={novoEndereco.identificacao}
                      onChange={(e) =>
                        setNovoEndereco({ ...novoEndereco, identificacao: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Tipo de Residência *</label>
                    <select
                      className="form-select select-endereco-tipo-residencia"
                      value={novoEndereco.tipoResidencia}
                      onChange={(e) =>
                        setNovoEndereco({ ...novoEndereco, tipoResidencia: e.target.value })
                      }
                    >
                      <option value="Casa">Casa</option>
                      <option value="Apartamento">Apartamento</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">CEP *</label>
                    <input
                      type="text"
                      className="form-control input-endereco-cep"
                      placeholder="00000-000"
                      maxLength={9}
                      value={novoEndereco.cep}
                      onChange={(e) => handleBuscarCep(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Logradouro *</label>
                    <input
                      type="text"
                      className="form-control input-endereco-logradouro"
                      value={novoEndereco.logradouro}
                      onChange={(e) =>
                        setNovoEndereco({ ...novoEndereco, logradouro: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Número *</label>
                    <input
                      type="text"
                      className="form-control input-endereco-numero"
                      value={novoEndereco.numero}
                      onChange={(e) =>
                        setNovoEndereco({ ...novoEndereco, numero: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="col-md-5">
                    <label className="form-label">Bairro *</label>
                    <input
                      type="text"
                      className="form-control input-endereco-bairro"
                      value={novoEndereco.bairro}
                      onChange={(e) =>
                        setNovoEndereco({ ...novoEndereco, bairro: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-5">
                    <label className="form-label">Cidade *</label>
                    <input
                      type="text"
                      className="form-control input-endereco-cidade"
                      value={novoEndereco.cidade}
                      onChange={(e) =>
                        setNovoEndereco({ ...novoEndereco, cidade: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Estado (UF) *</label>
                    <input
                      type="text"
                      maxLength={2}
                      className="form-control input-endereco-estado"
                      value={novoEndereco.estado}
                      onChange={(e) =>
                        setNovoEndereco({ ...novoEndereco, estado: e.target.value.toUpperCase() })
                      }
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Observações</label>
                    <input
                      type="text"
                      className="form-control input-endereco-observacoes"
                      placeholder="Ex: Próximo ao metrô"
                      value={novoEndereco.observacoes || ''}
                      onChange={(e) =>
                        setNovoEndereco({ ...novoEndereco, observacoes: e.target.value })
                      }
                    />
                  </div>

                  <div className="col-12 mt-3">
                    <div className="form-check">
                      <input
                        className="form-check-input check-incorporar-endereco-perfil"
                        type="checkbox"
                        id="checkSalvarEndereco"
                        checked={salvarEnderecoPerfil}
                        onChange={(e) => setSalvarEnderecoPerfil(e.target.checked)}
                      />
                      <label className="form-check-label fw-bold" htmlFor="checkSalvarEndereco">
                        Salvar este endereço no meu perfil de cliente (RF0035)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNovoEnderecoModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-warning fw-bold btn-salvar-novo-endereco"
                  onClick={handleSalvarNovoEndereco}
                >
                  Salvar e Usar Endereço
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
