import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Scale, AlertCircle, Plus, Trash2, Cpu, Shirt, Shield, Hash } from 'lucide-react'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useToast } from '../../contexts/ToastContext'
import { sanitize } from '../../utils/helpers'
import { useSegmento } from '../../hooks/useSegmento'
import type { VariacaoProduto, SerialProduto, EspecificacaoProduto } from '../../types'

const UNIDADES = ['UN', 'KG', 'L', 'CX', 'M', 'PCT'] as const
const TAMANHOS_ROUPA = ['PP', 'P', 'M', 'G', 'GG', 'EG', 'EGG'] as const
const TAMANHOS_CALCADO = ['33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44'] as const
const CORES_COMUNS = [
  'Preto', 'Branco', 'Cinza', 'Azul', 'Vermelho', 'Verde',
  'Amarelo', 'Rosa', 'Roxo', 'Laranja', 'Marrom', 'Bege',
]
const CATEGORIAS = [
  { value: '', label: 'Sem categoria' },
  { value: 'roupas', label: 'Roupas' },
  { value: 'calcados', label: 'Calcados' },
  { value: 'acessorios', label: 'Acessorios' },
  { value: 'informatica', label: 'Informatica' },
  { value: 'celulares', label: 'Celulares' },
  { value: 'eletronicos', label: 'Eletronicos' },
  { value: 'eletrodomesticos', label: 'Eletrodomesticos' },
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'bebidas', label: 'Bebidas' },
  { value: 'limpeza', label: 'Limpeza' },
  { value: 'outros', label: 'Outros' },
]

const SPECS_SUGESTOES: Record<string, string[]> = {
  informatica: ['Processador', 'Memoria RAM', 'Armazenamento', 'Tela', 'Placa de Video', 'Sistema Operacional', 'Bateria'],
  celulares: ['Processador', 'Memoria RAM', 'Armazenamento', 'Tela', 'Camera', 'Bateria', 'Sistema', 'Cor'],
  eletronicos: ['Potencia', 'Voltagem', 'Dimensoes', 'Peso', 'Conexoes'],
  eletrodomesticos: ['Potencia', 'Voltagem', 'Capacidade', 'Dimensoes', 'Peso', 'Cor'],
}

