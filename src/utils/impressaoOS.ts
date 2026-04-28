import type { OrdemServico, Orcamento } from '../types'
import { hasAndroidBridge, imprimirComandos, ElginBuilder } from './elginBridge'
import { getImpressoraPadrao } from './impressao'

interface EmpresaInfo {
  nome?: string
  cnpj?: string
  telefone?: string
  endereco?: string
  cidade?: string
  estado?: string
  logoBase64?: string
}

const statusLabels: Record<string, string> = {
  aberta: 'Aberta',
  em_analise: 'Em Analise',
  orcamento_enviado: 'Orcamento Enviado',
  aprovada: 'Aprovada',
  em_execucao: 'Em Execucao',
  concluida: 'Concluida',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
  pendente: 'Pendente',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  expirado: 'Expirado',
  convertido: 'Convertido em OS',
}

function formatCurrency(v: number) {
  return 'R$ ' + v.toFixed(2).replace('.', ',')
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR')
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR')
}

function buildDispositivoHtml(disp: OrdemServico['dispositivo']) {
  const lines: string[] = []
  if (disp.marca || disp.modelo) lines.push(`<b>${disp.marca} ${disp.modelo}</b>`)
  if (disp.cor) lines.push(`Cor: ${disp.cor}`)
  if (disp.imei) lines.push(`IMEI: ${disp.imei}`)
  if (disp.serial) lines.push(`Serial: ${disp.serial}`)
  if (disp.placa) lines.push(`Placa: ${disp.placa}`)
  if (disp.ano) lines.push(`Ano: ${disp.ano}`)
  if (disp.km) lines.push(`KM: ${disp.km}`)
  if (disp.combustivel) lines.push(`Combustivel: ${disp.combustivel}`)
  if (disp.chassi) lines.push(`Chassi: ${disp.chassi}`)
  if (disp.nomeAnimal) lines.push(`Nome: ${disp.nomeAnimal}`)
  if (disp.especie) lines.push(`Especie: ${disp.especie}`)
  if (disp.raca) lines.push(`Raca: ${disp.raca}`)
  if (disp.porte) lines.push(`Porte: ${disp.porte}`)
  if (disp.peso) lines.push(`Peso: ${disp.peso} kg`)
  if (disp.grauOD || disp.grauOE) lines.push(`Grau OD: ${disp.grauOD || '-'} | OE: ${disp.grauOE || '-'}`)
  if (disp.descricaoItem) lines.push(`Descricao: ${disp.descricaoItem}`)
  return lines.join('<br>')
}

function pageStyles() {
  return `
    @page { size: A4; margin: 12mm 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #222; }
    .via { page-break-after: always; padding: 8mm 0; }
    .via:last-child { page-break-after: auto; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 10px; }
    .header h1 { font-size: 16px; margin-bottom: 2px; }
    .header .empresa { font-size: 10px; color: #555; }
    .header .tipo-doc { font-size: 13px; font-weight: bold; color: #444; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .header .via-label { font-size: 10px; font-weight: bold; color: #fff; background: #333; display: inline-block; padding: 2px 10px; border-radius: 3px; margin-top: 6px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; margin-bottom: 10px; }
    .info-grid .item { padding: 3px 0; border-bottom: 1px dotted #ddd; }
    .info-grid .item .label { font-weight: bold; font-size: 9px; text-transform: uppercase; color: #666; }
    .info-grid .item .value { font-size: 11px; }
    .section { margin-bottom: 10px; }
    .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #333; border-bottom: 1px solid #999; padding-bottom: 3px; margin-bottom: 6px; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    table th { background: #f0f0f0; text-align: left; font-size: 9px; text-transform: uppercase; padding: 4px 6px; border: 1px solid #ccc; }
    table td { padding: 4px 6px; border: 1px solid #ddd; font-size: 10px; }
    table .right { text-align: right; }
    .totais { text-align: right; margin-top: 6px; }
    .totais .linha { padding: 2px 0; font-size: 11px; }
    .totais .total-final { font-size: 14px; font-weight: bold; border-top: 2px solid #333; padding-top: 4px; margin-top: 4px; }
    .obs-box { background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; padding: 8px; font-size: 10px; margin-top: 6px; min-height: 40px; }
    .defeito-box { background: #fff8f0; border: 1px solid #f0d0a0; border-radius: 4px; padding: 8px; font-size: 10px; }
    .assinatura { margin-top: 30px; display: flex; justify-content: space-between; gap: 40px; }
    .assinatura .campo { flex: 1; text-align: center; border-top: 1px solid #333; padding-top: 4px; font-size: 9px; }
    .footer { text-align: center; font-size: 8px; color: #999; margin-top: 15px; padding-top: 6px; border-top: 1px dotted #ccc; }
    .aviso-cliente { background: #eef6ff; border: 1px solid #bdd6f0; border-radius: 4px; padding: 8px; font-size: 9px; color: #336; margin-top: 10px; }
    .dados-internos { background: #fff0f0; border: 1px solid #f0c0c0; border-radius: 4px; padding: 8px; font-size: 9px; color: #633; margin-top: 6px; }
  `
}

