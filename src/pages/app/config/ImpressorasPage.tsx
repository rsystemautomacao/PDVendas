import { useState, useCallback } from 'react'
import { Printer, Save, X, Plus, Trash2, TestTube, Info, AlertTriangle, Wifi, WifiOff, Smartphone } from 'lucide-react'
import { useToast } from '../../../contexts/ToastContext'
import { testarConexao, hasAndroidBridge, type ModoConexao, type ConfigBridge } from '../../../utils/elginBridge'
import { ESCPOSBuilder } from '../../../utils/escpos'

const STORAGE_KEY = 'meupdv_impressoras'

type TipoImpressora = 'cupom' | 'a4' | 'etiqueta' | 'embarcada'

interface Impressora {
  id: string
  nome: string
  tipo: TipoImpressora
  larguraMm: number
  margemMm: number
  fonteSizePx: number
  ativa: boolean
  padrao: boolean
  imprimirAutomatico: boolean
  copias: number
  bridge?: ConfigBridge
}

const PRESETS: Record<TipoImpressora, { larguraMm: number; margemMm: number; fonteSizePx: number }> = {
  cupom: { larguraMm: 80, margemMm: 2, fonteSizePx: 11 },
  a4: { larguraMm: 210, margemMm: 10, fonteSizePx: 12 },
  etiqueta: { larguraMm: 60, margemMm: 2, fonteSizePx: 9 },
  embarcada: { larguraMm: 80, margemMm: 0, fonteSizePx: 11 },
}

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function criarImpressora(nome = '', tipo: TipoImpressora = 'cupom'): Impressora {
  const preset = PRESETS[tipo]
  const imp: Impressora = {
    id: gerarId(),
    nome,
    tipo,
    larguraMm: preset.larguraMm,
    margemMm: preset.margemMm,
    fonteSizePx: preset.fonteSizePx,
    ativa: true,
    padrao: false,
    imprimirAutomatico: false,
    copias: 1,
  }
  if (tipo === 'embarcada') {
    imp.bridge = {
      modo: hasAndroidBridge() ? 'android-bridge' : 'http-local',
      httpUrl: 'http://localhost:9100',
      httpEndpoint: '/print',
    }
  }
  return imp
}

function loadImpressoras(): Impressora[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return []
}

