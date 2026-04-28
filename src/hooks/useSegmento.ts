import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { SegmentoEmpresa } from '../types'

/**
 * Regras de visibilidade por segmento.
 * Cada flag indica se o recurso deve ser EXIBIDO para aquele segmento.
 * Se o segmento não está configurado, tudo é exibido (varejo_geral).
 */
// Tipo de "objeto" da OS conforme segmento
export type TipoObjetoOS = 'dispositivo' | 'veiculo' | 'animal' | 'produto_otico' | 'generico'

interface SegmentoFlags {
  segmento: SegmentoEmpresa
  label: string
  // Produto
  mostrarBalanca: boolean        // Modo venda por peso (balança)
  mostrarVariacoes: boolean      // Tamanho/cor (roupas)
  mostrarSerial: boolean         // Nº série / IMEI
  mostrarGarantia: boolean       // Prazo de garantia
  mostrarEspecificacoes: boolean // Specs técnicas
  mostrarGenero: boolean         // Masculino/feminino
  mostrarMaterial: boolean       // Composição/material
  mostrarColecao: boolean        // Coleção/temporada
  // Categorias sugeridas no form de produto
  categoriasPadrao: string[]
  // Unidades sugeridas
  unidadesPadrao: string[]
  // Módulos do sistema
  mostrarOrdensServico: boolean  // OS e orçamentos
  mostrarCompras: boolean        // Módulo de compras
  // Grupos sugeridos
  gruposSugeridos: string[]
  // OS / Orçamento
  tipoObjetoOS: TipoObjetoOS    // Que tipo de item a OS trata
  labelObjetoOS: string          // Label exibido no form (ex: "Dispositivo", "Veículo")
  tiposObjetoOS: string[]        // Opções do select "tipo" dentro da OS
  labelDefeitoOS: string         // Label do campo "defeito relatado"
  gruposServicoOS: string[]      // Sugestões de serviço para a OS
}

