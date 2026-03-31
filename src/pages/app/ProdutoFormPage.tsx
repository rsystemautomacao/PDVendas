import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Scale, AlertCircle } from 'lucide-react'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useToast } from '../../contexts/ToastContext'
import { sanitize } from '../../utils/helpers'

const UNIDADES = ['UN', 'KG', 'L', 'CX', 'M', 'PCT'] as const

export function ProdutoFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { getProduto, adicionarProduto, atualizarProduto } = useProdutos()
  const toast = useToast()

  const isEdit = !!id && id !== 'novo'
  const locationState = location.state as { codigoBarras?: string; returnTo?: string } | null

  const [nome, setNome] = useState('')
  const [codigo, setCodigo] = useState('')
  const [codigoBarras, setCodigoBarras] = useState('')
  const [tipo, setTipo] = useState<'produto' | 'servico'>('produto')
  const [modoVenda, setModoVenda] = useState<'normal' | 'balanca'>('normal')
  const [preco, setPreco] = useState('')
  const [precoCusto, setPrecoCusto] = useState('')
  const [estoque, setEstoque] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('0')
  const [unidade, setUnidade] = useState<typeof UNIDADES[number]>('UN')
  const [grupo, setGrupo] = useState('')
  const [marca, setMarca] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [observacoes, setObservacoes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Load existing product if editing
  useEffect(() => {
    if (isEdit && id) {
      const produto = getProduto(id)
      if (produto) {
        setNome(produto.nome)
        setCodigo(produto.codigo)
        setCodigoBarras(produto.codigoBarras || '')
        setTipo(produto.tipo)
        setModoVenda(produto.modoVenda || 'normal')
        setPreco(String(produto.preco))
        setPrecoCusto(String(produto.precoCusto || ''))
        setEstoque(String(produto.estoque))
        setEstoqueMinimo(String(produto.estoqueMinimo))
        setUnidade(produto.unidade)
        setGrupo(produto.grupo || '')
        setMarca(produto.marca || '')
        setFornecedor(produto.fornecedor || '')
        setAtivo(produto.ativo)
        setObservacoes(produto.observacoes || '')
      } else {
        toast.erro('Produto nao encontrado')
        navigate(locationState?.returnTo || '/app/produtos')
      }
    }
  }, [isEdit, id, getProduto, navigate, toast])

  // Pre-fill barcode from PDV navigation state
  useEffect(() => {
    if (!isEdit && locationState?.codigoBarras) {
      setCodigoBarras(locationState.codigoBarras)
    }
  }, [isEdit, locationState])

  // Auto-set unidade para KG quando modo balanca
  useEffect(() => {
    if (modoVenda === 'balanca') {
      setUnidade('KG')
    }
  }, [modoVenda])

  // Handler do codigo de barras: limita a 7 digitos no modo balanca
  const handleCodigoBarrasChange = useCallback((value: string) => {
    if (modoVenda === 'balanca') {
      // Apenas digitos, max 7
      const clean = value.replace(/\D/g, '').substring(0, 7)
      setCodigoBarras(clean)
    } else {
      setCodigoBarras(value)
    }
  }, [modoVenda])

  const validate = useCallback(() => {
    const next: Record<string, string> = {}
    if (!nome.trim()) next.nome = 'Nome e obrigatorio'
    if (!preco || parseFloat(preco) <= 0) next.preco = 'Preco e obrigatorio'
    if (modoVenda === 'balanca' && !codigoBarras.trim()) {
      next.codigoBarras = 'Codigo PLU e obrigatorio para produtos de balanca'
    }
    if (modoVenda === 'balanca' && codigoBarras.trim() && codigoBarras.trim().length !== 7) {
      next.codigoBarras = 'Codigo PLU deve ter exatamente 7 digitos'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }, [nome, preco, modoVenda, codigoBarras])

  const handleSave = useCallback(() => {
    if (!validate()) return
    setLoading(true)

    const data = {
      nome: sanitize(nome.trim()),
      codigo: codigo.trim() || String(Date.now()).slice(-6),
      codigoBarras: codigoBarras.trim() || undefined,
      tipo,
      modoVenda,
      preco: parseFloat(preco) || 0,
      precoCusto: precoCusto ? parseFloat(precoCusto) : undefined,
      estoque: parseInt(estoque) || 0,
      estoqueMinimo: parseInt(estoqueMinimo) || 0,
      unidade,
      grupo: grupo.trim() || undefined,
      marca: marca.trim() || undefined,
      fornecedor: fornecedor.trim() || undefined,
      ativo,
      observacoes: observacoes.trim() || undefined,
    }

    if (isEdit && id) {
      atualizarProduto(id, data)
    } else {
      adicionarProduto(data as Parameters<typeof adicionarProduto>[0])
    }

    setLoading(false)
    navigate(locationState?.returnTo || '/app/produtos')
  }, [nome, codigo, codigoBarras, tipo, modoVenda, preco, precoCusto, estoque, estoqueMinimo, unidade, grupo, marca, fornecedor, ativo, observacoes, isEdit, id, validate, adicionarProduto, atualizarProduto, navigate])

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(locationState?.returnTo || '/app/produtos')} className="btn-ghost p-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            {isEdit ? 'Editar Produto' : 'Novo Produto / Servico'}
          </h1>
        </div>

        <div className="card p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Nome */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nome *</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Nome do produto ou servico" className={`input-field ${errors.nome ? 'border-red-500' : ''}`} autoFocus />
              {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome}</p>}
            </div>

            {/* Tipo */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={tipo === 'produto'} onChange={() => setTipo('produto')}
                    className="text-primary focus:ring-primary" />
                  <span className="text-sm">Produto</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={tipo === 'servico'} onChange={() => { setTipo('servico'); setModoVenda('normal') }}
                    className="text-primary focus:ring-primary" />
                  <span className="text-sm">Servico</span>
                </label>
              </div>
            </div>

            {/* Modo Venda (apenas para produto) */}
            {tipo === 'produto' && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Modo de Venda</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={modoVenda === 'normal'} onChange={() => setModoVenda('normal')}
                      className="text-primary focus:ring-primary" />
                    <span className="text-sm">Codigo padrao</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={modoVenda === 'balanca'} onChange={() => setModoVenda('balanca')}
                      className="text-primary focus:ring-primary" />
                    <Scale className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">Balanca</span>
                  </label>
                </div>
              </div>
            )}

            {/* Balanca info box */}
            {modoVenda === 'balanca' && tipo === 'produto' && (
              <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Produto de Balanca</p>
                    <p>Cadastre apenas os 7 primeiros digitos do codigo de barras (PLU). Quando a balanca gerar o codigo completo (13 digitos), o PDV extrai automaticamente o valor total da etiqueta.</p>
                    <p className="mt-1 text-xs text-amber-600">Formato da etiqueta: 2PPPPP + VVVVV + D (P=PLU, V=valor em centavos, D=verificador)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Codigo */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Codigo</label>
              <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)}
                placeholder="Codigo interno (auto se vazio)" className="input-field" />
            </div>

            {/* Codigo de barras / PLU */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                {modoVenda === 'balanca' ? 'Codigo PLU da Balanca * (7 digitos)' : 'Codigo de Barras'}
              </label>
              <input type="text" value={codigoBarras} onChange={e => handleCodigoBarrasChange(e.target.value)}
                placeholder={modoVenda === 'balanca' ? 'Ex: 2124900' : 'EAN/GTIN'}
                maxLength={modoVenda === 'balanca' ? 7 : undefined}
                className={`input-field ${errors.codigoBarras ? 'border-red-500' : ''}`} />
              {errors.codigoBarras && <p className="text-xs text-red-500 mt-1">{errors.codigoBarras}</p>}
              {modoVenda === 'balanca' && codigoBarras.length > 0 && codigoBarras.length < 7 && (
                <p className="text-xs text-amber-500 mt-1">{codigoBarras.length}/7 digitos</p>
              )}
              {modoVenda === 'balanca' && codigoBarras.length === 7 && (
                <p className="text-xs text-green-600 mt-1">PLU completo</p>
              )}
            </div>

            {/* Preco */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Preco de Venda *</label>
              <input type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)}
                placeholder="0.00" className={`input-field ${errors.preco ? 'border-red-500' : ''}`} />
              {errors.preco && <p className="text-xs text-red-500 mt-1">{errors.preco}</p>}
            </div>

            {/* Preco Custo */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Preco de Custo</label>
              <input type="number" step="0.01" value={precoCusto} onChange={e => setPrecoCusto(e.target.value)}
                placeholder="0.00" className="input-field" />
            </div>

            {tipo === 'produto' && (
              <>
                {/* Estoque */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Estoque Atual</label>
                  <input type="number" value={estoque} onChange={e => setEstoque(e.target.value)}
                    placeholder="0" className="input-field" />
                </div>

                {/* Estoque Minimo */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Estoque Minimo</label>
                  <input type="number" value={estoqueMinimo} onChange={e => setEstoqueMinimo(e.target.value)}
                    placeholder="0" className="input-field" />
                </div>

                {/* Unidade */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Unidade</label>
                  <select value={unidade} onChange={e => setUnidade(e.target.value as typeof unidade)} className="input-field">
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Grupo */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Grupo</label>
              <input type="text" value={grupo} onChange={e => setGrupo(e.target.value)}
                placeholder="Ex: Bebidas, Alimentos" className="input-field" />
            </div>

            {/* Marca */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Marca</label>
              <input type="text" value={marca} onChange={e => setMarca(e.target.value)}
                placeholder="Marca do produto" className="input-field" />
            </div>

            {/* Fornecedor */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Fornecedor</label>
              <input type="text" value={fornecedor} onChange={e => setFornecedor(e.target.value)}
                placeholder="Fornecedor" className="input-field" />
            </div>

            {/* Status */}
            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative w-11 h-6 rounded-full transition-colors ${ativo ? 'bg-primary' : 'bg-gray-300'}`}
                  onClick={() => setAtivo(!ativo)}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${ativo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{ativo ? 'Ativo' : 'Inativo'}</span>
              </label>
            </div>

            {/* Observacoes */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Observacoes</label>
              <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
                placeholder="Observacoes sobre o produto" rows={3} className="input-field resize-none" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={() => navigate(locationState?.returnTo || '/app/produtos')} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary">
            {loading ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Cadastrar Produto'}
          </button>
        </div>
      </div>
    </div>
  )
}
