import { useState, useCallback, useEffect } from 'react'
import { Save, X, Building2 } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import { maskCNPJ, maskPhone, maskCEP } from '../../../utils/helpers'

const ESTADOS = [
  '', 'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export function MinhaEmpresaPage() {
  const { user, updateUser } = useAuth()
  const { sucesso, erro } = useToast()
  const [loading, setLoading] = useState(false)

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
    }
  }, [user])

  const handleSave = useCallback(() => {
    if (!razaoSocial.trim() && !nomeFantasia.trim()) {
      erro('Informe pelo menos o nome da empresa')
      return
    }

    setLoading(true)
    try {
      updateUser({
        empresa: {
          nome: nomeFantasia.trim() || razaoSocial.trim(),
          cnpj: cnpj,
          telefone: telefone,
          endereco: `${endereco}${numero ? ', ' + numero : ''}${complemento ? ' - ' + complemento : ''}`,
          cidade: cidade,
          estado: estado,
        },
      })
      sucesso('Dados da empresa atualizados!')
    } catch {
      erro('Erro ao salvar dados da empresa')
    } finally {
      setLoading(false)
    }
  }, [razaoSocial, nomeFantasia, cnpj, telefone, endereco, numero, complemento, cidade, estado, updateUser, sucesso, erro])

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
    }
  }, [user])

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Minha empresa</h1>
            <p className="text-sm text-text-secondary">Dados cadastrais da empresa.</p>
          </div>
        </div>

        {/* Dados da Empresa */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-semibold text-text-primary">Dados Gerais</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-text-primary">Razão Social</label>
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
              <label className="mb-1 block text-sm font-medium text-text-primary">Inscrição Estadual</label>
              <input
                type="text"
                value={ie}
                onChange={(e) => setIe(e.target.value)}
                className="input-field"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Inscrição Municipal</label>
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

        {/* Endereço */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-semibold text-text-primary">Endereço</h2>
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
              <label className="mb-1 block text-sm font-medium text-text-primary">Número</label>
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