const CONFIGS: Record<string, Partial<SegmentoFlags>> = {
  roupas_calcados: {
    label: 'Roupas e Calcados',
    mostrarBalanca: false,
    mostrarVariacoes: true,
    mostrarSerial: false,
    mostrarGarantia: false,
    mostrarEspecificacoes: false,
    mostrarGenero: true,
    mostrarMaterial: true,
    mostrarColecao: true,
    categoriasPadrao: ['roupas', 'calcados', 'acessorios'],
    unidadesPadrao: ['UN', 'CX', 'PCT'],
    mostrarOrdensServico: false,
    gruposSugeridos: ['Camisetas', 'Calcas', 'Vestidos', 'Bermudas', 'Tenis', 'Sapatos', 'Bolsas', 'Cintos', 'Bones', 'Meias'],
  },
  informatica_eletronicos: {
    label: 'Informatica e Eletronicos',
    mostrarBalanca: false,
    mostrarVariacoes: false,
    mostrarSerial: true,
    mostrarGarantia: true,
    mostrarEspecificacoes: true,
    mostrarGenero: false,
    mostrarMaterial: false,
    mostrarColecao: false,
    categoriasPadrao: ['informatica', 'celulares', 'eletronicos', 'acessorios'],
    unidadesPadrao: ['UN', 'CX'],
    mostrarOrdensServico: true,
    gruposSugeridos: ['Notebooks', 'Desktops', 'Monitores', 'Teclados', 'Mouses', 'Cabos', 'Celulares', 'Tablets', 'Impressoras', 'Pecas'],
    tipoObjetoOS: 'dispositivo',
    labelObjetoOS: 'Dispositivo',
    tiposObjetoOS: ['celular', 'tablet', 'notebook', 'desktop', 'impressora', 'monitor', 'outro'],
    labelDefeitoOS: 'Defeito relatado',
    gruposServicoOS: ['Formatacao', 'Troca de tela', 'Troca de bateria', 'Limpeza', 'Upgrade', 'Backup', 'Instalacao de software'],
  },
  alimentos_bebidas: {
    label: 'Alimentos e Bebidas',
    mostrarBalanca: true,
    mostrarVariacoes: false,
    mostrarSerial: false,
    mostrarGarantia: false,
    mostrarEspecificacoes: false,
    mostrarGenero: false,
    mostrarMaterial: false,
    mostrarColecao: false,
    categoriasPadrao: ['alimentos', 'bebidas'],
    unidadesPadrao: ['UN', 'KG', 'L', 'CX', 'PCT'],
    mostrarOrdensServico: false,
    gruposSugeridos: ['Frios', 'Laticínios', 'Bebidas', 'Padaria', 'Carnes', 'Hortifruti', 'Mercearia', 'Higiene', 'Limpeza', 'Congelados'],
  },
  materiais_construcao: {
    label: 'Materiais de Construcao',
    mostrarBalanca: true,
    mostrarVariacoes: false,
    mostrarSerial: false,
    mostrarGarantia: false,
    mostrarEspecificacoes: true,
    mostrarGenero: false,
    mostrarMaterial: true,
    mostrarColecao: false,
    categoriasPadrao: ['outros'],
    unidadesPadrao: ['UN', 'KG', 'M', 'CX', 'PCT'],
    mostrarOrdensServico: true,
    gruposSugeridos: ['Cimento', 'Areia', 'Tijolos', 'Tintas', 'Tubos', 'Fios', 'Ferramentas', 'Parafusos', 'Madeiras', 'Pisos'],
    tipoObjetoOS: 'generico',
    labelObjetoOS: 'Servico / Obra',
    tiposObjetoOS: ['instalacao', 'reparo', 'reforma', 'construcao', 'manutencao', 'outro'],
    labelDefeitoOS: 'Descricao do servico',
    gruposServicoOS: ['Instalacao', 'Reparo', 'Pintura', 'Encanamento', 'Eletrica', 'Alvenaria', 'Forro', 'Piso'],
  },
  pet_shop: {
    label: 'Pet Shop',
    mostrarBalanca: true,
    mostrarVariacoes: true,
    mostrarSerial: false,
    mostrarGarantia: false,
    mostrarEspecificacoes: false,
    mostrarGenero: false,
    mostrarMaterial: false,
    mostrarColecao: false,
    categoriasPadrao: ['outros'],
    unidadesPadrao: ['UN', 'KG', 'L', 'CX', 'PCT'],
    mostrarOrdensServico: true,
    gruposSugeridos: ['Racao', 'Petiscos', 'Brinquedos', 'Higiene', 'Medicamentos', 'Acessorios', 'Camas', 'Coleiras', 'Aquarios', 'Servicos'],
    tipoObjetoOS: 'animal',
    labelObjetoOS: 'Animal',
    tiposObjetoOS: ['cachorro', 'gato', 'ave', 'roedor', 'reptil', 'peixe', 'outro'],
    labelDefeitoOS: 'Servico solicitado',
    gruposServicoOS: ['Banho', 'Tosa', 'Banho e Tosa', 'Hidratacao', 'Consulta', 'Vacina', 'Hospedagem', 'Adestramento'],
  },
  assistencia_tecnica: {
    label: 'Assistencia Tecnica',
    mostrarBalanca: false,
    mostrarVariacoes: false,
    mostrarSerial: true,
    mostrarGarantia: true,
    mostrarEspecificacoes: true,
    mostrarGenero: false,
    mostrarMaterial: false,
    mostrarColecao: false,
    categoriasPadrao: ['informatica', 'celulares', 'eletronicos'],
    unidadesPadrao: ['UN'],
    mostrarOrdensServico: true,
    gruposSugeridos: ['Pecas', 'Telas', 'Baterias', 'Conectores', 'Placas', 'Servicos', 'Mao de Obra'],
    tipoObjetoOS: 'dispositivo',
    labelObjetoOS: 'Dispositivo',
    tiposObjetoOS: ['celular', 'tablet', 'notebook', 'desktop', 'impressora', 'monitor', 'tv', 'videogame', 'outro'],
    labelDefeitoOS: 'Defeito relatado',
    gruposServicoOS: ['Troca de tela', 'Troca de bateria', 'Troca de conector', 'Reparo na placa', 'Formatacao', 'Limpeza', 'Soldagem'],
  },
  farmacia: {
    label: 'Farmacia',
    mostrarBalanca: false,
    mostrarVariacoes: false,
    mostrarSerial: false,
    mostrarGarantia: false,
    mostrarEspecificacoes: true,
    mostrarGenero: false,
    mostrarMaterial: false,
    mostrarColecao: false,
    categoriasPadrao: ['outros'],
    unidadesPadrao: ['UN', 'CX'],
    mostrarOrdensServico: false,
    gruposSugeridos: ['Medicamentos', 'Higiene', 'Beleza', 'Vitaminas', 'Dermocosmeticos', 'Infantil', 'Ortopedia', 'Primeiros Socorros'],
  },
  otica: {
    label: 'Otica',
    mostrarBalanca: false,
    mostrarVariacoes: true,
    mostrarSerial: true,
    mostrarGarantia: true,
    mostrarEspecificacoes: true,
    mostrarGenero: true,
    mostrarMaterial: true,
    mostrarColecao: true,
    categoriasPadrao: ['acessorios', 'outros'],
    unidadesPadrao: ['UN'],
    mostrarOrdensServico: true,
    gruposSugeridos: ['Armacoes', 'Lentes', 'Oculos de Sol', 'Lentes de Contato', 'Acessorios', 'Servicos'],
    tipoObjetoOS: 'produto_otico',
    labelObjetoOS: 'Produto Otico',
    tiposObjetoOS: ['oculos_grau', 'oculos_sol', 'lente_contato', 'armacao', 'outro'],
    labelDefeitoOS: 'Servico solicitado',
    gruposServicoOS: ['Montagem de lentes', 'Ajuste de armacao', 'Troca de lentes', 'Reparo', 'Limpeza', 'Consulta'],
  },
  auto_pecas: {
    label: 'Auto Pecas',
    mostrarBalanca: false,
    mostrarVariacoes: false,
    mostrarSerial: true,
    mostrarGarantia: true,
    mostrarEspecificacoes: true,
    mostrarGenero: false,
    mostrarMaterial: false,
    mostrarColecao: false,
    categoriasPadrao: ['outros'],
    unidadesPadrao: ['UN', 'CX', 'L'],
    mostrarOrdensServico: true,
    gruposSugeridos: ['Motor', 'Freios', 'Suspensao', 'Eletrica', 'Filtros', 'Oleos', 'Pneus', 'Acessorios', 'Funilaria', 'Iluminacao'],
    tipoObjetoOS: 'veiculo',
    labelObjetoOS: 'Veiculo',
    tiposObjetoOS: ['carro', 'moto', 'caminhao', 'van', 'utilitario', 'outro'],
    labelDefeitoOS: 'Problema relatado',
    gruposServicoOS: ['Troca de oleo', 'Freios', 'Suspensao', 'Alinhamento', 'Balanceamento', 'Eletrica', 'Injecao', 'Funilaria'],
  },
  oficina_mecanica: {
    label: 'Oficina Mecanica',
    mostrarBalanca: false,
    mostrarVariacoes: false,
    mostrarSerial: false,
    mostrarGarantia: true,
    mostrarEspecificacoes: false,
    mostrarGenero: false,
    mostrarMaterial: false,
    mostrarColecao: false,
    categoriasPadrao: ['outros'],
    unidadesPadrao: ['UN', 'L', 'CX'],
    mostrarOrdensServico: true,
    gruposSugeridos: ['Oleo Motor', 'Filtros', 'Pastilhas', 'Discos', 'Amortecedores', 'Correias', 'Velas', 'Pneus', 'Baterias', 'Pecas Motor'],
    tipoObjetoOS: 'veiculo',
    labelObjetoOS: 'Veiculo',
    tiposObjetoOS: ['carro', 'moto', 'caminhao', 'van', 'utilitario', 'onibus', 'outro'],
    labelDefeitoOS: 'Problema / Reclamacao',
    gruposServicoOS: ['Troca de oleo', 'Revisao completa', 'Freios', 'Suspensao', 'Embreagem', 'Alinhamento', 'Balanceamento', 'Motor', 'Cambio', 'Arrefecimento', 'Eletrica', 'Injecao eletronica', 'Escapamento', 'Diagnostico'],
  },
  papelaria: {
    label: 'Papelaria',
    mostrarBalanca: false,
    mostrarVariacoes: true,
    mostrarSerial: false,
    mostrarGarantia: false,
    mostrarEspecificacoes: false,
    mostrarGenero: false,
    mostrarMaterial: false,
    mostrarColecao: false,
    categoriasPadrao: ['outros'],
    unidadesPadrao: ['UN', 'CX', 'PCT'],
    mostrarOrdensServico: false,
    gruposSugeridos: ['Cadernos', 'Canetas', 'Papeis', 'Mochilas', 'Colas', 'Tesouras', 'Pastas', 'Impressao', 'Artesanato', 'Presentes'],
  },
}