export function ProdutoFormPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { getProduto, adicionarProduto, atualizarProduto } = useProdutos()
  const toast = useToast()

  const seg = useSegmento()
  const isEdit = !!id && id !== 'novo'
  const locationState = location.state as { codigoBarras?: string; returnTo?: string } | null

  // Campos básicos
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
  const [validade, setValidade] = useState('')
  const [precoAtacado, setPrecoAtacado] = useState('')
  const [qtdMinimaAtacado, setQtdMinimaAtacado] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Novos campos
  const [categoria, setCategoria] = useState('')
  const [genero, setGenero] = useState<'' | 'masculino' | 'feminino' | 'unissex' | 'infantil'>('')
  const [material, setMaterial] = useState('')
  const [colecao, setColecao] = useState('')

  // Variações
  const [temVariacoes, setTemVariacoes] = useState(false)
  const [variacoes, setVariacoes] = useState<VariacaoProduto[]>([])
  const [tamanhosSelecionados, setTamanhosSelecionados] = useState<string[]>([])
  const [coresSelecionadas, setCoresSelecionadas] = useState<string[]>([])
  const [corCustom, setCorCustom] = useState('')
  const [tamanhoCustom, setTamanhoCustom] = useState('')

  // Seriais
  const [temSerial, setTemSerial] = useState(false)
  const [seriais, setSeriais] = useState<SerialProduto[]>([])
  const [novoSerial, setNovoSerial] = useState('')

  // Garantia
  const [garantiaMeses, setGarantiaMeses] = useState('')
  const [garantiaTipo, setGarantiaTipo] = useState<'' | 'fabricante' | 'loja' | 'estendida'>('')

  // Especificações
  const [especificacoes, setEspecificacoes] = useState<EspecificacaoProduto[]>([])

  // Aba ativa
  const [abaAtiva, setAbaAtiva] = useState<'basico' | 'variacoes' | 'serial' | 'specs'>('basico')

  const isRoupa = seg.mostrarVariacoes && (categoria === 'roupas' || categoria === 'calcados' || categoria === 'acessorios')
  const isInformatica = seg.mostrarSerial && (categoria === 'informatica' || categoria === 'celulares' || categoria === 'eletronicos' || categoria === 'eletrodomesticos')

  // Filtrar categorias e unidades conforme segmento
  const categoriasFiltradas = seg.categoriasPadrao.length > 0
    ? CATEGORIAS.filter(c => c.value === '' || c.value === 'outros' || seg.categoriasPadrao.includes(c.value))
    : CATEGORIAS
  const unidadesFiltradas = seg.unidadesPadrao.length > 0
    ? UNIDADES.filter(u => seg.unidadesPadrao.includes(u))
    : UNIDADES

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
        setValidade(produto.validade || '')
        setPrecoAtacado(produto.precoAtacado ? String(produto.precoAtacado) : '')
        setQtdMinimaAtacado(produto.qtdMinimaAtacado ? String(produto.qtdMinimaAtacado) : '')
        setCategoria(produto.categoria || '')
        setGenero(produto.genero || '')
        setMaterial(produto.material || '')
        setColecao(produto.colecao || '')
        setTemVariacoes(produto.temVariacoes || false)
        setVariacoes(produto.variacoes || [])
        setTamanhosSelecionados(produto.tamanhosPadrao || [])
        setCoresSelecionadas(produto.coresPadrao || [])
        setTemSerial(produto.temSerial || false)
        setSeriais(produto.seriais || [])
        setGarantiaMeses(String(produto.garantiaMeses || ''))
        setGarantiaTipo(produto.garantiaTipo || '')
        setEspecificacoes(produto.especificacoes || [])
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
    if (modoVenda === 'balanca') setUnidade('KG')
  }, [modoVenda])

  const handleCodigoBarrasChange = useCallback((value: string) => {
    if (modoVenda === 'balanca') {
      const clean = value.replace(/\D/g, '').substring(0, 7)
      setCodigoBarras(clean)
    } else {
      setCodigoBarras(value)
    }
  }, [modoVenda])

  // Gerar grade de variações automaticamente
  const gerarVariacoes = useCallback(() => {
    if (tamanhosSelecionados.length === 0 && coresSelecionadas.length === 0) return
    const novas: VariacaoProduto[] = []
    const tams = tamanhosSelecionados.length > 0 ? tamanhosSelecionados : ['']
    const cors = coresSelecionadas.length > 0 ? coresSelecionadas : ['']
    for (const tam of tams) {
      for (const cor of cors) {
        // Verificar se já existe
        const existe = variacoes.find(v => v.tamanho === tam && v.cor === cor)
        if (existe) {
          novas.push(existe)
        } else {
          novas.push({ tamanho: tam, cor, estoque: 0 })
        }
      }
    }
    setVariacoes(novas)
  }, [tamanhosSelecionados, coresSelecionadas, variacoes])

  const toggleTamanho = useCallback((tam: string) => {
    setTamanhosSelecionados(prev =>
      prev.includes(tam) ? prev.filter(t => t !== tam) : [...prev, tam]
    )
  }, [])

  const toggleCor = useCallback((cor: string) => {
    setCoresSelecionadas(prev =>
      prev.includes(cor) ? prev.filter(c => c !== cor) : [...prev, cor]
    )
  }, [])

  const addSerial = useCallback(() => {
    const num = novoSerial.trim()
    if (!num) return
    if (seriais.find(s => s.numero === num)) {
      toast.erro('Numero de serie ja cadastrado')
      return
    }
    setSeriais(prev => [...prev, { numero: num, status: 'disponivel' }])
    setNovoSerial('')
  }, [novoSerial, seriais, toast])

  const removeSerial = useCallback((idx: number) => {
    setSeriais(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const addEspecificacao = useCallback(() => {
    setEspecificacoes(prev => [...prev, { chave: '', valor: '' }])
  }, [])

  const updateEspecificacao = useCallback((idx: number, field: 'chave' | 'valor', val: string) => {
    setEspecificacoes(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e))
  }, [])

  const removeEspecificacao = useCallback((idx: number) => {
    setEspecificacoes(prev => prev.filter((_, i) => i !== idx))
  }, [])

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

    // Calcular estoque total baseado em variações ou seriais
    let estoqueCalc = parseInt(estoque) || 0
    if (temVariacoes && variacoes.length > 0) {
      estoqueCalc = variacoes.reduce((sum, v) => sum + (v.estoque || 0), 0)
    } else if (temSerial) {
      estoqueCalc = seriais.filter(s => s.status === 'disponivel').length
    }

    const data = {
      nome: sanitize(nome.trim()),
      codigo: codigo.trim() || String(Date.now()).slice(-6),
      codigoBarras: codigoBarras.trim() || undefined,
      tipo,
      modoVenda,
      preco: parseFloat(preco) || 0,
      precoCusto: precoCusto ? parseFloat(precoCusto) : undefined,
      estoque: estoqueCalc,
      estoqueMinimo: parseInt(estoqueMinimo) || 0,
      unidade,
      grupo: grupo.trim() || undefined,
      marca: marca.trim() || undefined,
      fornecedor: fornecedor.trim() || undefined,
      ativo,
      observacoes: observacoes.trim() || undefined,
      validade: validade || undefined,
      precoAtacado: precoAtacado ? parseFloat(precoAtacado) : undefined,
      qtdMinimaAtacado: qtdMinimaAtacado ? parseInt(qtdMinimaAtacado) : undefined,
      // Novos
      categoria: categoria || undefined,
      genero: genero || undefined,
      material: material.trim() || undefined,
      colecao: colecao.trim() || undefined,
      temVariacoes,
      variacoes: temVariacoes ? variacoes : [],
      tamanhosPadrao: temVariacoes ? tamanhosSelecionados : [],
      coresPadrao: temVariacoes ? coresSelecionadas : [],
      temSerial,
      seriais: temSerial ? seriais : [],
      garantiaMeses: garantiaMeses ? parseInt(garantiaMeses) : undefined,
      garantiaTipo: garantiaTipo || undefined,
      especificacoes: especificacoes.filter(e => e.chave && e.valor),
    }

    if (isEdit && id) {
      atualizarProduto(id, data)
    } else {
      adicionarProduto(data as Parameters<typeof adicionarProduto>[0])
    }

    setLoading(false)
    navigate(locationState?.returnTo || '/app/produtos')
  }, [nome, codigo, codigoBarras, tipo, modoVenda, preco, precoCusto, estoque, estoqueMinimo, unidade, grupo, marca, fornecedor, ativo, observacoes, categoria, genero, material, colecao, temVariacoes, variacoes, tamanhosSelecionados, coresSelecionadas, temSerial, seriais, garantiaMeses, garantiaTipo, especificacoes, isEdit, id, validate, adicionarProduto, atualizarProduto, navigate])

  const tamanhos = categoria === 'calcados' ? TAMANHOS_CALCADO : TAMANHOS_ROUPA

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

        {/* Abas */}
        <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
          {[
            { key: 'basico' as const, label: 'Dados Basicos', icon: null },
            ...(isRoupa ? [{ key: 'variacoes' as const, label: 'Variacoes', icon: Shirt }] : []),
            ...(isInformatica ? [{ key: 'serial' as const, label: 'Serial / Garantia', icon: Hash }] : []),
            ...(isInformatica || isRoupa ? [{ key: 'specs' as const, label: 'Detalhes', icon: Cpu }] : []),
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setAbaAtiva(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                abaAtiva === tab.key
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon && <tab.icon className="h-4 w-4" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ABA: Dados Básicos */}
        {abaAtiva === 'basico' && (
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

              {/* Categoria */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Categoria</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)} className="input-field">
                  {categoriasFiltradas.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Modo Venda (apenas para produto) */}
              {tipo === 'produto' && !isRoupa && !isInformatica && seg.mostrarBalanca && (
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
                      <p>Cadastre apenas os 7 primeiros digitos do codigo de barras (PLU).</p>
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

              {/* Codigo de barras */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {modoVenda === 'balanca' ? 'Codigo PLU da Balanca * (7 digitos)' : 'Codigo de Barras'}
                </label>
                <input type="text" value={codigoBarras} onChange={e => handleCodigoBarrasChange(e.target.value)}
                  placeholder={modoVenda === 'balanca' ? 'Ex: 2124900' : 'EAN/GTIN'}
                  maxLength={modoVenda === 'balanca' ? 7 : undefined}
                  className={`input-field ${errors.codigoBarras ? 'border-red-500' : ''}`} />
                {errors.codigoBarras && <p className="text-xs text-red-500 mt-1">{errors.codigoBarras}</p>}
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

              {/* Preco Atacado */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Preco Atacado</label>
                <input type="number" step="0.01" value={precoAtacado} onChange={e => setPrecoAtacado(e.target.value)}
                  placeholder="0.00" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Qtd Min. Atacado</label>
                <input type="number" min="1" value={qtdMinimaAtacado} onChange={e => setQtdMinimaAtacado(e.target.value)}
                  placeholder="Ex: 10" className="input-field" />
                <p className="text-xs text-gray-400 mt-1">Quantidade minima para preco de atacado</p>
              </div>

              {tipo === 'produto' && !temVariacoes && !temSerial && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Estoque Atual</label>
                    <input type="number" value={estoque} onChange={e => setEstoque(e.target.value)}
                      placeholder="0" className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Estoque Minimo</label>
                    <input type="number" value={estoqueMinimo} onChange={e => setEstoqueMinimo(e.target.value)}
                      placeholder="0" className="input-field" />
                  </div>
                </>
              )}

              {tipo === 'produto' && (temVariacoes || temSerial) && (
                <div className="sm:col-span-2 flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-blue-700">
                    O estoque total sera calculado automaticamente a partir {temVariacoes ? 'das variacoes' : 'dos numeros de serie'}.
                    {' '}Estoque atual: <strong>{temVariacoes ? variacoes.reduce((s, v) => s + (v.estoque || 0), 0) : seriais.filter(s => s.status === 'disponivel').length}</strong>
                  </span>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Unidade</label>
                <select value={unidade} onChange={e => setUnidade(e.target.value as typeof unidade)} className="input-field">
                  {unidadesFiltradas.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Grupo</label>
                <input type="text" value={grupo} onChange={e => setGrupo(e.target.value)}
                  placeholder="Ex: Bebidas, Camisetas" className="input-field" list="grupos-sugeridos" />
                {seg.gruposSugeridos.length > 0 && (
                  <datalist id="grupos-sugeridos">
                    {seg.gruposSugeridos.map(g => <option key={g} value={g} />)}
                  </datalist>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Marca</label>
                <input type="text" value={marca} onChange={e => setMarca(e.target.value)}
                  placeholder="Marca do produto" className="input-field" />
              </div>

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

              {/* Validade */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Validade</label>
                <input type="date" value={validade} onChange={e => setValidade(e.target.value)}
                  className="input-field" />
              </div>

              {/* Observacoes */}
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Observacoes</label>
                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
                  placeholder="Observacoes sobre o produto" rows={3} className="input-field resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* ABA: Variações (Roupas) */}
        {abaAtiva === 'variacoes' && isRoupa && (
          <div className="space-y-4">
            {/* Toggle variações */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Shirt className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Variacoes de Tamanho e Cor</h3>
                    <p className="text-xs text-gray-500">Controle estoque por combinacao tamanho/cor</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${temVariacoes ? 'bg-primary' : 'bg-gray-300'}`}
                    onClick={() => setTemVariacoes(!temVariacoes)}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${temVariacoes ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              </div>

              {temVariacoes && (
                <div className="space-y-5">
                  {/* Genero */}
                  {seg.mostrarGenero && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Genero</label>
                    <div className="flex flex-wrap gap-2">
                      {['masculino', 'feminino', 'unissex', 'infantil'].map(g => (
                        <button key={g} onClick={() => setGenero(g as typeof genero)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors capitalize ${
                            genero === g ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:border-primary/30'
                          }`}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Tamanhos */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Tamanhos</label>
                    <div className="flex flex-wrap gap-1.5">
                      {tamanhos.map(tam => (
                        <button key={tam} onClick={() => toggleTamanho(tam)}
                          className={`rounded-lg w-12 h-10 text-sm font-bold border transition-colors ${
                            tamanhosSelecionados.includes(tam)
                              ? 'border-primary bg-primary text-white'
                              : 'border-gray-200 text-gray-600 hover:border-primary/30'
                          }`}>
                          {tam}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input type="text" value={tamanhoCustom} onChange={e => setTamanhoCustom(e.target.value)}
                        placeholder="Tamanho personalizado" className="input-field flex-1 text-sm" />
                      <button onClick={() => {
                        if (tamanhoCustom.trim() && !tamanhosSelecionados.includes(tamanhoCustom.trim())) {
                          setTamanhosSelecionados(prev => [...prev, tamanhoCustom.trim()])
                          setTamanhoCustom('')
                        }
                      }} className="btn-secondary text-sm px-3">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Cores */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Cores</label>
                    <div className="flex flex-wrap gap-1.5">
                      {CORES_COMUNS.map(cor => (
                        <button key={cor} onClick={() => toggleCor(cor)}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
                            coresSelecionadas.includes(cor)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-gray-200 text-gray-600 hover:border-primary/30'
                          }`}>
                          {cor}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input type="text" value={corCustom} onChange={e => setCorCustom(e.target.value)}
                        placeholder="Cor personalizada" className="input-field flex-1 text-sm" />
                      <button onClick={() => {
                        if (corCustom.trim() && !coresSelecionadas.includes(corCustom.trim())) {
                          setCoresSelecionadas(prev => [...prev, corCustom.trim()])
                          setCorCustom('')
                        }
                      }} className="btn-secondary text-sm px-3">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Material e coleção */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Material / Composicao</label>
                      <input type="text" value={material} onChange={e => setMaterial(e.target.value)}
                        placeholder="Ex: 100% Algodao" className="input-field" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Colecao</label>
                      <input type="text" value={colecao} onChange={e => setColecao(e.target.value)}
                        placeholder="Ex: Verao 2026" className="input-field" />
                    </div>
                  </div>

                  {/* Botão gerar grade */}
                  <button onClick={gerarVariacoes} className="btn-primary w-full" disabled={tamanhosSelecionados.length === 0 && coresSelecionadas.length === 0}>
                    <Plus className="h-4 w-4" /> Gerar Grade de Variacoes
                  </button>

                  {/* Grade de variações */}
                  {variacoes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Grade ({variacoes.length} {variacoes.length === 1 ? 'variacao' : 'variacoes'}) - Estoque Total: {variacoes.reduce((s, v) => s + (v.estoque || 0), 0)}
                      </h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              {tamanhosSelecionados.length > 0 && <th className="px-3 py-2 text-left font-medium text-gray-600">Tamanho</th>}
                              {coresSelecionadas.length > 0 && <th className="px-3 py-2 text-left font-medium text-gray-600">Cor</th>}
                              <th className="px-3 py-2 text-left font-medium text-gray-600">SKU</th>
                              <th className="px-3 py-2 text-center font-medium text-gray-600 w-24">Estoque</th>
                              <th className="px-3 py-2 text-center font-medium text-gray-600 w-28">Preco</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variacoes.map((v, idx) => (
                              <tr key={idx} className="border-t border-gray-100">
                                {tamanhosSelecionados.length > 0 && (
                                  <td className="px-3 py-2 font-medium">{v.tamanho}</td>
                                )}
                                {coresSelecionadas.length > 0 && (
                                  <td className="px-3 py-2">{v.cor}</td>
                                )}
                                <td className="px-3 py-2">
                                  <input type="text" value={v.sku || ''} placeholder="Auto"
                                    onChange={e => setVariacoes(prev => prev.map((vv, i) => i === idx ? { ...vv, sku: e.target.value } : vv))}
                                    className="input-field text-xs py-1" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="number" min="0" value={v.estoque}
                                    onChange={e => setVariacoes(prev => prev.map((vv, i) => i === idx ? { ...vv, estoque: Number(e.target.value) || 0 } : vv))}
                                    className="input-field text-center text-xs py-1 w-20 mx-auto" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="number" step="0.01" min="0" value={v.preco || ''} placeholder={preco || '0'}
                                    onChange={e => setVariacoes(prev => prev.map((vv, i) => i === idx ? { ...vv, preco: e.target.value ? Number(e.target.value) : undefined } : vv))}
                                    className="input-field text-center text-xs py-1 w-24 mx-auto" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA: Serial / Garantia (Informática) */}
        {abaAtiva === 'serial' && isInformatica && (
          <div className="space-y-4">
            {/* Número de série */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Controle por Numero de Serie</h3>
                    <p className="text-xs text-gray-500">Rastreie cada unidade individualmente (IMEI, SN, etc)</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${temSerial ? 'bg-primary' : 'bg-gray-300'}`}
                    onClick={() => setTemSerial(!temSerial)}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${temSerial ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </label>
              </div>

              {temSerial && (
                <div className="space-y-4">
                  {/* Input para adicionar serial */}
                  <div className="flex gap-2">
                    <input type="text" value={novoSerial} onChange={e => setNovoSerial(e.target.value)}
                      placeholder="Digite o numero de serie / IMEI"
                      className="input-field flex-1"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSerial() } }}
                    />
                    <button onClick={addSerial} className="btn-primary px-4">
                      <Plus className="h-4 w-4" /> Adicionar
                    </button>
                  </div>

                  {/* Lista de seriais */}
                  {seriais.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Numero de Serie</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-600">Status</th>
                            <th className="px-3 py-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {seriais.map((s, idx) => (
                            <tr key={idx} className="border-t border-gray-100">
                              <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                              <td className="px-3 py-2 font-mono text-xs">{s.numero}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  s.status === 'disponivel' ? 'bg-green-100 text-green-700' :
                                  s.status === 'vendido' ? 'bg-blue-100 text-blue-700' :
                                  s.status === 'garantia' ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {s.status === 'disponivel' ? 'Disponivel' :
                                   s.status === 'vendido' ? 'Vendido' :
                                   s.status === 'garantia' ? 'Garantia' : 'Defeito'}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {s.status === 'disponivel' && (
                                  <button onClick={() => removeSerial(idx)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Disponveis: {seriais.filter(s => s.status === 'disponivel').length} |
                    Vendidos: {seriais.filter(s => s.status === 'vendido').length} |
                    Total: {seriais.length}
                  </p>
                </div>
              )}
            </div>

            {/* Garantia */}
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-gray-800">Garantia</h3>
                  <p className="text-xs text-gray-500">Prazo de garantia registrado na venda</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Prazo (meses)</label>
                  <input type="number" min="0" value={garantiaMeses} onChange={e => setGarantiaMeses(e.target.value)}
                    placeholder="Ex: 12" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo</label>
                  <select value={garantiaTipo} onChange={e => setGarantiaTipo(e.target.value as typeof garantiaTipo)} className="input-field">
                    <option value="">Selecione</option>
                    <option value="fabricante">Fabricante</option>
                    <option value="loja">Loja</option>
                    <option value="estendida">Estendida</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: Especificações / Detalhes */}
        {abaAtiva === 'specs' && (isInformatica || isRoupa) && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Cpu className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {isInformatica ? 'Especificacoes Tecnicas' : 'Detalhes do Produto'}
                  </h3>
                  <p className="text-xs text-gray-500">Informacoes adicionais exibidas ao cliente</p>
                </div>
              </div>
              <button onClick={addEspecificacao} className="btn-secondary text-sm">
                <Plus className="h-3.5 w-3.5" /> Adicionar
              </button>
            </div>

            {/* Sugestões rápidas */}
            {isInformatica && SPECS_SUGESTOES[categoria] && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Sugestoes rapidas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SPECS_SUGESTOES[categoria].map(spec => (
                    <button key={spec}
                      onClick={() => {
                        if (!especificacoes.find(e => e.chave === spec)) {
                          setEspecificacoes(prev => [...prev, { chave: spec, valor: '' }])
                        }
                      }}
                      disabled={especificacoes.some(e => e.chave === spec)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium border border-gray-200 text-gray-600 hover:border-primary/30 hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      + {spec}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de especificações */}
            {especificacoes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhuma especificacao adicionada.</p>
            ) : (
              <div className="space-y-2">
                {especificacoes.map((spec, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" value={spec.chave} onChange={e => updateEspecificacao(idx, 'chave', e.target.value)}
                      placeholder="Ex: Processador" className="input-field flex-1 text-sm" />
                    <input type="text" value={spec.valor} onChange={e => updateEspecificacao(idx, 'valor', e.target.value)}
                      placeholder="Ex: Intel Core i7" className="input-field flex-[2] text-sm" />
                    <button onClick={() => removeEspecificacao(idx)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Campos de roupas adicionais */}
            {isRoupa && (
              <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Material / Composicao</label>
                  <input type="text" value={material} onChange={e => setMaterial(e.target.value)}
                    placeholder="Ex: 100% Algodao" className="input-field" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Colecao</label>
                  <input type="text" value={colecao} onChange={e => setColecao(e.target.value)}
                    placeholder="Ex: Verao 2026" className="input-field" />
                </div>
              </div>
            )}
          </div>
        )}

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
