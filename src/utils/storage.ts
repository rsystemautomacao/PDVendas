// ==========================================
// MeuPDV - Camada de Persistência
// localStorage agora, MongoDB Atlas depois
// ==========================================

const PREFIX = 'meupdv_'

export const StorageKeys = {
  USERS: `${PREFIX}users`,
  CURRENT_USER: `${PREFIX}current_user`,
  PRODUTOS: `${PREFIX}produtos`,
  CLIENTES: `${PREFIX}clientes`,
  VENDAS: `${PREFIX}vendas`,
  CAIXAS: `${PREFIX}caixas`,
  CONTAS_PAGAR: `${PREFIX}contas_pagar`,
  CONTAS_RECEBER: `${PREFIX}contas_receber`,
  DESPESAS: `${PREFIX}despesas`,
  COMPRAS: `${PREFIX}compras`,
  NOTIFICACOES: `${PREFIX}notificacoes`,
  LOGS: `${PREFIX}logs`,
  NEXT_VENDA_NUM: `${PREFIX}next_venda_num`,
  NEXT_CAIXA_NUM: `${PREFIX}next_caixa_num`,
  NEXT_COMPRA_NUM: `${PREFIX}next_compra_num`,
} as const

// ---- CRUD Genérico ----

export function getAll<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getById<T extends { _id: string }>(key: string, id: string): T | null {
  const items = getAll<T>(key)
  return items.find(item => item._id === id) || null
}

export function saveAll<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items))
}

export function addItem<T extends { _id: string }>(key: string, item: T): T {
  const items = getAll<T>(key)
  items.push(item)
  saveAll(key, items)
  return item
}

export function updateItem<T extends { _id: string }>(key: string, id: string, updates: Partial<T>): T | null {
  const items = getAll<T>(key)
  const index = items.findIndex(item => item._id === id)
  if (index === -1) return null
  items[index] = { ...items[index], ...updates }
  saveAll(key, items)
  return items[index]
}

export function removeItem<T extends { _id: string }>(key: string, id: string): boolean {
  const items = getAll<T>(key)
  const filtered = items.filter(item => item._id !== id)
  if (filtered.length === items.length) return false
  saveAll(key, filtered)
  return true
}

// ---- Contadores sequenciais ----

export function getNextNumber(key: string): number {
  const current = localStorage.getItem(key)
  const next = current ? parseInt(current) + 1 : 1
  localStorage.setItem(key, String(next))
  return next
}

// ---- Gerar ID ----

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

// ---- Backup / Export ----

export function exportAllData(): string {
  const data: Record<string, unknown> = {}
  Object.values(StorageKeys).forEach(key => {
    const val = localStorage.getItem(key)
    if (val) data[key] = JSON.parse(val)
  })
  return JSON.stringify(data, null, 2)
}

export function importAllData(json: string): boolean {
  try {
    const data = JSON.parse(json)
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value))
    })
    return true
  } catch {
    return false
  }
}
