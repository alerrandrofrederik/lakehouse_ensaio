-- Silver · empresas: CNPJ só com dígitos, 1 linha por CNPJ.
CREATE OR REFRESH MATERIALIZED VIEW silver.empresas (
  CONSTRAINT cnpj_14_digitos EXPECT (length(cnpj) = 14)
)
COMMENT 'Base cadastral de empresas, normalizada por CNPJ'
AS
SELECT * EXCEPT (rn)
FROM (
  SELECT
    regexp_replace(cnpj, '[^0-9]', '')           AS cnpj,
    trim(razao_social)                           AS razao_social,
    lower(trim(porte))                           AS porte,
    trim(segmento)                               AS segmento,
    try_cast(num_funcionarios AS INT)            AS num_funcionarios,
    upper(trim(uf))                              AS uf,
    row_number() OVER (PARTITION BY regexp_replace(cnpj, '[^0-9]', '') ORDER BY _ingerido_em DESC, razao_social) AS rn
  FROM bronze.empresas
)
WHERE rn = 1;
