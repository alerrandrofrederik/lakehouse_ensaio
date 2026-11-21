-- Gold · todos os leads com intenção, entidades, nota 0–100 explicável, motivo e próximo passo. RF-09, RF-10, RF-12.
-- nota = 0,50 × intenção + 0,25 × perfil + 0,15 × sinais + 0,10 × recência  (PRD 2.7)
-- Recência relativa ao dia de referência (último dia com leads), para a demo funcionar com os dados de 17/11.
CREATE OR REFRESH MATERIALIZED VIEW gold.leads_classificados (
  CONSTRAINT nota_0_100 EXPECT (nota BETWEEN 0 AND 100)
)
COMMENT 'Todos os leads classificados pela IA, com nota de prioridade e componentes'
AS
WITH ref AS (
  SELECT max(to_date(recebido_em)) AS dia_ref FROM silver.leads
),
base AS (
  SELECT
    l.*,
    ia.intencao, ia.produto, ia.qtd_licencas, ia.prazo, ia.orcamento_aprovado, ia.cargo, ia.concorrente_citado,
    ia.ia_aplicada, ia.ai_versao,
    r.dia_ref
  FROM silver.leads_enriquecidos l
  JOIN gold.leads_ia ia ON ia.lead_id = l.lead_id
  CROSS JOIN ref r
),
comp AS (
  SELECT *,
    CASE intencao WHEN 'compra_imediata' THEN 100 WHEN 'avaliando' THEN 40 ELSE 0 END AS c_intencao,
    least(100,
      CASE porte WHEN 'grande' THEN 100 WHEN 'médio' THEN 60 WHEN 'medio' THEN 60 WHEN 'pequeno' THEN 30 ELSE 20 END
      + CASE WHEN ja_cliente THEN 20 ELSE 0 END)                                       AS c_perfil,
    least(100,
      CASE WHEN orcamento_aprovado THEN 40 ELSE 0 END
      + CASE WHEN prazo IS NOT NULL THEN 30 ELSE 0 END
      + CASE WHEN qtd_licencas IS NOT NULL THEN 30 ELSE 0 END)                         AS c_sinais,
    CASE datediff(dia_ref, to_date(recebido_em))
      WHEN 0 THEN 100 WHEN 1 THEN 50 WHEN 2 THEN 25 ELSE 0 END                         AS c_recencia
  FROM base
)
SELECT
  lead_id, nome, email, telefone, cnpj, empresa, canal, campanha,
  porte, segmento, uf, num_funcionarios, ja_cliente, produtos_contratados,
  mensagem,
  intencao,
  produto, qtd_licencas, prazo, orcamento_aprovado, cargo, concorrente_citado,
  CAST(CASE WHEN intencao = 'spam' THEN 0
            ELSE round(0.50 * c_intencao + 0.25 * c_perfil + 0.15 * c_sinais + 0.10 * c_recencia) END AS INT) AS nota,
  named_struct('intencao', c_intencao, 'perfil', c_perfil, 'sinais', c_sinais, 'recencia', c_recencia)    AS nota_componentes,
  intencao IN ('compra_imediata', 'avaliando')                                                             AS elegivel_fila,
  concat_ws(' · ',
    CASE WHEN qtd_licencas IS NOT NULL THEN concat('Pediu ', qtd_licencas, ' licenças', coalesce(concat(' do ', produto), ''))
         WHEN produto IS NOT NULL      THEN concat('Interesse em ', produto) END,
    CASE WHEN prazo IS NOT NULL THEN concat('prazo: ', prazo) END,
    CASE WHEN orcamento_aprovado THEN 'orçamento aprovado' END,
    cargo,
    CASE WHEN porte <> 'desconhecido' THEN concat('empresa ', porte) END,
    CASE WHEN ja_cliente THEN concat('já é cliente (', array_join(produtos_contratados, ', '), ')') END,
    CASE WHEN concorrente_citado IS NOT NULL THEN concat('citou ', concorrente_citado) END
  )                                                                                                         AS motivo,
  CASE intencao
    WHEN 'spam'    THEN 'Descartar'
    WHEN 'suporte' THEN 'Encaminhar ao suporte'
    WHEN 'compra_imediata' THEN
      CASE WHEN ja_cliente THEN 'Ligar hoje: proposta de expansão (cross-sell)'
           WHEN qtd_licencas IS NOT NULL OR orcamento_aprovado THEN 'Ligar hoje e enviar proposta'
           ELSE 'Ligar hoje para qualificar e agendar reunião' END
    WHEN 'avaliando' THEN 'Agendar demonstração'
  END                                                                                                       AS proximo_passo,
  ia_aplicada, ai_versao,
  dia_ref,
  recebido_em,
  current_timestamp()                                                                                       AS processado_em
FROM comp;
