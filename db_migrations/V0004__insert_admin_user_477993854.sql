INSERT INTO t_p41037438_bana_net_project.users (telegram_id, name, role, email_verified, password_hash, created_at, updated_at)
VALUES ('477993854', 'Admin', 'admin', TRUE, '', NOW(), NOW())
ON CONFLICT DO NOTHING;
