export interface Endereco {
  id?: number;
  identificacao: string;
  tipoResidencia: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  pais: string;
  observacoes?: string;
  tipoEndereco: 'COBRANCA' | 'ENTREGA' | 'AMBOS';
}

export interface CartaoCredito {
  id?: number;
  numero: string;
  nomeImpresso: string;
  bandeira: string;
  codigoSeguranca: string;
  preferencial: boolean;
}

export interface Cliente {
  id?: number;
  codigoCliente?: string;
  nome: string;
  genero: string;
  dataNascimento: string;
  cpf: string;
  telefone: string;
  email: string;
  senha?: string;
  ranking?: number;
  ativo?: boolean;
  dataCadastro?: string;
  enderecos: Endereco[];
  cartoes: CartaoCredito[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
