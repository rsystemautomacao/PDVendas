import { useState, useCallback, useEffect, useRef } from 'react'
import { Save, X, Building2, Upload, Trash2, ImageIcon } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import { maskCNPJ, maskPhone, maskCEP, isValidCNPJ } from '../../../utils/helpers'

const ESTADOS = [
  '', 'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const MAX_LOGO_SIZE = 500 * 1024 // 500KB

export function MinhaEmpresaPage() {
  const { user, updateUser } = useAuth()
  const { sucesso, erro } = useToast()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [ie, setIe] = useState('')
  const [im, setIm] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cep, setCep] = useState('')
  const [endereco, setEndereco] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [logoBase64, setLogoBase64] = useState('')

  useEffect(() => {
    if (user?.empresa) {
      const e = user.empresa
      setRazaoSocial(e.nome || '')
      setNomeFantasia(e.nome || '')
      setCnpj(e.cnpj || '')
      setEmail('')
      setTelefone(e.telefone || '')
      setEndereco(e.endereco || '')
      setCidade(e.cidade || '')
      setEstado(e.estado || '')
      setLogoBase64(e.logoBase64 || '')
    }
  }, [user])

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    reader.onload = () => {
      const result = reader.result as string
      setLogoBase64(result)
    }
    reader.readAsDataURL(file)

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [erro])

  const handleRemoveLogo = useCallback(() => {
    setLogoBase64('')
  }, [])

  const handleSave = useCallback(async () => {
    if (!razaoSocial.trim() && !nomeFantasia.trim()) {
      erro('Informe pelo menos o nome da empresa')
      return
    }

    if (cnpj && !isValidCNPJ(cnpj)) {
      erro('CNPJ invalido. Verifique os digitos.')
      return
    }

    setLoading(true)
    try {
      const result = await updateUser({
        empresa: {
          nome: nomeFantasia.trim() || razaoSocial.trim(),
          cnpj: cnpj,
          telefone: telefone,
          endereco: `${endereco}${numero ? ', ' + numero : ''}${complemento ? ' - ' + complemento : ''}`,
          cidade: cidade,
          estado: estado,
          logoBase64: logoBase64,
        },
      })
      if (result.ok) {
        sucesso('Dados da empresa atualizados!')
      } else {
        erro(result.error || 'Erro ao salvar dados da empresa')
      }
    } catch {
      erro('Erro ao salvar dados da empresa')
    } finally {
      setLoading(false)
    }
  }, [razaoSocial, nomeFantasia, cnpj, telefone, endereco, numero, complemento, cidade, estado, logoBase64, updateUser, sucesso, erro])

  const handleCancel = useCallback(() => {
    if (user?.empresa) {
      const e = user.empresa
      setRazaoSocial(e.nome || '')
      setNomeFantasia(e.nome || '')
      setCnpj(e.cnpj || '')
      setTelefone(e.telefone || '')
      setEndereco(e.endereco || '')
      setCidade(e.cidade || '')
      setEstado(e.estado || '')
      setLogoBase64(e.logoBase64 || '')
    }
  }, [user])

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Minha Empresa</h1>
            <p className="text-sm text-text-secondary">Dados cadastrais e identidade visual da empresa.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Logo Upload Card - Left Column */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h2 className="mb-4 font-semibold text-text-primary text-center">Logo da Empresa</h2>

              <div className="flex flex-col items-center gap-4">
                {/* Logo Preview */}
                <div className="w-40 h-40 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                  {logoBase64 ? (
                    <img
                      src={logoBase64}
                      alt="Logo da empresa"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Sem logo</p>
                    </div>
                  )}
                </div>

                {/* Upload / Remove buttons */}
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary flex-1 text-xs"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {logoBase64 ? 'Trocar' : 'Enviar'}
                  </button>
                  {logoBase64 && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="btn-secondary text-xs text-red-500 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <p className="text-[11px] text-gray-400 text-center leading-tight">
                  PNG, JPG ou WebP. Max 500KB. A logo aparece no cupom de venda.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Data */}
          <div className="lg:col-span-2 space-y-4">
            {/* Dados Gerais */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h2 className="mb-4 font-semibold text-text-primary">Dados Gerais</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-text-primary">Razao Social</label>
                  <input
                    type="text"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-text-primary">Nome Fantasia</label>
                  <input
                    type="text"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">CNPJ</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                    className="input-field"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Telefone</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(maskPhone(e.target.value))}
                    className="input-field"
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Inscricao Estadual</label>
                  <input
                    type="text"
                    value={ie}
                    onChange={(e) => setIe(e.target.value)}
                    className="input-field"
                    placeholder="Opcional"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Inscricao Municipal</label>
                  <input
                    type="text"
                    value={im}
                    onChange={(e) => setIm(e.target.value)}
                    className="input-field"
                    placeholder="Opcional"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-text-primary">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="empresa@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Endereco */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
              <h2 className="mb-4 font-semibold text-text-primary">Endereco</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">CEP</label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(maskCEP(e.target.value))}
                    className="input-field"
                    placeholder="00000-000"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-text-primary">Logradouro</label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Numero</label>
                  <input
                    type="text"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-text-primary">Complemento</label>
                  <input
                    type="text"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Bairro</label>
                  <input
                    type="text"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Cidade</label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-text-primary">Estado</label>
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
            </div>
          </div>
        </div>

        {/* Botoes */}
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
