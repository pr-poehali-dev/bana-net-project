ALTER TABLE t_p41037438_bana_net_project.users
  ADD COLUMN IF NOT EXISTS vk_id VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NULL DEFAULT 'telegram';

CREATE UNIQUE INDEX IF NOT EXISTS users_vk_id_key ON t_p41037438_bana_net_project.users(vk_id) WHERE vk_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_key ON t_p41037438_bana_net_project.users(google_id) WHERE google_id IS NOT NULL;
