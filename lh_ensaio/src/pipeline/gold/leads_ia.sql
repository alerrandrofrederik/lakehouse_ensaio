-- Gold · IA: ai_classify (intenção) e ai_extract (entidades) só em leads novos (streaming = incremental, CA-11). RF-07, RF-08.
-- Mensagem vazia ou com menos de 5 caracteres vira spam sem chamar a IA (custo zero).
CREATE OR REFRESH STREAMING TABLE gold.leads_ia
COMMENT 'Saída das AI Functions por lead (versão 2.1), processada uma única vez por lead'
AS
WITH base AS (
  SELECT
    trim(lead_id)                                  AS lead_id,
    trim(mensagem)                                 AS mensagem,
    length(trim(coalesce(mensagem, ''))) >= 5      AS ia_aplicada
  FROM STREAM(bronze.leads)
),
ia AS (
  SELECT *,
    CASE WHEN ia_aplicada THEN ai_classify(
      mensagem,
      '{
        "compra_imediata": "Pede preço, proposta, quantidade de licenças, prazo ou reunião comercial",
        "avaliando":       "Quer conhecer, comparar ou ver demo, sem urgência",
        "suporte":         "Já é cliente e relata problema ou dúvida de uso",
        "spam":            "Sem relação com compra"
      }',
      map('version', '2.1')
    ) END AS intencao_raw,
    CASE WHEN ia_aplicada THEN ai_extract(
      mensagem,
      '{
        "produto":            {"type": "string",  "description": "Produto Atlas citado"},
        "qtd_licencas":       {"type": "integer", "description": "Quantidade de licenças ou usuários"},
        "prazo":              {"type": "string",  "description": "Prazo ou data desejada"},
        "orcamento_aprovado": {"type": "boolean", "description": "Mencionou orçamento aprovado"},
        "cargo":              {"type": "string",  "description": "Cargo de quem escreveu"},
        "concorrente_citado": {"type": "string",  "description": "Concorrente mencionado"}
      }',
      map('version', '2.1')
    ) END AS entidades_raw
  FROM base
)
SELECT
  lead_id,
  mensagem,
  ia_aplicada,
  coalesce(intencao_raw:response[0].value::string, 'spam')   AS intencao,
  entidades_raw:response.produto.value::string                 AS produto,
  entidades_raw:response.qtd_licencas.value::int               AS qtd_licencas,
  entidades_raw:response.prazo.value::string                   AS prazo,
  entidades_raw:response.orcamento_aprovado.value::boolean     AS orcamento_aprovado,
  entidades_raw:response.cargo.value::string                   AS cargo,
  entidades_raw:response.concorrente_citado.value::string      AS concorrente_citado,
  intencao_raw,
  entidades_raw,
  '2.1'                                                        AS ai_versao,
  current_timestamp()                                          AS ia_processado_em
FROM ia;
