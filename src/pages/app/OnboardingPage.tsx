import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, CheckCircle, Upload, Trash2, ImageIcon } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { maskCNPJ, maskPhone, maskCEP, isValidCNPJ } from '../../utils/helpers'

const ESTADOS = [
  '', 'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const MAX_LOGO_SIZE = 500 * 1024

export function OnboardingPage() {
  const { updateUser, needsOnboarding } = useAuth()
  const { sucesso, erro } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  }, [razaoSocial, nomeFantasia, cnpj, telefone, endereco, numero, cidade, estado, logoBase64, updateUser, sucesso, erro, navigate])

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-start justify-center bg-gray-50 p-4 md:p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Bem-vindo ao MeuPDV!</h1>
          <p className="mt-2 text-text-secondary">
            Para comecar, configure os dados da sua empresa. Isso e necessario para emitir cupons e organizar seu negocio.
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
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(maskCEP(e.target.value))}
                  className="input-field"
                  placeholder="00000-000"
                />
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
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full justify-center text-base py-3"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
            Concluir Configuracao
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Campos marcados com <span className="text-red-500">*</span> sao obrigatorios.
        </p>
      </div>
    </div>
  )
}
