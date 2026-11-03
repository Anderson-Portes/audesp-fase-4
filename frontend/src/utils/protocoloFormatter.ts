export interface ErroProtocoloDetalhado {
  mensagem: string;
  campo?: string | null;
  codigoErro?: string | null;
  classificacao?: string | null;
  origem?: string | null;
  texto_formatado: string;
}

export interface HistoricoProtocoloItem {
  id: number;
  modulo: 'edital' | 'licitacao' | 'ata' | 'ajuste' | string;
  registro_id: number;
  codigo_documento: string;
  protocolo: string;
  origem: 'envio_automatico' | 'consulta_manual' | string;
  status_protocolo?: string | null;
  data_hora_audesp?: string | null;
  sucesso_consulta: boolean;
  is_rejeitado: boolean;
  possui_erros: boolean;
  erros_formatados: string[];
  erros_detalhados: ErroProtocoloDetalhado[];
  created_at?: string | null;
}

export function formatarItemErroAudesp(err: any): ErroProtocoloDetalhado {
  if (typeof err === 'string') {
    const texto = err.trim();
    return {
      mensagem: texto,
      campo: null,
      codigoErro: null,
      classificacao: null,
      origem: null,
      texto_formatado: texto,
    };
  }

  if (err && typeof err === 'object') {
    const mensagem = String(
      err.mensagem ||
        err.message ||
        err.descricao ||
        err.erro ||
        err.error ||
        err.texto_formatado ||
        'Inconsistência reportada pelo AUDESP'
    ).trim();
    const campo = String(err.campo || err.field || err.propriedade || '').trim() || null;
    const codigoErro = String(err.codigoErro || err.codigo || err.code || '').trim() || null;
    const classificacao = String(err.classificacao || err.tipo || '').trim() || null;
    const origem = String(err.origem || err.valor || '').trim() || null;

    const partesCabecalho: string[] = [];
    if (classificacao) partesCabecalho.push(`[${classificacao}]`);
    if (codigoErro) partesCabecalho.push(`(${codigoErro})`);

    const prefixo = partesCabecalho.join(' ');
    const detalhesExtras: string[] = [];
    if (campo) detalhesExtras.push(`Campo: ${campo}`);
    if (origem) detalhesExtras.push(`Valor informado: ${origem}`);

    const textoBase = prefixo ? `${prefixo} ${mensagem}` : mensagem;
    const texto_formatado = detalhesExtras.length > 0 ? `${textoBase} — ${detalhesExtras.join(' | ')}` : textoBase;

    return {
      mensagem,
      campo,
      codigoErro,
      classificacao,
      origem,
      texto_formatado,
    };
  }

  const fallback = String(err ?? '').trim();
  return {
    mensagem: fallback,
    campo: null,
    codigoErro: null,
    classificacao: null,
    origem: null,
    texto_formatado: fallback,
  };
}

/**
 * Extrai e formata erros/inconsistências do retorno do AUDESP (seja objeto ou string JSON)
 * garantindo que NUNCA retorne JSON bruto.
 */
export function extrairErrosDetalhadosProtocolo(dadosBrutos: any): ErroProtocoloDetalhado[] {
  if (!dadosBrutos) return [];

  let dados = dadosBrutos;
  if (typeof dados === 'string') {
    const trimmed = dados.trim();
    if (!trimmed) return [];
    try {
      dados = JSON.parse(trimmed);
    } catch {
      return [formatarItemErroAudesp(trimmed)];
    }
  }

  const itensBrutos: any[] = [];

  if (Array.isArray(dados)) {
    itensBrutos.push(...dados);
  } else if (dados && typeof dados === 'object') {
    for (const chave of ['erros_detalhados', 'erros', 'inconsistencias', 'mensagens', 'errors']) {
      const val = dados[chave];
      if (Array.isArray(val) && val.length > 0) {
        itensBrutos.push(...val);
        break;
      } else if (typeof val === 'string' && val.trim()) {
        itensBrutos.push(val.trim());
      }
    }

    if (itensBrutos.length === 0) {
      for (const chaveObj of ['message', 'detail', 'dados', 'detalhes', 'retorno']) {
        const sub = dados[chaveObj];
        if (sub && typeof sub === 'object') {
          for (const chave of ['erros', 'inconsistencias', 'mensagens', 'errors']) {
            const val = sub[chave];
            if (Array.isArray(val) && val.length > 0) {
              itensBrutos.push(...val);
            } else if (typeof val === 'string' && val.trim()) {
              itensBrutos.push(val.trim());
            }
          }
          if (itensBrutos.length === 0) {
            const msgSub = sub.mensagem || sub.message;
            if (typeof msgSub === 'string' && msgSub.trim()) {
              itensBrutos.push(msgSub.trim());
            }
          }
        }
      }
    }

    const statusStr = String(dados.status || dados.status_protocolo || '').toLowerCase();
    if (
      itensBrutos.length === 0 &&
      (statusStr.includes('rejeitado') || statusStr.includes('erro') || dados.sucesso === false)
    ) {
      const msgDireta = dados.mensagem || dados.message || dados.error;
      if (typeof msgDireta === 'string' && msgDireta.trim()) {
        itensBrutos.push(msgDireta.trim());
      }
    }
  }

  const vistos = new Set<string>();
  const resultado: ErroProtocoloDetalhado[] = [];
  for (const item of itensBrutos) {
    const formatado = formatarItemErroAudesp(item);
    if (formatado.texto_formatado && !vistos.has(formatado.texto_formatado)) {
      vistos.add(formatado.texto_formatado);
      resultado.push(formatado);
    }
  }

  return resultado;
}

export function formatarMensagensProtocolo(dadosBrutos: any): string[] {
  return extrairErrosDetalhadosProtocolo(dadosBrutos).map((e) => e.texto_formatado);
}