function headerHtml(empresa: EmpresaInfo, docTipo: string, numero: number, viaLabel: string) {
  const endParts = [empresa.endereco, empresa.cidade, empresa.estado].filter(Boolean).join(' - ')
  return `
    <div class="header">
      <h1>${empresa.nome || 'MeuPDV'}</h1>
      <div class="empresa">
        ${empresa.cnpj ? `CNPJ: ${empresa.cnpj}` : ''}
        ${empresa.telefone ? ` | Tel: ${empresa.telefone}` : ''}
        ${endParts ? `<br>${endParts}` : ''}
      </div>
      <div class="tipo-doc">${docTipo} #${numero}</div>
      <span class="via-label">${viaLabel}</span>
    </div>
  `
}

// =============================================
// IMPRESSÃO TÉRMICA (80mm) - ANDROID / EMBARCADA
// =============================================

function gerarOSTermica(os: OrdemServico, empresa: EmpresaInfo): ElginBuilder {
  const b = new ElginBuilder(48) // 48 colunas = 80mm

  // Logo
  if (empresa.logoBase64) b.imagem(empresa.logoBase64)

  // Cabeçalho
  b.centro().bold().duplo().texto((empresa.nome || 'MeuPDV') + '\n')
  b.normal().centro()
  if (empresa.cnpj) b.texto('CNPJ: ' + empresa.cnpj + '\n')
  if (empresa.telefone) b.texto('Tel: ' + empresa.telefone + '\n')
  const endParts = [empresa.endereco, empresa.cidade, empresa.estado].filter(Boolean).join(' - ')
  if (endParts) b.texto(endParts + '\n')

  b.separador('=')
  b.centro().bold().duplo_h().texto('ORDEM DE SERVICO #' + os.numero + '\n')
  b.normal().separador('=')

  // Info
  b.esquerda()
  b.esquerdaDireita('Status:', statusLabels[os.status] || os.status)
  b.esquerdaDireita('Data:', formatDateTime(os.criadoEm))
  b.esquerdaDireita('Prioridade:', os.prioridade.charAt(0).toUpperCase() + os.prioridade.slice(1))
  if (os.prazoEstimado) b.esquerdaDireita('Prazo:', formatDate(os.prazoEstimado))
  b.separador()

  // Cliente
  b.bold().texto('CLIENTE:\n').normal()
  b.texto(os.clienteNome + '\n')
  if (os.clienteTelefone) b.texto('Tel: ' + os.clienteTelefone + '\n')
  b.separador()

  // Equipamento
  b.bold().texto('EQUIPAMENTO:\n').normal()
  const disp = os.dispositivo
  if (disp.marca || disp.modelo) b.texto((disp.marca || '') + ' ' + (disp.modelo || '') + '\n')
  if (disp.cor) b.texto('Cor: ' + disp.cor + '\n')
  if (disp.imei) b.texto('IMEI: ' + disp.imei + '\n')
  if (disp.serial) b.texto('Serial: ' + disp.serial + '\n')
  if (disp.placa) b.texto('Placa: ' + disp.placa + '\n')
  if (disp.ano) b.texto('Ano: ' + disp.ano + '\n')
  if (disp.km) b.texto('KM: ' + disp.km + '\n')
  if (disp.nomeAnimal) b.texto('Nome: ' + disp.nomeAnimal + '\n')
  if (disp.especie) b.texto('Especie: ' + disp.especie + '\n')
  if (disp.raca) b.texto('Raca: ' + disp.raca + '\n')
  if (disp.descricaoItem) b.texto('Descricao: ' + disp.descricaoItem + '\n')
  if (disp.acessorios) b.texto('Acessorios: ' + disp.acessorios + '\n')
  if (disp.estadoVisual) b.texto('Estado: ' + disp.estadoVisual + '\n')
  b.separador()

  // Defeito relatado
  b.bold().texto('DEFEITO RELATADO:\n').normal()
  b.texto(os.defeitoRelatado + '\n')
  b.separador()

  // Serviços
  if (os.servicos.length > 0) {
    b.bold().texto('SERVICOS:\n').normal()
    os.servicos.forEach(s => {
      b.esquerdaDireita(s.descricao, formatCurrency(s.valor))
    })
    b.separador()
  }

  // Peças
  if (os.pecas.length > 0) {
    b.bold().texto('PECAS:\n').normal()
    os.pecas.forEach(p => {
      b.texto(p.nome + '\n')
      b.esquerdaDireita('  ' + p.quantidade + 'x ' + formatCurrency(p.valorUnitario), formatCurrency(p.total))
    })
    b.separador()
  }

  // Totais
  if (os.valorServicos > 0) b.esquerdaDireita('Servicos:', formatCurrency(os.valorServicos))
  if (os.valorPecas > 0) b.esquerdaDireita('Pecas:', formatCurrency(os.valorPecas))
  if (os.desconto > 0) b.esquerdaDireita('Desconto:', '-' + formatCurrency(os.desconto))
  b.separador('=')
  b.bold().duplo_h().esquerdaDireita('TOTAL:', formatCurrency(os.total))
  b.normal().separador('=')

  // Observações
  if (os.observacoes) {
    b.bold().texto('OBSERVACOES:\n').normal()
    b.texto(os.observacoes + '\n')
    b.separador()
  }

  // Aviso
  b.texto('\n')
  b.centro().texto('Guarde este comprovante para\n')
  b.texto('retirada do equipamento.\n')
  b.texto('Garantia: 90 dias sobre servico.\n')
  b.texto('\n')

  // Assinaturas
  b.texto('\n\n')
  b.centro().texto('________________________________\n')
  b.texto('Assinatura do Cliente\n')
  b.texto('\n\n')
  b.texto('________________________________\n')
  b.texto('Assinatura da Loja\n')

  b.alimentar(2)
  b.texto('\n')
  b.centro().texto(formatDateTime(new Date().toISOString()) + '\n')

  b.cortarPapel()
  return b
}

