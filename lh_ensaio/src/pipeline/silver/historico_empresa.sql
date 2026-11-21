-- Silver · histórico comercial agregado por empresa (base do bônus de cross-sell).
CREATE OR REFRESH MATERIALIZED VIEW silver.historico_empresa
COMMENT 'Oportunidades do CRM agregadas por CNPJ'
AS
WITH op AS (
  SELECT * EXCEPT (rn)
  FROM (
    SELECT
      trim(oportunidade_id)                       AS oportunidade_id,
      regexp_replace(cnpj, '[^0-9]', '')          AS cnpj,
      trim(produto)                               AS produto,
      lower(trim(status))                         AS status,
      try_cast(valor AS DECIMAL(18,2))            AS valor,
      try_to_date(data)                           AS data,
      row_number() OVER (PARTITION BY trim(oportunidade_id) ORDER BY _ingerido_em DESC) AS rn
    FROM bronze.oportunidades
  )
  WHERE rn = 1
)
SELECT
  cnpj,
  count(*)                                                         AS qtd_oportunidades,
  count_if(status = 'ganha')                                       AS qtd_ganhas,
  count_if(status = 'aberta')                                      AS qtd_abertas,
  count_if(status = 'perdida')                                     AS qtd_perdidas,
  coalesce(sum(CASE WHEN status = 'ganha' THEN valor END), 0)      AS valor_ganho,
  array_sort(collect_set(CASE WHEN status = 'ganha' THEN produto END)) AS produtos_contratados,
  count_if(status = 'ganha') > 0                                   AS ja_cliente,
  max(data)                                                        AS ultima_oportunidade
FROM op
GROUP BY cnpj;
