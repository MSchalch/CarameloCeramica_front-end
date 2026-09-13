export interface Peca {
  id?: number;
  sku?: string;
  nome: string;
  artesaoMarca: string;
  categoria: string;
  tipoArgila: string;
  tipoEsmalte: string;
  altura: number;
  diametro: number;
  peso: number;
  volume: number;
  vaiAoForno: boolean;
  vaiAoMicroondas: boolean;
  grupoPrecificacao: string;
  custo?: number;
  margemLucro?: number;
  valorVenda?: number;
  estoque?: number;
  imagemUrl?: string;
  ativo?: boolean;
  motivoInativacao?: string;
  categoriaInativacao?: string;
  motivoAtivacao?: string;
  categoriaAtivacao?: string;
  categoriasAdicionais?: string[];
}
