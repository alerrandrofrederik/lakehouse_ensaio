-- Gold · time comercial (4 vendedores × 5 conversas/dia).
CREATE OR REFRESH MATERIALIZED VIEW gold.vendedores
COMMENT 'Vendedores que recebem a fila do dia'
AS SELECT * FROM VALUES
  (1, 'Ana Lima'),
  (2, 'Bruno Costa'),
  (3, 'Carla Mendes'),
  (4, 'Diego Rocha')
AS t(vendedor_id, vendedor);
