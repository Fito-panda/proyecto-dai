/**
 * Types.gs — enums compartidos.
 * Apps Script no tiene módulos; todo es global. Convención: un objeto por concepto.
 */

const FIELD_TYPES = Object.freeze({
  SHORT_TEXT: 'SHORT_TEXT',
  PARAGRAPH: 'PARAGRAPH',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  CHECKBOX: 'CHECKBOX',
  DROPDOWN: 'DROPDOWN',
  DATE: 'DATE',
  DATETIME: 'DATETIME',
  TIME: 'TIME',
  SCALE: 'SCALE',
  FILE_UPLOAD: 'FILE_UPLOAD',
  SECTION_HEADER: 'SECTION_HEADER'
});

const PHASES = Object.freeze({
  ALL: 'all',
  ARRANQUE: 'arranque',
  PEDAGOGICA: 'pedagogica',
  INSTITUCIONAL: 'institucional',
  COMUNICACION: 'comunicacion',
  COOPERADORA: 'cooperadora',
  ADMIN: 'admin'
});

const ARTIFACT_STATUS = Object.freeze({
  CREATED: 'created',
  REUSED: 'reused',
  FAILED: 'failed',
  SKIPPED: 'skipped'
});
