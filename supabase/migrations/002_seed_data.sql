-- FinControl Pro — Seed Data
-- Migration: 002_seed_data
-- NOTE: Replace the user_id UUID below with your actual Supabase auth user ID

DO $$
DECLARE
  v_user_id  UUID := '00000000-0000-0000-0000-000000000001'; -- ← replace with real user ID
  v_acct1    UUID;
  v_acct2    UUID;
  v_acct3    UUID;
  v_cat1     UUID;
  v_cat2     UUID;
  v_cat3     UUID;
  v_cat4     UUID;
  v_cat5     UUID;
BEGIN

-- ── Accounts ──
INSERT INTO accounts (id, user_id, name, type, balance, available_balance, color, icon, bank_name, currency)
VALUES
  (uuid_generate_v4(), v_user_id, 'Carteira',  'cash',    2500.00, 2500.00, '#00d87f', 'wallet',     NULL,      'BRL'),
  (uuid_generate_v4(), v_user_id, 'Nubank',    'digital', 15750.50,14250.50,'#8b5cf6', 'credit-card','Nubank',  'BRL'),
  (uuid_generate_v4(), v_user_id, 'Bradesco',  'bank',    8200.00,  8200.00, '#ff3860', 'building-2', 'Bradesco','BRL')
RETURNING id INTO v_acct1;

SELECT id INTO v_acct2 FROM accounts WHERE name = 'Nubank'   AND user_id = v_user_id LIMIT 1;
SELECT id INTO v_acct3 FROM accounts WHERE name = 'Bradesco' AND user_id = v_user_id LIMIT 1;
SELECT id INTO v_acct1 FROM accounts WHERE name = 'Carteira' AND user_id = v_user_id LIMIT 1;

-- ── Categories ──
INSERT INTO categories (id, user_id, name, icon, color, type)
VALUES
  (uuid_generate_v4(), v_user_id, 'Salário',     'briefcase', '#00d87f', 'income'),
  (uuid_generate_v4(), v_user_id, 'Freelance',   'laptop',    '#00cce8', 'income'),
  (uuid_generate_v4(), v_user_id, 'Alimentação', 'utensils',  '#ff9443', 'expense'),
  (uuid_generate_v4(), v_user_id, 'Moradia',     'home',      '#8b5cf6', 'expense'),
  (uuid_generate_v4(), v_user_id, 'Transporte',  'car',       '#ffd60a', 'expense');

SELECT id INTO v_cat1 FROM categories WHERE name = 'Salário'     AND user_id = v_user_id LIMIT 1;
SELECT id INTO v_cat2 FROM categories WHERE name = 'Freelance'   AND user_id = v_user_id LIMIT 1;
SELECT id INTO v_cat3 FROM categories WHERE name = 'Alimentação' AND user_id = v_user_id LIMIT 1;
SELECT id INTO v_cat4 FROM categories WHERE name = 'Moradia'     AND user_id = v_user_id LIMIT 1;
SELECT id INTO v_cat5 FROM categories WHERE name = 'Transporte'  AND user_id = v_user_id LIMIT 1;

-- ── Transactions ──
INSERT INTO transactions (user_id, account_id, category_id, description, amount, type, status, occurred_on)
VALUES
  (v_user_id, v_acct2, v_cat1, 'Salário Janeiro',    8500.00, 'income',  'completed', '2024-01-05'),
  (v_user_id, v_acct2, v_cat4, 'Aluguel',           -2200.00, 'expense', 'completed', '2024-01-10'),
  (v_user_id, v_acct1, v_cat3, 'Supermercado',       -380.50, 'expense', 'completed', '2024-01-12'),
  (v_user_id, v_acct2, v_cat2, 'Projeto Freelance',  2800.00, 'income',  'completed', '2024-01-15'),
  (v_user_id, v_acct3, v_cat5, 'Combustível',         -280.00, 'expense', 'completed', '2024-01-18'),
  (v_user_id, v_acct2, v_cat1, 'Bônus Performance',  1500.00, 'income',  'completed', '2024-01-28'),
  (v_user_id, v_acct1, v_cat3, 'Restaurante',         -145.00, 'expense', 'completed', '2024-01-30');

END $$;
