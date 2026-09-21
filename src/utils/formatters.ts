/**
 * Utilitários de formatação e validação para CPF, Telefone, E-mail e CEP
 */

// Lista oficial de DDDs válidos no Brasil
const DDDS_VALIDOS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
  21, 22, 24,                         // RJ
  27, 28,                             // ES
  31, 32, 33, 34, 35, 37, 38,         // MG
  41, 42, 43, 44, 45, 46,             // PR
  47, 48, 49,                         // SC
  51, 53, 54, 55,                     // RS
  61,                                 // DF
  62, 64,                             // GO
  63,                                 // TO
  65, 66,                             // MT
  67,                                 // MS
  68,                                 // AC
  69,                                 // RO
  71, 73, 74, 75, 77,                 // BA
  79,                                 // SE
  81, 87,                             // PE
  82,                                 // AL
  83,                                 // PB
  84,                                 // RN
  85, 88,                             // CE
  86, 89,                             // PI
  91, 93, 94,                         // PA
  92, 97,                             // AM
  95,                                 // RR
  96,                                 // AP
  98, 99                              // MA
]);

/**
 * Aplica máscara de CPF no formato 000.000.000-00 conforme o usuário digita
 */
export const formatarCpf = (valor: string | undefined | null): string => {
  if (!valor) return '';
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 11);

  if (apenasNumeros.length <= 3) {
    return apenasNumeros;
  }
  if (apenasNumeros.length <= 6) {
    return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3)}`;
  }
  if (apenasNumeros.length <= 9) {
    return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6)}`;
  }
  return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6, 9)}-${apenasNumeros.slice(9, 11)}`;
};

/**
 * Valida se o CPF possui exatamente 11 dígitos e se os dígitos verificadores são válidos
 */
export const validarCpf = (cpf: string | undefined | null): boolean => {
  if (!cpf) return false;
  const numeros = cpf.replace(/\D/g, '');

  if (numeros.length !== 11) return false;

  // Rejeita sequências com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  // Validação do 1º dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(9), 10)) return false;

  // Validação do 2º dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(numeros.charAt(10), 10)) return false;

  return true;
};

/**
 * Aplica máscara de Telefone no formato (00) 00000-0000 ou (00) 0000-0000
 */
export const formatarTelefone = (valor: string | undefined | null): string => {
  if (!valor) return '';
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 11);

  if (apenasNumeros.length <= 2) {
    return apenasNumeros.length > 0 ? `(${apenasNumeros}` : '';
  }
  if (apenasNumeros.length <= 6) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
  }
  if (apenasNumeros.length <= 10) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
  }
  return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`;
};

/**
 * Valida se o telefone possui DDD brasileiro válido e estrutura correta (celular com 9 ou fixo de 2 a 5)
 */
export const validarTelefone = (telefone: string | undefined | null): boolean => {
  if (!telefone) return false;
  const limpo = telefone.replace(/\D/g, '');

  if (limpo.length !== 10 && limpo.length !== 11) {
    return false;
  }

  // Rejeita sequências repetidas (ex: 11999999999, 00000000000)
  if (/^(\d)\1+$/.test(limpo)) {
    return false;
  }

  // Valida DDD
  const ddd = parseInt(limpo.substring(0, 2), 10);
  if (!DDDS_VALIDOS.has(ddd)) {
    return false;
  }

  // Celular: deve começar com 9 após DDD
  if (limpo.length === 11 && limpo.charAt(2) !== '9') {
    return false;
  }

  // Fixo: deve começar com 2, 3, 4 ou 5 após DDD
  if (limpo.length === 10) {
    const terceiro = limpo.charAt(2);
    if (terceiro < '2' || terceiro > '5') {
      return false;
    }
  }

  return true;
};

/**
 * Valida o formato básico de e-mail
 */
export const validarEmail = (email: string | undefined | null): boolean => {
  if (!email) return false;
  return /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/.test(email.trim());
};

/**
 * RNF0031 - Valida política de senha forte:
 * Mínimo de 8 caracteres, contendo pelo menos uma letra maiúscula, uma minúscula e um caractere especial.
 */
export const validarSenhaForte = (senha: string | undefined | null): boolean => {
  if (!senha || senha.length < 8) return false;
  const temMinuscula = /[a-z]/.test(senha);
  const temMaiuscula = /[A-Z]/.test(senha);
  const temEspecial = /[^a-zA-Z0-9]/.test(senha);
  return temMinuscula && temMaiuscula && temEspecial;
};

