// ==========================================
// MeuPDV - Funções Utilitárias
// ==========================================

// ---- Parametros do sistema (localStorage) ----

const PARAMETROS_STORAGE_KEY = 'meupdv_parametros'

/**
 * Le o limite maximo de dinheiro fisico em caixa (em reais), configurado em
 * Configuracoes > Parametros. Retorna 0 quando nao configurado (= sem limite).
 */
export function getLimiteCaixaDinheiro(): number {
  try {
    const saved = localStorage.getItem(PARAMETROS_STORAGE_KEY)
    if (!saved) return 0
    const params = JSON.parse(saved)
    const v = parseFloat(params.limiteCaixaDinheiro)
    return Number.isFinite(v) && v > 0 ? v : 0
  } catch {
    return 0
  }
}

// ---- Formatação ----

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return 'R$ 0,00'
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
    const val = result[key]
    if (typeof val === 'string') {
      (result as Record<string, unknown>)[key] = sanitize(val)
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      // Percorre objetos aninhados recursivamente
      (result as Record<string, unknown>)[key] = sanitizeObject(val as Record<string, unknown>)
    } else if (Array.isArray(val)) {
      // Sanitiza strings dentro de arrays
      (result as Record<string, unknown>)[key] = val.map(item =>
        typeof item === 'string' ? sanitize(item) :
        (item !== null && typeof item === 'object' ? sanitizeObject(item as Record<string, unknown>) : item)
      )
    }
  }
  return result
}

// ---- Balanca (codigo de barras pesavel) ----

/**
 * Verifica se um codigo de barras e de balanca (pesavel).
 * Padrao brasileiro: comeca com "2" e tem 13 digitos.
 * Formato: 2PPPPP VVVVV D
 *  - 2 = prefixo de balanca
 *  - PPPPP = codigo PLU do produto (5 digitos)
 *  - VVVVV = valor total em centavos (5 digitos)
 *  - D = digito verificador
 *
 * Exemplo real: 2124900001061
 *  - PLU: 2124900
 *  - Valor: 00106 → R$ 1,06
 *  - D: 1
 */
export function isCodigoBalanca(codigo: string): boolean {
  const clean = codigo.replace(/\D/g, '')
  return clean.length === 13 && clean.startsWith('2')
}

/**
 * Extrai o PLU (codigo do produto) e o valor total de um codigo de balanca.
 * O codigo da balanca embute o VALOR TOTAL (em centavos), nao o peso.
 * Para obter o peso: valor / precoKg.
 *
 * @returns { plu, valorTotal } onde:
 *  - plu = primeiros 7 digitos (usado para buscar o produto cadastrado)
 *  - valorTotal = valor em reais (VVVVV / 100)
 */
export function parseCodigoBalanca(codigo: string): { plu: string; valorTotal: number } | null {
  const clean = codigo.replace(/\D/g, '')
  if (!isCodigoBalanca(clean)) return null

  const plu = clean.substring(0, 7) // 2 + PPPPP + 1 digito
  const valorDigits = clean.substring(7, 12)
  const valorTotal = parseInt(valorDigits) / 100  // centavos → reais

  return { plu, valorTotal }
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

// ---- WhatsApp ----

/**
 * Compartilha texto via WhatsApp.
 *
 * Abordagem em cascata para funcionar em TODOS os ambientes:
 *
 * 1. Android Bridge (WebView com ElginPrinter) — usa metodo nativo Java
 *    que abre o WhatsApp via Intent do Android. Mais confiavel no WebView.
 *
 * 2. navigator.share() — Web Share API, funciona no Chrome Android e
 *    em alguns WebViews modernos. Mostra menu de compartilhamento do sistema.
 *
 * 3. window.open('https://wa.me/...') — funciona em desktop e iOS.
 *
 * 4. Ultimo recurso (WebView sem bridge atualizado) — copia o texto para
 *    a area de transferencia e avisa o usuario para colar no WhatsApp.
 *
 * @param texto - Mensagem pre-preenchida
 * @param telefone - Numero com DDI (ex: "5511999999999"). Opcional.
 * @returns Objeto com resultado: { ok, metodo, copiado }
 */
export async function abrirWhatsApp(
  texto: string,
  telefone?: string,
): Promise<{ ok: boolean; metodo: string; copiado?: boolean }> {
  const isAndroid = /Android/i.test(navigator.userAgent)
  // 1. Android Bridge — funciona dentro do WebView customizado
  if (window.ElginPrinter?.compartilhar) {
    try {
      const ok = window.ElginPrinter.compartilhar(texto, 'com.whatsapp')
      if (ok) return { ok: true, metodo: 'bridge' }
    } catch { /* bridge sem metodo compartilhar, segue pro proximo */ }
  }

  // 2. Web Share API — funciona no Chrome Android e WebViews modernos
  if (isAndroid && navigator.share) {
    try {
      await navigator.share({ text: texto })
      return { ok: true, metodo: 'share-api' }
    } catch {
      // Usuario cancelou ou API falhou
    }
  }

  // 3. Link direto wa.me — funciona em desktop/iOS/Chrome (nao no WebView Android)
  const isWebView = !!window.ElginPrinter || !!window.AndroidPrinter
  if (!isWebView) {
    const encoded = encodeURIComponent(texto)
    const phonePath = telefone ? `/${telefone}` : ''
    window.open(`https://wa.me${phonePath}?text=${encoded}`, '_blank')
    return { ok: true, metodo: 'wa.me' }
  }

  // 4. Ultimo recurso (WebView sem suporte) — copia para clipboard
  try {
    await navigator.clipboard.writeText(texto)
    return { ok: false, metodo: 'clipboard', copiado: true }
  } catch {
    // Fallback clipboard para browsers antigos
    const ta = document.createElement('textarea')
    ta.value = texto
    ta.style.cssText = 'position:fixed;left:-9999px;'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    return { ok: false, metodo: 'clipboard', copiado: true }
  }
}
