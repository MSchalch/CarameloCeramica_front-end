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
  perguntaOrigem?: string;
  itensRecomendados?: PecaRecomendada[];
  categoriaFoco?: string;
  versaoModelo?: string;
  explicacaoPersonalizacao?: string;
  conteudosSugeridos?: string[];
  avaliacaoUsuario?: 'UTIL' | 'NAO_UTIL';
  timestamp: string;
}

export interface ChatRequisicao {
  mensagem: string;
  clienteId?: number;
  historico: Array<{ remetente: string; texto: string }>;
}

export interface ChatResposta {
  resposta: string;
  itensRecomendados: PecaRecomendada[];
  categoriaFoco?: string;
  versaoModelo?: string;
  explicacaoPersonalizacao?: string;
  conteudosSugeridos?: string[];
}

export interface ChatFeedbackRequisicao {
  clienteId?: number;
  perguntaUsuario: string;
  respostaBot: string;
  pecasRecomendadas: string;
  categoriaFoco?: string;
  avaliacao: 'UTIL' | 'NAO_UTIL';
  comentario?: string;
}

export interface IaPesoModeloItem {
  id: number;
  clienteId: number;
  clienteNome: string;
  categoriaNome: string;
  pesoVendas: number;
  pesoFeedback: number;
  scoreFinal: number;
  totalVendasContabilizadas: number;
  feedbacksPositivos: number;
  feedbacksNegativos: number;
}

export interface ClientePerfilChat {
  id: number;
  nome: string;
  email: string;
  preferenciasEstilo: string;
  pecasCompradas: string[];
}

export interface StatusTreinamentoIA {
  modeloIntegrado: string;
  justificativaEscolhaIa: string;
  metodoPreferencias: string;
  versaoAtualModelo: string;
  ultimoCiclo?: {
    id: number;
    versaoModelo: string;
    totalVendasProcessadas: number;
    totalFeedbacksProcessados: number;
    exemplosJsonlGerados: number;
    resumoAjuste: string;
  };
  pesosAtuais: IaPesoModeloItem[];
  feedbacksRegistrados: Array<{
    id: number;
    clienteId: number;
    clienteNome: string;
    perguntaUsuario: string;
    pecasRecomendadas: string;
    categoriaFoco: string;
    avaliacao: string;
    comentario: string;
    incorporadoTreinamento: boolean;
  }>;
  datasetFineTuningJsonl: string[];
  clientesPerfis: ClientePerfilChat[];
}
