export interface CartItem {
  id: number;
  sku?: string;
  nome: string;
  artesaoMarca?: string;
  preco: number;
  imagemUrl: string;
  categoria: string;
  categoriasAdicionais?: string[];
  quantidade: number;
  estoque: number;
  peso?: number;
  altura?: number;
  diametro?: number;
  volume?: number;
  tipoArgila?: string;
  tipoEsmalte?: string;
  vaiAoForno?: boolean;
  vaiAoMicroondas?: boolean;
}

const GUEST_CART_KEY = 'caramelo_cart_guest';
const LEGACY_CART_KEY = 'caramelo_cart';
const CART_EXPIRES_AT_KEY = 'caramelo_cart_expires_at';
const CART_EXPIRED_ITEMS_KEY = 'caramelo_cart_expired_items';
const CART_TTL_PARAM_KEY = 'caramelo_cart_ttl_ms';
const DEFAULT_BLOCK_TTL_MS = 5 * 60 * 1000; // 5 minutos padrão (parametrizável via RNF0045)

export const cartService = {
  /**
   * Retorna o prazo parametrizado de bloqueio do carrinho em milissegundos (RNF0045).
   */
  getBlockDurationMs: (): number => {
    try {
      const customTtl = localStorage.getItem(CART_TTL_PARAM_KEY);
      if (customTtl) {
        const parsed = parseInt(customTtl, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {}
    return DEFAULT_BLOCK_TTL_MS;
  },

  setBlockDurationMs: (ms: number): void => {
    localStorage.setItem(CART_TTL_PARAM_KEY, String(ms));
  },

  getExpiresAt: (): number | null => {
    try {
      const val = localStorage.getItem(CART_EXPIRES_AT_KEY);
      if (val) {
        const num = parseInt(val, 10);
        return isNaN(num) ? null : num;
      }
    } catch {}
    return null;
  },

  getExpiredItems: (): CartItem[] => {
    try {
      const saved = localStorage.getItem(CART_EXPIRED_ITEMS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  },

  clearExpiredItems: (): void => {
    localStorage.removeItem(CART_EXPIRED_ITEMS_KEY);
    window.dispatchEvent(new Event('cartUpdated'));
  },

  /**
   * Expira o bloqueio temporário do carrinho (RN0044, RNF0042):
   * Remove todos os itens do carrinho ativo e os registra na lista de itens expirados.
   */
  expireCartNow: (): CartItem[] => {
    const currentItems = cartService.getCart();
    if (currentItems.length > 0) {
      localStorage.setItem(CART_EXPIRED_ITEMS_KEY, JSON.stringify(currentItems));
      const key = cartService.getCurrentUserKey();
      localStorage.removeItem(key);
      localStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem(LEGACY_CART_KEY);
      localStorage.removeItem(CART_EXPIRES_AT_KEY);
      window.dispatchEvent(new Event('cartUpdated'));
      return currentItems;
    }
    return cartService.getExpiredItems();
  },

  /**
   * Restaura os itens expirados de volta ao carrinho com novo bloqueio temporário (RNF0042).
   */
  restoreExpiredItemsToCart: (): CartItem[] => {
    const expired = cartService.getExpiredItems();
    if (expired.length > 0) {
      localStorage.removeItem(CART_EXPIRED_ITEMS_KEY);
      cartService.saveCart(expired);
      return expired;
    }
    return [];
  },

  /**
   * Retorna a chave de armazenamento no localStorage para o usuário atual.
   * Usuários logados têm sua chave própria isolada (caramelo_cart_user_{id}).
   * Visitantes utilizam a chave de convidado.
   */
  getCurrentUserKey: (): string => {
    try {
      const userStr = localStorage.getItem('caramelo_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          return `caramelo_cart_user_${user.id}`;
        }
      }
    } catch (e) {
      console.error('Erro ao obter usuário para chave do carrinho:', e);
    }
    return GUEST_CART_KEY;
  },

  /**
   * Obtém a lista de itens no carrinho do usuário atual.
   */
  getCart: (): CartItem[] => {
    try {
      const key = cartService.getCurrentUserKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }

      // Se for visitante, verificar compatibilidade com a chave legado
      if (key === GUEST_CART_KEY) {
        const legacy = localStorage.getItem(LEGACY_CART_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler carrinho:', e);
    }
    return [];
  },

  /**
   * Salva a lista de itens no carrinho do usuário atual, renova o prazo de bloqueio
   * contado a partir do último item incluído (RN0044, RNF0045) e sincroniza eventos.
   */
  saveCart: (items: CartItem[]): void => {
    try {
      const key = cartService.getCurrentUserKey();
      localStorage.setItem(key, JSON.stringify(items));
      // Manter chave legado sincronizada para máxima compatibilidade com componentes existentes
      localStorage.setItem(LEGACY_CART_KEY, JSON.stringify(items));
      if (items.length > 0) {
        const ttl = cartService.getBlockDurationMs();
        localStorage.setItem(CART_EXPIRES_AT_KEY, String(Date.now() + ttl));
        localStorage.removeItem(CART_EXPIRED_ITEMS_KEY);
      } else {
        localStorage.removeItem(CART_EXPIRES_AT_KEY);
      }
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (e) {
      console.error('Erro ao salvar carrinho:', e);
    }
  },

  /**
   * Esvazia completamente o carrinho do usuário atual e limpa resíduos de sessão.
   */
  clearCart: (): void => {
    try {
      const key = cartService.getCurrentUserKey();
      localStorage.removeItem(key);
      localStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem(LEGACY_CART_KEY);
      localStorage.removeItem(CART_EXPIRES_AT_KEY);
      localStorage.removeItem(CART_EXPIRED_ITEMS_KEY);
      localStorage.removeItem('caramelo_frete_opcao');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (e) {
      console.error('Erro ao limpar carrinho:', e);
    }
  },

  /**
   * Migra os itens adicionados por um visitante não-autenticado para a conta do usuário
   * quando ele é direcionado do carrinho para o login com intenção de finalizar compra.
   */
  migrarCarrinhoGuestParaUsuario: (userId: number): void => {
    try {
      const guestSaved = localStorage.getItem(GUEST_CART_KEY) || localStorage.getItem(LEGACY_CART_KEY);
      if (guestSaved) {
        const items = JSON.parse(guestSaved);
        if (Array.isArray(items) && items.length > 0) {
          localStorage.setItem(`caramelo_cart_user_${userId}`, JSON.stringify(items));
          // Limpa resíduos de convidado após a transferência
          localStorage.removeItem(GUEST_CART_KEY);
          localStorage.removeItem(LEGACY_CART_KEY);
          window.dispatchEvent(new Event('cartUpdated'));
          return;
        }
      }
    } catch (e) {
      console.error('Erro ao migrar carrinho de visitante para usuário:', e);
    }
  },

  /**
   * Limpa qualquer item deixado por visitantes ou sessões anteriores quando um cliente
   * faz login normalmente, garantindo que contas novas comecem com carrinho vazio.
   */
  limparCarrinhoGuest: (): void => {
    try {
      localStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem(LEGACY_CART_KEY);
      localStorage.removeItem(CART_EXPIRES_AT_KEY);
      localStorage.removeItem(CART_EXPIRED_ITEMS_KEY);
      localStorage.removeItem('caramelo_frete_opcao');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (e) {
      console.error('Erro ao limpar carrinho guest:', e);
    }
  },
};

export default cartService;
