import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, User, Home, DollarSign, Info } from 'lucide-react'
import { useClientes } from '../../contexts/ClienteContext'
import { useToast } from '../../contexts/ToastContext'
import { sanitize, maskCPF, maskCNPJ, maskPhone, maskCEP, formatCurrency } from '../../utils/helpers'
import { useCepLookup } from '../../hooks/useCepLookup'

const ESTADOS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
] as const

type TabId = 'dados' | 'enderecos' | 'credito' | 'outras'

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'dados', label: 'Dados do Cliente', icon: User },
  { id: 'enderecos', label: 'Endereco', icon: Home },
  { id: 'credito', label: 'Credito', icon: DollarSign },
  { id: 'outras', label: 'Outras Info', icon: Info },
]

export function ClientePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const { getCliente, adicionarCliente, atualizarCliente } = useClientes()
  const toast = useToast()
  const locationState = location.state as { returnTo?: string } | null

  const isEdit = !!id && id !== 'novo'

  const [activeTab, setActiveTab] = useState<TabId>('dados')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Dados do cliente
  const [tipo, setTipo] = useState<'fisica' | 'juridica'>('fisica')
  const [nome, setNome] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [celular, setCelular] = useState('')
  const [rgIe, setRgIe] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [genero, setGenero] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [aprovado, setAprovado] = useState(true)

  // Endereco
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')

  // Credito
  const [limiteCredito, setLimiteCredito] = useState('0')
  const [saldoDevedor, setSaldoDevedor] = useState(0)

  // Outras
  const [observacoes, setObservacoes] = useState('')

  // CEP auto-fill
  const { buscarCep, loading: cepLoading } = useCepLookup({
    onLogradouro: setLogradouro,
    onBairro: setBairro,
    onCidade: setCidade,
    onEstado: setEstado,
  })

  // Load existing client data when editing
  useEffect(() => {
    if (isEdit && id) {
      const cliente = getCliente(id)
      if (cliente) {
        setTipo(cliente.tipo)
        setNome(cliente.nome)
        setCpfCnpj(cliente.cpfCnpj || '')
        setEmail(cliente.email || '')
        setTelefone(cliente.telefone || '')
        setCelular(cliente.celular || '')
        setRgIe(cliente.rgIe || '')
        setDataNascimento(cliente.dataNascimento || '')
        setGenero(cliente.genero || '')
        setAtivo(cliente.ativo)
        setAprovado(cliente.aprovado)
        setCep(cliente.endereco?.cep || '')
        setLogradouro(cliente.endereco?.logradouro || '')
        setNumero(cliente.endereco?.numero || '')
        setComplemento(cliente.endereco?.complemento || '')
        setBairro(cliente.endereco?.bairro || '')
        setCidade(cliente.endereco?.cidade || '')
        setEstado(cliente.endereco?.estado || '')
        setLimiteCredito(String(cliente.limiteCredito || 0))
        setSaldoDevedor(cliente.saldoDevedor || 0)
        setObservacoes(cliente.observacoes || '')
      } else {
        toast.erro('Cliente nao encontrado')
        navigate(locationState?.returnTo || '/app/clientes')
      }
    }
  }, [isEdit, id, getCliente, navigate, toast])

  const validate = useCallback(() => {
    const next: Record<string, string> = {}
    if (!nome.trim()) next.nome = 'Nome e obrigatorio'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'E-mail invalido'
    setErrors(next)
    return Object.keys(next).length === 0
  }, [nome, email])

  const handleSave = useCallback(() => {
    if (!validate()) {
      setActiveTab('dados')
      return
    }
    setLoading(true)

    const endereco = (cep || logradouro || numero || bairro || cidade || estado)
      ? { cep: cep.trim(), logradouro: logradouro.trim(), numero: numero.trim(), complemento: complemento.trim(), bairro: bairro.trim(), cidade: cidade.trim(), estado: estado.trim() }
      : undefined

    const data = {
      tipo,
      nome: sanitize(nome.trim()),
      cpfCnpj: cpfCnpj.trim() || undefined,
      email: email.trim() || undefined,
      telefone: telefone.trim() || undefined,
      celular: celular.trim() || undefined,
      rgIe: rgIe.trim() || undefined,
      dataNascimento: dataNascimento || undefined,
      genero: genero || undefined,
      ativo,
      aprovado,
      endereco,
      limiteCredito: parseFloat(limiteCredito) || 0,
      saldoDevedor,
      observacoes: observacoes.trim() || undefined,
    }

    if (isEdit && id) {
      atualizarCliente(id, data)
    } else {
      adicionarCliente(data as Parameters<typeof adicionarCliente>[0])
    }

    setLoading(false)
    navigate(locationState?.returnTo || '/app/clientes')
  }, [tipo, nome, cpfCnpj, email, telefone, celular, rgIe, dataNascimento, genero, ativo, aprovado, cep, logradouro, numero, complemento, bairro, cidade, estado, limiteCredito, saldoDevedor, observacoes, isEdit, id, validate, adicionarCliente, atualizarCliente, navigate])

  const handleCpfCnpjChange = (value: string) => {
    if (tipo === 'fisica') {
      setCpfCnpj(maskCPF(value))
    } else {
      setCpfCnpj(maskCNPJ(value))
    }
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(locationState?.returnTo || '/app/clientes')} className="btn-ghost p-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Dados do Cliente */}
        {activeTab === 'dados' && (
          <div className="card p-6">
            <div className="flex flex-col gap-6 md:flex-row">
              {/* Left column: avatar + toggles */}
              <div className="flex flex-shrink-0 flex-col items-center gap-4 md:w-44">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                  tipo === 'juridica' ? 'bg-purple-100 text-purple-600' : 'bg-primary/10 text-primary'
                }`}>
                  <User size={40} />
                </div>

                <div className="w-full space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-1">Status</span>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`relative w-11 h-6 rounded-full transition-colors ${ativo ? 'bg-primary' : 'bg-gray-300'}`}
                        onClick={() => setAtivo(!ativo)}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${ativo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{ativo ? 'Ativo' : 'Inativo'}</span>
                    </label>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500 block mb-1">Aprovado</span>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`relative w-11 h-6 rounded-full transition-colors ${aprovado ? 'bg-green-500' : 'bg-gray-300'}`}
                        onClick={() => setAprovado(!aprovado)}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${aprovado ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{aprovado ? 'Sim' : 'Nao'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right column: form fields */}
              <div className="flex-1">
                {/* Tipo toggle */}
                <div className="flex gap-4 mb-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={tipo === 'fisica'} onChange={() => { setTipo('fisica'); setCpfCnpj('') }}
                      className="text-primary focus:ring-primary" />
                    <span className="text-sm font-medium">Pessoa Fisica</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={tipo === 'juridica'} onChange={() => { setTipo('juridica'); setCpfCnpj('') }}
                      className="text-primary focus:ring-primary" />
                    <span className="text-sm font-medium">Pessoa Juridica</span>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Nome */}
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {tipo === 'fisica' ? 'Nome Completo *' : 'Razao Social / Nome *'}
                    </label>
                    <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                      placeholder={tipo === 'fisica' ? 'Nome do cliente' : 'Razao social ou nome fantasia'}
                      className={`input-field ${errors.nome ? 'border-red-500' : ''}`} autoFocus />
                    {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome}</p>}
                  </div>

                  {/* CPF/CNPJ */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {tipo === 'fisica' ? 'CPF' : 'CNPJ'}
                    </label>
                    <input type="text" value={cpfCnpj} onChange={e => handleCpfCnpjChange(e.target.value)}
                      placeholder={tipo === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                      maxLength={tipo === 'fisica' ? 14 : 18} className="input-field" />
                  </div>

                  {/* RG / IE */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      {tipo === 'fisica' ? 'RG' : 'Inscricao Estadual'}
                    </label>
                    <input type="text" value={rgIe} onChange={e => setRgIe(e.target.value)}
                      placeholder={tipo === 'fisica' ? 'RG' : 'IE'} className="input-field" />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">E-mail</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="email@exemplo.com" className={`input-field ${errors.email ? 'border-red-500' : ''}`} />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  {/* Celular */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Celular</label>
                    <input type="text" value={celular} onChange={e => setCelular(maskPhone(e.target.value))}
                      placeholder="(00) 00000-0000" maxLength={15} className="input-field" />
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Telefone</label>
                    <input type="text" value={telefone} onChange={e => setTelefone(maskPhone(e.target.value))}
                      placeholder="(00) 0000-0000" maxLength={14} className="input-field" />
                  </div>

                  {tipo === 'fisica' && (
                    <>
                      {/* Data Nascimento */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Data de Nascimento</label>
                        <input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)}
                          className="input-field" />
                      </div>

                      {/* Genero */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Genero</label>
                        <select value={genero} onChange={e => setGenero(e.target.value)} className="input-field">
                          <option value="">Selecione</option>
                          <option value="masculino">Masculino</option>
                          <option value="feminino">Feminino</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <p className="mt-4 text-xs text-gray-400">
                  * Apenas o nome e obrigatorio para salvar o cadastro.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Endereco */}
        {activeTab === 'enderecos' && (
          <div className="card p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">CEP</label>
                <div className="relative">
                  <input type="text" value={cep} onChange={e => {
                      const masked = maskCEP(e.target.value)
                      setCep(masked)
                      if (masked.replace(/\D/g, '').length === 8) buscarCep(masked)
                    }}
                    placeholder="00000-000" maxLength={9} className="input-field" />
                  {cepLoading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary animate-pulse-soft">Buscando...</span>}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Logradouro</label>
                <input type="text" value={logradouro} onChange={e => setLogradouro(e.target.value)}
                  placeholder="Rua, Avenida, etc." className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Numero</label>
                <input type="text" value={numero} onChange={e => setNumero(e.target.value)}
                  placeholder="N" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Complemento</label>
                <input type="text" value={complemento} onChange={e => setComplemento(e.target.value)}
                  placeholder="Apto, Sala, etc." className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Bairro</label>
                <input type="text" value={bairro} onChange={e => setBairro(e.target.value)}
                  placeholder="Bairro" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Cidade</label>
                <input type="text" value={cidade} onChange={e => setCidade(e.target.value)}
                  placeholder="Cidade" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Estado</label>
                <select value={estado} onChange={e => setEstado(e.target.value)} className="input-field">
                  <option value="">Selecione</option>
                  {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Credito */}
        {activeTab === 'credito' && (
          <div className="card p-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Limite de Credito</label>
                <input type="number" step="0.01" value={limiteCredito} onChange={e => setLimiteCredito(e.target.value)}
                  placeholder="0.00" className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Saldo Devedor</label>
                <div className="input-field bg-gray-50 text-gray-500 cursor-not-allowed">
                  {formatCurrency(saldoDevedor)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Saldo Disponivel</label>
                <div className={`input-field bg-gray-50 cursor-not-allowed ${
                  (parseFloat(limiteCredito) || 0) - saldoDevedor > 0 ? 'text-green-600' : 'text-red-500'
                }`}>
                  {formatCurrency(Math.max(0, (parseFloat(limiteCredito) || 0) - saldoDevedor))}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              O saldo devedor e atualizado automaticamente conforme as vendas a prazo / crediario do cliente.
            </div>
          </div>
        )}

        {/* Tab: Outras Informacoes */}
        {activeTab === 'outras' && (
          <div className="card p-6">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Observacoes</label>
            <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)}
              placeholder="Observacoes sobre o cliente" rows={5} className="input-field resize-none" />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={() => navigate(locationState?.returnTo || '/app/clientes')} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary">
            {loading ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Cadastrar Cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}
