import { StorageKeys } from '../utils/storage';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Guard para evitar múltiplos redirects simultâneos no 401
let isRedirecting = false;

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

async function request<T = any>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      // credentials: 'include' envia o cookie httpOnly automaticamente (proteção contra XSS)
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch {
    throw new Error('Sem conexao com o servidor. Verifique sua internet.');
  }

  // Token expirado ou invalido - redirect uma única vez
  // Nao redirecionar se for rota de login (401 = senha errada, nao token expirado)
  if (res.status === 401 && !path.includes('/auth/login')) {
    if (!isRedirecting) {
      isRedirecting = true;
      const body = await res.json().catch(() => ({}));
      localStorage.removeItem(StorageKeys.CURRENT_USER);
      if (body.code === 'SESSION_INVALIDATED' && body.reason) {
        sessionStorage.setItem('meupdv_disconnect_reason', body.reason);
      }
      window.location.href = '/login';
    }
    throw new Error('Sessao expirada');
  }

  // Assinatura bloqueada - o frontend já trata via AppLayout, mas propagamos o erro
  if (res.status === 402) {
    const body = await res.json().catch(() => ({}));
    if (body.code === 'SUBSCRIPTION_BLOCKED') {
      throw new Error('SUBSCRIPTION_BLOCKED');
    }
    throw new Error(body.error || 'Pagamento necessário');
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error('Servidor indisponivel. Verifique se o backend esta rodando.');
  }

  if (!res.ok) {
    throw new Error(data.error || 'Erro desconhecido');
  }

  return data;
}

export const api = {
  get: <T = any>(path: string) => request<T>(path),

  post: <T = any>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
