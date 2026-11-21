-- Fila do Dia com status de contato. vendedor = '' traz a fila inteira.
-- @param vendedor STRING = Ana Lima
-- @param atualizacao INT = 0
SELECT
  f.posicao,
  f.vendedor,
  f.lead_id,
  f.nome,
  f.email,
  f.telefone,
  coalesce(f.empresa, 'Empresa não identificada')  AS empresa,
  f.canal,
  f.porte,
  f.uf,
  f.intencao,
  f.produto,
  f.qtd_licencas,
  f.prazo,
  f.orcamento_aprovado,
  f.cargo,
  f.concorrente_citado,
  f.nota,
  f.nota_componentes.intencao                      AS c_intencao,
  f.nota_componentes.perfil                        AS c_perfil,
  f.nota_componentes.sinais                        AS c_sinais,
  f.nota_componentes.recencia                      AS c_recencia,
  f.motivo,
  f.proximo_passo,
  f.mensagem,
  CAST(f.recebido_em AS STRING)                    AS recebido_em,
  CAST(c.contatado_em AS STRING)                   AS contatado_em,
  :atualizacao                                     AS atualizacao
FROM lh_ensaio.gold.fila_do_dia f
LEFT JOIN (
  SELECT lead_id, max(contatado_em) AS contatado_em
  FROM lh_ensaio.gold.feedback_contatos
  GROUP BY lead_id
) c ON c.lead_id = f.lead_id
WHERE :vendedor = '' OR f.vendedor = :vendedor
ORDER BY f.posicao
