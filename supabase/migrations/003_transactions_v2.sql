-- ============================================================
-- FinControl Pro — Transactions V2
-- Migration 003: Enhanced transaction schema
-- Cole no SQL Editor: https://supabase.com/dashboard/project/ycysacarhrknllnwtqbn/sql/new
-- ============================================================

-- ── Extend transactions table ─────────────────────────────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual','accounts','cards','obligations','goals','investments','recurring')),
  ADD COLUMN IF NOT EXISTS effective_date DATE,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurring_transaction_id UUID
    REFERENCES recurring_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transfer_pair_id UUID;

-- Back-fill effective_date from occurred_on
UPDATE transactions SET effective_date = occurred_on WHERE effective_date IS NULL;

-- Now enforce NOT NULL
ALTER TABLE transactions ALTER COLUMN effective_date SET DEFAULT NOW()::DATE;
ALTER TABLE transactions ALTER COLUMN effective_date SET NOT NULL;

-- ── Extra indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_effective ON transactions(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_source    ON transactions(source);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions(is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_transactions_pair      ON transactions(transfer_pair_id) WHERE transfer_pair_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_type      ON transactions(type);

-- ── View: v_transactions (denormalised, safe to query) ────────
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
  c.icon        AS category_icon
FROM transactions t
LEFT JOIN accounts  a  ON a.id = t.account_id
LEFT JOIN accounts  da ON da.id = t.destination_account_id
LEFT JOIN categories c ON c.id = t.category_id;

-- ── Monthly summary function ──────────────────────────────────
CREATE OR REPLACE FUNCTION get_monthly_summary(
  p_user_id UUID,
  p_year    INT,
  p_month   INT
)
RETURNS TABLE (
  total_income  NUMERIC,
  total_expense NUMERIC,
  net_balance   NUMERIC,
  tx_count      BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN amount > 0 AND type != 'transfer' THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN amount < 0 AND type != 'transfer' THEN ABS(amount) ELSE 0 END), 0) AS total_expense,
    COALESCE(SUM(CASE WHEN type != 'transfer' THEN amount ELSE 0 END), 0) AS net_balance,
    COUNT(*) AS tx_count
  FROM transactions
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND EXTRACT(YEAR  FROM effective_date) = p_year
    AND EXTRACT(MONTH FROM effective_date) = p_month;
END;
$$ LANGUAGE plpgsql;
