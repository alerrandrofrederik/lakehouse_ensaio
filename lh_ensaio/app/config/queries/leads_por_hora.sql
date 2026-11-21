-- Leads recebidos por hora do dia de referência vs. leads de compra imediata.
SELECT
  date_format(date_trunc('hour', recebido_em), 'HH:00')  AS hora,
  count(*)                                               AS recebidos,
  count_if(intencao = 'compra_imediata')                 AS compra_imediata
FROM lh_ensaio.gold.leads_classificados
WHERE recebido_em IS NOT NULL AND to_date(recebido_em) = dia_ref
GROUP BY 1
ORDER BY 1
