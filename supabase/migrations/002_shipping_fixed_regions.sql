-- ==========================================================================
-- Adicionar colunas de frete fixo por região em settings
-- 5 faixas por região: SP · Sudeste · Sul · Centro-Oeste + Norte + Nordeste
-- (o campo 'shipping_fixed' genérico continua como fallback global)
-- ==========================================================================

ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS shipping_fixed_sp NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_fixed_sudeste NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_fixed_sul NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_fixed_centro_norte_ne NUMERIC DEFAULT 0;

-- Confirmação
SELECT
    id, shipping_mode, shipping_fixed,
    shipping_fixed_sp, shipping_fixed_sudeste,
    shipping_fixed_sul, shipping_fixed_centro_norte_ne,
    free_shipping_min
FROM public.settings
WHERE id = 1;
