import axios from 'axios';
import type { Cliente, PageResponse } from '../types/customer';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const customerService = {
  listarClientes: async (termo = '', page = 0, size = 10): Promise<PageResponse<Cliente>> => {
    const response = await api.get<PageResponse<Cliente>>('/clientes', {
      params: { termo, page, size },
    });
    return response.data;
  },

  buscarPorId: async (id: number): Promise<Cliente> => {
    const response = await api.get<Cliente>(`/clientes/${id}`);
    return response.data;
  },

  cadastrarCliente: async (cliente: Cliente): Promise<string> => {
    const response = await api.post<string>('/clientes', cliente);
    return response.data;
  },

  atualizarCliente: async (cliente: Cliente): Promise<string> => {
    const response = await api.put<string>('/clientes', cliente);
    return response.data;
  },

  excluirCliente: async (id: number): Promise<string> => {
    const response = await api.delete<string>(`/clientes/${id}`);
    return response.data;
  },
};

export default api;
