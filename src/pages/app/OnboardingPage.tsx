import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, CheckCircle, Upload, Trash2, ImageIcon, ArrowRight, ArrowLeft,
  ShoppingBag, Laptop, UtensilsCrossed, Hammer, PawPrint, BookOpen,
  Pill, Glasses, Car, Wrench, Store, MoreHorizontal, Settings,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { maskCNPJ, maskPhone, maskCEP, isValidCNPJ } from '../../utils/helpers'
import { useCepLookup } from '../../hooks/useCepLookup'
import type { SegmentoEmpresa } from '../../types'

const ESTADOS = [
  '', 'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const MAX_LOGO_SIZE = 500 * 1024

const SEGMENTOS: { value: SegmentoEmpresa; label: string; desc: string; icon: typeof Store }[] = [
  { value: 'varejo_geral', label: 'Varejo Geral', desc: 'Loja com produtos variados', icon: Store },
  { value: 'roupas_calcados', label: 'Roupas e Calcados', desc: 'Moda, vestuario, acessorios', icon: ShoppingBag },
  { value: 'informatica_eletronicos', label: 'Informatica', desc: 'Computadores, celulares, eletronicos', icon: Laptop },
  { value: 'alimentos_bebidas', label: 'Alimentos e Bebidas', desc: 'Mercado, padaria, conveniencia', icon: UtensilsCrossed },
  { value: 'materiais_construcao', label: 'Mat. Construcao', desc: 'Materiais, ferramentas, tintas', icon: Hammer },
  { value: 'pet_shop', label: 'Pet Shop', desc: 'Produtos e servicos para animais', icon: PawPrint },
  { value: 'papelaria', label: 'Papelaria', desc: 'Material escolar, escritorio', icon: BookOpen },
  { value: 'farmacia', label: 'Farmacia', desc: 'Medicamentos, higiene, beleza', icon: Pill },
  { value: 'otica', label: 'Otica', desc: 'Oculos, lentes, acessorios', icon: Glasses },
  { value: 'assistencia_tecnica', label: 'Assist. Tecnica', desc: 'Conserto e manutencao', icon: Wrench },
  { value: 'auto_pecas', label: 'Auto Pecas', desc: 'Pecas e acessorios automotivos', icon: Car },
  { value: 'oficina_mecanica', label: 'Oficina Mecanica', desc: 'Reparo e manutencao de veiculos', icon: Settings },
  { value: 'outro', label: 'Outro', desc: 'Meu segmento nao esta listado', icon: MoreHorizontal },
]

export function OnboardingPage() {
  const { updateUser, needsOnboarding } = useAuth()
  const { sucesso, erro } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Etapa: 1 = segmento, 2 = dados empresa
  const [etapa, setEtapa] = useState(1)
  const [segmento, setSegmento] = useState<SegmentoEmpresa>('')

  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState('')
  const [numero, setNumero] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [logoBase64, setLogoBase64] = useState('')

  // CEP auto-fill
  const { buscarCep, loading: cepLoading } = useCepLookup({
    onLogradouro: setEndereco,
    onCidade: setCidade,
    onEstado: setEstado,
  })

  // If user doesn't need onboarding, redirect to dashboard
  if (!needsOnboarding) {
    navigate('/app', { replace: true })
    return null
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      erro('Selecione um arquivo de imagem (PNG, JPG, etc.)')
      return
    }
    if (file.size > MAX_LOGO_SIZE) {
      erro('A imagem deve ter no maximo 500KB')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setLogoBase64(reader.result as string)
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = useCallback(async () => {
    if (!razaoSocial.trim()) {
      erro('Informe a Razao Social da empresa')
      return
    }
    if (!cnpj.trim()) {
      erro('Informe o CNPJ da empresa')
      return
    }
    if (!isValidCNPJ(cnpj)) {
      erro('CNPJ invalido. Verifique os digitos.')
      return
    }
    if (!telefone.trim()) {
      erro('Informe o telefone da empresa')
      return
    }
    if (!cidade.trim()) {
      erro('Informe a cidade da empresa')
      return
    }
    if (!estado) {
      erro('Selecione o estado da empresa')
      return
    }

    setLoading(true)
    try {
      const result = await updateUser({
        empresa: {
          nome: nomeFantasia.trim() || razaoSocial.trim(),
          cnpj,
          telefone,
          endereco: `${endereco}${numero ? ', ' + numero : ''}`.trim(),
          cidade,
          estado,
          logoBase64,
          segmento: segmento || 'varejo_geral',
        },
      })
      if (result.ok) {
        sucesso('Empresa configurada com sucesso! Bem-vindo ao MeuPDV!')
        navigate('/app', { replace: true })
      } else {
        erro(result.error || 'Erro ao salvar dados da empresa')
      }
    } catch {
      erro('Erro ao salvar dados da empresa')
    } finally {
      setLoading(false)
    }
  }, [razaoSocial, nomeFantasia, cnpj, telefone, endereco, numero, cidade, estado, logoBase64, segmento, updateUser, sucesso, erro, navigate])

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center bg-gray-50 p-4 md:p-8">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`h-2 w-16 rounded-full transition-colors ${etapa >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className={`h-2 w-16 rounded-full transition-colors ${etapa >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
        </div>

        {/* ===== ETAPA 1: Segmento ===== */}
        {etapa === 1 && (
          <>
            <div className="text-center mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">Bem-vindo ao MeuPDV!</h1>
              <p className="mt-2 text-text-secondary">
                Qual e o segmento da sua loja? Isso nos ajuda a personalizar o sistema para voce.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SEGMENTOS.map(seg => {
                const Icon = seg.icon
                const selected = segmento === seg.value
                return (
                  <button
                    key={seg.value}
                    onClick={() => setSegmento(seg.value)}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all text-center ${
                      selected
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {selected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                      selected ? 'bg-primary/15 text-primary' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${selected ? 'text-primary' : 'text-gray-700'}`}>{seg.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{seg.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => {
                if (!segmento) { setSegmento('varejo_geral') }
                setEtapa(2)
              }}
              className="btn-primary w-full justify-center text-base py-3 mt-6"
            >
              Continuar <ArrowRight className="h-5 w-5" />
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Voce pode alterar isso depois em Configuracoes &gt; Minha Empresa.
            </p>
          </>
        )}

        {/* ===== ETAPA 2: Dados da Empresa ===== */}
        {etapa === 2 && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">Dados da Empresa</h1>
              <p className="mt-2 text-text-secondary">
                Configure os dados da sua empresa para emitir cupons e organizar seu negocio.
              </p>
            </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card space-y-6">
          {/* Logo (optional) */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
              {logoBase64 ? (
                <img src={logoBase64} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary mb-1">Logo da empresa <span className="text-gray-400 font-normal">(opcional)</span></p>
              <div className="flex gap-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs">
                  <Upload className="h-3.5 w-3.5" />
                  {logoBase64 ? 'Trocar' : 'Enviar'}
                </button>
                {logoBase64 && (
                  <button type="button" onClick={() => setLogoBase64('')} className="btn-secondary text-xs text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} className="hidden" />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Dados obrigatorios */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Razao Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                className="input-field"
                placeholder="Nome oficial da empresa"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Nome Fantasia <span className="text-gray-400 font-normal text-xs">(opcional)</span>
              </label>
              <input
                type="text"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                className="input-field"
                placeholder="Nome comercial"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                CNPJ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                className="input-field"
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Telefone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))}
                className="input-field"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Cidade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="input-field"
                placeholder="Sua cidade"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="input-field"
              >
                {ESTADOS.map(uf => (
                  <option key={uf} value={uf}>{uf || 'Selecione'}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Endereco (opcional) */}
          <div>
            <p className="text-sm font-medium text-text-primary mb-3">
              Endereco <span className="text-gray-400 font-normal text-xs">(opcional)</span>
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-text-secondary">CEP</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => {
                      const masked = maskCEP(e.target.value)
                      setCep(masked)
                      if (masked.replace(/\D/g, '').length === 8) buscarCep(masked)
                    }}
                    className="input-field"
                    placeholder="00000-000"
                  />
                  {cepLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary animate-pulse-soft">Buscando...</span>}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-text-secondary">Logradouro</label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-text-secondary">Numero</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEtapa(1)}
              className="btn-secondary py-3 px-4"
            >
              <ArrowLeft className="h-5 w-5" /> Voltar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-1 justify-center text-base py-3"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              Concluir Configuracao
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Campos marcados com <span className="text-red-500">*</span> sao obrigatorios.
        </p>
          </>
        )}
      </div>
    </div>
  )
}
