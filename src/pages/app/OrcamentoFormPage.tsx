import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Save, Smartphone, User, FileText,
  Plus, Trash2, AlertTriangle,
} from 'lucide-react'
import { useOrdensServico } from '../../contexts/OrdemServicoContext'
import { useClientes } from '../../contexts/ClienteContext'
import { useProdutos } from '../../contexts/ProdutoContext'
import { useToast } from '../../contexts/ToastContext'
import { useSegmento } from '../../hooks/useSegmento'
import { formatCurrency } from '../../utils/helpers'
import type { StatusOrcamento, ItemOrcamento } from '../../types'

const statusOptions: { value: StatusOrcamento; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'recusado', label: 'Recusado' },
  { value: 'expirado', label: 'Expirado' },
]

export function OrcamentoFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { orcamentos, criarOrcamento, atualizarOrcamento, converterOrcamentoEmOS } = useOrdensServico()
  const { clientes } = useClientes()
  const { produtos } = useProdutos()
  const toast = useToast()
  const seg = useSegmento()

  const isEdit = !!id
  const orcExistente = isEdit ? orcamentos.find(o => o._id === id) : null

  // Form state
  const [clienteId, setClienteId] = useState('')
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [dispositivoTipo, setDispositivoTipo] = useState(seg.tiposObjetoOS[0] || 'outro')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [cor, setCor] = useState('')
  const [imei, setImei] = useState('')
  // Veículo
  const [placa, setPlaca] = useState('')
  const [ano, setAno] = useState('')
  const [km, setKm] = useState('')
  const [combustivel, setCombustivel] = useState('')
  // Animal
  const [nomeAnimal, setNomeAnimal] = useState('')
  const [raca, setRaca] = useState('')
  const [porte, setPorte] = useState('')
  const [peso, setPeso] = useState('')
  // Ótica
  const [grauOD, setGrauOD] = useState('')
  const [grauOE, setGrauOE] = useState('')
  // Genérico
  const [descricaoItem, setDescricaoItem] = useState('')
  const [defeitoRelatado, setDefeitoRelatado] = useState('')
  const [itens, setItens] = useState<ItemOrcamento[]>([])
  const [desconto, setDesconto] = useState(0)
  const [validade, setValidade] = useState(15)
  const [status, setStatus] = useState<StatusOrcamento>('pendente')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [convertendo, setConvertendo] = useState(false)

  // Carregar dados existentes
  useEffect(() => {
    if (orcExistente) {
      setClienteId(orcExistente.clienteId || '')
      setClienteNome(orcExistente.clienteNome)
      setClienteTelefone(orcExistente.clienteTelefone || '')
      setDispositivoTipo(orcExistente.dispositivo.tipo)
      setMarca(orcExistente.dispositivo.marca)
      setModelo(orcExistente.dispositivo.modelo)
      setCor(orcExistente.dispositivo.cor || '')
      setImei(orcExistente.dispositivo.imei || '')
      setPlaca(orcExistente.dispositivo.placa || '')
      setAno(orcExistente.dispositivo.ano || '')
      setKm(orcExistente.dispositivo.km || '')
      setCombustivel(orcExistente.dispositivo.combustivel || '')
      setNomeAnimal(orcExistente.dispositivo.nomeAnimal || '')
      setRaca(orcExistente.dispositivo.raca || '')
      setPorte(orcExistente.dispositivo.porte || '')
      setPeso(orcExistente.dispositivo.peso || '')
      setGrauOD(orcExistente.dispositivo.grauOD || '')
      setGrauOE(orcExistente.dispositivo.grauOE || '')
      setDescricaoItem(orcExistente.dispositivo.descricaoItem || '')
      setDefeitoRelatado(orcExistente.defeitoRelatado)
      setItens(orcExistente.itens || [])
      setDesconto(orcExistente.desconto)
      setValidade(orcExistente.validade)
      setStatus(orcExistente.status)
      setObservacoes(orcExistente.observacoes || '')
    }
  }, [orcExistente])

  const handleClienteSelect = (cId: string) => {
    setClienteId(cId)
    const cliente = clientes.find(c => c._id === cId)
    if (cliente) {
      setClienteNome(cliente.nome)
      setClienteTelefone(cliente.celular || cliente.telefone || '')
    }
  }

  // Itens
  const addItem = (tipo: 'servico' | 'peca') => {
    setItens([...itens, { tipo, descricao: '', quantidade: 1, valorUnitario: 0, total: 0 }])
  }
  const removeItem = (i: number) => setItens(itens.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: string | number) => {
    setItens(itens.map((item, idx) => {
      if (idx !== i) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantidade' || field === 'valorUnitario') {
        updated.total = (Number(updated.quantidade) || 0) * (Number(updated.valorUnitario) || 0)
      }
      return updated
    }))
  }
  const handleItemProduto = (i: number, produtoId: string) => {
    const prod = produtos.find(p => p._id === produtoId)
    if (prod) {
      setItens(itens.map((item, idx) =>
        idx === i
          ? { ...item, produtoId, descricao: prod.nome, valorUnitario: prod.preco, total: (item.quantidade || 1) * prod.preco }
          : item
      ))
    }
  }

  // Totais
  const subtotal = itens.reduce((s, item) => s + (Number(item.total) || 0), 0)
  const total = Math.max(0, subtotal - (Number(desconto) || 0))

  const handleSalvar = async () => {
    if (!clienteNome.trim()) { toast.alerta('Informe o nome do cliente'); return }
    const tipoOS = seg.tipoObjetoOS
    if ((tipoOS === 'dispositivo' || tipoOS === 'veiculo') && (!marca.trim() || !modelo.trim())) { toast.alerta('Informe a marca e modelo'); return }
    if (tipoOS === 'animal' && !nomeAnimal.trim()) { toast.alerta('Informe o nome do animal'); return }
    if (!defeitoRelatado.trim()) { toast.alerta('Descreva o servico ou problema'); return }
    if (itens.length === 0) { toast.alerta('Adicione pelo menos um item ao orcamento'); return }

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
        placa: placa || undefined,
        ano: ano || undefined,
        km: km || undefined,
        combustivel: combustivel || undefined,
        nomeAnimal: nomeAnimal || undefined,
        raca: raca || undefined,
        porte: porte || undefined,
        peso: peso || undefined,
        grauOD: grauOD || undefined,
        grauOE: grauOE || undefined,
        descricaoItem: descricaoItem || undefined,
      },
      defeitoRelatado,
      itens,
      subtotal,
      desconto: Number(desconto) || 0,
      total,
      validade,
      status,
      observacoes: observacoes || undefined,
    }

    let result
    if (isEdit && id) {
      result = await atualizarOrcamento(id, data)
    } else {
      result = await criarOrcamento(data)
    }

    setSalvando(false)
    if (result) navigate('/app/orcamentos')
  }

  const handleConverterOS = async () => {
    if (!id) return
    setConvertendo(true)
    const os = await converterOrcamentoEmOS(id)
    setConvertendo(false)
    if (os) navigate(`/app/ordens-servico/${os._id}`)
  }

  const isReadOnly = orcExistente?.status === 'convertido'

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => navigate('/app/orcamentos')} className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">
              {isEdit ? `Orcamento #${orcExistente?.numero || ''}` : 'Novo Orcamento'}
            </h1>
            {isEdit && orcExistente && (
              <p className="text-sm text-gray-500">
                Criado em {new Date(orcExistente.criadoEm).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          {isEdit && orcExistente?.status === 'aprovado' && (
            <button
              onClick={handleConverterOS}
              disabled={convertendo}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {convertendo ? 'Convertendo...' : 'Gerar OS'}
            </button>
          )}
        </div>

        {isReadOnly && (
          <div className="mb-4 rounded-xl bg-purple-50 border border-purple-200 p-4 flex items-center gap-3">
            <AlertTriangle size={20} className="text-purple-600 flex-shrink-0" />
            <p className="text-sm text-purple-800">
              Este orcamento ja foi convertido em OS e nao pode ser editado.
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

          {/* Objeto do Orçamento */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              <Smartphone size={16} className="text-primary" /> {seg.labelObjetoOS}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select value={dispositivoTipo} onChange={e => setDispositivoTipo(e.target.value)} disabled={isReadOnly} className="input-field w-full">
                  {seg.tiposObjetoOS.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Dispositivo */}
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

              {/* Veículo */}
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

              {/* Animal */}
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

              {/* Ótica */}
              {seg.tipoObjetoOS === 'produto_otico' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                    <input type="text" placeholder="Ray-Ban, Oakley..." value={marca} onChange={e => setMarca(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                    <input type="text" placeholder="Modelo..." value={modelo} onChange={e => setModelo(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                    <input type="text" placeholder="Preto, Tartaruga..." value={cor} onChange={e => setCor(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                  </div>
                </>
              )}

              {/* Genérico */}
              {seg.tipoObjetoOS === 'generico' && (
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
                  <input type="text" placeholder="Descreva o item ou local do servico..." value={descricaoItem} onChange={e => setDescricaoItem(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                </div>
              )}
            </div>

            {/* Extras por tipo */}
            {seg.tipoObjetoOS === 'dispositivo' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">IMEI</label>
                <input type="text" placeholder="IMEI do aparelho" value={imei} onChange={e => setImei(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
              </div>
            )}
            {seg.tipoObjetoOS === 'veiculo' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                  <input type="text" placeholder="2024" value={ano} onChange={e => setAno(e.target.value)} disabled={isReadOnly} className="input-field w-full" maxLength={9} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KM</label>
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
                  </select>
                </div>
              </div>
            )}
            {seg.tipoObjetoOS === 'animal' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                  <input type="text" placeholder="12.5" value={peso} onChange={e => setPeso(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor / Pelagem</label>
                  <input type="text" placeholder="Caramelo, Preto..." value={cor} onChange={e => setCor(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                </div>
              </div>
            )}
            {seg.tipoObjetoOS === 'produto_otico' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grau OD</label>
                  <input type="text" placeholder="-2.50" value={grauOD} onChange={e => setGrauOD(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grau OE</label>
                  <input type="text" placeholder="-1.75" value={grauOE} onChange={e => setGrauOE(e.target.value)} disabled={isReadOnly} className="input-field w-full" />
                </div>
              </div>
            )}
          </div>

          {/* Defeito / Serviço solicitado */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              <FileText size={16} className="text-primary" /> {seg.labelDefeitoOS}
            </h2>
            <textarea
              rows={3}
              placeholder="Descreva o que o cliente relatou..."
              value={defeitoRelatado}
              onChange={e => setDefeitoRelatado(e.target.value)}
              disabled={isReadOnly}
              className="input-field w-full resize-none"
            />
          </div>

          {/* Itens */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Itens do Orcamento</h2>
              {!isReadOnly && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => addItem('servico')} className="flex items-center gap-1 text-sm text-green-600 font-medium hover:underline">
                    <Plus size={14} /> Servico
                  </button>
                  <button type="button" onClick={() => addItem('peca')} className="flex items-center gap-1 text-sm text-orange-600 font-medium hover:underline">
                    <Plus size={14} /> Peca
                  </button>
                </div>
              )}
            </div>
            {itens.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum item adicionado</p>
            ) : (
              <div className="space-y-3">
                {itens.map((item, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3 border-b border-gray-50 pb-3 last:border-0">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.tipo === 'servico' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {item.tipo === 'servico' ? 'Servico' : 'Peca'}
                    </span>
                    <div className="flex-1 min-w-[180px]">
                      {item.tipo === 'peca' && (
                        <select
                          value={item.produtoId || ''}
                          onChange={e => handleItemProduto(i, e.target.value)}
                          disabled={isReadOnly}
                          className="input-field w-full text-sm mb-1"
                        >
                          <option value="">Selecione do estoque (opcional)</option>
                          {produtos.filter(pr => pr.ativo).map(pr => (
                            <option key={pr._id} value={pr._id}>{pr.nome}</option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        placeholder="Descricao"
                        value={item.descricao}
                        onChange={e => updateItem(i, 'descricao', e.target.value)}
                        disabled={isReadOnly}
                        className="input-field w-full text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="number"
                        min={1}
                        value={item.quantidade}
                        onChange={e => updateItem(i, 'quantidade', Number(e.target.value))}
                        disabled={isReadOnly}
                        className="input-field w-full text-sm text-center"
                      />
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Valor"
                        value={item.valorUnitario || ''}
                        onChange={e => updateItem(i, 'valorUnitario', Number(e.target.value))}
                        disabled={isReadOnly}
                        className="input-field w-full text-sm text-right"
                      />
                    </div>
                    <div className="w-24">
                      <p className="text-sm font-medium text-gray-800">{formatCurrency(item.total)}</p>
                    </div>
                    {!isReadOnly && (
                      <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totais e Status */}
          <div className="card p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as StatusOrcamento)} disabled={isReadOnly} className="input-field w-full">
                  {statusOptions.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Validade (dias)</label>
                <input type="number" min={1} value={validade} onChange={e => setValidade(Number(e.target.value))} disabled={isReadOnly} className="input-field w-full" />
              </div>
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
                onClick={() => navigate('/app/orcamentos')}
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
                <Save size={16} /> {salvando ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Criar Orcamento'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
