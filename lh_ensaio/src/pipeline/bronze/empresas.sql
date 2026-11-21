-- Bronze · empresas: dado como veio (tudo string), cada arquivo lido uma única vez (Auto Loader).
CREATE OR REFRESH STREAMING TABLE empresas
COMMENT 'Base cadastral de empresas (CSV empresas_*.csv, sem tratamento)'
AS SELECT
  *,
  _metadata.file_path  AS _arquivo,
  current_timestamp()  AS _ingerido_em
FROM STREAM read_files(
  '/Volumes/lh_ensaio/bronze/landing/empresas_*.csv',
  format             => 'csv',
  header             => true,
  multiLine          => true,
  encoding           => 'UTF-8',
  inferColumnTypes   => false,
  rescuedDataColumn  => '_rescued_data'
);
