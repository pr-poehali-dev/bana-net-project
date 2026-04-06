-- Добавляем поля в таблицу reviews согласно ТЗ
ALTER TABLE t_p41037438_bana_net_project.reviews
  ADD COLUMN IF NOT EXISTS moderated_at timestamp without time zone NULL;

-- Таблица файлов отзывов (с метаданными и флагом сжатия)
CREATE TABLE IF NOT EXISTS t_p41037438_bana_net_project.review_files (
  id SERIAL PRIMARY KEY,
  review_id integer NOT NULL REFERENCES t_p41037438_bana_net_project.reviews(id),
  original_filename varchar(500) NOT NULL,
  stored_filename varchar(500) NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  compressed_size bigint NULL,
  mime_type varchar(100) NOT NULL DEFAULT 'image/jpeg',
  is_compressed boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_files_review_id ON t_p41037438_bana_net_project.review_files(review_id);

-- Таблица логов модерации
CREATE TABLE IF NOT EXISTS t_p41037438_bana_net_project.moderation_logs (
  id SERIAL PRIMARY KEY,
  review_id integer NOT NULL REFERENCES t_p41037438_bana_net_project.reviews(id),
  admin_id integer NOT NULL REFERENCES t_p41037438_bana_net_project.users(id),
  action varchar(20) NOT NULL CHECK (action IN ('approved', 'rejected')),
  comment text NULL,
  created_at timestamp without time zone NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_review_id ON t_p41037438_bana_net_project.moderation_logs(review_id);
