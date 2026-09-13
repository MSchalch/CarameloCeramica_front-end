import api from './customerService';
import type { DashboardData, DashboardFilter } from '../types/dashboard';

export const dashboardService = {
  obterDados: async (filtro?: DashboardFilter): Promise<DashboardData> => {
    const params: any = {};
    if (filtro?.dataInicio) {
      params.dataInicio = filtro.dataInicio;
    }
    if (filtro?.dataFim) {
      params.dataFim = filtro.dataFim;
    }
    if (filtro?.categorias && filtro.categorias.length > 0) {
      params.categorias = filtro.categorias.join(',');
    }

    const response = await api.get<DashboardData>('/dashboard/analise', { params });
    return response.data;
  },
};
