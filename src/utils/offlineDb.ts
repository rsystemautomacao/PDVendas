/**
 * offlineDb.ts — Banco IndexedDB para modo offline do MeuPDV
 *
 * Armazena localmente: produtos, clientes, dados da empresa,
 * e uma fila de vendas pendentes para sync quando a conexao voltar.
 *
 * IMPORTANTE: Este modulo NUNCA modifica dados existentes do app.
 * Ele apenas oferece leitura/escrita ao IndexedDB de forma isolada.
 */

const DB_NAME = 'meupdv_offline'
const DB_VERSION = 1

// Nomes dos object stores
export const STORES = {
  PRODUTOS: 'produtos',
  CLIENTES: 'clientes',
  CONFIG: 'config', // empresa, usuario, etc
  VENDAS_PENDENTES: 'vendas_pendentes',
} as const

type StoreName = (typeof STORES)[keyof typeof STORES]

// ─── Abrir / criar banco ────────────────────────────────────────

let _dbPromise: Promise<IDBDatabase> | null = null

function abrirBanco(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise

  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result

      // Produtos — chave = _id
      if (!db.objectStoreNames.contains(STORES.PRODUTOS)) {
        const store = db.createObjectStore(STORES.PRODUTOS, { keyPath: '_id' })
        store.createIndex('codigo', 'codigo', { unique: false })
        store.createIndex('codigoBarras', 'codigoBarras', { unique: false })
      }

      // Clientes — chave = _id
      if (!db.objectStoreNames.contains(STORES.CLIENTES)) {
        db.createObjectStore(STORES.CLIENTES, { keyPath: '_id' })
      }

      // Config — chave = chave (ex: 'empresa', 'usuario')
      if (!db.objectStoreNames.contains(STORES.CONFIG)) {
        db.createObjectStore(STORES.CONFIG, { keyPath: 'chave' })
      }

      // Vendas pendentes — chave autoincrement + id temporario
      if (!db.objectStoreNames.contains(STORES.VENDAS_PENDENTES)) {
        const store = db.createObjectStore(STORES.VENDAS_PENDENTES, {
          keyPath: 'offlineId',
          autoIncrement: true,
        })
        store.createIndex('criadoEm', 'criadoEm', { unique: false })
        store.createIndex('sincronizado', 'sincronizado', { unique: false })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      _dbPromise = null
      reject(req.error)
    }
  })

  return _dbPromise
}

// ─── Operacoes genericas ────────────────────────────────────────

async function transacao<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (objectStore: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await abrirBanco()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const os = tx.objectStore(store)
    const req = fn(os)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ─── CRUD generico ──────────────────────────────────────────────

/** Salva um item (put = insert or update) */
export async function salvar<T>(store: StoreName, item: T): Promise<void> {
  await transacao(store, 'readwrite', (os) => os.put(item))
}

/** Busca um item por chave */
export async function buscarPorId<T>(store: StoreName, id: string | number): Promise<T | undefined> {
  return transacao(store, 'readonly', (os) => os.get(id))
}

/** Busca todos os itens de um store */
export async function buscarTodos<T>(store: StoreName): Promise<T[]> {
  return transacao(store, 'readonly', (os) => os.getAll())
}

/** Remove um item por chave */
export async function remover(store: StoreName, id: string | number): Promise<void> {
  await transacao(store, 'readwrite', (os) => os.delete(id))
}

/** Limpa todos os itens de um store */
export async function limparStore(store: StoreName): Promise<void> {
  await transacao(store, 'readwrite', (os) => os.clear())
}

// ─── Funcoes especificas ────────────────────────────────────────

/** Salva a lista completa de produtos (limpa e reinsere) */
export async function salvarProdutos(produtos: unknown[]): Promise<void> {
  const db = await abrirBanco()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PRODUTOS, 'readwrite')
    const os = tx.objectStore(STORES.PRODUTOS)
    os.clear()
    for (const p of produtos) {
      os.put(p)
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Salva a lista completa de clientes (limpa e reinsere) */
export async function salvarClientes(clientes: unknown[]): Promise<void> {
  const db = await abrirBanco()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CLIENTES, 'readwrite')
    const os = tx.objectStore(STORES.CLIENTES)
    os.clear()
    for (const c of clientes) {
      os.put(c)
    }
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Salva config (empresa, usuario, etc) */
export async function salvarConfig(chave: string, valor: unknown): Promise<void> {
  await salvar(STORES.CONFIG, { chave, valor, atualizadoEm: new Date().toISOString() })
}

/** Busca config por chave */
export async function buscarConfig<T>(chave: string): Promise<T | undefined> {
  const result = await buscarPorId<{ chave: string; valor: T }>(STORES.CONFIG, chave)
  return result?.valor
}

/** Adiciona uma venda na fila de pendentes */
export async function enfileirarVenda(vendaPayload: unknown): Promise<number> {
  const db = await abrirBanco()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.VENDAS_PENDENTES, 'readwrite')
    const os = tx.objectStore(STORES.VENDAS_PENDENTES)
    const req = os.add({
      ...vendaPayload as object,
      criadoEm: new Date().toISOString(),
      sincronizado: false,
      tentativas: 0,
    })
    req.onsuccess = () => resolve(req.result as number)
    req.onerror = () => reject(req.error)
  })
}

/** Busca vendas pendentes nao sincronizadas */
export async function buscarVendasPendentes(): Promise<unknown[]> {
  const todas = await buscarTodos(STORES.VENDAS_PENDENTES)
  return (todas as Array<{ sincronizado: boolean }>).filter((v) => !v.sincronizado)
}

/** Marca uma venda pendente como sincronizada */
export async function marcarVendaSincronizada(offlineId: number): Promise<void> {
  const venda = await buscarPorId<Record<string, unknown>>(STORES.VENDAS_PENDENTES, offlineId)
  if (venda) {
    venda.sincronizado = true
    venda.sincronizadoEm = new Date().toISOString()
    await salvar(STORES.VENDAS_PENDENTES, venda)
  }
}

/** Remove vendas ja sincronizadas (limpeza) */
export async function limparVendasSincronizadas(): Promise<void> {
  const todas = await buscarTodos<{ offlineId: number; sincronizado: boolean }>(STORES.VENDAS_PENDENTES)
  const db = await abrirBanco()
  const tx = db.transaction(STORES.VENDAS_PENDENTES, 'readwrite')
  const os = tx.objectStore(STORES.VENDAS_PENDENTES)
  for (const v of todas) {
    if (v.sincronizado) {
      os.delete(v.offlineId)
    }
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Conta vendas pendentes */
export async function contarVendasPendentes(): Promise<number> {
  const pendentes = await buscarVendasPendentes()
  return pendentes.length
}
