export interface DashboardData {
  vendasTotais: number;
  pedidosTotais: number;
  novosClientes: number;
  trocasSolicitadas: number;
  categoriasDisponiveis: string[];
  dadosGraficoLinhas: Array<Record<string, any>>;
}

export interface DashboardFilter {
  dataInicio?: string;
  dataFim?: string;
  categorias?: string[];
}
