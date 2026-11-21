-- Gold · Fila do Dia: os 20 leads de maior nota (sem spam/suporte), 5 por vendedor em rodízio. RF-11.
CREATE OR REFRESH MATERIALIZED VIEW gold.fila_do_dia (
  CONSTRAINT sem_spam_suporte EXPECT (intencao IN ('compra_imediata', 'avaliando'))
)
COMMENT 'Os 20 leads prioritários do dia, distribuídos entre os 4 vendedores'
AS
WITH ranking AS (
  SELECT *,
    row_number() OVER (ORDER BY nota DESC, recebido_em DESC NULLS LAST, lead_id) AS posicao
  FROM gold.leads_classificados
  WHERE elegivel_fila
)
SELECT
  r.dia_ref                AS data,
  r.posicao,
  v.vendedor_id,
  v.vendedor,
  r.* EXCEPT (posicao, dia_ref)
FROM ranking r
JOIN gold.vendedores v ON v.vendedor_id = ((r.posicao - 1) % 4) + 1
WHERE r.posicao <= 20;
