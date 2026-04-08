import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Store, MapPin, Phone, X, Check } from 'lucide-react'
import { api } from '../../../services/api'
import { useToast } from '../../../contexts/ToastContext'

interface Loja {
  _id: string
  nome: string
  endereco?: string
  cidade?: string
  estado?: string
  telefone?: string
  ativa: boolean
  criadoEm: string
}

export function LojasPage() {
  const toast = useToast()
  const [lojas, setLojas] = useState<Loja[]>([])
  const [loading, setLoading] = useState(true)

  // Form
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [telefone, setTelefone] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchLojas = useCallback(async () => {
    try {
      const res = await api.get('/lojas')
      if (res.success) setLojas(res.data || [])
    } catch {
      // silencioso no carregamento inicial
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLojas() }, [fetchLojas])

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setNome('')
    setEndereco('')
    setCidade('')
    setEstado('')
    setTelefone('')
  }

  const handleEdit = (loja: Loja) => {
    setEditingId(loja._id)
    setNome(loja.nome)
    setEndereco(loja.endereco || '')
    setCidade(loja.cidade || '')
    setEstado(loja.estado || '')
    setTelefone(loja.telefone || '')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!nome.trim()) { toast.erro('Nome e obrigatorio'); return }
    setSaving(true)
    try {
      if (editingId) {
        await api.put(`/lojas/${editingId}`, { nome, endereco, cidade, estado, telefone })
        toast.sucesso('Loja atualizada!')
      } else {
        await api.post('/lojas', { nome, endereco, cidade, estado, telefone })
        toast.sucesso('Loja criada!')
      }
      resetForm()
      fetchLojas()
    } catch (err: any) {
      toast.erro(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await api.delete(`/lojas/${deleteId}`)
      toast.sucesso('Loja removida')
      setDeleteId(null)
      fetchLojas()
    } catch (err: any) {
      toast.erro(err.message)
    }
  }

  const lojaAtiva = localStorage.getItem('meupdv_loja_ativa')

  const handleSetAtiva = (lojaId: string, lojaNome: string) => {
    localStorage.setItem('meupdv_loja_ativa', lojaId)
    localStorage.setItem('meupdv_loja_nome', lojaNome)
    toast.sucesso(`Loja ativa: ${lojaNome}`)
    // Force re-render
    setLojas([...lojas])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Store size={22} className="text-primary" /> Minhas Lojas
            </h1>
            <p className="text-sm text-gray-500 mt-1">{lojas.length} loja(s) cadastrada(s)</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary">
            <Plus size={18} /> Nova Loja
          </button>
        </div>

        {lojas.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16">
            <Store size={48} className="text-gray-200 mb-3" />
            <p className="text-gray-400">Nenhuma loja cadastrada</p>
            <p className="text-xs text-gray-400 mt-1">Cadastre suas lojas para controlar vendas por unidade</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lojas.map(loja => (
              <div key={loja._id} className={`card p-4 flex items-center gap-4 ${lojaAtiva === loja._id ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${lojaAtiva === loja._id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                  <Store size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-800">{loja.nome}</p>
                    {lojaAtiva === loja._id && <span className="badge badge-primary text-[10px]">Ativa</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-0.5">
                    {loja.cidade && <span className="flex items-center gap-1"><MapPin size={10} />{loja.cidade}{loja.estado ? `/${loja.estado}` : ''}</span>}
                    {loja.telefone && <span className="flex items-center gap-1"><Phone size={10} />{loja.telefone}</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {lojaAtiva !== loja._id && (
                    <button onClick={() => handleSetAtiva(loja._id, loja.nome)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600" title="Definir como ativa">
                      <Check size={16} />
                    </button>
                  )}
                  <button onClick={() => handleEdit(loja)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary" title="Editar">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => setDeleteId(loja._id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="Excluir">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Loja' : 'Nova Loja'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="label">Nome *</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="input-field" placeholder="Ex: Loja Centro" autoFocus />
              </div>
              <div>
                <label className="label">Endereco</label>
                <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} className="input-field" placeholder="Rua, numero" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Cidade</label>
                  <input type="text" value={cidade} onChange={e => setCidade(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="label">Estado</label>
                  <input type="text" value={estado} onChange={e => setEstado(e.target.value)} className="input-field" placeholder="SP" maxLength={2} />
                </div>
              </div>
              <div>
                <label className="label">Telefone</label>
                <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} className="input-field" placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={resetForm} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in text-center">
            <Trash2 size={32} className="text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">Excluir loja?</h3>
            <p className="text-sm text-gray-500 mb-4">Esta acao nao pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
