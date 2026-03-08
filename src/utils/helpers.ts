// ==========================================
// MeuPDV - Funções Utilitárias
// ==========================================

// ---- Formatação ----

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR')
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('pt-BR')
}

export function formatDateInput(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr.substring(0, 10)
}

export function todayISO(): string {
  return new Date().toISOString()
}

export function todayDateOnly(): string {
  return new Date().toISOString().substring(0, 10)
}

// ---- Validação ----

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i)
  let rest = (sum * 10) % 11
  if (rest === 10) rest = 0
  if (rest !== parseInt(cleaned[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i)
  rest = (sum * 10) % 11
  if (rest === 10) rest = 0
  return rest === parseInt(cleaned[10])
}

export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) return false
  const weights1 = [5,4,3,2,9,8,7,6,5,4,3,2]
  const weights2 = [6,5,4,3,2,9,8,7,6,5,4,3,2]
  let sum = 0
  for (let i = 0; i < 12; i++) sum += parseInt(cleaned[i]) * weights1[i]
  let rest = sum % 11
  const d1 = rest < 2 ? 0 : 11 - rest
  if (d1 !== parseInt(cleaned[12])) return false
  sum = 0
  for (let i = 0; i < 13; i++) sum += parseInt(cleaned[i]) * weights2[i]
  rest = sum % 11
  const d2 = rest < 2 ? 0 : 11 - rest
  return d2 === parseInt(cleaned[13])
}

// ---- Máscaras ----

export function maskCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .substring(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .substring(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function maskPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '').substring(0, 11)
  if (cleaned.length <= 10) {
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
  }
  return cleaned
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function maskCEP(value: string): string {
  return value
    .replace(/\D/g, '')
    .substring(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2')
}

export function maskCurrency(value: string): string {
  const cleaned = value.replace(/\D/g, '')
  const num = parseInt(cleaned || '0') / 100
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function parseCurrency(formatted: string): number {
  const cleaned = formatted.replace(/[^\d,.-]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

// ---- Sanitização (XSS protection) ----

export function sanitize(input: string): string {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj }
  for (const key in result) {
    if (typeof result[key] === 'string') {
      (result as Record<string, unknown>)[key] = sanitize(result[key] as string)
    }
  }
  return result
}

// ---- Hash de senha (frontend - usar bcrypt no backend depois) ----

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'meupdv_salt_2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password)
  return computed === hash
}

// ---- Balanca (codigo de barras pesavel) ----

/**
 * Verifica se um codigo de barras e de balanca (pesavel).
 * Padrao brasileiro: comeca com "2" e tem 13 digitos.
 * Formato: 2PPPPP VVVVV D
 *  - 2 = prefixo de balanca
 *  - PPPPP = codigo PLU do produto (5 digitos)
 *  - VVVVV = valor em centavos OU peso em gramas (5 digitos)
 *  - D = digito verificador
 */
export function isCodigoBalanca(codigo: string): boolean {
  const clean = codigo.replace(/\D/g, '')
  return clean.length === 13 && clean.startsWith('2')
}

/**
 * Extrai o PLU (codigo do produto) e o valor/peso de um codigo de balanca.
 * Retorna { plu, valor } onde:
 *  - plu = os primeiros 7 digitos (prefixo "2" + 5 digitos PLU + 1 digito separador)
 *    Usa os primeiros 7 chars para buscar no cadastro
 *  - valor = os 5 digitos seguintes interpretados como reais (VVVVV / 100)
 *  - peso = os 5 digitos seguintes interpretados como peso (VVVVV / 1000)
 */
export function parseCodigoBalanca(codigo: string): { plu: string; valor: number; peso: number } | null {
  const clean = codigo.replace(/\D/g, '')
  if (!isCodigoBalanca(clean)) return null

  const plu = clean.substring(0, 7) // 2 + PPPPP + 1 digito
  const valorDigits = clean.substring(7, 12)
  const valor = parseInt(valorDigits) / 100  // em reais (centavos)
  const peso = parseInt(valorDigits) / 1000  // em kg (gramas)

  return { plu, valor, peso }
}

// ---- Datas helpers ----

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function isDateInRange(dateStr: string, from: string, to: string): boolean {
  const d = new Date(dateStr).getTime()
  const f = from ? new Date(from).getTime() : 0
  const t = to ? new Date(to + 'T23:59:59').getTime() : Infinity
  return d >= f && d <= t
}
