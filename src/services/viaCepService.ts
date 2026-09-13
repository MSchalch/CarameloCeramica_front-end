export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

export const viaCepService = {
  buscarEnderecoPorCep: async (cep: string): Promise<ViaCepResponse | null> => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      return null;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!response.ok) {
        throw new Error('Falha na resposta do ViaCEP');
      }
      const data: ViaCepResponse = await response.json();
      if (data.erro) {
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro ao consultar ViaCEP:', error);
      return null;
    }
  },

  formatarCep: (cep: string): string => {
    const limpo = cep.replace(/\D/g, '').slice(0, 8);
    if (limpo.length > 5) {
      return `${limpo.slice(0, 5)}-${limpo.slice(5)}`;
    }
    return limpo;
  }
};
