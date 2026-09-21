// Cypress Support File
import './commands';

// Evita que erros não capturados da aplicação quebrem os testes desnecessariamente
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignora erros como ResizeObserver loop limit exceeded
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});
