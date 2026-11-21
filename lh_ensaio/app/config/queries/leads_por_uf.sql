-- Leads por UF da empresa (leads sem empresa identificada ficam em "Sem empresa").
SELECT
  coalesce(uf, 'Sem empresa')               AS uf,
  count(*)                                  AS leads,
  count_if(intencao = 'compra_imediata')    AS compra_imediata
FROM lh_ensaio.gold.leads_classificados
GROUP BY 1
ORDER BY leads DESC
LIMIT 8