export function ImpressorasPage() {
  const { sucesso, erro } = useToast()
  const [impressoras, setImpressoras] = useState<Impressora[]>(loadImpressoras)
  const [editId, setEditId] = useState<string | null>(null)
  const [showNova, setShowNova] = useState(false)
  const [novaImpressora, setNovaImpressora] = useState<Impressora>(() => criarImpressora())
  const [loading, setLoading] = useState(false)

  // Detectar impressoras via browser (experimental)
  const [impressorasDetectadas, setImpressorasDetectadas] = useState<string[]>([])
  const [, setDetectando] = useState(false)

  const detectarImpressoras = useCallback(async () => {
    setDetectando(true)
    try {
      // Tentativa 1: Usando a API experimental do Chrome (se disponível)
      // @ts-expect-error - API experimental
      if (navigator.usb) {
        // USB printers detection hint
      }

      // Na web, a forma mais confiável é abrir o diálogo de impressão
      // e deixar o usuário escolher. Vamos oferecer nomes comuns como sugestão.
      const sugestoes = [
        'Impressora Padrao do Sistema',
        'Elgin TPro (Embarcada)',
        'Elgin M8 (Embarcada)',
        'Epson TM-T20',
        'Epson TM-T88',
        'Bematech MP-4200 TH',
        'Elgin i9',
        'Daruma DR800',
        'Star TSP143',
        'Samsung M2020',
        'HP LaserJet',
        'Brother HL',
      ]
      setImpressorasDetectadas(sugestoes)
    } finally {
      setDetectando(false)
    }
  }, [])

  const handleSave = useCallback(() => {
    setLoading(true)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(impressoras))
      sucesso('Configurações de impressora salvas!')
      setEditId(null)
    } finally {
      setLoading(false)
    }
  }, [impressoras, sucesso])

  const handleAdicionarImpressora = useCallback(() => {
    if (!novaImpressora.nome.trim()) {
      erro('Informe o nome da impressora')
      return
    }
    const nova = { ...novaImpressora }
    // Se é a primeira, marcar como padrão
    if (impressoras.length === 0) nova.padrao = true
    setImpressoras(prev => [...prev, nova])
    setNovaImpressora(criarImpressora())
    setShowNova(false)
    // Salvar automaticamente
    const updated = [...impressoras, nova]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    sucesso(`Impressora "${nova.nome}" adicionada!`)
  }, [novaImpressora, impressoras, erro, sucesso])

  const handleRemover = useCallback((id: string) => {
    setImpressoras(prev => {
      const updated = prev.filter(p => p.id !== id)
      // Se removeu a padrão, tornar a primeira a padrão
      if (updated.length > 0 && !updated.some(p => p.padrao)) {
        updated[0].padrao = true
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    sucesso('Impressora removida')
  }, [sucesso])

  const handleSetPadrao = useCallback((id: string) => {
    setImpressoras(prev => {
      const updated = prev.map(p => ({ ...p, padrao: p.id === id }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const handleUpdateField = useCallback(<K extends keyof Impressora>(id: string, key: K, value: Impressora[K]) => {
    setImpressoras(prev => prev.map(p => {
      if (p.id !== id) return p
      const updated = { ...p, [key]: value }
      // Ao trocar tipo, aplicar preset
      if (key === 'tipo') {
        const preset = PRESETS[value as TipoImpressora]
        updated.larguraMm = preset.larguraMm
        updated.margemMm = preset.margemMm
        updated.fonteSizePx = preset.fonteSizePx
      }
      return updated
    }))
  }, [])

  // Estado do teste de conexao da embarcada
  const [testeBridge, setTesteBridge] = useState<{ ok: boolean; modo: string; mensagem: string } | null>(null)
  const [testando, setTestando] = useState(false)

  const handleTestarBridge = useCallback(async () => {
    setTestando(true)
    const resultado = await testarConexao()
    setTesteBridge(resultado)
    setTestando(false)
    if (resultado.ok) {
      sucesso(`Impressora conectada via ${resultado.modo}`)
    } else {
      erro(resultado.mensagem)
    }
  }, [sucesso, erro])

  const handleTesteImpressao = useCallback(async (impressora: Impressora) => {
    // Para impressora embarcada, envia ESC/POS direto
    if (impressora.tipo === 'embarcada') {
      const { imprimirEmbarcada } = await import('../../../utils/elginBridge')
      const colunas = impressora.larguraMm >= 72 ? 48 : 32
      const b = new ESCPOSBuilder(colunas)
      b.align('center').bold().fontSize('double').text('TESTE DE IMPRESSAO').fontSize('normal').bold(false)
      b.text('MeuPDV - Sistema de Vendas')
      b.separator('=')
      b.align('left')
      b.text(`Impressora: ${impressora.nome}`)
      b.text(`Tipo: Embarcada (ESC/POS)`)
      b.text(`Colunas: ${colunas}`)
      b.separator('-')
      b.text('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
      b.text('abcdefghijklmnopqrstuvwxyz')
      b.text('0123456789')
      b.separator('-')
      b.bold()
      b.textLeftRight('Produto 1', 'R$ 10,00')
      b.textLeftRight('Produto 2', 'R$ 25,50')
      b.separator('=')
      b.fontSize('double-h').textLeftRight('TOTAL:', 'R$ 35,50').fontSize('normal')
      b.bold(false)
      b.separator('-')
      b.align('center').text('Teste realizado com sucesso!')
      b.text(new Date().toLocaleString('pt-BR'))
      b.feedAndCut()

      const ok = await imprimirEmbarcada(b.build())
      if (ok) {
        sucesso('Teste enviado para a impressora!')
      } else {
        erro('Falha ao enviar teste. Verifique a conexao.')
      }
      return
    }

    // Para impressora convencional, usa iframe
    const larguraPx = impressora.tipo === 'cupom'
      ? Math.round((impressora.larguraMm / 25.4) * 72)
      : undefined

    const conteudo = `
      <html>
      <head>
        <title>Teste de Impressao - ${impressora.nome}</title>
        <style>
          @page {
            size: ${impressora.larguraMm}mm auto;
            margin: ${impressora.margemMm}mm;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: ${impressora.fonteSizePx}px;
            ${larguraPx ? `width: ${larguraPx}px;` : ''}
            margin: 0 auto;
          }
          .linha { border-top: 1px dashed #000; margin: 6px 0; }
          .centro { text-align: center; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="centro bold">TESTE DE IMPRESSAO</div>
        <div class="centro">MeuPDV - Sistema de Vendas</div>
        <div class="linha"></div>
        <div>Impressora: ${impressora.nome}</div>
        <div>Tipo: ${impressora.tipo === 'cupom' ? 'Cupom Termica' : impressora.tipo === 'a4' ? 'A4 Normal' : 'Etiqueta'}</div>
        <div>Largura: ${impressora.larguraMm}mm</div>
        <div>Margem: ${impressora.margemMm}mm</div>
        <div>Fonte: ${impressora.fonteSizePx}px</div>
        <div class="linha"></div>
        <div>ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>
        <div>abcdefghijklmnopqrstuvwxyz</div>
        <div>0123456789</div>
        <div class="linha"></div>
        <div class="centro bold">Produto 1............R$ 10,00</div>
        <div class="centro bold">Produto 2............R$ 25,50</div>
        <div class="centro bold">TOTAL................R$ 35,50</div>
        <div class="linha"></div>
        <div class="centro">Teste realizado com sucesso!</div>
        <div class="centro">${new Date().toLocaleString('pt-BR')}</div>
      </body>
      </html>
    `

    const FRAME_ID = 'meupdv-print-test'
    let iframe = document.getElementById(FRAME_ID) as HTMLIFrameElement | null
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.id = FRAME_ID
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;'
      document.body.appendChild(iframe)
    }
    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(conteudo)
      doc.close()
      setTimeout(() => iframe!.contentWindow?.print(), 300)
    }
  }, [sucesso, erro])

  const tipoLabel = (tipo: TipoImpressora) => {
    switch (tipo) {
      case 'cupom': return 'Cupom / Termica'
      case 'a4': return 'A4 / Comum'
      case 'etiqueta': return 'Etiqueta'
      case 'embarcada': return 'Embarcada (ESC/POS)'
    }
  }

  const tipoColor = (tipo: TipoImpressora) => {
    switch (tipo) {
      case 'cupom': return 'bg-amber-100 text-amber-700'
      case 'a4': return 'bg-blue-100 text-blue-700'
      case 'etiqueta': return 'bg-green-100 text-green-700'
      case 'embarcada': return 'bg-violet-100 text-violet-700'
    }
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Printer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Impressoras</h1>
              <p className="text-sm text-text-secondary">Configure suas impressoras para cupom, A4 e etiquetas.</p>
            </div>
          </div>
          <button
            onClick={() => { setShowNova(true); detectarImpressoras() }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> Nova
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Como funciona a impressao</p>
            <p className="mt-1 text-blue-600">
              <b>Impressoras comuns:</b> O sistema usa o dialogo de impressao do navegador.
              Configure o formato (cupom, A4, etiqueta) e o navegador lembra a ultima impressora selecionada.
            </p>
            <p className="mt-1 text-blue-600">
              <b>Impressoras embarcadas (Elgin TPro, M8, etc):</b> O sistema envia comandos ESC/POS
              direto para a impressora, sem dialogo do navegador. Escolha o tipo "Embarcada" ao adicionar.
            </p>
          </div>
        </div>

        {/* Lista de impressoras */}
        {impressoras.length === 0 && !showNova && (
          <div className="mt-8 text-center py-12 rounded-xl border-2 border-dashed border-gray-200">
            <Printer className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma impressora configurada</p>
            <p className="text-sm text-gray-400 mt-1">Clique em "Nova" para adicionar sua primeira impressora.</p>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {impressoras.map(imp => (
            <div
              key={imp.id}
              className={`rounded-xl border bg-white shadow-card overflow-hidden transition-all ${
                imp.padrao ? 'border-primary/30 ring-1 ring-primary/10' : 'border-gray-200'
              }`}
            >
              {/* Header da impressora */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    imp.ativa ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{imp.nome}</span>
                      {imp.padrao && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          PADRAO
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tipoColor(imp.tipo)}`}>
                        {tipoLabel(imp.tipo)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {imp.larguraMm}mm | Fonte {imp.fonteSizePx}px | {imp.copias} {imp.copias === 1 ? 'copia' : 'copias'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleTesteImpressao(imp)}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Imprimir pagina de teste"
                  >
                    <TestTube className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditId(editId === imp.id ? null : imp.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors"
                    title="Editar"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRemover(imp.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Painel de edição expandido */}
              {editId === imp.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50/50 space-y-4 animate-fade-in">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Nome</label>
                      <input
                        type="text"
                        value={imp.nome}
                        onChange={e => handleUpdateField(imp.id, 'nome', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Tipo</label>
                      <select
                        value={imp.tipo}
                        onChange={e => handleUpdateField(imp.id, 'tipo', e.target.value as TipoImpressora)}
                        className="input-field"
                      >
                        <option value="cupom">Cupom / Termica</option>
                        <option value="a4">A4 / Comum</option>
                        <option value="etiqueta">Etiqueta</option>
                        <option value="embarcada">Embarcada (ESC/POS)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Largura do papel (mm)</label>
                      <input
                        type="number"
                        min="20"
                        max="300"
                        value={imp.larguraMm}
                        onChange={e => handleUpdateField(imp.id, 'larguraMm', Number(e.target.value))}
                        className="input-field"
                      />
                      <p className="mt-1 text-xs text-text-muted">
                        Cupom: 58mm ou 80mm | A4: 210mm | Etiqueta: 40-100mm
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Margem (mm)</label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={imp.margemMm}
                        onChange={e => handleUpdateField(imp.id, 'margemMm', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Tamanho da fonte (px)</label>
                      <input
                        type="number"
                        min="6"
                        max="20"
                        value={imp.fonteSizePx}
                        onChange={e => handleUpdateField(imp.id, 'fonteSizePx', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Copias por impressao</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={imp.copias}
                        onChange={e => handleUpdateField(imp.id, 'copias', Number(e.target.value))}
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* Configuracao de bridge para embarcada */}
                  {imp.tipo === 'embarcada' && (
                    <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-violet-700">
                        <Smartphone className="h-4 w-4" />
                        Configuracao da Impressora Embarcada
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-text-primary">Modo de conexao</label>
                          <select
                            value={imp.bridge?.modo || 'http-local'}
                            onChange={e => {
                              const bridge: ConfigBridge = {
                                ...(imp.bridge || { httpUrl: 'http://localhost:9100', httpEndpoint: '/print' }),
                                modo: e.target.value as ModoConexao,
                              }
                              handleUpdateField(imp.id, 'bridge' as keyof Impressora, bridge as never)
                            }}
                            className="input-field text-sm"
                          >
                            <option value="android-bridge">Android Bridge (WebView)</option>
                            <option value="http-local">HTTP Local (servico bridge)</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-text-primary">Colunas</label>
                          <select
                            value={imp.larguraMm >= 72 ? '80' : '58'}
                            onChange={e => handleUpdateField(imp.id, 'larguraMm', e.target.value === '80' ? 80 : 58)}
                            className="input-field text-sm"
                          >
                            <option value="80">80mm (48 colunas)</option>
                            <option value="58">58mm (32 colunas)</option>
                          </select>
                        </div>
                      </div>
                      {imp.bridge?.modo === 'http-local' && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-text-primary">URL do servico</label>
                            <input
                              type="text"
                              value={imp.bridge?.httpUrl || 'http://localhost:9100'}
                              onChange={e => {
                                const bridge: ConfigBridge = { ...imp.bridge!, httpUrl: e.target.value }
                                handleUpdateField(imp.id, 'bridge' as keyof Impressora, bridge as never)
                              }}
                              className="input-field text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-text-primary">Endpoint</label>
                            <input
                              type="text"
                              value={imp.bridge?.httpEndpoint || '/print'}
                              onChange={e => {
                                const bridge: ConfigBridge = { ...imp.bridge!, httpEndpoint: e.target.value }
                                handleUpdateField(imp.id, 'bridge' as keyof Impressora, bridge as never)
                              }}
                              className="input-field text-sm"
                            />
                          </div>
                        </div>
                      )}
                      <button
                        onClick={handleTestarBridge}
                        disabled={testando}
                        className="inline-flex items-center gap-2 rounded-lg bg-violet-100 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-200 transition-colors disabled:opacity-50"
                      >
                        {testando ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                        ) : testeBridge?.ok ? (
                          <Wifi className="h-4 w-4" />
                        ) : (
                          <WifiOff className="h-4 w-4" />
                        )}
                        Testar Conexao
                      </button>
                      {testeBridge && (
                        <div className={`text-xs rounded-lg p-2 ${testeBridge.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          <b>{testeBridge.modo}:</b> {testeBridge.mensagem}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={imp.ativa}
                        onChange={e => handleUpdateField(imp.id, 'ativa', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">Ativa</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={imp.imprimirAutomatico}
                        onChange={e => handleUpdateField(imp.id, 'imprimirAutomatico', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">Imprimir automaticamente ao finalizar venda</span>
                    </label>
                    {!imp.padrao && (
                      <button
                        onClick={() => handleSetPadrao(imp.id)}
                        className="text-sm text-primary font-medium hover:underline"
                      >
                        Definir como padrao
                      </button>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setEditId(null)} className="btn-secondary text-sm py-1.5 px-3">
                      <X className="h-3.5 w-3.5" /> Fechar
                    </button>
                    <button onClick={handleSave} disabled={loading} className="btn-primary text-sm py-1.5 px-3">
                      <Save className="h-3.5 w-3.5" /> Salvar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Nova Impressora */}
        {showNova && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Nova Impressora</h3>
                    <p className="text-sm text-gray-500">Configure os dados da impressora.</p>
                  </div>
                </div>

                {/* Sugestões de impressoras */}
                {impressorasDetectadas.length > 0 && (
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-text-primary">Selecione ou digite o nome:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {impressorasDetectadas.map(nome => (
                        <button
                          key={nome}
                          onClick={() => setNovaImpressora(prev => ({ ...prev, nome }))}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${
                            novaImpressora.nome === nome
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-200 text-gray-600 hover:border-primary/30 hover:bg-primary/5'
                          }`}
                        >
                          {nome}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">Nome da impressora</label>
                    <input
                      type="text"
                      value={novaImpressora.nome}
                      onChange={e => setNovaImpressora(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Epson TM-T20, HP LaserJet..."
                      className="input-field"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-text-primary">Tipo</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { value: 'cupom' as const, label: 'Cupom / Termica', desc: 'Impressoras termicas 58mm ou 80mm' },
                        { value: 'a4' as const, label: 'A4 / Comum', desc: 'Impressoras jato de tinta ou laser' },
                        { value: 'etiqueta' as const, label: 'Etiqueta', desc: 'Impressoras de etiquetas' },
                        { value: 'embarcada' as const, label: 'Embarcada', desc: 'Elgin TPro, M8 ou similar (ESC/POS direto)' },
                      ]).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            const preset = PRESETS[opt.value]
                            setNovaImpressora(prev => ({ ...prev, tipo: opt.value, ...preset }))
                          }}
                          className={`rounded-xl border-2 p-3 text-left transition-all ${
                            novaImpressora.tipo === opt.value
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-sm font-semibold text-gray-800">{opt.label}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Largura (mm)</label>
                      <input
                        type="number"
                        value={novaImpressora.larguraMm}
                        onChange={e => setNovaImpressora(prev => ({ ...prev, larguraMm: Number(e.target.value) }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Margem (mm)</label>
                      <input
                        type="number"
                        value={novaImpressora.margemMm}
                        onChange={e => setNovaImpressora(prev => ({ ...prev, margemMm: Number(e.target.value) }))}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-primary">Fonte (px)</label>
                      <input
                        type="number"
                        value={novaImpressora.fonteSizePx}
                        onChange={e => setNovaImpressora(prev => ({ ...prev, fonteSizePx: Number(e.target.value) }))}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={novaImpressora.imprimirAutomatico}
                        onChange={e => setNovaImpressora(prev => ({ ...prev, imprimirAutomatico: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">Imprimir automaticamente ao finalizar venda</span>
                    </label>
                  </div>

                  {novaImpressora.tipo === 'cupom' && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">
                        Para impressoras termicas, configure a largura correta do papel (58mm ou 80mm).
                        No dialogo de impressao do sistema, desmarque cabecalhos/rodapes e ajuste as margens para "minimo".
                      </p>
                    </div>
                  )}

                  {novaImpressora.tipo === 'embarcada' && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 rounded-lg bg-violet-50 border border-violet-200 p-3">
                        <Smartphone className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-violet-700">
                          <p className="font-medium mb-1">Impressora embarcada (Elgin TPro, M8, etc)</p>
                          <p>
                            A impressao sera enviada via comandos ESC/POS direto para a impressora,
                            sem o dialogo do navegador. O sistema tenta conectar via:
                          </p>
                          <ul className="mt-1 ml-3 list-disc space-y-0.5">
                            <li><b>Android Bridge</b> - Se o app roda em WebView com interface nativa</li>
                            <li><b>HTTP Local</b> - Se existe um servico bridge rodando no dispositivo</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-text-primary">Modo de conexao</label>
                        <select
                          value={novaImpressora.bridge?.modo || 'http-local'}
                          onChange={e => setNovaImpressora(prev => ({
                            ...prev,
                            bridge: { ...prev.bridge!, modo: e.target.value as ModoConexao }
                          }))}
                          className="input-field"
                        >
                          <option value="android-bridge">Android Bridge (WebView)</option>
                          <option value="http-local">HTTP Local (servico bridge)</option>
                        </select>
                      </div>

                      {(novaImpressora.bridge?.modo === 'http-local') && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">URL do servico</label>
                            <input
                              type="text"
                              value={novaImpressora.bridge?.httpUrl || 'http://localhost:9100'}
                              onChange={e => setNovaImpressora(prev => ({
                                ...prev,
                                bridge: { ...prev.bridge!, httpUrl: e.target.value }
                              }))}
                              placeholder="http://localhost:9100"
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-text-primary">Endpoint</label>
                            <input
                              type="text"
                              value={novaImpressora.bridge?.httpEndpoint || '/print'}
                              onChange={e => setNovaImpressora(prev => ({
                                ...prev,
                                bridge: { ...prev.bridge!, httpEndpoint: e.target.value }
                              }))}
                              placeholder="/print"
                              className="input-field"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="mb-1 block text-sm font-medium text-text-primary">Colunas</label>
                        <select
                          value={novaImpressora.larguraMm >= 72 ? '80' : '58'}
                          onChange={e => setNovaImpressora(prev => ({
                            ...prev,
                            larguraMm: e.target.value === '80' ? 80 : 58
                          }))}
                          className="input-field"
                        >
                          <option value="80">80mm (48 colunas)</option>
                          <option value="58">58mm (32 colunas)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => { setShowNova(false); setNovaImpressora(criarImpressora()) }}
                    className="btn-secondary flex-1"
                  >
                    <X className="h-4 w-4" /> Cancelar
                  </button>
                  <button onClick={handleAdicionarImpressora} className="btn-primary flex-1">
                    <Plus className="h-4 w-4" /> Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botões salvar/cancelar globais */}
        {impressoras.length > 0 && (
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setImpressoras(loadImpressoras())} className="btn-secondary">
              <X className="h-4 w-4" /> Cancelar
            </button>
            <button onClick={handleSave} disabled={loading} className="btn-primary">
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
