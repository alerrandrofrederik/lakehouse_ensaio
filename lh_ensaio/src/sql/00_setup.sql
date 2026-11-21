-- Setup fora do pipeline (rodar uma vez no SQL Warehouse).
-- Tabela de feedback: o app escreve aqui quando o vendedor marca o lead como contatado (RF-14).
CREATE TABLE IF NOT EXISTS lh_ensaio.gold.feedback_contatos (
  lead_id       STRING    NOT NULL COMMENT 'Lead contatado',
  vendedor      STRING    NOT NULL COMMENT 'Vendedor que fez o contato',
  contatado_em  TIMESTAMP NOT NULL COMMENT 'Quando o contato foi registrado',
  resultado     STRING             COMMENT 'Resultado do contato (opcional)'
)
COMMENT 'Feedback do time comercial: leads marcados como contatados no app';
