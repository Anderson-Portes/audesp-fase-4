import React from 'react';
import { Modal, Button, Badge, Table, Spinner } from 'react-bootstrap';
import { AlertTriangle, CheckCircle2, Clock, FileCheck, History } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ErroProtocoloDetalhado, HistoricoProtocoloItem } from '../../utils/protocoloFormatter';
import { extrairErrosDetalhadosProtocolo, formatarMensagensProtocolo } from '../../utils/protocoloFormatter';
import { formatDateTimeBR } from '../../utils/formatters';

export function notificarResultadoProtocolo(
  res: any,
  opcoes: {
    prefixoSucesso?: string;
    isTransmissao?: boolean;
  } = {}
) {
  const status = res?.status_protocolo || res?.status || 'Recebido';
  const protocolo = res?.protocolo;
  const isRejected =
    Boolean(res?.is_rejeitado) || String(status).toLowerCase().includes('rejeitado');
  const erros: string[] =
    Array.isArray(res?.erros_formatados) && res.erros_formatados.length > 0
      ? res.erros_formatados
      : formatarMensagensProtocolo(res?.dados || res?.detalhes || res);

  if (isRejected || erros.length > 0) {
    toast.error(
      <div>
        <strong>
          {opcoes.isTransmissao
            ? `Transmitido (Protocolo: ${protocolo}), mas ${isRejected ? 'REJEITADO' : 'com alertas'} na consulta do AUDESP (${status}):`
            : `Protocolo ${protocolo || ''} — Situação: ${status}`}
        </strong>
        {erros.length > 0 && (
          <ul className="mb-0 ps-3 mt-1 small text-start">
            {erros.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        )}
      </div>,
      { duration: 9000 }
    );
  } else {
    if (opcoes.isTransmissao) {
      toast.success(
        `${opcoes.prefixoSucesso || 'Documento transmitido com sucesso!'} Protocolo: ${protocolo} (Situação: ${status})`
      );
    } else {
      toast.success(`Situação atualizada no AUDESP: ${status}`);
    }
  }
}

interface ProtocoloErrosAlertProps {
  detalhesProtocolo?: any;
  errosDetalhados?: ErroProtocoloDetalhado[];
  statusProtocolo?: string | null;
  titulo?: string;
  className?: string;
}

export const ProtocoloErrosAlert: React.FC<ProtocoloErrosAlertProps> = ({
  detalhesProtocolo,
  errosDetalhados,
  statusProtocolo,
  titulo,
  className = 'mt-2',
}) => {
  const listaErros =
    errosDetalhados && errosDetalhados.length > 0
      ? errosDetalhados
      : extrairErrosDetalhadosProtocolo(detalhesProtocolo);

  const isRejected = (statusProtocolo || '').toLowerCase().includes('rejeitado');

  if (listaErros.length === 0 && !isRejected) {
    return null;
  }

  return (
    <div
      className={`alert ${isRejected ? 'alert-danger' : 'alert-warning'} py-2 px-3 small mb-0 ${className}`}
    >
      <div className="d-flex align-items-center gap-2 fw-bold mb-1">
        <AlertTriangle size={15} />
        <span>
          {titulo ||
            (isRejected
              ? 'Motivos de Rejeição / Inconsistências Apontadas pelo AUDESP:'
              : 'Notificações / Alertas Indicativos do AUDESP:')}
        </span>
      </div>

      {listaErros.length > 0 ? (
        <ul className="mb-0 ps-3 mt-1 d-flex flex-column gap-1">
          {listaErros.map((err, idx) => (
            <li key={idx}>
              <div className="d-flex flex-wrap align-items-center gap-1">
                {err.classificacao && (
                  <Badge
                    bg={err.classificacao.toLowerCase().includes('impeditivo') ? 'danger' : 'warning'}
                    text={err.classificacao.toLowerCase().includes('impeditivo') ? 'white' : 'dark'}
                    className="me-1"
                  >
                    {err.classificacao}
                  </Badge>
                )}
                {err.codigoErro && (
                  <code className="text-dark bg-white px-1 rounded border me-1">{err.codigoErro}</code>
                )}
                <span className="fw-semibold">{err.mensagem}</span>
              </div>
              {(err.campo || err.origem) && (
                <div className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>
                  {err.campo && (
                    <span className="me-3">
                      <strong>Campo:</strong> {err.campo}
                    </span>
                  )}
                  {err.origem && (
                    <span>
                      <strong>Valor informado:</strong> {err.origem}
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-0">
          O protocolo consta como <strong>{statusProtocolo}</strong> no TCESP. Consulte o protocolo para atualizar os detalhes.
        </p>
      )}
    </div>
  );
};

interface HistoricoProtocoloModalProps {
  show: boolean;
  onHide: () => void;
  protocolo?: string | null;
  codigoDocumento?: string;
  historico: HistoricoProtocoloItem[];
  loading?: boolean;
}

export const HistoricoProtocoloModal: React.FC<HistoricoProtocoloModalProps> = ({
  show,
  onHide,
  protocolo,
  codigoDocumento,
  historico,
  loading = false,
}) => {
  const renderStatusBadge = (status?: string | null) => {
    const st = (status || 'Recebido').toLowerCase();
    if (st.includes('armazenado')) {
      return (
        <Badge bg="success" className="d-inline-flex align-items-center gap-1">
          <CheckCircle2 size={12} /> {status}
        </Badge>
      );
    }
    if (st.includes('rejeitado')) {
      return (
        <Badge bg="danger" className="d-inline-flex align-items-center gap-1">
          <AlertTriangle size={12} /> {status}
        </Badge>
      );
    }
    return (
      <Badge bg="primary" className="d-inline-flex align-items-center gap-1">
        <FileCheck size={12} /> {status || 'Recebido'}
      </Badge>
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6 fw-bold d-flex align-items-center gap-2">
          <History size={18} className="text-primary" />
          <span>Histórico de Consultas de Protocolo AUDESP</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-wrap justify-content-between align-items-center bg-light p-2 rounded border mb-3 small">
          <div>
            <span className="text-muted">Documento: </span>
            <strong className="font-monospace">{codigoDocumento || '-'}</strong>
          </div>
          {protocolo && (
            <div>
              <span className="text-muted">Protocolo Atual: </span>
              <code className="fw-bold text-primary">{protocolo}</code>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4 text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Carregando histórico de consultas...
          </div>
        ) : historico.length === 0 ? (
          <div className="text-center py-4 text-muted small">
            <Clock size={32} className="mb-2 opacity-50" />
            <p className="mb-0">Nenhuma consulta de protocolo registrada até o momento para este documento.</p>
          </div>
        ) : (
          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <Table responsive hover size="sm" className="align-middle small mb-0">
              <thead className="table-light">
                <tr>
                  <th>Data / Hora da Consulta</th>
                  <th>Origem</th>
                  <th>Protocolo</th>
                  <th>Situação Retornada</th>
                  <th>Detalhes / Mensagens</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((item) => (
                  <tr key={item.id}>
                    <td className="text-nowrap">
                      <div className="fw-semibold">{formatDateTimeBR(item.created_at || undefined)}</div>
                      {item.data_hora_audesp && (
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          TCESP: {item.data_hora_audesp}
                        </div>
                      )}
                    </td>
                    <td>
                      <Badge
                        bg={item.origem === 'envio_automatico' ? 'info' : 'secondary'}
                        text={item.origem === 'envio_automatico' ? 'dark' : 'white'}
                      >
                        {item.origem === 'envio_automatico' ? 'Pós-Envio Automático' : 'Consulta Manual'}
                      </Badge>
                    </td>
                    <td className="font-monospace">{item.protocolo}</td>
                    <td>{renderStatusBadge(item.status_protocolo)}</td>
                    <td style={{ minWidth: '260px' }}>
                      {item.erros_detalhados && item.erros_detalhados.length > 0 ? (
                        <ul className="mb-0 ps-3 text-danger">
                          {item.erros_detalhados.map((err, i) => (
                            <li key={i}>
                              <strong>{err.mensagem}</strong>
                              {(err.campo || err.codigoErro || err.origem) && (
                                <span className="d-block text-muted" style={{ fontSize: '0.75rem' }}>
                                  {[
                                    err.classificacao ? `Tipo: ${err.classificacao}` : null,
                                    err.codigoErro ? `Cód: ${err.codigoErro}` : null,
                                    err.campo ? `Campo: ${err.campo}` : null,
                                    err.origem ? `Valor: ${err.origem}` : null,
                                  ]
                                    .filter(Boolean)
                                    .join(' | ')}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : item.erros_formatados && item.erros_formatados.length > 0 ? (
                        <ul className="mb-0 ps-3 text-danger">
                          {item.erros_formatados.map((msg, i) => (
                            <li key={i}>{msg}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-success d-inline-flex align-items-center gap-1">
                          <CheckCircle2 size={13} /> Sem erros ou inconsistências apontadas
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
