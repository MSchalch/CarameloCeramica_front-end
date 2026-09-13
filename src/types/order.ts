import type { Peca } from './product';
import type { Cliente, CartaoCredito } from './customer';

export interface Cupom {
  id?: number;
  codigo: string;
  tipo: 'PROMOCIONAL' | 'TROCA';
  valor: number;
  ativo: boolean;
  dataValidade?: string;
}

export interface ItemPedido {
  id?: number;
  peca: Peca;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface PagamentoPedido {
  id?: number;
  formaPagamento: 'CARTAO' | 'CUPOM_TROCA';
  cartao?: CartaoCredito;
  cupomTroca?: Cupom;
  valorPago: number;
}

export interface Pedido {
  id?: number;
  codigoPedido?: string;
  cliente: Cliente;
  dataPedido?: string;
  status?: string;
  valorSubtotal: number;
  valorFrete: number;
  valorDesconto?: number;
  valorTotal: number;
  cupomPromocional?: Cupom;
  enderecoEntregaId?: number;
  itens: ItemPedido[];
  pagamentos: PagamentoPedido[];
}
