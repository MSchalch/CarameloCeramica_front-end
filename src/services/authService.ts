import axios from 'axios';
import type { Usuario, LoginCredentials, NovoAdminRequest } from '../types/auth';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  login: async (credentials: LoginCredentials): Promise<Usuario> => {
    const response = await api.post<Usuario>('/auth/login', credentials);
    return response.data;
  },

  criarAdmin: async (dados: NovoAdminRequest): Promise<Usuario> => {
    const response = await api.post<Usuario>('/auth/admin', dados);
    return response.data;
  },

  listarAdmins: async (): Promise<Usuario[]> => {
    const response = await api.get<Usuario[]>('/auth/admin');
    return response.data;
  },
};

export default authService;
