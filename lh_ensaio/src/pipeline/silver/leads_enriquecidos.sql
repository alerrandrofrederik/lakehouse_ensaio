-- Silver · lead + empresa + histórico (RF-05).
CREATE OR REFRESH MATERIALIZED VIEW silver.leads_enriquecidos
COMMENT 'Lead unido à empresa (por CNPJ) e ao histórico comercial da empresa'
AS
SELECT
  l.lead_id, l.nome, l.email, l.telefone, l.cnpj, l.cnpj_valido,
  l.canal, l.campanha, l.mensagem, l.recebido_em,
  e.razao_social                                AS empresa,
  coalesce(e.porte, 'desconhecido')             AS porte,
  e.segmento, e.num_funcionarios, e.uf,
  coalesce(h.ja_cliente, false)                 AS ja_cliente,
  coalesce(h.qtd_ganhas, 0)                     AS qtd_ganhas,
  coalesce(h.produtos_contratados, array())     AS produtos_contratados
FROM silver.leads l
LEFT JOIN silver.empresas e          ON e.cnpj = l.cnpj
LEFT JOIN silver.historico_empresa h ON h.cnpj = l.cnpj;
