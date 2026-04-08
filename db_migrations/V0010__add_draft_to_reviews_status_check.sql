ALTER TABLE t_p41037438_bana_net_project.reviews DROP CONSTRAINT reviews_status_check;
ALTER TABLE t_p41037438_bana_net_project.reviews ADD CONSTRAINT reviews_status_check CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));
