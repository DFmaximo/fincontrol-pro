-- FinControl Pro — Initial Schema
-- Migration: 001_initial_schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── accounts ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL,
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

-- ── categories ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT 'tag',
  color      TEXT NOT NULL DEFAULT '#8490b0',
  type       TEXT NOT NULL CHECK (type IN ('income','expense','both')),
  parent_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── transactions ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL,
  account_id              UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  destination_account_id  UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id             UUID REFERENCES categories(id) ON DELETE SET NULL,
  description             TEXT NOT NULL,
  amount                  NUMERIC(15,2) NOT NULL,
  type                    TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  status                  TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','cancelled')),
  occurred_on             DATE NOT NULL,
  notes                   TEXT,
  tags                    TEXT[],
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── goals ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL,
  name            TEXT NOT NULL,
  target_amount   NUMERIC(15,2) NOT NULL,
  current_amount  NUMERIC(15,2) NOT NULL DEFAULT 0,
  target_date     DATE,
  icon            TEXT NOT NULL DEFAULT 'target',
  color           TEXT NOT NULL DEFAULT '#00d87f',
  category        TEXT,
  is_completed    BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── recurring_transactions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL,
  account_id       UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  description      TEXT NOT NULL,
  amount           NUMERIC(15,2) NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('income','expense','transfer')),
  frequency        TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','yearly')),
  next_occurrence  DATE NOT NULL,
  last_occurrence  DATE,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_accounts_user     ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(occurred_on);
CREATE INDEX IF NOT EXISTS idx_transactions_acct ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_categories_user  ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user       ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user   ON recurring_transactions(user_id);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER accounts_updated_at      BEFORE UPDATE ON accounts      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER transactions_updated_at  BEFORE UPDATE ON transactions  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER goals_updated_at         BEFORE UPDATE ON goals         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER recurring_updated_at     BEFORE UPDATE ON recurring_transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