function gerarOrcamentoTermico(orc: Orcamento, empresa: EmpresaInfo): ElginBuilder {
  const b = new ElginBuilder(48)

  if (empresa.logoBase64) b.imagem(empresa.logoBase64)

  b.centro().bold().duplo().texto((empresa.nome || 'MeuPDV') + '\n')
  b.normal().centro()
  if (empresa.cnpj) b.texto('CNPJ: ' + empresa.cnpj + '\n')
  if (empresa.telefone) b.texto('Tel: ' + empresa.telefone + '\n')

  b.separador('=')
  b.centro().bold().duplo_h().texto('ORCAMENTO #' + orc.numero + '\n')
  b.normal().separador('=')

  const validadeDate = new Date(orc.criadoEm)
  validadeDate.setDate(validadeDate.getDate() + orc.validade)

  b.esquerda()
  b.esquerdaDireita('Status:', statusLabels[orc.status] || orc.status)
  b.esquerdaDireita('Data:', formatDateTime(orc.criadoEm))
  b.esquerdaDireita('Validade:', orc.validade + ' dias')
  b.esquerdaDireita('Vence em:', formatDate(validadeDate.toISOString()))
  b.separador()

  b.bold().texto('CLIENTE:\n').normal()
  b.texto(orc.clienteNome + '\n')
  if (orc.clienteTelefone) b.texto('Tel: ' + orc.clienteTelefone + '\n')
  b.separador()

  // Equipamento
  const disp = orc.dispositivo
  b.bold().texto('EQUIPAMENTO:\n').normal()
  if (disp.marca || disp.modelo) b.texto((disp.marca || '') + ' ' + (disp.modelo || '') + '\n')
  if (disp.imei) b.texto('IMEI: ' + disp.imei + '\n')
  if (disp.serial) b.texto('Serial: ' + disp.serial + '\n')
  if (disp.descricaoItem) b.texto(disp.descricaoItem + '\n')
  b.separador()

  b.bold().texto('PROBLEMA:\n').normal()
  b.texto(orc.defeitoRelatado + '\n')
  b.separador()

  // Itens
  if (orc.itens.length > 0) {
    b.bold().texto('ITENS:\n').normal()
    orc.itens.forEach(item => {
      const tipo = item.tipo === 'servico' ? '[S]' : '[P]'
      b.texto(tipo + ' ' + item.descricao + '\n')
      b.esquerdaDireita('  ' + item.quantidade + 'x ' + formatCurrency(item.valorUnitario), formatCurrency(item.total))
    })
    b.separador()
  }

  b.esquerdaDireita('Subtotal:', formatCurrency(orc.subtotal))
  if (orc.desconto > 0) b.esquerdaDireita('Desconto:', '-' + formatCurrency(orc.desconto))
  b.separador('=')
  b.bold().duplo_h().esquerdaDireita('TOTAL:', formatCurrency(orc.total))
  b.normal().separador('=')

  if (orc.observacoes) {
    b.bold().texto('OBSERVACOES:\n').normal()
    b.texto(orc.observacoes + '\n')
    b.separador()
  }

  b.texto('\n')
  b.centro().texto('Orcamento valido por ' + orc.validade + ' dias.\n')
  b.texto('Valores sujeitos a alteracao\n')
  b.texto('apos vencimento.\n')

  b.texto('\n\n')
  b.centro().texto('________________________________\n')
  b.texto('Assinatura do Cliente\n')
  b.texto('\n\n')
  b.texto('________________________________\n')
  b.texto('Assinatura da Loja\n')

  b.alimentar(2)
  b.centro().texto(formatDateTime(new Date().toISOString()) + '\n')
  b.cortarPapel()
  return b
}

