-- Distribuição dos leads por intenção classificada pela IA.
SELECT intencao, count(*) AS leads
FROM lh_ensaio.gold.leads_classificados
GROUP BY intencao
ORDER BY leads DESC
