ALTER TABLE t_p41037438_bana_net_project.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) DEFAULT '';

CREATE TABLE IF NOT EXISTS t_p41037438_bana_net_project.refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p41037438_bana_net_project.users(id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON t_p41037438_bana_net_project.refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON t_p41037438_bana_net_project.refresh_tokens(user_id);
