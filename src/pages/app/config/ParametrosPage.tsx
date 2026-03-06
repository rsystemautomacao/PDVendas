import { useState, useCallback } from 'react'
import { Settings, Save, X } from 'lucide-react'
import { useToast } from '../../../contexts/ToastContext'

const STORAGE_KEY = 'meupdv_parametros'

interface Parametros {
  moeda: string
  casasDecimais: string
  fusoHorario: string
  estoqueMinimoPadrao: string
  permitirEstoqueNegativo: boolean
  formatoData: string
  tema: string
}

const DEFAULT_PARAMS: Parametros = {
  moeda: 'BRL',
  casasDecimais: '2',
  fusoHorario: 'America/Sao_Paulo',
  estoqueMinimoPadrao: '5',
  permitirEstoqueNegativo: false,
  formatoData: 'DD/MM/YYYY',
  tema: 'claro',
}

function loadParams(): Parametros {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...DEFAULT_PARAMS, ...JSON.parse(saved) }
  } catch { /* ignore */ }
  return { ...DEFAULT_PARAMS }
}

export function ParametrosPage() {
  const { sucesso } = useToast()
  const [loading, setLoading] = useState(false)
  const [params, setParams] = useState<Parametros>(loadParams)

  const setParam = useCallback(<K extends keyof Parametros>(key: K, value: Parametros[K]) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(() => {
    setLoading(true)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(params))
      sucesso('Parâmetros salvos com sucesso!')
    } finally {
      setLoading(false)
    }
  }, [params, sucesso])

  const handleCancel = useCallback(() => {
    setParams(loadParams())
  }, [])

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Parâmetros</h1>
            <p className="text-sm text-text-secondary">Configurações gerais do sistema.</p>
          </div>
        </div>

        {/* Geral */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-semibold text-text-primary">Geral</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Moeda</label>
              <select value={params.moeda} onChange={(e) => setParam('moeda', e.target.value)} className="input-field">
                <option value="BRL">BRL (R$)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Casas decimais</label>
              <select value={params.casasDecimais} onChange={(e) => setParam('casasDecimais', e.target.value)} className="input-field">
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Fuso horário</label>
              <select value={params.fusoHorario} onChange={(e) => setParam('fusoHorario', e.target.value)} className="input-field">
                <option value="America/Sao_Paulo">Brasília (SP/RJ/MG)</option>
                <option value="America/Manaus">Manaus (AM)</option>
                <option value="America/Belem">Belém (PA)</option>
                <option value="America/Cuiaba">Cuiabá (MT/MS)</option>
                <option value="America/Rio_Branco">Rio Branco (AC)</option>
                <option value="America/Noronha">Fernando de Noronha</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Formato de data</label>
              <select value={params.formatoData} onChange={(e) => setParam('formatoData', e.target.value)} className="input-field">
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estoque */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-semibold text-text-primary">Estoque</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Estoque mínimo padrão</label>
              <input
                type="number"
                min="0"
                value={params.estoqueMinimoPadrao}
                onChange={(e) => setParam('estoqueMinimoPadrao', e.target.value)}
                className="input-field"
              />
              <p className="mt-1 text-xs text-text-muted">Usado ao cadastrar novos produtos.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={params.permitirEstoqueNegativo}
                  onChange={(e) => setParam('permitirEstoqueNegativo', e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/30" />
              </label>
              <div>
                <p className="text-sm font-medium text-text-primary">Permitir estoque negativo</p>
                <p className="text-xs text-text-muted">Permite vender mesmo sem estoque.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Aparência */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-semibold text-text-primary">Aparência</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Tema</label>
            <select value={params.tema} onChange={(e) => setParam('tema', e.target.value)} className="input-field max-w-xs">
              <option value="claro">Claro</option>
              <option value="escuro">Escuro (em breve)</option>
            </select>
          </div>
        </div>

        {/* Botões */}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={handleCancel} className="btn-secondary">
            <X className="h-4 w-4" /> Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={loading} className="btn-primary">
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
