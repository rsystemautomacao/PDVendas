import { useState, useCallback, useEffect } from 'react'
import { Save, X, User, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import { maskPhone } from '../../../utils/helpers'

export function MeuUsuarioPage() {
  const { user, updateUser } = useAuth()
  const { sucesso, erro } = useToast()
  const [loading, setLoading] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')

  // Alteração de senha
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [showSenhaAtual, setShowSenhaAtual] = useState(false)
  const [showNovaSenha, setShowNovaSenha] = useState(false)

  useEffect(() => {
    if (user) {
      setNome(user.nome || '')
      setEmail(user.email || '')
      setTelefone(user.empresa?.telefone || '')
    }
  }, [user])

  const handleSave = useCallback(async () => {
    if (!nome.trim()) {
      erro('Nome é obrigatório')
      return
    }
    if (!email.trim()) {
      erro('E-mail é obrigatório')
      return
    }

    setLoading(true)
    try {
      const updates: Record<string, unknown> = {
        nome: nome.trim(),
        email: email.trim(),
      }

      // Se o usuário preencheu os campos de senha
      if (mostrarSenha && (senhaAtual || novaSenha || confirmarSenha)) {
        if (!senhaAtual) {
          erro('Informe a senha atual')
          setLoading(false)
          return
        }
        if (novaSenha.length < 6) {
          erro('A nova senha deve ter pelo menos 6 caracteres')
          setLoading(false)
          return
        }
        if (novaSenha !== confirmarSenha) {
          erro('As senhas não coincidem')
          setLoading(false)
          return
        }

        updates.senhaAtual = senhaAtual
        updates.novaSenha = novaSenha
      }

      const result = await updateUser(updates)
      if (result.ok) {
        sucesso('Dados atualizados com sucesso!')
        setSenhaAtual('')
        setNovaSenha('')
        setConfirmarSenha('')
        setMostrarSenha(false)
      } else {
        erro(result.error || 'Erro ao salvar dados')
      }
    } catch {
      erro('Erro ao salvar dados')
    } finally {
      setLoading(false)
    }
  }, [nome, email, telefone, mostrarSenha, senhaAtual, novaSenha, confirmarSenha, updateUser, sucesso, erro])

  const handleCancel = useCallback(() => {
    if (user) {
      setNome(user.nome || '')
      setEmail(user.email || '')
      setTelefone(user.empresa?.telefone || '')
    }
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmarSenha('')
    setMostrarSenha(false)
  }, [user])

  return (
    <div className="p-4 md:p-6 pb-24">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Meu usuário</h1>
            <p className="text-sm text-text-secondary">Altere seus dados de acesso e perfil.</p>
          </div>
        </div>

        {/* Dados Pessoais */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-semibold text-text-primary">Dados Pessoais</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-text-primary">Nome *</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="input-field"
                placeholder="Seu nome completo"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-text-primary">E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Telefone</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))}
                className="input-field"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">Perfil</label>
              <input
                type="text"
                value={user?.role === 'admin' ? 'Administrador' : user?.role === 'gerente' ? 'Gerente' : 'Caixa'}
                className="input-field bg-gray-50"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Alterar Senha */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-text-muted" />
              <h2 className="font-semibold text-text-primary">Alterar Senha</h2>
            </div>
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {mostrarSenha ? 'Cancelar' : 'Alterar'}
            </button>
          </div>

          {mostrarSenha && (
            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Senha atual *</label>
                <div className="relative">
                  <input
                    type={showSenhaAtual ? 'text' : 'password'}
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Nova senha *</label>
                <div className="relative">
                  <input
                    type={showNovaSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNovaSenha(!showNovaSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-text-primary">Confirmar nova senha *</label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="input-field"
                  placeholder="Repita a nova senha"
                />
              </div>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="btn-primary"
          >
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
