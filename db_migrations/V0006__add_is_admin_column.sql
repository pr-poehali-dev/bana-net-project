ALTER TABLE t_p41037438_bana_net_project.users 
  ADD COLUMN IF NOT EXISTS is_admin integer NOT NULL DEFAULT 0;

UPDATE t_p41037438_bana_net_project.users 
  SET is_admin = CASE WHEN role = 'admin' THEN 1 ELSE 0 END;