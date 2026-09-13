import api from './customerService';
import type { ChatRequisicao, ChatResposta } from '../types/chat';

export const chatService = {
  enviarMensagem: async (requisicao: ChatRequisicao): Promise<ChatResposta> => {
    const response = await api.post<ChatResposta>('/chat/recomendar', requisicao);
    return response.data;
  },
};