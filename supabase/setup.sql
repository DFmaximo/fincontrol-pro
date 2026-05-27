-- ============================================================
-- FinControl Pro — Database Setup
-- Cole todo este conteúdo no SQL Editor do Supabase e execute
-- https://supabase.com/dashboard/project/ycysacarhrknllnwtqbn/sql/new
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── accounts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name              TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('cash','bank','credit','investment','digital')),
  balance           NUMERIC(15,2) NOT NULL DEFAULT 0,
  available_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  color             TEXT NOT NULL DEFAULT '#00d87f',
  icon              TEXT NOT NULL DEFAULT 'wallet',
  bank_name         TEXT,
  currency          TEXT NOT NULL DEFAULT 'BRL',
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT 'tag',
  color      TEXT NOT NULL DEFAULT '#8490b0',
  type       TEXT NOT NULL CHECK (type IN ('income','expense','both')),
  parent_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  account_id             UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  destination_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id            UUID REFERENCES categories(id) ON DELETE SET NULL,
  description            TEXT NOT NULL,
  amount                 NUMERIC(15,2) NOT NULL,
  type                   TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  status                 TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','cancelled')),
  occurred_on            DATE NOT NULL,
  notes                  TEXT,
  tags                   TEXT[],
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── goals ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name           TEXT NOT NULL,
  target_amount  NUMERIC(15,2) NOT NULL,
  current_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  target_date    DATE,
  icon           TEXT NOT NULL DEFAULT 'target',
  color          TEXT NOT NULL DEFAULT '#00d87f',
  category       TEXT,
  is_completed   BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── recurring_transactions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  description     TEXT NOT NULL,
  amount          NUMERIC(15,2) NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  frequency       TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','yearly')),
  next_occurrence DATE NOT NULL,
  last_occurrence DATE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_accounts_user       ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user   ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date   ON transactions(occurred_on);
CREATE INDEX IF NOT EXISTS idx_transactions_acct   ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_categories_user     ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user          ON goals(user_id);

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS (desativado para dev — ative em produção) ─────────────
ALTER TABLE accounts             DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions         DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories           DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals                DISABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions DISABLE ROW LEVEL SECURITY;

-- ── Realtime ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- ── Seed data ────────────────────────────────────────────────
INSERT INTO accounts (name, type, balance, available_balance, color, icon, bank_name) VALUES
  ('Carteira',  'cash',    2500.00,  2500.00,  '#00d87f', 'wallet',     NULL),
  ('Nubank',    'digital', 15750.50, 14250.50, '#8b5cf6', 'credit-card','Nubank'),
  ('Bradesco',  'bank',    8200.00,  8200.00,  '#ff3860', 'building-2', 'Bradesco')
ON CONFLICT DO NOTHING;

INSERT INTO categories (name, icon, color, type) VALUES
  ('Salário',     'briefcase', '#00d87f', 'income'),
  ('Freelance',   'laptop',    '#00cce8', 'income'),
  ('Alimentação', 'utensils',  '#ff9443', 'expense'),
  ('Moradia',     'home',      '#8b5cf6', 'expense'),
  ('Transporte',  'car',       '#ffd60a', 'expense'),
  ('Saúde',       'heart',     '#ff3860', 'expense'),
  ('Lazer',       'music',     '#00cce8', 'expense'),
  ('Educação',    'book',      '#00d87f', 'expense')
ON CONFLICT DO NOTHING;

-- Transações de exemplo (Janeiro 2024)
WITH
  a1 AS (SELECT id FROM accounts WHERE name = 'Carteira'  LIMIT 1),
  a2 AS (SELECT id FROM accounts WHERE name = 'Nubank'    LIMIT 1),
  a3 AS (SELECT id FROM accounts WHERE name = 'Bradesco'  LIMIT 1),
  c1 AS (SELECT id FROM categories WHERE name = 'Salário'     LIMIT 1),
  c2 AS (SELECT id FROM categories WHERE name = 'Freelance'   LIMIT 1),
  c3 AS (SELECT id FROM categories WHERE name = 'Alimentação' LIMIT 1),
  c4 AS (SELECT id FROM categories WHERE name = 'Moradia'     LIMIT 1),
  c5 AS (SELECT id FROM categories WHERE name = 'Transporte'  LIMIT 1)
INSERT INTO transactions (account_id, category_id, description, amount, type, status, occurred_on)
SELECT a2.id, c1.id, 'Salário Janeiro',    8500.00, 'income',  'completed', '2024-01-05'::date FROM a2, c1 UNION ALL
SELECT a2.id, c4.id, 'Aluguel',           -2200.00, 'expense', 'completed', '2024-01-10'::date FROM a2, c4 UNION ALL
SELECT a1.id, c3.id, 'Supermercado',        -380.50, 'expense', 'completed', '2024-01-12'::date FROM a1, c3 UNION ALL
SELECT a2.id, c2.id, 'Projeto Freelance',  2800.00, 'income',  'completed', '2024-01-15'::date FROM a2, c2 UNION ALL
SELECT a3.id, c5.id, 'Combustível',         -280.00, 'expense', 'completed', '2024-01-18'::date FROM a3, c5 UNION ALL
SELECT a2.id, c1.id, 'Bônus Performance',  1500.00, 'income',  'completed', '2024-01-28'::date FROM a2, c1 UNION ALL
SELECT a1.id, c3.id, 'Restaurante',         -145.00, 'expense', 'completed', '2024-01-30'::date FROM a1, c3;
