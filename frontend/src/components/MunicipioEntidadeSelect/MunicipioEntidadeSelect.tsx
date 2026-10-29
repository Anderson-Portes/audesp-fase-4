import React from 'react';
import { Col, Form } from 'react-bootstrap';
import type { MunicipioAudesp, EntidadeAudesp } from '../../types/audesp';

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
                onMunicipioChange(cod);

                // Ao mudar o município, filtra as entidades pertencentes a ele
                const possiveis = entidadesList.filter((ent) => ent.municipio === cod);
                if (possiveis.length > 0) {
                  onEntidadeChange(possiveis[0].codigo);
                  setCustomEntidadeMode(false);
                } else {
                  // Se o município não tem entidades cadastradas, zera a entidade
                  onEntidadeChange(0);
                  setCustomEntidadeMode(false);
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
              {isCustomMun ? `Outro: Código manual (${municipio || 'digitar'})` : 'Outro (Digitar código manual)...'}
            </option>
          </Form.Select>

          {isCustomMun && (
            <Form.Control
              type="number"
              size="sm"
              value={municipio || ''}
              onChange={(e) => onMunicipioChange(Number(e.target.value))}
              placeholder="Digite o código AUDESP do Município"
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
                onEntidadeChange(Number(val));
              }
            }}
            disabled={disabled}
            className="mb-1"
          >
            {entidadesFiltradas.length === 0 ? (
              <option value="">-- Nenhuma entidade cadastrada para este município --</option>
            ) : (
              entidadesFiltradas.map((ent) => (
                <option key={ent.codigo} value={ent.codigo}>
                  {ent.codigo} — {ent.nome}
                </option>
              ))
            )}
            <option value="CUSTOM">
              {isCustomEnt ? `Outra: Código manual (${entidade || 'digitar'})` : 'Outra (Digitar código manual)...'}
            </option>
          </Form.Select>

          {isCustomEnt && (
            <Form.Control
              type="number"
              size="sm"
              value={entidade || ''}
              onChange={(e) => onEntidadeChange(Number(e.target.value))}
              placeholder="Digite o código AUDESP da Entidade"
              disabled={disabled}
              className="mt-1"
            />
          )}
        </Form.Group>
      </Col>
    </>
  );
};
