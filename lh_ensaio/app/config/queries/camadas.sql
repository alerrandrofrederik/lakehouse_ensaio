-- Contagem de linhas por camada do medalhão (tela Plataforma).
SELECT 1 AS ordem, 'Bronze' AS camada, 'bronze.leads' AS tabela, count(*) AS linhas FROM lh_ensaio.bronze.leads
UNION ALL SELECT 2, 'Silver', 'silver.leads_enriquecidos', count(*) FROM lh_ensaio.silver.leads_enriquecidos
UNION ALL SELECT 3, 'Gold', 'gold.leads_classificados', count(*) FROM lh_ensaio.gold.leads_classificados
UNION ALL SELECT 4, 'Gold', 'gold.fila_do_dia', count(*) FROM lh_ensaio.gold.fila_do_dia
UNION ALL SELECT 5, 'Gold', 'gold.feedback_contatos', count(*) FROM lh_ensaio.gold.feedback_contatos
ORDER BY ordem
