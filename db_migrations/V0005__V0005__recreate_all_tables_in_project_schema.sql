-- Полная миграция с явным указанием схемы из MAIN_DB_SCHEMA

CREATE TABLE IF NOT EXISTS t_p41037438_bana_net_project.users (
    id SERIAL PRIMARY KEY,
    telegram_id VARCHAR(50),
    email VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT TRUE,
    password_hash VARCHAR(255) DEFAULT '',
    role VARCHAR(20) DEFAULT 'user',
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON t_p41037438_bana_net_project.users(telegram_id);

CREATE TABLE IF NOT EXISTS t_p41037438_bana_net_project.telegram_auth_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    telegram_id VARCHAR(50) NOT NULL,
    telegram_username VARCHAR(255),
    telegram_first_name VARCHAR(255),
    telegram_last_name VARCHAR(255),
    telegram_photo_url TEXT,
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telegram_auth_tokens_hash ON t_p41037438_bana_net_project.telegram_auth_tokens(token_hash);

CREATE TABLE IF NOT EXISTS t_p41037438_bana_net_project.refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p41037438_bana_net_project.users(id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON t_p41037438_bana_net_project.refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON t_p41037438_bana_net_project.refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS t_p41037438_bana_net_project.reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p41037438_bana_net_project.users(id),
    marketplace VARCHAR(50) NOT NULL,
    product_article VARCHAR(255),
    product_link TEXT,
    seller VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p41037438_bana_net_project.review_images (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES t_p41037438_bana_net_project.reviews(id),
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON t_p41037438_bana_net_project.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON t_p41037438_bana_net_project.reviews(status);
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON t_p41037438_bana_net_project.review_images(review_id);

INSERT INTO t_p41037438_bana_net_project.users (telegram_id, name, role, email_verified, password_hash, created_at, updated_at)
VALUES ('477993854', 'Admin', 'admin', TRUE, '', NOW(), NOW())
ON CONFLICT DO NOTHING;
