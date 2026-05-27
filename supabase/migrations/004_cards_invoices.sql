-- ============================================================
-- FinControl Pro — Cards & Invoices
-- Migration 004: Credit card, invoice and installment schema
-- Cole no SQL Editor: https://supabase.com/dashboard/project/ycysacarhrknllnwtqbn/sql/new
-- ============================================================

-- ── Cards ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  name            TEXT NOT NULL,
  bank_name       TEXT,
  last_four       CHAR(4),
  brand           TEXT DEFAULT 'mastercard'
    CHECK (brand IN ('visa','mastercard','elo','amex','hipercard')),
  credit_limit    NUMERIC(12,2) NOT NULL DEFAULT 0,
  available_limit NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_day     SMALLINT NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  due_day         SMALLINT NOT NULL CHECK (due_day     BETWEEN 1 AND 31),
  color           TEXT    NOT NULL DEFAULT '#8b5cf6',
  icon            TEXT    NOT NULL DEFAULT 'credit-card',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Invoices ─────────────────────────────────────────────────
-- One row per card × month. status open → closed → paid.
CREATE TABLE IF NOT EXISTS invoices (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id      UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  year         SMALLINT NOT NULL,
  month        SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  status       TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','closed','paid','overdue')),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_date DATE NOT NULL,
  due_date     DATE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (card_id, year, month)
);

-- ── Installment plans ─────────────────────────────────────────
-- Tracks multi-installment purchases (parcelamentos).
-- Each installment creates a separate transaction row.
CREATE TABLE IF NOT EXISTS installment_plans (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL,
  card_id                UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  description            TEXT NOT NULL,
  total_amount           NUMERIC(12,2) NOT NULL,
  installment_amount     NUMERIC(12,2) NOT NULL,
  total_installments     SMALLINT NOT NULL,
  paid_installments      SMALLINT NOT NULL DEFAULT 0,
  purchase_date          DATE NOT NULL,
  first_installment_date DATE NOT NULL,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ── Extend transactions with card columns ─────────────────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS card_id              UUID REFERENCES cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invoice_id           UUID REFERENCES invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS installment_plan_id  UUID REFERENCES installment_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS installment_number   SMALLINT;

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cards_user         ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_active        ON cards(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_invoices_card       ON invoices(card_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due        ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_installments_card   ON installment_plans(card_id);
CREATE INDEX IF NOT EXISTS idx_tx_card_id          ON transactions(card_id)     WHERE card_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tx_invoice_id       ON transactions(invoice_id)  WHERE invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tx_installment_plan ON transactions(installment_plan_id) WHERE installment_plan_id IS NOT NULL;

-- ── Update v_transactions view (from migration 003) ──────────
CREATE OR REPLACE VIEW v_transactions AS
SELECT
  t.*,
  a.name        AS account_name,
  a.color       AS account_color,
  a.icon        AS account_icon,
  a.type        AS account_type,
  da.name       AS dest_account_name,
  da.color      AS dest_account_color,
  da.icon       AS dest_account_icon,
  c.name        AS category_name,
  c.color       AS category_color,
  c.icon        AS category_icon,
  cd.name       AS card_name,
  cd.color      AS card_color,
  cd.last_four  AS card_last_four,
  cd.brand      AS card_brand,
  inv.status    AS invoice_status,
  inv.due_date  AS invoice_due_date
FROM transactions t
LEFT JOIN accounts         a   ON a.id   = t.account_id
LEFT JOIN accounts         da  ON da.id  = t.destination_account_id
LEFT JOIN categories       c   ON c.id   = t.category_id
LEFT JOIN cards            cd  ON cd.id  = t.card_id
LEFT JOIN invoices         inv ON inv.id = t.invoice_id;

-- ── Helper function: get or create an invoice for card+month ──
CREATE OR REPLACE FUNCTION get_or_create_invoice(
  p_card_id UUID,
  p_year    SMALLINT,
  p_month   SMALLINT
) RETURNS UUID AS $$
DECLARE
  v_card      cards%ROWTYPE;
  v_inv_id    UUID;
  v_close_day DATE;
  v_due_day   DATE;
BEGIN
  SELECT * INTO v_card FROM cards WHERE id = p_card_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Card not found: %', p_card_id; END IF;

  v_close_day := make_date(p_year, p_month, v_card.closing_day);
  v_due_day   := make_date(
    CASE WHEN v_card.due_day < v_card.closing_day THEN
      CASE WHEN p_month = 12 THEN p_year + 1 ELSE p_year END
    ELSE p_year END,
    CASE WHEN v_card.due_day < v_card.closing_day THEN
      CASE WHEN p_month = 12 THEN 1 ELSE p_month + 1 END
    ELSE p_month END,
    v_card.due_day
  );

  INSERT INTO invoices (card_id, year, month, closing_date, due_date)
  VALUES (p_card_id, p_year, p_month, v_close_day, v_due_day)
  ON CONFLICT (card_id, year, month) DO NOTHING
  RETURNING id INTO v_inv_id;

  IF v_inv_id IS NULL THEN
    SELECT id INTO v_inv_id FROM invoices
    WHERE card_id = p_card_id AND year = p_year AND month = p_month;
  END IF;

  RETURN v_inv_id;
END;
$$ LANGUAGE plpgsql;

-- ── Trigger: keep invoice total_amount in sync ────────────────
CREATE OR REPLACE FUNCTION sync_invoice_total() RETURNS trigger AS $$
BEGIN
  IF NEW.invoice_id IS NOT NULL THEN
    UPDATE invoices
    SET total_amount = (
      SELECT COALESCE(SUM(ABS(amount)), 0)
      FROM transactions
      WHERE invoice_id = NEW.invoice_id
        AND status != 'cancelled'
        AND type != 'card_payment'
    ),
    updated_at = NOW()
    WHERE id = NEW.invoice_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_invoice ON transactions;
CREATE TRIGGER trg_sync_invoice
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION sync_invoice_total();
