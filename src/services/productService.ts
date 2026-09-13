import api from './customerService';
import type { Peca } from '../types/product';
import type { PageResponse } from '../types/customer';

export const productService = {
  listarPecas: async (termo = '', categoria = '', page = 0, size = 50): Promise<PageResponse<Peca>> => {
    const response = await api.get<PageResponse<Peca>>('/pecas', {
      params: { termo, categoria, page, size },
    });
    return response.data;
  },

  buscarPorId: async (id: number): Promise<Peca> => {
    const response = await api.get<Peca>(`/pecas/${id}`);
    return response.data;
  },

  cadastrarPeca: async (peca: Peca): Promise<string> => {
    const response = await api.post<string>('/pecas', peca);
    return response.data;
  },

  atualizarPeca: async (peca: Peca): Promise<string> => {
    const response = await api.put<string>('/pecas', peca);
    return response.data;
  },

  excluirPeca: async (id: number): Promise<string> => {
    const response = await api.delete<string>(`/pecas/${id}`);
    return response.data;
  },
};
