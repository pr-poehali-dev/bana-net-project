INSERT INTO t_p41037438_bana_net_project.users
  (telegram_id, name, avatar_url, email_verified, password_hash, is_admin, created_at, updated_at, last_login_at)
VALUES
  ('dev_poehali', 'Dev Poehali', NULL, TRUE, '', 1, NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;