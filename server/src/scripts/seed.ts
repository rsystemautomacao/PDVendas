import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '../../.env') });

// Import models - need to import after config to ensure env is loaded
async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI nao definida'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Conectado ao MongoDB');

  // Import models
  const { User } = require('../models/User');
  const { Produto } = require('../models/Produto');
  const { Cliente } = require('../models/Cliente');
  const { ContaPagar } = require('../models/ContaPagar');
  const { ContaReceber } = require('../models/ContaReceber');
  const { Despesa } = require('../models/Despesa');
  const { Notificacao } = require('../models/Notificacao');
  const { Counter } = require('../models/Counter');

  // Limpar tudo
  await Promise.all([
    User.deleteMany({}), Produto.deleteMany({}), Cliente.deleteMany({}),
    ContaPagar.deleteMany({}), ContaReceber.deleteMany({}), Despesa.deleteMany({}),
    Notificacao.deleteMany({}), Counter.deleteMany({}),
  ]);
  console.log('Colecoes limpas');

  // ===== ADMIN =====
  const admin = await User.create({
    nome: 'Administrador',
    email: 'admin@meupdv.com',
    senha: 'admin123',
    role: 'admin',
    ativo: true,
    empresa: {
      nome: 'Minha Empresa LTDA',
      cnpj: '12.345.678/0001-99',
      telefone: '(11) 99999-0000',
      endereco: 'Rua Exemplo, 100',
      cidade: 'Sao Paulo',
      estado: 'SP',
    },
  });
  console.log('Admin criado:', admin.email);

  const adminId = admin._id;

  // ===== PRODUTOS =====
  const produtos = await Produto.insertMany([
    { empresaId: adminId, nome: 'Coca-Cola 350ml', codigo: 'P001', codigoBarras: '7891234560001', tipo: 'produto', preco: 5.50, precoCusto: 3.20, estoque: 48, estoqueMinimo: 10, unidade: 'UN', grupo: 'Bebidas', marca: 'Coca-Cola', ativo: true },
    { empresaId: adminId, nome: 'Agua Mineral 500ml', codigo: 'P002', codigoBarras: '7891234560002', tipo: 'produto', preco: 3.00, precoCusto: 1.50, estoque: 100, estoqueMinimo: 20, unidade: 'UN', grupo: 'Bebidas', marca: 'Crystal', ativo: true },
    { empresaId: adminId, nome: 'Pao Frances', codigo: 'P003', codigoBarras: '7891234560003', tipo: 'produto', preco: 0.75, precoCusto: 0.35, estoque: 200, estoqueMinimo: 50, unidade: 'UN', grupo: 'Padaria', ativo: true },
    { empresaId: adminId, nome: 'Cafe Expresso', codigo: 'P004', tipo: 'produto', preco: 6.00, precoCusto: 2.00, estoque: 500, estoqueMinimo: 100, unidade: 'UN', grupo: 'Bebidas', marca: 'Pilao', ativo: true },
    { empresaId: adminId, nome: 'Suco de Laranja 1L', codigo: 'P005', codigoBarras: '7891234560005', tipo: 'produto', preco: 8.90, precoCusto: 5.50, estoque: 30, estoqueMinimo: 10, unidade: 'UN', grupo: 'Bebidas', marca: 'Del Valle', ativo: true },
    { empresaId: adminId, nome: 'Biscoito Recheado', codigo: 'P006', codigoBarras: '7891234560006', tipo: 'produto', preco: 4.50, precoCusto: 2.80, estoque: 3, estoqueMinimo: 15, unidade: 'UN', grupo: 'Alimentos', marca: 'Oreo', ativo: true },
    { empresaId: adminId, nome: 'Sabonete Liquido', codigo: 'P007', codigoBarras: '7891234560007', tipo: 'produto', preco: 12.90, precoCusto: 7.50, estoque: 25, estoqueMinimo: 10, unidade: 'UN', grupo: 'Higiene', marca: 'Dove', ativo: true },
    { empresaId: adminId, nome: 'Detergente 500ml', codigo: 'P008', codigoBarras: '7891234560008', tipo: 'produto', preco: 2.99, precoCusto: 1.50, estoque: 40, estoqueMinimo: 15, unidade: 'UN', grupo: 'Limpeza', marca: 'Ype', ativo: true },
    { empresaId: adminId, nome: 'Corte de Cabelo Masculino', codigo: 'S001', tipo: 'servico', preco: 35.00, precoCusto: 0, estoque: 0, estoqueMinimo: 0, unidade: 'UN', grupo: 'Servicos', ativo: true },
    { empresaId: adminId, nome: 'Instalacao de Software', codigo: 'S002', tipo: 'servico', preco: 80.00, precoCusto: 0, estoque: 0, estoqueMinimo: 0, unidade: 'UN', grupo: 'Servicos', ativo: true },
  ]);
  console.log(`${produtos.length} produtos criados`);

  // ===== CLIENTES =====
  const clientes = await Cliente.insertMany([
    { empresaId: adminId, tipo: 'fisica', nome: 'Maria Silva', email: 'maria@email.com', telefone: '(11) 3333-4444', celular: '(11) 99999-1111', cpfCnpj: '123.456.789-00', ativo: true, aprovado: true, limiteCredito: 500, saldoDevedor: 0, endereco: { cep: '01001-000', logradouro: 'Rua Augusta', numero: '100', bairro: 'Centro', cidade: 'Sao Paulo', estado: 'SP' } },
    { empresaId: adminId, tipo: 'fisica', nome: 'Joao Santos', email: 'joao@email.com', celular: '(11) 99999-2222', cpfCnpj: '987.654.321-00', ativo: true, aprovado: true, limiteCredito: 1000, saldoDevedor: 150 },
    { empresaId: adminId, tipo: 'juridica', nome: 'Tech Solutions LTDA', email: 'contato@tech.com', telefone: '(11) 2222-3333', cpfCnpj: '12.345.678/0001-90', ativo: true, aprovado: true, limiteCredito: 5000, saldoDevedor: 0 },
    { empresaId: adminId, tipo: 'fisica', nome: 'Ana Oliveira', email: 'ana@email.com', celular: '(11) 99999-3333', cpfCnpj: '111.222.333-44', ativo: true, aprovado: true, limiteCredito: 300, saldoDevedor: 0 },
    { empresaId: adminId, tipo: 'fisica', nome: 'Pedro Costa', celular: '(11) 99999-4444', ativo: false, aprovado: true, limiteCredito: 0, saldoDevedor: 200 },
  ]);
  console.log(`${clientes.length} clientes criados`);

  // ===== FINANCEIRO =====
  const hoje = new Date();
  const daqui5 = new Date(hoje); daqui5.setDate(daqui5.getDate() + 5);
  const daqui15 = new Date(hoje); daqui15.setDate(daqui15.getDate() + 15);
  const atras5 = new Date(hoje); atras5.setDate(atras5.getDate() - 5);

  const fmt = (d: Date) => d.toISOString().split('T')[0];

  await ContaPagar.insertMany([
    { empresaId: adminId, descricao: 'Aluguel do mes', fornecedor: 'Imobiliaria XYZ', valor: 2500, vencimento: fmt(daqui5), categoria: 'Aluguel', pago: false },
    { empresaId: adminId, descricao: 'Conta de luz', fornecedor: 'CPFL', valor: 350, vencimento: fmt(daqui15), categoria: 'Energia', pago: false },
    { empresaId: adminId, descricao: 'Internet', fornecedor: 'Vivo', valor: 150, vencimento: fmt(atras5), categoria: 'Telecomunicacoes', pago: true, pagoEm: fmt(atras5), valorPago: 150 },
  ]);
  console.log('3 contas a pagar criadas');

  await ContaReceber.insertMany([
    { empresaId: adminId, descricao: 'Venda parcelada - Maria Silva', clienteNome: 'Maria Silva', valor: 250, vencimento: fmt(daqui5), recebido: false },
    { empresaId: adminId, descricao: 'Servico prestado - Tech Solutions', clienteNome: 'Tech Solutions LTDA', valor: 800, vencimento: fmt(daqui15), recebido: false },
  ]);
  console.log('2 contas a receber criadas');

  await Despesa.insertMany([
    { empresaId: adminId, nome: 'Aluguel', fornecedor: 'Imobiliaria XYZ', tipo: 'fixa', valor: 2500, vencimento: fmt(daqui5), pago: false },
    { empresaId: adminId, nome: 'Material de limpeza', fornecedor: 'Atacadao', tipo: 'variavel', valor: 120, vencimento: fmt(atras5), pago: true, pagoEm: fmt(atras5) },
    { empresaId: adminId, nome: 'Contador', fornecedor: 'Contabilidade ABC', tipo: 'fixa', valor: 800, vencimento: fmt(daqui15), pago: false },
  ]);
  console.log('3 despesas criadas');

  // ===== NOTIFICACOES =====
  await Notificacao.insertMany([
    { empresaId: adminId, titulo: 'Bem-vindo ao MeuPDV!', mensagem: 'Seu sistema esta pronto para uso. Configure sua empresa em Configuracoes.', tipo: 'sucesso', lida: false },
    { empresaId: adminId, titulo: 'Estoque baixo', mensagem: 'O produto "Biscoito Recheado" esta com estoque abaixo do minimo (3 unidades).', tipo: 'alerta', lida: false },
    { empresaId: adminId, titulo: 'Conta vencida', mensagem: 'A conta "Internet" venceu ha 5 dias. Regularize o pagamento.', tipo: 'erro', lida: false },
  ]);
  console.log('3 notificacoes criadas');

  // ===== CONTADORES =====
  await Counter.insertMany([
    { _id: `${adminId}_venda_num`, seq: 0 },
    { _id: `${adminId}_caixa_num`, seq: 0 },
    { _id: `${adminId}_compra_num`, seq: 0 },
    { _id: `${adminId}_os_num`, seq: 0 },
    { _id: `${adminId}_orcamento_num`, seq: 0 },
  ]);
  console.log('Contadores inicializados');

  console.log('\nSeed concluido com sucesso!');
  console.log('Login: admin@meupdv.com / admin123');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