// Configuração padrão (varejo geral / segmento não definido) — tudo habilitado
const DEFAULT_FLAGS: SegmentoFlags = {
  segmento: 'varejo_geral',
  label: 'Varejo Geral',
  mostrarBalanca: true,
  mostrarVariacoes: true,
  mostrarSerial: true,
  mostrarGarantia: true,
  mostrarEspecificacoes: true,
  mostrarGenero: true,
  mostrarMaterial: true,
  mostrarColecao: true,
  categoriasPadrao: [],
  unidadesPadrao: ['UN', 'KG', 'L', 'CX', 'M', 'PCT'],
  mostrarOrdensServico: false,
  mostrarCompras: true,
  gruposSugeridos: [],
  tipoObjetoOS: 'generico',
  labelObjetoOS: 'Item',
  tiposObjetoOS: ['outro'],
  labelDefeitoOS: 'Descricao do servico',
  gruposServicoOS: [],
}

export function useSegmento(): SegmentoFlags {
  const { user } = useAuth()

  return useMemo(() => {
    const seg = user?.empresa?.segmento || ''
    const config = CONFIGS[seg]
    if (!config) return { ...DEFAULT_FLAGS, segmento: (seg || 'varejo_geral') as SegmentoEmpresa }
    return {
      ...DEFAULT_FLAGS,
      ...config,
      segmento: seg as SegmentoEmpresa,
    }
  }, [user?.empresa?.segmento])
}
