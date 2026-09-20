export interface Usuario {
  id: number;
  nome: string;
  login: string;
  perfil: 'ADMIN' | 'CLIENTE';
  ativo: boolean;
  clienteId?: number | null;
  dataCadastro?: string;
}

export interface LoginCredentials {
  login: string;
  senha: string;
}

export interface NovoAdminRequest {
  nome: string;
  login: string;
  senha: string;
}
