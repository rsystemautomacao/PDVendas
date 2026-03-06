export interface ClienteMock {
  id: string
  nome: string
  email: string
  status: 'ativo' | 'inativo'
}

export const MOCK_CLIENTES: ClienteMock[] = [
  { id: '1', nome: 'Maria Silva', email: 'maria@email.com', status: 'ativo' },
  { id: '2', nome: 'João Santos', email: 'joao@email.com', status: 'ativo' },
  { id: '3', nome: 'Empresa ABC Ltda', email: 'contato@abc.com', status: 'inativo' },
]
