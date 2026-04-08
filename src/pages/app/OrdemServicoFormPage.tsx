import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Save, Smartphone, User, Wrench,
  Package, Plus, Trash2, AlertTriangle, Printer,
} from 'lucide-react'
import { useOrdensServico } from '../../contexts/OrdemServicoContext'
import { useClientes } from '../../contexts/ClienteContext'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useToast } from '../../contexts/ToastContext'
import { useSegmento } from '../../hooks/useSegmento'
import { formatCurrency } from '../../utils/helpers'
import { imprimirOS } from '../../utils/impressaoOS'
import { useAuth } from '../../contexts/AuthContext'
import type { StatusOS, ServicoOS, PecaOS } from '../../types'

const statusOptions: { value: StatusOS; label: string }[] = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'em_analise', label: 'Em Analise' },
  { value: 'orcamento_enviado', label: 'Orcamento Enviado' },
  { value: 'aprovada', label: 'Aprovada' },
  { value: 'em_execucao', label: 'Em Execucao' },
  { value: 'concluida', label: 'Concluida' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelada', label: 'Cancelada' },
]

export function OrdemServicoFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { ordensServico, criarOS, atualizarOS, cancelarOS } = useOrdensServico()
  const { clientes } = useClientes()
  const { produtos } = useProdutos()
  const toast = useToast()
  const seg = useSegmento()
  const { user } = useAuth()

  const isEdit = !!id
  const osExistente = isEdit ? ordensServico.find(os => os._id === id) : null

  // Form state
  const [clienteId, setClienteId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [dispositivoTipo, setDispositivoTipo] = useState(seg.tiposObjetoOS[0] || 'outro')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [cor, setCor] = useState('')
  const [imei, setImei] = useState('')
  const [serial, setSerial] = useState('')
  const [senhaDispositivo, setSenhaDispositivo] = useState('')
  const [acessorios, setAcessorios] = useState('')
  const [estadoVisual, setEstadoVisual] = useState('')
  // Veículo
  const [placa, setPlaca] = useState('')
  const [ano, setAno] = useState('')
  const [km, setKm] = useState('')
  const [chassi, setChassi] = useState('')
  const [combustivel, setCombustivel] = useState('')
  // Animal
  const [nomeAnimal, setNomeAnimal] = useState('')
  const [especie, setEspecie] = useState('')
  const [raca, setRaca] = useState('')
  const [porte, setPorte] = useState('')
  const [peso, setPeso] = useState('')
  // Ótica
  const [grauOD, setGrauOD] = useState('')
  const [grauOE, setGrauOE] = useState('')
  // Genérico
  const [descricaoItem, setDescricaoItem] = useState('')
  const [defeitoRelatado, setDefeitoRelatado] = useState('')
  const [laudoTecnico, setLaudoTecnico] = useState('')
  const [servicos, setServicos] = useState<ServicoOS[]>([])
  const [pecas, setPecas] = useState<PecaOS[]>([])
  const [desconto, setDesconto] = useState(0)
  const [status, setStatus] = useState<StatusOS>('aberta')
  const [prioridade, setPrioridade] = useState<'baixa' | 'normal' | 'alta' | 'urgente'>('normal')
  const [tecnicoNome, setTecnicoNome] = useState('')
  const [prazoEstimado, setPrazoEstimado] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Carregar dados da OS existente
  useEffect(() => {
    if (osExistente) {
      setClienteId(osExistente.clienteId || '')
      setClienteNome(osExistente.clienteNome)
      setClienteTelefone(osExistente.clienteTelefone || '')
      setDispositivoTipo(osExistente.dispositivo.tipo)
      setMarca(osExistente.dispositivo.marca)
      setModelo(osExistente.dispositivo.modelo)
      setCor(osExistente.dispositivo.cor || '')
      setImei(osExistente.dispositivo.imei || '')
      setSerial(osExistente.dispositivo.serial || '')
      setSenhaDispositivo(osExistente.dispositivo.senhaDispositivo || '')
      setAcessorios(osExistente.dispositivo.acessorios || '')
      setEstadoVisual(osExistente.dispositivo.estadoVisual || '')
      setPlaca(osExistente.dispositivo.placa || '')
      setAno(osExistente.dispositivo.ano || '')
      setKm(osExistente.dispositivo.km || '')
      setChassi(osExistente.dispositivo.chassi || '')
      setCombustivel(osExistente.dispositivo.combustivel || '')
      setNomeAnimal(osExistente.dispositivo.nomeAnimal || '')
      setEspecie(osExistente.dispositivo.especie || '')
      setRaca(osExistente.dispositivo.raca || '')
      setPorte(osExistente.dispositivo.porte || '')
      setPeso(osExistente.dispositivo.peso || '')
      setGrauOD(osExistente.dispositivo.grauOD || '')
      setGrauOE(osExistente.dispositivo.grauOE || '')
      setDescricaoItem(osExistente.dispositivo.descricaoItem || '')
      setDefeitoRelatado(osExistente.defeitoRelatado)
      setLaudoTecnico(osExistente.laudoTecnico || '')
      setServicos(osExistente.servicos || [])
      setPecas(osExistente.pecas || [])
      setDesconto(osExistente.desconto)
      setStatus(osExistente.status)
      setPrioridade(osExistente.prioridade)
      setTecnicoNome(osExistente.tecnicoNome || '')
      setPrazoEstimado(osExistente.prazoEstimado ? osExistente.prazoEstimado.substring(0, 10) : '')
      setObservacoes(osExistente.observacoes || '')
    }
  }, [osExistente])

  // Seleção de cliente
  const handleClienteSelect = (cId: string) => {
    setClienteId(cId)
    const cliente = clientes.find(c => c._id === cId)
    if (cliente) {
      setClienteNome(cliente.nome)
      setClienteTelefone(cliente.celular || cliente.telefone || '')
    }
  }

  // Servicos
  const addServico = () => setServicos([...servicos, { descricao: '', valor: 0 }])
  const removeServico = (i: number) => setServicos(servicos.filter((_, idx) => idx !== i))
  const updateServico = (i: number, field: keyof ServicoOS, value: string | number) => {
    setServicos(servicos.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  // Pecas
  const addPeca = () => setPecas([...pecas, { nome: '', quantidade: 1, valorUnitario: 0, total: 0 }])
  const removePeca = (i: number) => setPecas(pecas.filter((_, idx) => idx !== i))
  const updatePeca = (i: number, field: string, value: string | number) => {
    setPecas(pecas.map((p, idx) => {
      if (idx !== i) return p
      const updated = { ...p, [field]: value }
      if (field === 'quantidade' || field === 'valorUnitario') {
        updated.total = (Number(updated.quantidade) || 0) * (Number(updated.valorUnitario) || 0)
      }
      return updated
    }))
  }
  const handlePecaProduto = (i: number, produtoId: string) => {
    const prod = produtos.find(p => p._id === produtoId)
    if (prod) {
      setPecas(pecas.map((p, idx) =>
        idx === i
          ? { ...p, produtoId, nome: prod.nome, valorUnitario: prod.precoCusto || prod.preco, total: (p.quantidade || 1) * (prod.precoCusto || prod.preco) }
          : p
      ))
    }
  }

  // Totais
  const valorServicos = servicos.reduce((s, sv) => s + (Number(sv.valor) || 0), 0)
  const valorPecas = pecas.reduce((s, p) => s + (Number(p.total) || 0), 0)
  const total = Math.max(0, valorServicos + valorPecas - (Number(desconto) || 0))

  const handleSalvar = async () => {
    if (!clienteNome.trim()) { toast.alerta('Informe o nome do cliente'); return }
    const tipoOS = seg.tipoObjetoOS
    if (tipoOS === 'dispositivo' && (!marca.trim() || !modelo.trim())) { toast.alerta('Informe a marca e modelo do aparelho'); return }
    if (tipoOS === 'veiculo' && (!marca.trim() || !modelo.trim())) { toast.alerta('Informe a marca e modelo do veiculo'); return }
    if (tipoOS === 'animal' && !nomeAnimal.trim()) { toast.alerta('Informe o nome do animal'); return }
    if (!defeitoRelatado.trim()) { toast.alerta('Descreva o servico ou problema'); return }

    setSalvando(true)
    const data = {
      clienteId: clienteId || undefined,
      clienteNome,
      clienteTelefone: clienteTelefone || undefined,
      dispositivo: {
        tipo: dispositivoTipo,
        marca,
        modelo,
        cor: cor || undefined,
        imei: imei || undefined,
        serial: serial || undefined,
        senhaDispositivo: senhaDispositivo || undefined,
        acessorios: acessorios || undefined,
        estadoVisual: estadoVisual || undefined,
        placa: placa || undefined,
        ano: ano || undefined,
        km: km || undefined,
        chassi: chassi || undefined,
        combustivel: combustivel || undefined,
        nomeAnimal: nomeAnimal || undefined,
        especie: especie || undefined,
        raca: raca || undefined,
        porte: porte || undefined,
        peso: peso || undefined,
        grauOD: grauOD || undefined,
        grauOE: grauOE || undefined,
        descricaoItem: descricaoItem || undefined,
      },
      defeitoRelatado,
      laudoTecnico: laudoTecnico || undefined,
      servicos,
      pecas,
      valorServicos,
      valorPecas,
      desconto: Number(desconto) || 0,
      total,
      status,
      prioridade,
      tecnicoNome: tecnicoNome || undefined,
      prazoEstimado: prazoEstimado || undefined,
      observacoes: observacoes || undefined,
    }

    let result
    if (isEdit && id) {
      result = await atualizarOS(id, data)
    } else {
      result = await criarOS(data)
    }

    setSalvando(false)
    if (result) navigate('/app/ordens-servico')
  }

  const handleCancelar = async () => {
    if (!motivoCancelamento.trim()) { toast.alerta('Informe o motivo do cancelamento'); return }
    if (id) {
      await cancelarOS(id, motivoCancelamento)
      setShowCancelModal(false)
      navigate('/app/ordens-servico')
    }
  }

  const handleImprimir = () => {
    if (!osExistente) return
    const emp = user?.empresa
    imprimirOS(osExistente, {
      nome: emp?.nome,
      cnpj: emp?.cnpj,
      telefone: emp?.telefone,
      endereco: emp?.endereco,
      cidade: emp?.cidade,
      estado: emp?.estado,
    })
  }

  const isReadOnly = osExistente?.status === 'cancelada' || osExistente?.status === 'entregue'

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => navigate('/app/ordens-servico')} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">
              {isEdit ? `OS #${osExistente?.numero || ''}` : 'Nova Ordem de Servico'}
            </h1>
            {isEdit && osExistente && (
              <p className="text-sm text-gray-500">
                Criada em {new Date(osExistente.criadoEm).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          {isEdit && osExistente && (
            <button
              onClick={handleImprimir}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Printer size={16} /> Imprimir
            </button>
          )}
          {isEdit && !isReadOnly && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn-secondary text-red-600 hover:bg-red-50 text-sm"
            >
              Cancelar OS
            </button>
          )}
        </div>

        {isReadOnly && (
          <div className="mb-4 rounded-xl bg-yellow-50 border border-yellow-200 p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              Esta OS esta {osExistente?.status === 'cancelada' ? 'cancelada' : 'entregue'} e nao pode ser editada.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Cliente */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              <User size={16} className="text-primary" /> Cliente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <select
                  value={clienteId}
                  onChange={e => handleClienteSelect(e.target.value)}
                  disabled={isReadOnly}
                  className="input-field w-full"
                >
                  <option value="">Selecione ou digite abaixo</option>
                  {clientes.filter(c => c.ativo).map(c => (
                    <option key={c._id} value={c._id}>{c.nome}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Ou digite o nome do cliente"
                  value={clienteNome}
                  onChange={e => { setClienteNome(e.target.value); setClienteId('') }}
                  disabled={isReadOnly}
                  className="input-field w-full mt-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={clienteTelefone}
                  onChange={e => setClienteTelefone(e.target.value)}
                  disabled={isReadOnly}
                  className="input-field w-full"
                />
              </div>
            </div>
          </div>

          {/* Objeto da OS (dispositivo / veículo / animal / ótico / genérico) */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              <Smartphone size={16} className="text-primary" /> {seg.labelObjetoOS}
            </h2>

            {/* Tipo (comum a todos) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select value={dispositivoTipo} onChange={e => setDispositivoTipo(e.target.value)} disabled={isReadOnly} className="input-field w-full">
                  {seg.tiposObjetoOS.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {/* === DISPOSITIVO (informática / assist. técnica) === */}
              {seg.tipoObjetoOS === 'dispositivo' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                    <input type="text" placeholder="Samsung, Apple..." value={marca} onChange={e => setMarca(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
                    <input type="text" placeholder="Galaxy S24, iPhone 15..." value={modelo} onChange={e => setModelo(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                    <input type="text" placeholder="Preto, Branco..." value={cor} onChange={e => setCor(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                </>
              )}

              {/* === VEÍCULO (oficina / auto peças) === */}
              {seg.tipoObjetoOS === 'veiculo' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                    <input type="text" placeholder="Fiat, VW, Honda..." value={marca} onChange={e => setMarca(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
                    <input type="text" placeholder="Uno, Gol, Civic..." value={modelo} onChange={e => setModelo(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Placa</label>
                    <input type="text" placeholder="ABC-1234" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} disabled={isReadOnly} className="input-field w-full" maxLength={8} />
                  </div>
                </>
              )}

              {/* === ANIMAL (pet shop) === */}
              {seg.tipoObjetoOS === 'animal' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do animal *</label>
                    <input type="text" placeholder="Rex, Luna..." value={nomeAnimal} onChange={e => setNomeAnimal(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raca</label>
                    <input type="text" placeholder="Labrador, SRD..." value={raca} onChange={e => setRaca(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Porte</label>
                    <select value={porte} onChange={e => setPorte(e.target.value)} disabled={isReadOnly} className="input-field w-full">
                      <option value="">Selecione</option>
                      <option value="pequeno">Pequeno</option>
                      <option value="medio">Medio</option>
                      <option value="grande">Grande</option>
                    </select>
                  </div>
                </>
              )}

              {/* === ÓTICA === */}
              {seg.tipoObjetoOS === 'produto_otico' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                    <input type="text" placeholder="Ray-Ban, Oakley..." value={marca} onChange={e => setMarca(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                    <input type="text" placeholder="Modelo da armacao..." value={modelo} onChange={e => setModelo(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                    <input type="text" placeholder="Preto, Tartaruga..." value={cor} onChange={e => setCor(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                </>
              )}

              {/* === GENÉRICO (mat. construção etc.) === */}
              {seg.tipoObjetoOS === 'generico' && (
                <>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
                    <input type="text" placeholder="Descreva o item ou local do servico..." value={descricaoItem} onChange={e => setDescricaoItem(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                </>
              )}
            </div>

            {/* Campos extras - segunda linha */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {/* Dispositivo: IMEI, Serial, Senha, Acessórios */}
              {seg.tipoObjetoOS === 'dispositivo' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IMEI</label>
                    <input type="text" placeholder="IMEI do aparelho" value={imei} onChange={e => setImei(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial</label>
                    <input type="text" placeholder="Numero de serie" value={serial} onChange={e => setSerial(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha do aparelho</label>
                    <input type="text" placeholder="Senha/padrao" value={senhaDispositivo} onChange={e => setSenhaDispositivo(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acessorios</label>
                    <input type="text" placeholder="Capa, carregador..." value={acessorios} onChange={e => setAcessorios(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                </>
              )}

              {/* Veículo: Ano, KM, Cor, Combustível */}
              {seg.tipoObjetoOS === 'veiculo' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                    <input type="text" placeholder="2024" value={ano} onChange={e => setAno(e.target.value)} disabled={isReadOnly} className="input-field w-full" maxLength={9} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KM atual</label>
                    <input type="text" placeholder="45.000" value={km} onChange={e => setKm(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                    <input type="text" placeholder="Prata, Preto..." value={cor} onChange={e => setCor(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Combustivel</label>
                    <select value={combustivel} onChange={e => setCombustivel(e.target.value)} disabled={isReadOnly} className="input-field w-full">
                      <option value="">Selecione</option>
                      <option value="flex">Flex</option>
                      <option value="gasolina">Gasolina</option>
                      <option value="etanol">Etanol</option>
                      <option value="diesel">Diesel</option>
                      <option value="eletrico">Eletrico</option>
                      <option value="gnv">GNV</option>
                    </select>
                  </div>
                </>
              )}

              {/* Animal: Peso, Espécie */}
              {seg.tipoObjetoOS === 'animal' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                    <input type="text" placeholder="12.5" value={peso} onChange={e => setPeso(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor / Pelagem</label>
                    <input type="text" placeholder="Caramelo, Preto..." value={cor} onChange={e => setCor(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                </>
              )}

              {/* Ótica: Grau OD, OE */}
              {seg.tipoObjetoOS === 'produto_otico' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grau OD (olho direito)</label>
                    <input type="text" placeholder="-2.50" value={grauOD} onChange={e => setGrauOD(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grau OE (olho esquerdo)</label>
                    <input type="text" placeholder="-1.75" value={grauOE} onChange={e => setGrauOE(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial</label>
                    <input type="text" placeholder="Numero de serie" value={serial} onChange={e => setSerial(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                </>
              )}
            </div>

            {/* Veículo: Chassi */}
            {seg.tipoObjetoOS === 'veiculo' && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chassi</label>
                  <input type="text" placeholder="Numero do chassi (opcional)" value={chassi} onChange={e => setChassi(e.target.value.toUpperCase())} disabled={isReadOnly} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado visual</label>
                  <input type="text" placeholder="Arranhoes, amassados..." value={estadoVisual} onChange={e => setEstadoVisual(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                </div>
              </div>
            )}

            {/* Dispositivo: Estado visual */}
            {seg.tipoObjetoOS === 'dispositivo' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado visual</label>
                <input type="text" placeholder="Arranhoes, tela trincada..." value={estadoVisual} onChange={e => setEstadoVisual(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
              </div>
            )}

            {/* Animal: Observações */}
            {seg.tipoObjetoOS === 'animal' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Acessorios / Observacoes</label>
                <input type="text" placeholder="Coleira, guia, restricoes alimentares..." value={acessorios} onChange={e => setAcessorios(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
              </div>
            )}
          </div>

          {/* Defeito e Laudo */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              <Wrench size={16} className="text-primary" /> Defeito e Diagnostico
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{seg.labelDefeitoOS} *</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o que o cliente relatou..."
                  value={defeitoRelatado}
                  onChange={e => setDefeitoRelatado(e.target.value)}
                  disabled={isReadOnly}
                  className="input-field w-full resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Laudo tecnico</label>
                <textarea
                  rows={3}
                  placeholder="Diagnostico tecnico do problema encontrado..."
                  value={laudoTecnico}
                  onChange={e => setLaudoTecnico(e.target.value)}
                  disabled={isReadOnly}
                  className="input-field w-full resize-none"
                />
              </div>
            </div>
          </div>

          {/* Servicos */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                <Wrench size={16} className="text-green-600" /> Servicos
              </h2>
              {!isReadOnly && (
                <button type="button" onClick={addServico} className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                  <Plus size={14} /> Adicionar
                </button>
              )}
            </div>
            {/* Sugestões de serviço */}
            {!isReadOnly && seg.gruposServicoOS.length > 0 && servicos.length === 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1.5">Sugestoes rapidas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {seg.gruposServicoOS.map(s => (
                    <button key={s} type="button"
                      onClick={() => setServicos([...servicos, { descricao: s, valor: 0 }])}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium border border-gray-200 text-gray-600 hover:border-primary/30 hover:bg-primary/5 transition-colors">
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {servicos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum servico adicionado</p>
            ) : (
              <div className="space-y-3">
                {servicos.map((sv, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Descricao do servico"
                      value={sv.descricao}
                      onChange={e => updateServico(i, 'descricao', e.target.value)}
                      disabled={isReadOnly}
                      className="input-field flex-1"
                    />
                    <div className="w-32">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Valor"
                        value={sv.valor || ''}
                        onChange={e => updateServico(i, 'valor', Number(e.target.value))}
                        disabled={isReadOnly}
                        className="input-field w-full text-right"
                      />
                    </div>
                    {!isReadOnly && (
                      <button type="button" onClick={() => removeServico(i)} className="p-1.5 text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="text-right text-sm font-medium text-gray-600">
                  Subtotal servicos: <span className="text-gray-800">{formatCurrency(valorServicos)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Pecas */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                <Package size={16} className="text-orange-600" /> Pecas
              </h2>
              {!isReadOnly && (
                <button type="button" onClick={addPeca} className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                  <Plus size={14} /> Adicionar
                </button>
              )}
            </div>
            {pecas.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma peca adicionada</p>
            ) : (
              <div className="space-y-3">
                {pecas.map((p, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3 border-b border-gray-50 pb-3 last:border-0">
                    <div className="flex-1 min-w-[200px]">
                      <select
                        value={p.produtoId || ''}
                        onChange={e => handlePecaProduto(i, e.target.value)}
                        disabled={isReadOnly}
                        className="input-field w-full text-sm"
                      >
                        <option value="">Selecione do estoque (opcional)</option>
                        {produtos.filter(pr => pr.ativo).map(pr => (
                          <option key={pr._id} value={pr._id}>{pr.nome} (Est: {pr.estoque})</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Nome da peca"
                        value={p.nome}
                        onChange={e => updatePeca(i, 'nome', e.target.value)}
                        disabled={isReadOnly}
                        className="input-field w-full mt-1 text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-xs text-gray-500 mb-0.5">Qtd</label>
                      <input
                        type="number"
                        min={1}
                        value={p.quantidade}
                        onChange={e => updatePeca(i, 'quantidade', Number(e.target.value))}
                        disabled={isReadOnly}
                        className="input-field w-full text-sm text-center"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs text-gray-500 mb-0.5">Valor un.</label>
                      <input
                        type="number"
                        step="0.01"
                        value={p.valorUnitario || ''}
                        onChange={e => updatePeca(i, 'valorUnitario', Number(e.target.value))}
                        disabled={isReadOnly}
                        className="input-field w-full text-sm text-right"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs text-gray-500 mb-0.5">Total</label>
                      <p className="text-sm font-medium text-gray-800 py-2">{formatCurrency(p.total)}</p>
                    </div>
                    {!isReadOnly && (
                      <button type="button" onClick={() => removePeca(i)} className="p-1.5 text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="text-right text-sm font-medium text-gray-600">
                  Subtotal pecas: <span className="text-gray-800">{formatCurrency(valorPecas)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Status, Prioridade, Tecnico */}
          <div className="card p-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Informacoes da OS</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as StatusOS)} disabled={isReadOnly} className="input-field w-full">
                  {statusOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select value={prioridade} onChange={e => setPrioridade(e.target.value as any)} disabled={isReadOnly} className="input-field w-full">
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tecnico</label>
                <input type="text" placeholder="Nome do tecnico" value={tecnicoNome} onChange={e => setTecnicoNome(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo estimado</label>
                <input type="date" value={prazoEstimado} onChange={e => setPrazoEstimado(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (R$)</label>
                <input type="number" step="0.01" min={0} value={desconto || ''} onChange={e => setDesconto(Number(e.target.value))} disabled={isReadOnly} className="input-field w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                <p className="text-2xl font-bold text-gray-800 py-1">{formatCurrency(total)}</p>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observacoes</label>
              <textarea
                rows={2}
                placeholder="Observacoes adicionais..."
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                disabled={isReadOnly}
                className="input-field w-full resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          {!isReadOnly && (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/app/ordens-servico')}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="btn-primary flex items-center gap-2"
              >
                <Save size={16} /> {salvando ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Criar OS'}
              </button>
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCancelModal(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Cancelar OS</h3>
              <p className="text-sm text-gray-600 mb-4">Informe o motivo do cancelamento:</p>
              <textarea
                rows={3}
                placeholder="Motivo do cancelamento..."
                value={motivoCancelamento}
                onChange={e => setMotivoCancelamento(e.target.value)}
                className="input-field w-full resize-none mb-4"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowCancelModal(false)} className="btn-secondary text-sm">Voltar</button>
                <button onClick={handleCancelar} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700">
                  Confirmar Cancelamento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
