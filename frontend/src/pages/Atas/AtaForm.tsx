import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Form, 
  Button, 
  ButtonGroup, 
  Badge, 
  ListGroup, 
  Spinner,
  Card
} from 'react-bootstrap';
import { 
  Save, 
  Send, 
  ArrowLeft, 
  CheckSquare, 
  Square, 
  AlertCircle,
  RefreshCw,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/PageHeader/PageHeader';
import { CardBox } from '../../components/CardBox/CardBox';
import { MunicipioEntidadeSelect } from '../../components/MunicipioEntidadeSelect/MunicipioEntidadeSelect';
import { ataService } from '../../services/ataService';
import { editalService } from '../../services/editalService';
import type { Edital } from '../../types/edital';
import type { MunicipioAudesp, EntidadeAudesp } from '../../types/audesp';

export const AtaForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [editais, setEditais] = useState<Edital[]>([]);
  const [selectedEdital, setSelectedEdital] = useState<any>(null);
  const [municipiosList, setMunicipiosList] = useState<MunicipioAudesp[]>([]);
  const [entidadesList, setEntidadesList] = useState<EntidadeAudesp[]>([]);

  // Status de Transmissão / Protocolo
  const [ataStatus, setAtaStatus] = useState<'draft' | 'sent' | 'error'>('draft');
  const [protocolo, setProtocolo] = useState<string | null>(null);
  const [statusProtocolo, setStatusProtocolo] = useState<string | null>(null);
  const [detalhesProtocolo, setDetalhesProtocolo] = useState<any>(null);

  // Form State
  const [editalId, setEditalId] = useState<number | ''>('');
  const [municipio, setMunicipio] = useState<number>(7071);
  const [entidade, setEntidade] = useState<number>(11310);
  const [codigoEdital, setCodigoEdital] = useState('');
  const [codigoAta, setCodigoAta] = useState('');
  const [anoCompra, setAnoCompra] = useState<number>(new Date().getFullYear());
  const [retificacao, setRetificacao] = useState(false);

  const [numeroAtaRegistroPreco, setNumeroAtaRegistroPreco] = useState('');
  const [anoAta, setAnoAta] = useState<number>(new Date().getFullYear());
  const [dataAssinatura, setDataAssinatura] = useState('');
  const [dataVigenciaInicio, setDataVigenciaInicio] = useState('');
  const [dataVigenciaFim, setDataVigenciaFim] = useState('');

  // Itens selecionados da licitação/edital
  const [selectedItens, setSelectedItens] = useState<number[]>([]);

  // Carrega lista de editais para vinculação
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [dataEditais, doms] = await Promise.all([
          editalService.getEditais(),
          ataService.getDominios()
        ]);
        setEditais(dataEditais);
        if (doms?.municipios) setMunicipiosList(doms.municipios);
        if (doms?.entidades) setEntidadesList(doms.entidades);
      } catch {
        toast.error('Erro ao carregar dados iniciais da Ata.');
      }
    };
    loadInitialData();
  }, []);

  // Carrega ata se for edição
  useEffect(() => {
    if (isEditing && id) {
      const loadAta = async () => {
        try {
          setLoading(true);
          const { ata, documento } = await ataService.getAtaById(Number(id));
          
          setEditalId(ata.edital_id || '');
          setMunicipio(ata.municipio);
          setEntidade(ata.entidade);
          setCodigoEdital(ata.codigo_edital);
          setCodigoAta(ata.codigo_ata);
          setAnoCompra(ata.ano_compra);
          setRetificacao(ata.retificacao);

          setNumeroAtaRegistroPreco(ata.numero_ata_registro_preco);
          setAnoAta(ata.ano_ata);
          setAtaStatus(ata.status as any || 'draft');
          setProtocolo(ata.protocolo || null);
          setStatusProtocolo(ata.status_protocolo || null);
          try {
            setDetalhesProtocolo(ata.detalhes_protocolo ? JSON.parse(ata.detalhes_protocolo) : null);
          } catch {
            setDetalhesProtocolo(null);
          }
          setDataAssinatura(ata.data_assinatura ? String(ata.data_assinatura).split('T')[0] : '');
          setDataVigenciaInicio(ata.data_vigencia_inicio ? String(ata.data_vigencia_inicio).split('T')[0] : '');
          setDataVigenciaFim(ata.data_vigencia_fim ? String(ata.data_vigencia_fim).split('T')[0] : '');

          if (documento.numeroItem && Array.isArray(documento.numeroItem)) {
            setSelectedItens(documento.numeroItem);
          }

          if (ata.edital_id) {
            const ed = await editalService.getEdital(ata.edital_id);
            setSelectedEdital(ed);
          }
        } catch {
          toast.error('Erro ao carregar dados da Ata.');
          navigate('/atas');
        } finally {
          setLoading(false);
        }
      };
      loadAta();
    }
  }, [id, isEditing]);

  // Ao selecionar um edital de referência
  const handleSelectEdital = async (eId: number) => {
    setEditalId(eId);
    if (!eId) {
      setSelectedEdital(null);
      return;
    }
    try {
      const ed = await editalService.getEdital(eId);
      setSelectedEdital(ed);

      setMunicipio(ed.municipio);
      setEntidade(ed.entidade);
      setCodigoEdital(ed.codigo_edital);
      setAnoCompra(ed.ano_compra || new Date().getFullYear());

      // Pré-seleciona todos os itens do edital
      const itens = (ed as any).parsed_documento?.itensCompra || (ed as any).documento?.itensCompra;
      if (itens && Array.isArray(itens)) {
        setSelectedItens(itens.map((it: any) => it.numeroItem));
      }
    } catch {
      toast.error('Erro ao carregar itens do edital selecionado.');
    }
  };

  const toggleItem = (numItem: number) => {
    setSelectedItens((prev) =>
      prev.includes(numItem) ? prev.filter((i) => i !== numItem) : [...prev, numItem].sort((a, b) => a - b)
    );
  };

  const selectAllItens = () => {
    if (!selectedEdital) return;
    const itens = (selectedEdital as any).parsed_documento?.itensCompra || (selectedEdital as any).documento?.itensCompra;
    if (itens && Array.isArray(itens)) {
      setSelectedItens(itens.map((it: any) => it.numeroItem));
    }
  };

  const unselectAllItens = () => {
    setSelectedItens([]);
  };

  const handleSalvar = async (transmitirAposSalvar: boolean = false) => {
    if (!codigoEdital) {
      toast.error('Informe o Código do Edital de referência.');
      return;
    }
    if (!numeroAtaRegistroPreco) {
      toast.error('Informe o Número da Ata de Registro de Preço.');
      return;
    }
    if (numeroAtaRegistroPreco.trim().length > 30) {
      toast.error('O Número da Ata de Registro de Preço não pode exceder 30 caracteres.');
      return;
    }
    if (!anoAta) {
      toast.error('Informe o Ano da Ata.');
      return;
    }
    if (!dataAssinatura || !dataVigenciaInicio || !dataVigenciaFim) {
      toast.error('Informe a data de assinatura e o período de vigência.');
      return;
    }
    if (dataVigenciaFim < dataVigenciaInicio) {
      toast.error('A data de fim de vigência não pode ser menor que a data de início.');
      return;
    }
    if (selectedItens.length === 0) {
      toast.error('Selecione ao menos um item da licitação vinculado à ata.');
      return;
    }

    const codAtaFinal = codigoAta || `ATA-${numeroAtaRegistroPreco}/${anoAta}`;
    if (codAtaFinal.trim().length > 31) {
      toast.error('Código único da Ata (codigoAta) deve ter no máximo 31 caracteres.');
      return;
    }

    const documentoJSON = {
      descritor: {
        municipio: Number(municipio),
        entidade: Number(entidade),
        codigoEdital: codigoEdital.trim(),
        codigoAta: codAtaFinal.trim(),
        anoCompra: Number(anoCompra),
        retificacao: Boolean(retificacao)
      },
      numeroItem: selectedItens,
      numeroAtaRegistroPreco: numeroAtaRegistroPreco.trim(),
      anoAta: Number(anoAta),
      dataAssinatura,
      dataVigenciaInicio,
      dataVigenciaFim
    };

    const payload = {
      id: isEditing ? Number(id) : undefined,
      edital_id: editalId ? Number(editalId) : undefined,
      documento: documentoJSON
    };

    try {
      setSaving(true);
      const resAta = await ataService.salvarAta(payload);
      toast.success(isEditing ? 'Ata atualizada com sucesso!' : 'Ata criada com sucesso!');

      if (transmitirAposSalvar) {
        setSending(true);
        toast.loading('Transmitindo para o AUDESP...', { id: 'transmissao' });
        const resEnvio = await ataService.enviarAta(resAta.id);
        toast.dismiss('transmissao');
        setSending(false);
        if (resEnvio.sucesso) {
          toast.success(`Ata transmitida! Protocolo: ${resEnvio.protocolo}`);
          navigate('/atas');
        } else {
          toast.error(resEnvio.mensagem || 'Falha na transmissão da ata.');
          navigate(`/atas/${resAta.id}`);
        }
      } else {
        if (!isEditing) {
          navigate(`/atas/${resAta.id}`);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao salvar ata.';
      toast.error(msg);
    } finally {
      setSaving(false);
      setSending(false);
    }
  };

  const handleConsultarProtocolo = async () => {
    if (!id) return;
    try {
      setSending(true);
      const res = await ataService.consultarProtocolo(Number(id));
      if (res.sucesso) {
        setStatusProtocolo(res.status);
        setDetalhesProtocolo(res.detalhes);
        toast.success(`Status atualizado: ${res.status}`);
      } else {
        toast.error(res.mensagem || 'Erro ao consultar protocolo.');
      }
    } catch {
      toast.error('Falha ao consultar protocolo no AUDESP');
    } finally {
      setSending(false);
    }
  };

  const handleRetornarRascunho = async () => {
    if (!id) return;
    if (!window.confirm('Deseja retornar esta ata para rascunho para corrigir eventuais dados?')) {
      return;
    }
    try {
      setLoading(true);
      await ataService.retornarRascunho(Number(id));
      setAtaStatus('draft');
      toast.success('Ata retornada para rascunho com sucesso!');
    } catch {
      toast.error('Erro ao retornar ata para rascunho');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container fluid className="p-4 text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Carregando dados da Ata...</p>
      </Container>
    );
  }

  const isSent = ataStatus === 'sent';
  const itensCompra = selectedEdital?.parsed_documento?.itensCompra || selectedEdital?.documento?.itensCompra;

  return (
    <Container fluid className="p-0 pb-5">
      <PageHeader
        title={isSent ? 'Ata Transmitida (Fase IV)' : id ? `Editar Ata: ${numeroAtaRegistroPreco}/${anoAta}` : 'Nova Ata de Registro de Preço (ARP)'}
        actions={
          <button
            onClick={() => navigate('/atas')}
            className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
          >
            <ArrowLeft size={16} /> Voltar à Lista
          </button>
        }
      />

      {/* Protocol Banner if Sent */}
      {isSent && (
        <div className={`alert ${statusProtocolo?.toLowerCase().includes('rejeitado') ? 'alert-danger' : 'alert-success'} d-flex justify-content-between align-items-center shadow-sm mb-4`}>
          <div>
            <h5 className="alert-heading mb-1 d-flex align-items-center gap-2">
              <CheckCircle2 size={20} /> Protocolo AUDESP: <strong>{protocolo}</strong>
            </h5>
            <p className="mb-0 small">
              Situação no Tribunal de Contas: <strong>{statusProtocolo || 'Recebido'}</strong>
            </p>
            {detalhesProtocolo?.erros?.length > 0 && (
              <div className="mt-2 pt-2 border-top border-danger-subtle small">
                <strong>Erros / Notificações do TCESP:</strong>
                <ul className="mb-0 ps-3 mt-1">
                  {detalhesProtocolo.erros.map((err: any, idx: number) => (
                    <li key={idx}>{err.mensagem || err.campo || JSON.stringify(err)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <span className="badge bg-white text-dark fs-6 px-3 py-2 border">
            Fase IV — TCESP
          </span>
        </div>
      )}

      <Row className="g-4">
        {/* Coluna 1: Dados do Descritor e Vinculação com Form Controls de React-Bootstrap */}
        <Col lg={6}>
          <CardBox title="1. Edital e Identificadores do TCESP">
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Vincular a um Edital Cadastrado (Opcional):</Form.Label>
              <Form.Select
                value={editalId}
                onChange={(e) => handleSelectEdital(Number(e.target.value))}
              >
                <option value="">-- Selecione um edital para autopreenchimento --</option>
                {editais.map((ed) => (
                  <option key={ed.id} value={ed.id}>
                    {ed.codigo_edital} - {ed.numero_compra}/{ed.ano_compra} ({ed.objeto_compra ? ed.objeto_compra.substring(0, 60) + '...' : ''})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Código do Edital: *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ex: PREG-01/2026"
                    maxLength={30}
                    value={codigoEdital}
                    onChange={(e) => setCodigoEdital(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Ano da Compra/Contratação: *</Form.Label>
                  <Form.Control
                    type="number"
                    value={anoCompra}
                    onChange={(e) => setAnoCompra(Number(e.target.value))}
                    required
                  />
                </Form.Group>
              </Col>

              <MunicipioEntidadeSelect
                municipio={municipio}
                entidade={entidade}
                onMunicipioChange={setMunicipio}
                onEntidadeChange={setEntidade}
                municipiosList={municipiosList}
                entidadesList={entidadesList}
                disabled={retificacao}
                municipioColMd={6}
                entidadeColMd={6}
              />

              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Código Único da Ata: *</Form.Label>
                  <Form.Control
                    type="text"
                    className="font-monospace"
                    placeholder="Ex: ATA-10/2026 (gerado automaticamente se vazio)"
                    maxLength={31}
                    value={codigoAta}
                    onChange={(e) => setCodigoAta(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Identificador unívoco da ata no TCESP (campo <code>codigoAta</code>).
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Check
                  type="switch"
                  id="chkRetificacao"
                  label="Esta remessa é uma Retificação de Ata já enviada anteriormente"
                  checked={retificacao}
                  onChange={(e) => setRetificacao(e.target.checked)}
                  className="fw-medium mt-2"
                />
              </Col>
            </Row>
          </CardBox>

          {/* Dados da Ata */}
          <div className="mt-4">
            <CardBox title="2. Dados da Ata de Registro de Preços">
              <Row className="g-3">
                <Col md={8}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Número da Ata no Sistema de Origem: *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: 014/2026 ou 14"
                      maxLength={30}
                      value={numeroAtaRegistroPreco}
                      onChange={(e) => setNumeroAtaRegistroPreco(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Ano da Ata: *</Form.Label>
                    <Form.Control
                      type="number"
                      value={anoAta}
                      onChange={(e) => setAnoAta(Number(e.target.value))}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Data de Assinatura: *</Form.Label>
                    <Form.Control
                      type="date"
                      value={dataAssinatura}
                      onChange={(e) => setDataAssinatura(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Início da Vigência: *</Form.Label>
                    <Form.Control
                      type="date"
                      value={dataVigenciaInicio}
                      onChange={(e) => setDataVigenciaInicio(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="fw-bold">Fim da Vigência: *</Form.Label>
                    <Form.Control
                      type="date"
                      value={dataVigenciaFim}
                      onChange={(e) => setDataVigenciaFim(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
            </CardBox>
          </div>
        </Col>

        {/* Coluna 2: Itens da Licitação Vinculados à Ata */}
        <Col lg={6}>
          <CardBox 
            title="3. Itens da Contratação Vinculados à Ata"
            actions={
              itensCompra && itensCompra.length > 0 && (
                <ButtonGroup size="sm">
                  <Button variant="outline-primary" onClick={selectAllItens}>
                    Marcar Todos
                  </Button>
                  <Button variant="outline-secondary" onClick={unselectAllItens}>
                    Desmarcar Todos
                  </Button>
                </ButtonGroup>
              )
            }
          >
            {itensCompra && itensCompra.length > 0 ? (
              <div>
                <p className="text-muted small mb-3">
                  Selecione quais itens do edital <strong>{codigoEdital}</strong> fazem parte desta Ata de Registro de Preços:
                </p>
                <ListGroup style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  {itensCompra.map((item: any) => {
                    const checked = selectedItens.includes(item.numeroItem);
                    return (
                      <ListGroup.Item
                        key={item.numeroItem}
                        action
                        active={checked}
                        onClick={() => toggleItem(item.numeroItem)}
                        className="d-flex align-items-start gap-3 p-3 cursor-pointer"
                      >
                        <div className={`mt-1 ${checked ? 'text-white' : 'text-primary'}`}>
                          {checked ? <CheckSquare size={20} /> : <Square size={20} className="text-muted" />}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Item {item.numeroItem}</span>
                            <Badge bg={checked ? 'light' : 'secondary'} text={checked ? 'dark' : undefined}>
                              {item.materialOuServico === 'M' ? 'Material' : 'Serviço'}
                            </Badge>
                          </div>
                          <p className={`mb-1 small ${checked ? 'text-white' : 'text-dark'}`}>{item.descricao}</p>
                          <div className={`d-flex gap-3 small ${checked ? 'text-light' : 'text-muted'}`}>
                            <span>Qtd: <strong>{item.quantidade}</strong> {item.unidadeMedida}</span>
                            {item.valorUnitarioEstimado && (
                              <span>Unitário: <strong>R$ {Number(item.valorUnitarioEstimado).toFixed(2)}</strong></span>
                            )}
                          </div>
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
                <div className="mt-3 p-2 bg-light rounded text-muted small d-flex justify-content-between align-items-center">
                  <span>Itens selecionados para esta ata:</span>
                  <Badge bg="primary" className="fs-6">{selectedItens.length} de {itensCompra.length}</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 text-muted">
                <AlertCircle size={36} className="mb-2 opacity-50 text-warning" />
                <p className="fw-medium mb-1">Nenhum edital selecionado ou sem itens carregados.</p>
                <small className="d-block mb-3">
                  Selecione um Edital no passo 1 ou adicione manualmente os números dos itens abaixo:
                </small>
                
                {/* Fallback de inserção manual de números de item */}
                <Card body className="text-start bg-light">
                  <Form.Group>
                    <Form.Label className="fw-bold small">
                      Números dos itens (separados por vírgula):
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Ex: 1, 2, 3, 4"
                      value={selectedItens.join(', ')}
                      onChange={(e) => {
                        const nums = e.target.value
                          .split(',')
                          .map((s) => parseInt(s.trim()))
                          .filter((n) => !isNaN(n) && n > 0);
                        setSelectedItens(Array.from(new Set(nums)));
                      }}
                    />
                    <Form.Text className="text-muted mt-1">
                      Ex: 1, 2, 5 (números dos itens vencedores do SRP)
                    </Form.Text>
                  </Form.Group>
                </Card>
              </div>
            )}
          </CardBox>
        </Col>
      </Row>

      {/* Botões de Ação no Final do Formulário */}
      <div className="card shadow-sm border-0 mt-4 p-3 bg-white">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/atas')}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
          >
            <ArrowLeft size={16} /> Voltar à Lista
          </button>

          <div className="d-flex align-items-center gap-2">
            {!isSent ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSalvar(false)}
                  disabled={saving || sending}
                  className="btn btn-outline-success fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                >
                  <Save size={16} /> {saving ? 'Salvando...' : 'Salvar Rascunho'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSalvar(true)}
                  disabled={saving || sending}
                  className="btn btn-warning text-dark fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                >
                  <Send size={16} /> {sending ? 'Transmitindo...' : 'Transmitir à AUDESP'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleConsultarProtocolo}
                  disabled={sending}
                  className="btn btn-outline-primary fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                >
                  <RefreshCw size={16} className={sending ? 'spin' : ''} /> Atualizar Status
                </button>
                {statusProtocolo?.toLowerCase().includes('rejeitado') && (
                  <button
                    type="button"
                    onClick={handleRetornarRascunho}
                    className="btn btn-warning text-dark fw-bold btn-sm d-flex align-items-center gap-1 shadow-sm"
                  >
                    <RotateCcw size={16} /> Corrigir e Reenviar
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};
