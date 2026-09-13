import api from './customerService';
import type { Pedido, Cupom } from '../types/order';
import type { PageResponse } from '../types/customer';

export const orderService = {
  criarPedido: async (pedido: Pedido): Promise<string> => {
    const response = await api.post<string>('/pedidos', pedido);
    return response.data;
  },

  atualizarPedido: async (pedido: Pedido): Promise<string> => {
    const response = await api.put<string>('/pedidos', pedido);
    return response.data;
  },

  listarPedidos: async (clienteId?: number, status?: string, page = 0, size = 50): Promise<PageResponse<Pedido>> => {
    const response = await api.get<PageResponse<Pedido>>('/pedidos', {
      params: { clienteId, status, page, size },
    });
    return response.data;
  },

  buscarPorId: async (id: number): Promise<Pedido> => {
    const response = await api.get<Pedido>(`/pedidos/${id}`);
    return response.data;
  },

  validarCupom: async (codigo: string): Promise<Cupom> => {
    const response = await api.get<Cupom>(`/cupons/validar/${codigo}`);
    return response.data;
  },
};
