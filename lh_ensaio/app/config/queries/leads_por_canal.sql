-- Compra imediata por canal (marketing: canal que traz comprador, não só volume).
SELECT
  canal,
  count(*)                                                              AS total,
  count_if(intencao = 'compra_imediata')                                AS compra_imediata,
  round(100.0 * count_if(intencao = 'compra_imediata') / count(*), 1)   AS pct_compra_imediata
FROM lh_ensaio.gold.leads_classificados
GROUP BY canal
ORDER BY compra_imediata DESC, total DESC
