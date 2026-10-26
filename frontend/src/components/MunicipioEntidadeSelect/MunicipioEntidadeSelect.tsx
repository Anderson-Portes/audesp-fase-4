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
  // Entidades filtradas de acordo com o município selecionado (se houver correspondência)
  const entidadesFiltradas = entidadesList.filter(
    (e) => !municipio || e.municipio === Number(municipio)
  );

  const isMunicipioCadastrado = municipiosList.some((m) => m.codigo === Number(municipio));
  const isEntidadeCadastrada = entidadesList.some((e) => e.codigo === Number(entidade));

  return (
    <>
      <Col md={municipioColMd}>
        <Form.Group className="mb-2">
          <Form.Label className="form-label fw-bold small text-secondary">
            Município (AUDESP) *
          </Form.Label>
          <Form.Select
            size="sm"
            value={isMunicipioCadastrado ? municipio : (municipio ? 'CUSTOM' : '')}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'CUSTOM') {
                // Mantém o valor atual ou 0 para edição manual
              } else if (val) {
                const cod = Number(val);
                onMunicipioChange(cod);
                // Se a entidade atual não pertence ao novo município, reseta ou seleciona a primeira
                const possiveis = entidadesList.filter((ent) => ent.municipio === cod);
                if (possiveis.length > 0 && !possiveis.some((ent) => ent.codigo === entidade)) {
                  onEntidadeChange(possiveis[0].codigo);
                }
              }
            }}
            disabled={disabled}
            className="mb-1"
          >
            {municipiosList.length === 0 && (
              <option value={7107}>7107 - Santos (SP)</option>
            )}
            {municipiosList.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo} — {m.nome} ({m.uf})
              </option>
            ))}
            {!isMunicipioCadastrado && municipio ? (
              <option value="CUSTOM">Outro: Código {municipio}</option>
            ) : (
              <option value="CUSTOM">Outro (Digitar código manual)...</option>
            )}
          </Form.Select>

          {(!isMunicipioCadastrado || (!municipiosList.length && municipio !== 7107)) && (
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
            value={isEntidadeCadastrada ? entidade : (entidade ? 'CUSTOM' : '')}
            onChange={(e) => {
              const val = e.target.value;
              if (val !== 'CUSTOM' && val) {
                onEntidadeChange(Number(val));
              }
            }}
            disabled={disabled}
            className="mb-1"
          >
            {entidadesFiltradas.length === 0 && (
              <option value={10048}>10048 - PRODESAN (Santos)</option>
            )}
            {entidadesFiltradas.map((ent) => (
              <option key={ent.codigo} value={ent.codigo}>
                {ent.codigo} — {ent.nome}
              </option>
            ))}
            {/* Se houver entidades de outros municípios cadastradas mas não na lista filtrada */}
            {entidadesList
              .filter((ent) => ent.municipio !== Number(municipio))
              .map((ent) => (
                <option key={`ext-${ent.codigo}`} value={ent.codigo}>
                  {ent.codigo} — {ent.nome} (Mun. {ent.municipio})
                </option>
              ))}
            {!isEntidadeCadastrada && entidade ? (
              <option value="CUSTOM">Outra: Código {entidade}</option>
            ) : (
              <option value="CUSTOM">Outra (Digitar código manual)...</option>
            )}
          </Form.Select>

          {(!isEntidadeCadastrada || (!entidadesFiltradas.length && entidade !== 10048)) && (
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
