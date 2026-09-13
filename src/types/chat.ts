export interface PecaRecomendada {
  id: number;
  nome: string;
  categoria: string;
  valorVenda: number;
  imagemUrl?: string;
  tipoArgila?: string;
  tipoEsmalte?: string;
  estoque?: number;
}

export interface ChatMensagem {
  id: string;
  remetente: 'usuario' | 'bot';
  texto: string;
  itensRecomendados?: PecaRecomendada[];
  timestamp: string;
}

export interface ChatRequisicao {
  mensagem: string;
  historico: Array<{ remetente: string; texto: string }>;
}

export interface ChatResposta {
  resposta: string;
  itensRecomendados: PecaRecomendada[];
}