ALTER TABLE t_p41037438_bana_net_project.users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE t_p41037438_bana_net_project.users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

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
