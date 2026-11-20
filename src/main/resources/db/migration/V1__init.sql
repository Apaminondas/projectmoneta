CREATE TABLE users (
    id            BIGSERIAL    PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE categories (
    id      BIGSERIAL    PRIMARY KEY,
    name    VARCHAR(80)  NOT NULL,
    user_id BIGINT       NOT NULL,
    CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_categories_user ON categories (user_id);

CREATE TABLE transactions (
    id          BIGSERIAL      PRIMARY KEY,
    description VARCHAR(255)   NOT NULL,
    amount      NUMERIC(19, 2) NOT NULL,
    date        DATE           NOT NULL,
    type        VARCHAR(10)    NOT NULL,
    category_id BIGINT         NOT NULL,
    user_id     BIGINT         NOT NULL,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_transactions_amount_positive CHECK (amount > 0),
    CONSTRAINT ck_transactions_type CHECK (type IN ('INCOME', 'EXPENSE')),
    CONSTRAINT fk_transactions_category FOREIGN KEY (category_id) REFERENCES categories (id),
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_transactions_user_date ON transactions (user_id, date);
CREATE INDEX idx_transactions_user_category ON transactions (user_id, category_id);
