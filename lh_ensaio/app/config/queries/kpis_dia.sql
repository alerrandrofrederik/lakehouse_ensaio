-- KPIs do dia: funil recebidos -> classificados -> na fila -> contatados.
-- @param atualizacao INT = 0
WITH fila AS (SELECT lead_id FROM lh_ensaio.gold.fila_do_dia),
contatos AS (SELECT DISTINCT lead_id FROM lh_ensaio.gold.feedback_contatos)
SELECT
  (SELECT count(*) FROM lh_ensaio.bronze.leads)                                        AS recebidos,
  (SELECT count(*) FROM lh_ensaio.gold.leads_classificados)                            AS classificados,
  (SELECT count(*) FROM fila)                                                          AS na_fila,
  (SELECT count(*) FROM fila f JOIN contatos c ON c.lead_id = f.lead_id)               AS contatados,
  (SELECT count_if(intencao = 'compra_imediata') FROM lh_ensaio.gold.leads_classificados) AS compra_imediata,
  (SELECT count(*) FROM lh_ensaio.gold.leads_classificados
    WHERE intencao = 'compra_imediata' AND lead_id NOT IN (SELECT lead_id FROM fila))  AS compra_imediata_fora,
  (SELECT CAST(max(dia_ref) AS STRING) FROM lh_ensaio.gold.leads_classificados)        AS dia_ref,
  (SELECT CAST(max(processado_em) AS STRING) FROM lh_ensaio.gold.leads_classificados)  AS atualizado_em,
  :atualizacao                                                                         AS atualizacao