// =============================================
// IMPRESSÃO DE ORDEM DE SERVIÇO
// =============================================
export function imprimirOS(os: OrdemServico, empresa: EmpresaInfo) {
  // Se estiver em Android/embarcada, imprime em formato térmico 80mm
  const impressora = getImpressoraPadrao()
  if ((impressora?.tipo === 'embarcada' || hasAndroidBridge()) && hasAndroidBridge()) {
    const builder = gerarOSTermica(os, empresa)
    imprimirComandos(builder.build()).catch(err =>
      console.error('[ImpressaoOS] Erro na impressora embarcada:', err)
    )
    return
  }

  const dispHtml = buildDispositivoHtml(os.dispositivo)

  // --- VIA DO CLIENTE ---
  const viaCliente = `
    <div class="via">
      ${headerHtml(empresa, 'Ordem de Servico', os.numero, 'Via do Cliente')}

      <div class="info-grid">
        <div class="item"><span class="label">Cliente</span><div class="value">${os.clienteNome}</div></div>
        <div class="item"><span class="label">Telefone</span><div class="value">${os.clienteTelefone || '-'}</div></div>
        <div class="item"><span class="label">Data de Abertura</span><div class="value">${formatDateTime(os.criadoEm)}</div></div>
        <div class="item"><span class="label">Status</span><div class="value">${statusLabels[os.status] || os.status}</div></div>
        <div class="item"><span class="label">Prioridade</span><div class="value">${os.prioridade.charAt(0).toUpperCase() + os.prioridade.slice(1)}</div></div>
        <div class="item"><span class="label">Prazo Estimado</span><div class="value">${os.prazoEstimado ? formatDate(os.prazoEstimado) : 'A definir'}</div></div>
      </div>

      <div class="section">
        <div class="section-title">Equipamento / Item</div>
        <p>${dispHtml}</p>
        ${os.dispositivo.acessorios ? `<p style="margin-top:4px"><b>Acessorios:</b> ${os.dispositivo.acessorios}</p>` : ''}
        ${os.dispositivo.estadoVisual ? `<p><b>Estado visual:</b> ${os.dispositivo.estadoVisual}</p>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Problema Relatado</div>
        <div class="defeito-box">${os.defeitoRelatado}</div>
      </div>

      ${os.servicos.length > 0 ? `
        <div class="section">
          <div class="section-title">Servicos</div>
          <table>
            <thead><tr><th>Descricao</th><th class="right" style="width:90px">Valor</th></tr></thead>
            <tbody>
              ${os.servicos.map(s => `<tr><td>${s.descricao}</td><td class="right">${formatCurrency(s.valor)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${os.pecas.length > 0 ? `
        <div class="section">
          <div class="section-title">Pecas</div>
          <table>
            <thead><tr><th>Peca</th><th class="right" style="width:50px">Qtd</th><th class="right" style="width:80px">Unit.</th><th class="right" style="width:80px">Total</th></tr></thead>
            <tbody>
              ${os.pecas.map(p => `<tr><td>${p.nome}</td><td class="right">${p.quantidade}</td><td class="right">${formatCurrency(p.valorUnitario)}</td><td class="right">${formatCurrency(p.total)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="totais">
        ${os.valorServicos > 0 ? `<div class="linha">Servicos: ${formatCurrency(os.valorServicos)}</div>` : ''}
        ${os.valorPecas > 0 ? `<div class="linha">Pecas: ${formatCurrency(os.valorPecas)}</div>` : ''}
        ${os.desconto > 0 ? `<div class="linha">Desconto: -${formatCurrency(os.desconto)}</div>` : ''}
        <div class="linha total-final">Total: ${formatCurrency(os.total)}</div>
      </div>

      ${os.observacoes ? `
        <div class="section" style="margin-top:8px">
          <div class="section-title">Observacoes</div>
          <div class="obs-box">${os.observacoes}</div>
        </div>
      ` : ''}

      <div class="aviso-cliente">
        <b>Informacoes importantes:</b><br>
        - Guarde esta via para retirada do equipamento.<br>
        - O prazo estimado pode variar conforme disponibilidade de pecas.<br>
        - Equipamentos nao retirados em 90 dias serao descartados conforme legislacao vigente.<br>
        - Garantia de 90 dias sobre o servico realizado, exceto mau uso.
      </div>

      <div class="assinatura">
        <div class="campo">Assinatura do Cliente</div>
        <div class="campo">Assinatura da Loja</div>
      </div>

      <div class="footer">
        Documento gerado em ${formatDateTime(new Date().toISOString())} | ${empresa.nome || 'MeuPDV'}
      </div>
    </div>
  `

  // --- VIA DA LOJA ---
  const viaLoja = `
    <div class="via">
      ${headerHtml(empresa, 'Ordem de Servico', os.numero, 'Via da Loja')}

      <div class="info-grid">
        <div class="item"><span class="label">Cliente</span><div class="value">${os.clienteNome}</div></div>
        <div class="item"><span class="label">Telefone</span><div class="value">${os.clienteTelefone || '-'}</div></div>
        <div class="item"><span class="label">Data de Abertura</span><div class="value">${formatDateTime(os.criadoEm)}</div></div>
        <div class="item"><span class="label">Status</span><div class="value">${statusLabels[os.status] || os.status}</div></div>
        <div class="item"><span class="label">Prioridade</span><div class="value">${os.prioridade.charAt(0).toUpperCase() + os.prioridade.slice(1)}</div></div>
        <div class="item"><span class="label">Prazo Estimado</span><div class="value">${os.prazoEstimado ? formatDate(os.prazoEstimado) : 'A definir'}</div></div>
        <div class="item"><span class="label">Tecnico</span><div class="value">${os.tecnicoNome || 'A definir'}</div></div>
        <div class="item"><span class="label">Conclusao</span><div class="value">${os.concluidaEm ? formatDateTime(os.concluidaEm) : '-'}</div></div>
      </div>

      <div class="section">
        <div class="section-title">Equipamento / Item</div>
        <p>${dispHtml}</p>
        ${os.dispositivo.acessorios ? `<p style="margin-top:4px"><b>Acessorios:</b> ${os.dispositivo.acessorios}</p>` : ''}
        ${os.dispositivo.estadoVisual ? `<p><b>Estado visual:</b> ${os.dispositivo.estadoVisual}</p>` : ''}
      </div>

      ${os.dispositivo.senhaDispositivo ? `
        <div class="dados-internos">
          <b>Dados internos (NAO entregar ao cliente):</b><br>
          Senha do dispositivo: <b>${os.dispositivo.senhaDispositivo}</b>
        </div>
      ` : ''}

      <div class="section">
        <div class="section-title">Problema Relatado</div>
        <div class="defeito-box">${os.defeitoRelatado}</div>
      </div>

      ${os.laudoTecnico ? `
        <div class="section">
          <div class="section-title">Laudo Tecnico</div>
          <div class="obs-box">${os.laudoTecnico}</div>
        </div>
      ` : ''}

      ${os.servicos.length > 0 ? `
        <div class="section">
          <div class="section-title">Servicos</div>
          <table>
            <thead><tr><th>Descricao</th><th class="right" style="width:90px">Valor</th></tr></thead>
            <tbody>
              ${os.servicos.map(s => `<tr><td>${s.descricao}</td><td class="right">${formatCurrency(s.valor)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${os.pecas.length > 0 ? `
        <div class="section">
          <div class="section-title">Pecas</div>
          <table>
            <thead><tr><th>Peca</th><th class="right" style="width:50px">Qtd</th><th class="right" style="width:80px">Unit.</th><th class="right" style="width:80px">Total</th></tr></thead>
            <tbody>
              ${os.pecas.map(p => `<tr><td>${p.nome}</td><td class="right">${p.quantidade}</td><td class="right">${formatCurrency(p.valorUnitario)}</td><td class="right">${formatCurrency(p.total)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="totais">
        ${os.valorServicos > 0 ? `<div class="linha">Servicos: ${formatCurrency(os.valorServicos)}</div>` : ''}
        ${os.valorPecas > 0 ? `<div class="linha">Pecas: ${formatCurrency(os.valorPecas)}</div>` : ''}
        ${os.desconto > 0 ? `<div class="linha">Desconto: -${formatCurrency(os.desconto)}</div>` : ''}
        <div class="linha total-final">Total: ${formatCurrency(os.total)}</div>
      </div>

      ${os.observacoes ? `
        <div class="section" style="margin-top:8px">
          <div class="section-title">Observacoes</div>
          <div class="obs-box">${os.observacoes}</div>
        </div>
      ` : ''}

      <div class="assinatura">
        <div class="campo">Assinatura do Cliente</div>
        <div class="campo">Assinatura da Loja</div>
      </div>

      <div class="footer">
        Documento gerado em ${formatDateTime(new Date().toISOString())} | ${empresa.nome || 'MeuPDV'}
      </div>
    </div>
  `

  abrirJanelaImpressao(viaCliente + viaLoja, `OS #${os.numero}`)
}

// =============================================
// IMPRESSÃO DE ORÇAMENTO
// =============================================
export function imprimirOrcamento(orc: Orcamento, empresa: EmpresaInfo) {
  // Se estiver em Android/embarcada, imprime em formato térmico 80mm
  const impressora = getImpressoraPadrao()
  if ((impressora?.tipo === 'embarcada' || hasAndroidBridge()) && hasAndroidBridge()) {
    const builder = gerarOrcamentoTermico(orc, empresa)
    imprimirComandos(builder.build()).catch(err =>
      console.error('[ImpressaoOS] Erro na impressora embarcada:', err)
    )
    return
  }

  const dispHtml = buildDispositivoHtml(orc.dispositivo)
  const validadeDate = new Date(orc.criadoEm)
  validadeDate.setDate(validadeDate.getDate() + orc.validade)

  // --- VIA DO CLIENTE ---
  const viaCliente = `
    <div class="via">
      ${headerHtml(empresa, 'Orcamento', orc.numero, 'Via do Cliente')}

      <div class="info-grid">
        <div class="item"><span class="label">Cliente</span><div class="value">${orc.clienteNome}</div></div>
        <div class="item"><span class="label">Telefone</span><div class="value">${orc.clienteTelefone || '-'}</div></div>
        <div class="item"><span class="label">Data</span><div class="value">${formatDateTime(orc.criadoEm)}</div></div>
        <div class="item"><span class="label">Status</span><div class="value">${statusLabels[orc.status] || orc.status}</div></div>
        <div class="item"><span class="label">Validade</span><div class="value">${orc.validade} dias (ate ${formatDate(validadeDate.toISOString())})</div></div>
      </div>

      <div class="section">
        <div class="section-title">Equipamento / Item</div>
        <p>${dispHtml}</p>
      </div>

      <div class="section">
        <div class="section-title">Problema / Servico Solicitado</div>
        <div class="defeito-box">${orc.defeitoRelatado}</div>
      </div>

      ${orc.itens.length > 0 ? `
        <div class="section">
          <div class="section-title">Itens do Orcamento</div>
          <table>
            <thead><tr><th>Tipo</th><th>Descricao</th><th class="right" style="width:50px">Qtd</th><th class="right" style="width:80px">Unit.</th><th class="right" style="width:80px">Total</th></tr></thead>
            <tbody>
              ${orc.itens.map(item => `
                <tr>
                  <td>${item.tipo === 'servico' ? 'Servico' : 'Peca'}</td>
                  <td>${item.descricao}</td>
                  <td class="right">${item.quantidade}</td>
                  <td class="right">${formatCurrency(item.valorUnitario)}</td>
                  <td class="right">${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="totais">
        <div class="linha">Subtotal: ${formatCurrency(orc.subtotal)}</div>
        ${orc.desconto > 0 ? `<div class="linha">Desconto: -${formatCurrency(orc.desconto)}</div>` : ''}
        <div class="linha total-final">Total: ${formatCurrency(orc.total)}</div>
      </div>

      ${orc.observacoes ? `
        <div class="section" style="margin-top:8px">
          <div class="section-title">Observacoes</div>
          <div class="obs-box">${orc.observacoes}</div>
        </div>
      ` : ''}

      <div class="aviso-cliente">
        <b>Informacoes importantes:</b><br>
        - Este orcamento tem validade de <b>${orc.validade} dias</b> a partir da data de emissao.<br>
        - Valores sujeitos a alteracao apos o vencimento do orcamento.<br>
        - Aprovacao do orcamento autoriza o inicio dos servicos.<br>
        - Prazo de execucao sera informado apos aprovacao.
      </div>

      <div class="assinatura">
        <div class="campo">Assinatura do Cliente (Aprovacao)</div>
        <div class="campo">Assinatura da Loja</div>
      </div>

      <div class="footer">
        Documento gerado em ${formatDateTime(new Date().toISOString())} | ${empresa.nome || 'MeuPDV'}
      </div>
    </div>
  `

  // --- VIA DA LOJA ---
  const viaLoja = `
    <div class="via">
      ${headerHtml(empresa, 'Orcamento', orc.numero, 'Via da Loja')}

      <div class="info-grid">
        <div class="item"><span class="label">Cliente</span><div class="value">${orc.clienteNome}</div></div>
        <div class="item"><span class="label">Telefone</span><div class="value">${orc.clienteTelefone || '-'}</div></div>
        <div class="item"><span class="label">Data</span><div class="value">${formatDateTime(orc.criadoEm)}</div></div>
        <div class="item"><span class="label">Status</span><div class="value">${statusLabels[orc.status] || orc.status}</div></div>
        <div class="item"><span class="label">Validade</span><div class="value">${orc.validade} dias (ate ${formatDate(validadeDate.toISOString())})</div></div>
        ${orc.aprovadoEm ? `<div class="item"><span class="label">Aprovado em</span><div class="value">${formatDateTime(orc.aprovadoEm)}</div></div>` : ''}
        ${orc.recusadoEm ? `<div class="item"><span class="label">Recusado em</span><div class="value">${formatDateTime(orc.recusadoEm)}</div></div>` : ''}
        ${orc.osGeradaId ? `<div class="item"><span class="label">OS Gerada</span><div class="value">Sim</div></div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Equipamento / Item</div>
        <p>${dispHtml}</p>
      </div>

      <div class="section">
        <div class="section-title">Problema / Servico Solicitado</div>
        <div class="defeito-box">${orc.defeitoRelatado}</div>
      </div>

      ${orc.itens.length > 0 ? `
        <div class="section">
          <div class="section-title">Itens do Orcamento</div>
          <table>
            <thead><tr><th>Tipo</th><th>Descricao</th><th class="right" style="width:50px">Qtd</th><th class="right" style="width:80px">Unit.</th><th class="right" style="width:80px">Total</th></tr></thead>
            <tbody>
              ${orc.itens.map(item => `
                <tr>
                  <td>${item.tipo === 'servico' ? 'Servico' : 'Peca'}</td>
                  <td>${item.descricao}</td>
                  <td class="right">${item.quantidade}</td>
                  <td class="right">${formatCurrency(item.valorUnitario)}</td>
                  <td class="right">${formatCurrency(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="totais">
        <div class="linha">Subtotal: ${formatCurrency(orc.subtotal)}</div>
        ${orc.desconto > 0 ? `<div class="linha">Desconto: -${formatCurrency(orc.desconto)}</div>` : ''}
        <div class="linha total-final">Total: ${formatCurrency(orc.total)}</div>
      </div>

      ${orc.observacoes ? `
        <div class="section" style="margin-top:8px">
          <div class="section-title">Observacoes</div>
          <div class="obs-box">${orc.observacoes}</div>
        </div>
      ` : ''}

      <div class="assinatura">
        <div class="campo">Assinatura do Cliente (Aprovacao)</div>
        <div class="campo">Assinatura da Loja</div>
      </div>

      <div class="footer">
        Documento gerado em ${formatDateTime(new Date().toISOString())} | ${empresa.nome || 'MeuPDV'}
      </div>
    </div>
  `

  abrirJanelaImpressao(viaCliente + viaLoja, `Orcamento #${orc.numero}`)
}

// =============================================
// HELPER: IMPRIME VIA IFRAME OCULTO
// =============================================
function abrirJanelaImpressao(bodyHtml: string, titulo: string) {
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <style>${pageStyles()}</style>
    </head>
    <body>${bodyHtml}</body>
    </html>
  `

  const FRAME_ID = 'meupdv-print-frame-os'
  let iframe = document.getElementById(FRAME_ID) as HTMLIFrameElement | null
  if (!iframe) {
    iframe = document.createElement('iframe')
    iframe.id = FRAME_ID
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;'
    document.body.appendChild(iframe)
  }

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(html)
  doc.close()

  const win = iframe.contentWindow
  if (!win) return

  setTimeout(() => win.print(), 300)
}
