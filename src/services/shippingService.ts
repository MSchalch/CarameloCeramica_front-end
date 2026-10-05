export interface OpcaoFrete {
  id: 'PAC' | 'SEDEX';
  nome: string;
  descricao: string;
  valor: number;
  prazoDias: string;
  cidade?: string;
  uf?: string;
  pesoTotalKg: number;
}

export interface CotacaoFreteResultado {
  cep: string;
  cidade: string;
  uf: string;
  pesoTotalKg: number;
  opcoes: OpcaoFrete[];
}

/**
 * Mapeamento de fallback para identificar UF a partir da faixa de CEP brasileira
 */
function inferirUfPorCep(cepNumerico: string): string {
  const prefixo2 = parseInt(cepNumerico.substring(0, 2), 10);
  if (prefixo2 >= 1 && prefixo2 <= 19) return 'SP';
  if (prefixo2 >= 20 && prefixo2 <= 28) return 'RJ';
  if (prefixo2 === 29) return 'ES';
  if (prefixo2 >= 30 && prefixo2 <= 39) return 'MG';
  if (prefixo2 >= 40 && prefixo2 <= 48) return 'BA';
  if (prefixo2 === 49) return 'SE';
  if (prefixo2 >= 50 && prefixo2 <= 56) return 'PE';
  if (prefixo2 === 57) return 'AL';
  if (prefixo2 === 58) return 'PB';
  if (prefixo2 === 59) return 'RN';
  if (prefixo2 >= 60 && prefixo2 <= 63) return 'CE';
  if (prefixo2 === 64) return 'PI';
  if (prefixo2 === 65) return 'MA';
  if (prefixo2 >= 66 && prefixo2 <= 68) return 'PA';
  if (prefixo2 === 68) return 'AC';
  if (prefixo2 === 69) return 'AM';
  if (prefixo2 >= 70 && prefixo2 <= 72) return 'DF';
  if (prefixo2 >= 72 && prefixo2 <= 76) return 'GO';
  if (prefixo2 === 76) return 'RO';
  if (prefixo2 === 77) return 'TO';
  if (prefixo2 === 78) return 'MT';
  if (prefixo2 === 79) return 'MS';
  if (prefixo2 >= 80 && prefixo2 <= 87) return 'PR';
  if (prefixo2 >= 88 && prefixo2 <= 89) return 'SC';
  if (prefixo2 >= 90 && prefixo2 <= 99) return 'RS';
  return 'SP';
}

/**
 * Consulta a API pública do ViaCEP com fallback automático
 */
export async function consultarCep(cep: string): Promise<{ cidade: string; uf: string; bairro?: string }> {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) {
    throw new Error('CEP inválido. O CEP deve conter 8 dígitos.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (!data.erro && data.uf) {
        return {
          cidade: data.localidade || 'São Paulo',
          uf: data.uf.toUpperCase(),
          bairro: data.bairro,
        };
      }
    }
  } catch (err) {
    // Falha de rede ou timeout: recorre ao fallback por prefixo de CEP
  }

  const ufInferida = inferirUfPorCep(cepLimpo);
  return {
    cidade: ufInferida === 'SP' ? 'São Paulo' : 'Capital Regional',
    uf: ufInferida,
  };
}

/**
 * Calcula cotação com opções PAC e SEDEX com base no endereço e no peso real dos produtos (RF0034)
 */
export async function calcularOpcoesFrete(
  cep: string,
  itens: Array<{ peso?: number; quantidade: number }>,
  ufInformada?: string
): Promise<CotacaoFreteResultado> {
  const cepLimpo = cep.replace(/\D/g, '');
  let cidade = 'São Paulo';
  let uf = ufInformada ? ufInformada.toUpperCase() : 'SP';

  if (!ufInformada && cepLimpo.length === 8) {
    try {
      const info = await consultarCep(cepLimpo);
      cidade = info.cidade;
      uf = info.uf;
    } catch {
      uf = inferirUfPorCep(cepLimpo);
    }
  }

  // 1. Calcula o peso total das peças em kg (RF0034: peso/dimensões)
  const pesoTotalGramas = itens.reduce((acc, item) => {
    const pesoItem = item.peso && item.peso > 0 ? item.peso : 500; // peso médio padrão da cerâmica: 500g
    return acc + pesoItem * (item.quantidade || 1);
  }, 0);

  const pesoTotalKg = Math.max(0.3, Number((pesoTotalGramas / 1000).toFixed(2)));

  // 2. Tarifa base e prazos por região de destino (origem: SP)
  let basePac = 16.0;
  let baseSedex = 26.0;
  let prazoPac = '3 a 5 dias úteis';
  let prazoSedex = '1 a 2 dias úteis';

  if (uf === 'SP') {
    basePac = 15.0;
    baseSedex = 24.0;
    prazoPac = '2 a 4 dias úteis';
    prazoSedex = '1 dia útil';
  } else if (['RJ', 'MG', 'ES'].includes(uf)) {
    basePac = 20.0;
    baseSedex = 34.0;
    prazoPac = '4 a 6 dias úteis';
    prazoSedex = '2 a 3 dias úteis';
  } else if (['PR', 'SC', 'RS'].includes(uf)) {
    basePac = 24.0;
    baseSedex = 40.0;
    prazoPac = '5 a 7 dias úteis';
    prazoSedex = '2 a 4 dias úteis';
  } else if (['MS', 'MT', 'GO', 'DF'].includes(uf)) {
    basePac = 26.0;
    baseSedex = 44.0;
    prazoPac = '5 a 8 dias úteis';
    prazoSedex = '3 a 4 dias úteis';
  } else if (['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'].includes(uf)) {
    basePac = 32.0;
    baseSedex = 54.0;
    prazoPac = '7 a 10 dias úteis';
    prazoSedex = '3 a 5 dias úteis';
  } else {
    // Região Norte
    basePac = 36.0;
    baseSedex = 62.0;
    prazoPac = '8 a 14 dias úteis';
    prazoSedex = '4 a 6 dias úteis';
  }

  // 3. Adicional de peso para embalagem reforçada de cerâmica frágil (acima de 1 kg)
  const kgExcedente = Math.max(0, pesoTotalKg - 1.0);
  const acrescimoPesoPac = kgExcedente * 4.5;
  const acrescimoPesoSedex = kgExcedente * 7.5;

  const valorPac = Number((basePac + acrescimoPesoPac).toFixed(2));
  const valorSedex = Number((baseSedex + acrescimoPesoSedex).toFixed(2));

  return {
    cep: cepLimpo,
    cidade,
    uf,
    pesoTotalKg,
    opcoes: [
      {
        id: 'PAC',
        nome: 'PAC (Econômico)',
        descricao: 'Entrega padrão com embalagem reforçada para cerâmica',
        valor: valorPac,
        prazoDias: prazoPac,
        cidade,
        uf,
        pesoTotalKg,
      },
      {
        id: 'SEDEX',
        nome: 'SEDEX (Expresso)',
        descricao: 'Entrega rápida prioritária com seguro antiquebra',
        valor: valorSedex,
        prazoDias: prazoSedex,
        cidade,
        uf,
        pesoTotalKg,
      },
    ],
  };
}
