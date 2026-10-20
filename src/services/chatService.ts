import api from './customerService';
import type {
  ChatRequisicao,
  ChatResposta,
  ChatFeedbackRequisicao,
  StatusTreinamentoIA,
} from '../types/chat';

export const chatService = {
  enviarMensagem: async (requisicao: ChatRequisicao): Promise<ChatResposta> => {
    const response = await api.post<ChatResposta>('/chat/recomendar', requisicao);
    return response.data;
  },

  registrarFeedback: async (feedback: ChatFeedbackRequisicao): Promise<any> => {
    const response = await api.post('/chat/feedback', feedback);
    return response.data;
  },

  executarTreinamento: async (motivo?: string): Promise<any> => {
    const response = await api.post('/chat/treinar', { motivo });
    return response.data;
  },

  obterStatusTreinamento: async (clienteId?: number): Promise<StatusTreinamentoIA> => {
    const params = clienteId ? { clienteId } : {};
    const response = await api.get<StatusTreinamentoIA>('/chat/treinamento-status', { params });
    return response.data;
  },

  atualizarPreferencias: async (clienteId: number, preferenciasEstilo: string): Promise<any> => {
    const response = await api.put(`/chat/preferencias/${clienteId}`, { preferenciasEstilo });
    return response.data;
  },
};
