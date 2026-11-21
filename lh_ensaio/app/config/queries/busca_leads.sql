-- Busca de lead por nome, empresa ou e-mail (cabeçalho).
-- @param termo STRING = atlas
SELECT
  lead_id, nome, coalesce(empresa, 'Empresa não identificada') AS empresa,
  canal, intencao, nota, proximo_passo
FROM lh_ensaio.gold.leads_classificados
WHERE length(:termo) >= 2
  AND (nome ILIKE concat('%', :termo, '%')
       OR empresa ILIKE concat('%', :termo, '%')
       OR email ILIKE concat('%', :termo, '%'))
ORDER BY nota DESC
LIMIT 8
