import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useFinanceiro } from '../../contexts/FinanceiroContext'
import { useToast } from '../../contexts/ToastContext'

export function DespesaFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { getDespesa, addDespesa, updateDespesa } = useFinanceiro()
  const toast = useToast()

  const isEdit = !!id && id !== 'novo'

  const [nome, setNome] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [tipo, setTipo] = useState<'fixa' | 'variavel'>('variavel')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [pago, setPago] = useState(false)
  const [observacoes, setObservacoes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit && id) {
      const despesa = getDespesa(id)
      if (despesa) {
        setNome(despesa.nome)
        setFornecedor(despesa.fornecedor || '')
        setTipo(despesa.tipo)
        setValor(String(despesa.valor))
        setVencimento(despesa.vencimento)
        setPago(despesa.pago)
        setObservacoes(despesa.observacoes || '')
      } else {
        toast.erro('Despesa nao encontrada')
        navigate('/app/despesas')
      }
    }
  }, [isEdit, id, getDespesa, navigate, toast])

  const validate = useCallback(() => {
    const next: Record<string, string> = {}
    if (!nome.trim()) next.nome = 'Nome e obrigatorio'
    if (!valor || parseFloat(valor) <= 0) next.valor = 'Valor e obrigatorio'
    if (!vencimento) next.vencimento = 'Vencimento e obrigatorio'
    setErrors(next)
    return Object.keys(next).length === 0
  }, [nome, valor, vencimento])

  const handleSave = useCallback(() => {
    if (!validate()) return
    setLoading(true)

    const data = {
      nome: nome.trim(),
      fornecedor: fornecedor.trim() || undefined,
      tipo,
      valor: parseFloat(valor) || 0,
      vencimento,
      pago,
      pagoEm: pago ? new Date().toISOString().substring(0, 10) : undefined,
      observacoes: observacoes.trim() || undefined,
    }

    if (isEdit && id) {
      updateDespesa(id, data)
    } else {
      addDespesa(data)
    }

    setLoading(false)
    navigate('/app/despesas')
  }, [nome, fornecedor, tipo, valor, vencimento, pago, observacoes, isEdit, id, validate, addDespesa, updateDespesa, navigate])

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/app/despesas')} className="btn-ghost p-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            {isEdit ? 'Editar Despesa' : 'Nova Despesa'}
          </h1>
        </div>

        <div className="card p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nome *</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Ex: Aluguel, Conta de luz" className={`input-field ${errors.nome ? 'border-red-500' : ''}`} autoFocus />
              {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Fornecedor</label>
              <input type="text" value={fornecedor} onChange={e => setFornecedor(e.target.value)}
                placeholder="Nome do fornecedor" className="input-field" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as typeof tipo)} className="input-field">
                <option value="fixa">Fixa</option>
                <option value="variavel">Variavel</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Valor *</label>
              <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)}
                placeholder="0.00" className={`input-field ${errors.valor ? 'border-red-500' : ''}`} />
              {errors.valor && <p className="text-xs text-red-500 mt-1">{errors.valor}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Vencimento *</label>
              <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)}
                className={`input-field ${errors.vencimento ? 'border-red-500' : ''}`} />
              {errors.vencimento && <p className="text-xs text-red-500 mt-1">{errors.vencimento}</p>}
            </div>

            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative w-11 h-6 rounded-full transition-colors ${pago ? 'bg-green-500' : 'bg-gray-300'}`}
                  onClick={() => setPago(!pago)}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${pago ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{pago ? 'Pago' : 'Nao pago'}</span>
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Observacoes</label>
              <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
                placeholder="Observacoes" rows={3} className="input-field resize-none" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={() => navigate('/app/despesas')} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary">
            {loading ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Cadastrar Despesa'}
          </button>
        </div>
      </div>
    </div>
  )
}
