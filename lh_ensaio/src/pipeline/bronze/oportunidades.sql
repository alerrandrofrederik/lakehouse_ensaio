-- Bronze · oportunidades: dado como veio (tudo string), cada arquivo lido uma única vez (Auto Loader).
CREATE OR REFRESH STREAMING TABLE oportunidades
COMMENT 'Export de oportunidades do CRM (CSV oportunidades_*.csv, sem tratamento)'
AS SELECT
  *,
  _metadata.file_path  AS _arquivo,
  current_timestamp()  AS _ingerido_em
FROM STREAM read_files(
  '/Volumes/lh_ensaio/bronze/landing/oportunidades_*.csv',
  format             => 'csv',
  header             => true,
  multiLine          => true,
  encoding           => 'UTF-8',
  inferColumnTypes   => false,
  rescuedDataColumn  => '_rescued_data'
);
