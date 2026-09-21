/**
 * Utilitários de formatação e validação para CPF, Telefone e CEP
 */

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
