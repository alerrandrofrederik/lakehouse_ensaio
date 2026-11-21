-- Silver · leads: e-mail e CNPJ normalizados, data tipada, 1 linha por e-mail (a mensagem mais recente). RF-03, RF-04, RF-06.
CREATE OR REFRESH MATERIALIZED VIEW silver.leads (
  CONSTRAINT email_valido       EXPECT (email RLIKE '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT recebido_em_valido EXPECT (recebido_em IS NOT NULL),
  CONSTRAINT cnpj_valido        EXPECT (cnpj IS NULL OR cnpj_valido)
)
COMMENT 'Leads limpos e deduplicados por e-mail'
AS
WITH base AS (
  SELECT
    trim(lead_id)                                           AS lead_id,
    trim(nome)                                              AS nome,
    lower(trim(email))                                      AS email,
    trim(telefone)                                          AS telefone,
    nullif(regexp_replace(cnpj, '[^0-9]', ''), '')          AS cnpj,
    lower(trim(canal))                                      AS canal,
    trim(campanha)                                          AS campanha,
    trim(mensagem)                                          AS mensagem,
    try_to_timestamp(trim(recebido_em), 'yyyy-MM-dd HH:mm:ss') AS recebido_em,
    recebido_em                                             AS recebido_em_original,
    _arquivo,
    _ingerido_em
  FROM bronze.leads
),
dv AS (
  -- Dígitos verificadores do CNPJ (pesos 5..2,9..2 e 6..2,9..2)
  SELECT *,
    aggregate(sequence(1, 12), 0, (acc, i) -> acc + int(substr(cnpj, i, 1)) * element_at(array(5,4,3,2,9,8,7,6,5,4,3,2), i)) % 11   AS r1,
    aggregate(sequence(1, 13), 0, (acc, i) -> acc + int(substr(cnpj, i, 1)) * element_at(array(6,5,4,3,2,9,8,7,6,5,4,3,2), i)) % 11 AS r2
  FROM base
),
validado AS (
  SELECT * EXCEPT (r1, r2),
    cnpj IS NOT NULL
      AND length(cnpj) = 14
      AND NOT cnpj RLIKE '^(\d)\1{13}$'
      AND int(substr(cnpj, 13, 1)) = CASE WHEN r1 < 2 THEN 0 ELSE 11 - r1 END
      AND int(substr(cnpj, 14, 1)) = CASE WHEN r2 < 2 THEN 0 ELSE 11 - r2 END AS cnpj_valido
  FROM dv
)
SELECT * EXCEPT (rn)
FROM (
  SELECT *, row_number() OVER (PARTITION BY email ORDER BY recebido_em DESC NULLS LAST, lead_id DESC) AS rn
  FROM validado
)
WHERE rn = 1;
