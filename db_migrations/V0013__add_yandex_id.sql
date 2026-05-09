ALTER TABLE t_p41037438_bana_net_project.users
  ADD COLUMN IF NOT EXISTS yandex_id VARCHAR(100) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_yandex_id_key ON t_p41037438_bana_net_project.users(yandex_id) WHERE yandex_id IS NOT NULL;
