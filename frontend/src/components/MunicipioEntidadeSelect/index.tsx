import React from 'react';
import { Col, Form } from 'react-bootstrap';
import type { MunicipioAudesp, EntidadeAudesp } from '../../types/audesp';

const STORAGE_KEY_MUNICIPIO = 'audesp_default_municipio';
const STORAGE_KEY_ENTIDADE = 'audesp_default_entidade';

export function getSavedMunicipio(fallback: number = 7071): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MUNICIPIO);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getSavedEntidade(fallback: number = 11310): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENTIDADE);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveDefaultMunicipioEntidade(municipio?: number, entidade?: number): void {
  try {
    if (municipio && Number.isFinite(municipio) && municipio > 0) {
      localStorage.setItem(STORAGE_KEY_MUNICIPIO, String(municipio));
    }
    if (entidade && Number.isFinite(entidade) && entidade > 0) {
      localStorage.setItem(STORAGE_KEY_ENTIDADE, String(entidade));
    }
  } catch {
    // ignore storage errors
  }
}

interface MunicipioEntidadeSelectProps {
  municipio: number;
  entidade: number;
  onMunicipioChange: (municipio: number) => void;
  onEntidadeChange: (entidade: number) => void;
  municipiosList?: MunicipioAudesp[];
  entidadesList?: EntidadeAudesp[];
  disabled?: boolean;
  municipioColMd?: number;
  entidadeColMd?: number;
}

export const MunicipioEntidadeSelect: React.FC<MunicipioEntidadeSelectProps> = ({
  municipio,
  entidade,
  onMunicipioChange,
  onEntidadeChange,
  municipiosList = [],
  entidadesList = [],
  disabled = false,
  municipioColMd = 6,
  entidadeColMd = 6
}) => {
  // Entidades pertencentes estritamente ao município selecionado
  const entidadesFiltradas = entidadesList.filter(
    (e) => e.municipio === Number(municipio)
  );

  const isMunicipioCadastrado = municipiosList.some((m) => m.codigo === Number(municipio));
  const isEntidadeCadastrada = entidadesFiltradas.some((e) => e.codigo === Number(entidade));

  const [customMunicipioMode, setCustomMunicipioMode] = React.useState(false);
  const [customEntidadeMode, setCustomEntidadeMode] = React.useState(false);

  const isCustomMun = customMunicipioMode || (!isMunicipioCadastrado && Boolean(municipio));
  const isCustomEnt = customEntidadeMode || (!isEntidadeCadastrada && Boolean(entidade));

  const handleMunChange = (cod: number) => {
    onMunicipioChange(cod);
    saveDefaultMunicipioEntidade(cod, undefined);
  };

  const handleEntChange = (cod: number) => {
    onEntidadeChange(cod);
    saveDefaultMunicipioEntidade(undefined, cod);
  };

  return (
    <>
      <Col md={municipioColMd}>
        <Form.Group className="mb-2">
          <Form.Label className="form-label fw-bold small text-secondary">
            Município (AUDESP) *
          </Form.Label>
          <Form.Select
            size="sm"
            value={isCustomMun ? 'CUSTOM' : (municipio || '')}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'CUSTOM') {
                setCustomMunicipioMode(true);
              } else if (val) {
                setCustomMunicipioMode(false);
                const cod = Number(val);
                handleMunChange(cod);

                // Ao mudar o município, filtra as entidades pertencentes a ele
                const possiveis = entidadesList.filter((ent) => ent.municipio === cod);
                if (possiveis.length > 0) {
                  handleEntChange(possiveis[0].codigo);
                  setCustomEntidadeMode(false);
                } else {
                  // Se o município não tem entidades cadastradas, abre modo manual de código
                  onEntidadeChange(0);
                  setCustomEntidadeMode(true);
                }
              }
            }}
            disabled={disabled}
            className="mb-1"
          >
            {municipiosList.length === 0 && (
              <option value={7071}>7071 - Santos (SP)</option>
            )}
            {municipiosList.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo} — {m.nome} ({m.uf})
              </option>
            ))}
            <option value="CUSTOM">
              {isCustomMun ? `Outro: Código manual (${municipio || 'digitar'})` : 'Outro (Digitar código manual 1-9999)...'}
            </option>
          </Form.Select>

          {isCustomMun && (
            <Form.Control
              type="number"
              size="sm"
              min={1}
              max={9999}
              value={municipio || ''}
              onChange={(e) => handleMunChange(Number(e.target.value))}
              placeholder="Digite o código AUDESP do Município (1 a 9999)"
              disabled={disabled}
              className="mt-1"
            />
          )}
        </Form.Group>
      </Col>

      <Col md={entidadeColMd}>
        <Form.Group className="mb-2">
          <Form.Label className="form-label fw-bold small text-secondary">
            Entidade (AUDESP) *
          </Form.Label>
          <Form.Select
            size="sm"
            value={isCustomEnt ? 'CUSTOM' : (entidade || '')}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'CUSTOM') {
                setCustomEntidadeMode(true);
              } else if (val === '') {
                setCustomEntidadeMode(false);
                onEntidadeChange(0);
              } else if (val) {
                setCustomEntidadeMode(false);
                handleEntChange(Number(val));
              }
            }}
            disabled={disabled}
            className="mb-1"
          >
            {entidadesFiltradas.length === 0 ? (
              <option value="">-- Nenhuma entidade pré-cadastrada para este município --</option>
            ) : (
              entidadesFiltradas.map((ent) => (
                <option key={ent.codigo} value={ent.codigo}>
                  {ent.codigo} — {ent.nome}
                </option>
              ))
            )}
            <option value="CUSTOM">
              {isCustomEnt ? `Outra: Código manual (${entidade || 'digitar'})` : 'Outra (Digitar código manual 1-99999)...'}
            </option>
          </Form.Select>

          {isCustomEnt && (
            <Form.Control
              type="number"
              size="sm"
              min={1}
              max={99999}
              value={entidade || ''}
              onChange={(e) => handleEntChange(Number(e.target.value))}
              placeholder="Digite o código AUDESP da Entidade (1 a 99999)"
              disabled={disabled}
              className="mt-1"
            />
          )}
        </Form.Group>
      </Col>
    </>
  );
};
