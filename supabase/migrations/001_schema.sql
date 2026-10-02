-- ==========================================================================
-- USE GEMAS — Schema completo do banco (Supabase)
-- ==========================================================================
-- Projeto: dytdnemwqbzgrekamwla
-- Gerado por varredura em: 02/out/2026
-- Fonte da verdade: Supabase (este arquivo é referência versionada)
--
-- ESTRUTURA:
--   1. Tabelas (13)
--   2. RLS (13 tabelas)
--   3. Policies (40)
--   4. Funções (24: RPCs + trigger functions)
--   5. Triggers (14)
--   6. Índices (42)
--   7. Cron jobs (5)
--
-- IDEMPOTENTE: pode rodar múltiplas vezes sem quebrar
-- ==========================================================================

-- ==========================================================================
-- 1. TABELAS
-- ==========================================================================

-- --------------------------------------------------------------------------
-- admins — lista de usuários com acesso ao painel admin
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------------
-- products — catálogo de joias
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ref TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT,
    gem TEXT,
    description TEXT,
    materials TEXT,
    gallery TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------------
-- orders — pedidos
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    customer_name TEXT NOT NULL,
    customer_doc TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    cep TEXT,
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    notes TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    shipping_cost NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'novo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    shipped_at TIMESTAMPTZ,
    review_requested_at TIMESTAMPTZ,
    review_reminder_sent_at TIMESTAMPTZ,
    guest_token TEXT,
    discount_amount NUMERIC DEFAULT 0,
    discount_code TEXT,
    shipping_method TEXT,
    shipping_service_id TEXT,
    shipping_carrier TEXT,
    shipping_estimated_days INTEGER,
    shipping_quote_data JSONB,
    tracking_code TEXT,
    tracking_url TEXT,
    melhorenvio_order_id TEXT,
    label_url TEXT,
    label_generated_at TIMESTAMPTZ,
    label_status TEXT,
    label_error TEXT
);

-- --------------------------------------------------------------------------
-- reviews — avaliações (cliente + guest)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID,
    product_ref TEXT NOT NULL,
    user_id UUID,
    customer_name TEXT,
    customer_email TEXT,
    rating INTEGER NOT NULL,
    title TEXT,
    comment TEXT,
    photos TEXT,
    verified_purchase BOOLEAN DEFAULT false,
    admin_response TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------------
-- notifications — notificações reais (tabela interna)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- coupons — cupons de desconto
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT ''::text,
    discount_type TEXT NOT NULL,
    discount_value NUMERIC NOT NULL,
    min_purchase NUMERIC DEFAULT 0,
    max_discount NUMERIC DEFAULT NULL,
    free_shipping BOOLEAN DEFAULT false,
    first_purchase_only BOOLEAN DEFAULT false,
    usage_limit_total INTEGER,
    usage_limit_per_user INTEGER DEFAULT 1,
    times_used INTEGER DEFAULT 0,
    customer_email TEXT,
    starts_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ,
    active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    email_notified_at TIMESTAMPTZ
);

-- --------------------------------------------------------------------------
-- coupon_usages — histórico de usos de cupons
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupon_usages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    order_id UUID,
    user_id UUID,
    customer_email TEXT NOT NULL,
    discount_applied NUMERIC NOT NULL DEFAULT 0,
    used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------------
-- loyalty_points — ledger de pontos/fidelidade
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loyalty_points (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    customer_email TEXT NOT NULL,
    order_id UUID,
    coupon_id UUID,
    points INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjustment')),
    description TEXT DEFAULT ''::text,
    expires_at TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expired_at TIMESTAMPTZ
);

-- --------------------------------------------------------------------------
-- settings — configurações do site (single-row, id=1)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID NOT NULL PRIMARY KEY,
    whatsapp TEXT,
    instagram TEXT,
    shipping_fixed NUMERIC DEFAULT 0,
    free_shipping_min NUMERIC DEFAULT 400,
    banner_message TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    shipping_origin_cep TEXT,
    shipping_default_weight_kg NUMERIC(5, 3) DEFAULT 1.0,
    shipping_default_length_cm INTEGER DEFAULT 20,
    shipping_default_width_cm INTEGER DEFAULT 15,
    shipping_default_height_cm INTEGER DEFAULT 10,
    shipping_insurance_enabled BOOLEAN DEFAULT true,
    shipping_enabled_carriers JSONB DEFAULT '["correios", "jadlog"]'::jsonb,
    melhorenvio_sandbox BOOLEAN DEFAULT true,
    melhorenvio_token_expires_at TIMESTAMPTZ,
    melhorenvio_sender_name TEXT,
    melhorenvio_sender_doc TEXT,
    melhorenvio_sender_phone TEXT,
    melhorenvio_sender_email TEXT,
    melhorenvio_sender_address TEXT,
    melhorenvio_sender_number TEXT,
    melhorenvio_sender_complement TEXT,
    melhorenvio_sender_district TEXT,
    melhorenvio_sender_city TEXT,
    melhorenvio_sender_state TEXT
);

-- --------------------------------------------------------------------------
-- profiles — perfil do cliente (ligado a auth.users)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------------
-- favorites — lista de desejos do cliente
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    product_ref TEXT NOT NULL,
    product_price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, product_ref)
);

-- --------------------------------------------------------------------------
-- checkout_data — dados de checkout persistidos (1 por user)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.checkout_data (
    user_id UUID NOT NULL PRIMARY KEY,
    name TEXT,
    doc TEXT,
    phone TEXT,
    cep TEXT,
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- --------------------------------------------------------------------------
-- shipping_quotes_cache — cache de cotações do Melhor Envio (24h)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shipping_quotes_cache (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cep_origem TEXT NOT NULL,
    cep_destino TEXT NOT NULL,
    peso_kg NUMERIC(10, 3) NOT NULL,
    valor_declarado NUMERIC(10, 2) NOT NULL,
    quotes JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================================
-- 2. RLS — Habilita em todas as tabelas
-- ==========================================================================
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_quotes_cache ENABLE ROW LEVEL SECURITY;

-- ==========================================================================
-- 3. POLICIES (40)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- admins
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can check if they are admin" ON public.admins;
CREATE POLICY "Users can check if they are admin"
ON public.admins FOR SELECT TO public
USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- checkout_data
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own checkout data" ON public.checkout_data;
CREATE POLICY "Users can view own checkout data"
ON public.checkout_data FOR SELECT TO public
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own checkout data" ON public.checkout_data;
CREATE POLICY "Users can insert own checkout data"
ON public.checkout_data FOR INSERT TO public
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own checkout data" ON public.checkout_data;
CREATE POLICY "Users can update own checkout data"
ON public.checkout_data FOR UPDATE TO public
USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- coupon_usages
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert coupon usages" ON public.coupon_usages;
CREATE POLICY "Anyone can insert coupon usages"
ON public.coupon_usages FOR INSERT TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can read own coupon usages" ON public.coupon_usages;
CREATE POLICY "Users can read own coupon usages"
ON public.coupon_usages FOR SELECT TO authenticated
USING (
    (auth.uid() = user_id)
    OR (lower(customer_email) = lower(auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Admins can manage all coupon usages" ON public.coupon_usages;
CREATE POLICY "Admins can manage all coupon usages"
ON public.coupon_usages FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- --------------------------------------------------------------------------
-- coupons
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;
CREATE POLICY "Anyone can read active coupons"
ON public.coupons FOR SELECT TO public
USING (active = true);

DROP POLICY IF EXISTS "Admins can manage all coupons" ON public.coupons;
CREATE POLICY "Admins can manage all coupons"
ON public.coupons FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- --------------------------------------------------------------------------
-- favorites
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites"
ON public.favorites FOR SELECT TO public
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
CREATE POLICY "Users can insert own favorites"
ON public.favorites FOR INSERT TO public
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites"
ON public.favorites FOR DELETE TO public
USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- loyalty_points
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own loyalty points" ON public.loyalty_points;
CREATE POLICY "Users can read own loyalty points"
ON public.loyalty_points FOR SELECT TO authenticated
USING (
    (auth.uid() = user_id)
    OR (lower(customer_email) = lower(auth.jwt() ->> 'email'))
);

DROP POLICY IF EXISTS "Admins can manage all loyalty points" ON public.loyalty_points;
CREATE POLICY "Admins can manage all loyalty points"
ON public.loyalty_points FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- --------------------------------------------------------------------------
-- notifications
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all notifications" ON public.notifications;
CREATE POLICY "Admins can manage all notifications"
ON public.notifications FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- --------------------------------------------------------------------------
-- orders
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Guests can view guest orders" ON public.orders;
CREATE POLICY "Guests can view guest orders"
ON public.orders FOR SELECT TO anon
USING (user_id IS NULL);

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE TO public
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
ON public.orders FOR DELETE TO public
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- --------------------------------------------------------------------------
-- products
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT TO public
USING (active = true);

DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT TO public
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT TO public
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE TO public
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE TO public
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- --------------------------------------------------------------------------
-- profiles
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO public
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO public
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO public
USING (auth.uid() = id);

-- --------------------------------------------------------------------------
-- reviews
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;
CREATE POLICY "Anyone can read approved reviews"
ON public.reviews FOR SELECT TO public
USING (status = 'approved');

DROP POLICY IF EXISTS "Users can read own reviews" ON public.reviews;
CREATE POLICY "Users can read own reviews"
ON public.reviews FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own reviews" ON public.reviews;
CREATE POLICY "Users can create own reviews"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending reviews" ON public.reviews;
CREATE POLICY "Users can update own pending reviews"
ON public.reviews FOR UPDATE TO authenticated
USING ((auth.uid() = user_id) AND (status = 'pending'))
WITH CHECK ((auth.uid() = user_id) AND (status = 'pending'));

DROP POLICY IF EXISTS "Guests can create reviews for their own orders" ON public.reviews;
CREATE POLICY "Guests can create reviews for their own orders"
ON public.reviews FOR INSERT TO anon
WITH CHECK (
    (user_id IS NULL)
    AND (order_id IS NOT NULL)
    AND (EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = reviews.order_id
          AND o.user_id IS NULL
          AND o.customer_email IS NOT NULL
          AND o.customer_email <> ''::text
          AND o.guest_token IS NOT NULL
    ))
);

DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.reviews;
CREATE POLICY "Admins can manage all reviews"
ON public.reviews FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- --------------------------------------------------------------------------
-- settings
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "settings_read_all" ON public.settings;
CREATE POLICY "settings_read_all"
ON public.settings FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "settings_insert_admins" ON public.settings;
CREATE POLICY "settings_insert_admins"
ON public.settings FOR INSERT TO public
WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

DROP POLICY IF EXISTS "settings_update_admins" ON public.settings;
CREATE POLICY "settings_update_admins"
ON public.settings FOR UPDATE TO public
USING (EXISTS (SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()));

-- --------------------------------------------------------------------------
-- shipping_quotes_cache
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Only service_role manages shipping cache" ON public.shipping_quotes_cache;
CREATE POLICY "Only service_role manages shipping cache"
ON public.shipping_quotes_cache FOR ALL TO service_role
USING (true)
WITH CHECK (true);
-- ==========================================================================
-- 4. FUNÇÕES
-- ==========================================================================
-- 24 funções no schema public:
--   - 10 RPCs (chamadas pelo client)
--   - 12 funções de trigger
--   - 2 utilitárias (cleanup_old_notifications, generate_guest_token)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- update_coupons_updated_at — atualiza updated_at em cupons
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_coupons_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------
-- update_products_updated_at — atualiza updated_at em produtos
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------
-- update_reviews_updated_at — atualiza updated_at em reviews
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------
-- normalize_coupon_code — normaliza código do cupom em MAIÚSCULAS
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_coupon_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.code = UPPER(TRIM(NEW.code));
    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------
-- generate_guest_token — gera token para pedidos de guest (128 bits hex)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_guest_token()
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
    new_token TEXT;
BEGIN
    -- 32 caracteres hexadecimais = ~128 bits de entropia
    new_token := encode(gen_random_bytes(16), 'hex');
    RETURN new_token;
END;
$function$;

-- --------------------------------------------------------------------------
-- set_guest_token — trigger que preenche guest_token quando user_id é NULL
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_guest_token()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.user_id IS NULL 
       AND NEW.guest_token IS NULL 
       AND NEW.customer_email IS NOT NULL 
       AND NEW.customer_email <> '' THEN
        NEW.guest_token = generate_guest_token();
    END IF;
    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------
-- set_shipped_at — trigger que registra timestamp do envio
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_shipped_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.status = 'enviado' 
       AND (OLD.status IS NULL OR OLD.status <> 'enviado') 
       AND NEW.shipped_at IS NULL THEN
        NEW.shipped_at = now();
    END IF;
    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------
-- handle_new_user — trigger que cria profile automaticamente ao cadastrar
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email);
  return new;
end;
$function$;

-- --------------------------------------------------------------------------
-- notify_order_status_change — cria notificação real ao mudar status
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    order_total TEXT;
BEGIN
    -- Só dispara se status mudou E tem user_id (cliente logado)
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
        RETURN NEW;
    END IF;

    -- Formata o total pra mensagem
    order_total := 'R$ ' || to_char(NEW.total, 'FM999G999D00');

    -- Pedido pago
    IF NEW.status = 'pago' AND OLD.status <> 'pago' THEN
        INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
        VALUES (
            NEW.user_id,
            'order_paid',
            'Pagamento confirmado',
            'Seu pedido de ' || order_total || ' foi confirmado. Em breve começaremos a produzir sua peça.',
            'minha-conta.html',
            jsonb_build_object('order_id', NEW.id)
        );
    END IF;

    -- Pedido enviado
    IF NEW.status = 'enviado' AND OLD.status <> 'enviado' THEN
        INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
        VALUES (
            NEW.user_id,
            'order_shipped',
            'Sua peça foi enviada',
            'Sua encomenda de ' || order_total || ' está a caminho. Fique de olho no prazo de entrega.',
            'minha-conta.html',
            jsonb_build_object('order_id', NEW.id)
        );
    END IF;

    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------
-- notify_review_status_change — notifica cliente quando review é moderada
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_review_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- Só dispara se status mudou E cliente logado (não guest)
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
        RETURN NEW;
    END IF;

    -- Review aprovado
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
        VALUES (
            NEW.user_id,
            'review_approved',
            'Avaliação publicada',
            'Sua avaliação foi aprovada e já está no site. Obrigado por compartilhar! 💛',
            'minha-conta.html',
            jsonb_build_object('review_id', NEW.id, 'product_ref', NEW.product_ref)
        );
    END IF;

    -- Review rejeitado
    IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
        INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
        VALUES (
            NEW.user_id,
            'review_rejected',
            'Avaliação não publicada',
            'Sua avaliação não pôde ser publicada. Entre em contato pra saber mais.',
            'minha-conta.html',
            jsonb_build_object('review_id', NEW.id, 'product_ref', NEW.product_ref)
        );
    END IF;

    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------
-- credit_loyalty_points_on_paid — credita pontos quando pedido vira "pago"
-- Regra: 1 ponto por R$ 1 (FLOOR do total)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.credit_loyalty_points_on_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_points INTEGER;
    v_already_credited BOOLEAN;
BEGIN
    -- Só roda quando status muda PRA 'pago'
    IF NEW.status <> 'pago' THEN
        RETURN NEW;
    END IF;

    -- Se já era 'pago' antes (UPDATE por outro motivo), ignora
    IF TG_OP = 'UPDATE' AND OLD.status = 'pago' THEN
        RETURN NEW;
    END IF;

    -- Checa se já foi creditado pra esse pedido (idempotência)
    SELECT EXISTS (
        SELECT 1 FROM public.loyalty_points
        WHERE order_id = NEW.id
          AND type = 'earned'
    ) INTO v_already_credited;

    IF v_already_credited THEN
        RETURN NEW;
    END IF;

    -- Calcula pontos: 1 ponto por R$ 1 do total pago
    v_points := FLOOR(COALESCE(NEW.total, 0))::INTEGER;

    IF v_points <= 0 THEN
        RETURN NEW;
    END IF;

    -- Insere o crédito (SEM order_number)
    INSERT INTO public.loyalty_points (
        user_id,
        customer_email,
        order_id,
        points,
        type,
        description,
        expires_at
    ) VALUES (
        NEW.user_id,
        LOWER(NEW.customer_email),
        NEW.id,
        v_points,
        'earned',
        'Pontos ganhos no pedido ' || NEW.id::text,
        now() + interval '12 months'
    );

    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------
-- notify_points_earned — cria notificação quando cliente ganha pontos
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_points_earned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_points_formatted TEXT;
    v_brl_value TEXT;
BEGIN
    -- Só processa linhas de ganho
    IF NEW.type <> 'earned' THEN
        RETURN NEW;
    END IF;

    -- Só cria notificação se tiver user_id (logado)
    -- Guest não tem sininho, não faz sentido
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Formata valores
    v_points_formatted := TO_CHAR(NEW.points, 'FM999G999G999');
    v_brl_value := TO_CHAR(NEW.points / 100.0, 'FM999G999D00');

    -- Insere notificação real
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        link,
        metadata,
        read_at
    ) VALUES (
        NEW.user_id,
        'points_earned',
        'Você ganhou ' || v_points_formatted || ' pontos! 💎',
        'Vale R$ ' || v_brl_value || ' de desconto no próximo pedido',
        'minha-conta.html#beneficios',
        jsonb_build_object(
            'points', NEW.points,
            'order_id', NEW.order_id,
            'loyalty_point_id', NEW.id
        ),
        NULL
    );

    RETURN NEW;
END;
$function$;

-- --------------------------------------------------------------------------
-- cleanup_old_notifications — deleta notificações lidas há 30+ dias
-- (Roda via cron job #3)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM public.notifications
    WHERE read_at IS NOT NULL
      AND read_at < now() - interval '30 days';
END;
$function$;

-- --------------------------------------------------------------------------
-- decrease_product_stock — baixa estoque e desativa se zerar
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrease_product_stock(p_ref text, p_qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_new_stock INTEGER;
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - p_qty)
  WHERE ref = p_ref
  RETURNING stock INTO v_new_stock;

  IF v_new_stock <= 0 THEN
    UPDATE public.products
    SET active = false
    WHERE ref = p_ref;
  END IF;
END;
$function$;

-- --------------------------------------------------------------------------
-- restore_product_stock — restaura estoque e reativa produto
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.restore_product_stock(p_ref text, p_qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.products
  SET stock = stock + p_qty,
      active = true
  WHERE ref = p_ref;
END;
$function$;

-- --------------------------------------------------------------------------
-- get_product_by_ref — retorna produto + reviews + stats + relacionados
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_product_by_ref(p_ref text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_product RECORD;
    v_reviews JSONB;
    v_stats JSONB;
    v_related JSONB;
BEGIN
    -- Normaliza
    p_ref := UPPER(TRIM(p_ref));

    -- 1. Busca o produto
    SELECT * INTO v_product
    FROM public.products
    WHERE ref = p_ref
      AND active = true
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'product_not_found',
            'message', 'Produto não encontrado'
        );
    END IF;

    -- 2. Busca reviews aprovadas + média + contagem
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'id', r.id,
                'rating', r.rating,
                'title', r.title,
                'comment', r.comment,
                'photos', r.photos,
                'customer_name', r.customer_name,
                'verified_purchase', r.verified_purchase,
                'admin_response', r.admin_response,
                'created_at', r.created_at
            )
            ORDER BY r.created_at DESC
        ) INTO v_reviews
    FROM public.reviews r
    WHERE r.product_ref = p_ref
      AND r.status = 'approved';

    -- Se não tem reviews, garante array vazio
    IF v_reviews IS NULL THEN
        v_reviews := '[]'::jsonb;
    END IF;

    -- 3. Estatísticas agregadas
    SELECT 
        jsonb_build_object(
            'avg_rating', COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0),
            'total_reviews', COUNT(*),
            'distribution', jsonb_build_object(
                '5', COUNT(*) FILTER (WHERE r.rating = 5),
                '4', COUNT(*) FILTER (WHERE r.rating = 4),
                '3', COUNT(*) FILTER (WHERE r.rating = 3),
                '2', COUNT(*) FILTER (WHERE r.rating = 2),
                '1', COUNT(*) FILTER (WHERE r.rating = 1)
            )
        ) INTO v_stats
    FROM public.reviews r
    WHERE r.product_ref = p_ref
      AND r.status = 'approved';

    -- 4. Produtos relacionados (mesma categoria, exceto o atual)
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'ref', p.ref,
                'name', p.name,
                'price', p.price,
                'gallery', p.gallery,
                'gem', p.gem,
                'stock', p.stock
            )
        ) INTO v_related
    FROM (
        SELECT * FROM public.products
        WHERE active = true
          AND ref <> p_ref
          AND (
              category = v_product.category
              OR category IS NULL
          )
        ORDER BY created_at DESC
        LIMIT 3
    ) p;

    IF v_related IS NULL THEN
        v_related := '[]'::jsonb;
    END IF;

    -- 5. Retorna tudo
    RETURN jsonb_build_object(
        'success', true,
        'product', jsonb_build_object(
            'id', v_product.id,
            'ref', v_product.ref,
            'name', v_product.name,
            'price', v_product.price,
            'stock', v_product.stock,
            'category', v_product.category,
            'gem', v_product.gem,
            'description', v_product.description,
            'materials', v_product.materials,
            'gallery', v_product.gallery,
            'created_at', v_product.created_at
        ),
        'reviews', v_reviews,
        'stats', v_stats,
        'related', v_related
    );
END;
$function$;

-- --------------------------------------------------------------------------
-- validate_coupon — valida cupom com todas as regras (server-side)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_coupon(
    p_code text,
    p_subtotal numeric,
    p_customer_email text,
    p_user_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_coupon RECORD;
    v_normalized_code TEXT;
    v_user_uses INTEGER;
    v_has_previous_orders BOOLEAN;
    v_discount NUMERIC(10, 2);
    v_free_shipping BOOLEAN;
BEGIN
    v_normalized_code := UPPER(TRIM(p_code));

    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = v_normalized_code
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'error', 'coupon_not_found', 'message', 'Cupom não encontrado');
    END IF;

    IF NOT v_coupon.active THEN
        RETURN jsonb_build_object('valid', false, 'error', 'coupon_inactive', 'message', 'Este cupom não está mais ativo');
    END IF;

    IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > now() THEN
        RETURN jsonb_build_object('valid', false, 'error', 'coupon_not_started', 'message', 'Este cupom ainda não está disponível');
    END IF;

    IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at <= now() THEN
        RETURN jsonb_build_object('valid', false, 'error', 'coupon_expired', 'message', 'Este cupom expirou');
    END IF;

    IF v_coupon.min_purchase > 0 AND p_subtotal < v_coupon.min_purchase THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'min_purchase_not_met',
            'message', 'Este cupom só vale pra compras acima de R$ ' || to_char(v_coupon.min_purchase, 'FM999G999D00')
        );
    END IF;

    IF v_coupon.usage_limit_total IS NOT NULL 
       AND v_coupon.times_used >= v_coupon.usage_limit_total THEN
        RETURN jsonb_build_object('valid', false, 'error', 'usage_limit_reached', 'message', 'Este cupom atingiu o limite de usos');
    END IF;

    IF v_coupon.customer_email IS NOT NULL THEN
        IF p_customer_email IS NULL 
           OR LOWER(v_coupon.customer_email) <> LOWER(p_customer_email) THEN
            RETURN jsonb_build_object('valid', false, 'error', 'coupon_not_for_you', 'message', 'Este cupom é exclusivo e não está disponível pra você');
        END IF;
    END IF;

    IF v_coupon.usage_limit_per_user IS NOT NULL THEN
        SELECT COUNT(*) INTO v_user_uses
        FROM public.coupon_usages
        WHERE coupon_id = v_coupon.id
          AND (
              (p_user_id IS NOT NULL AND user_id = p_user_id)
              OR (p_customer_email IS NOT NULL AND LOWER(customer_email) = LOWER(p_customer_email))
          );

        IF v_user_uses >= v_coupon.usage_limit_per_user THEN
            RETURN jsonb_build_object('valid', false, 'error', 'user_limit_reached', 'message', 'Você já usou este cupom');
        END IF;
    END IF;

    IF v_coupon.first_purchase_only THEN
        SELECT EXISTS (
            SELECT 1 FROM public.orders
            WHERE (
                (p_user_id IS NOT NULL AND user_id = p_user_id)
                OR (p_customer_email IS NOT NULL AND LOWER(customer_email) = LOWER(p_customer_email))
            )
            AND status IN ('pago', 'produzindo', 'enviado')
        ) INTO v_has_previous_orders;

        IF v_has_previous_orders THEN
            RETURN jsonb_build_object('valid', false, 'error', 'not_first_purchase', 'message', 'Este cupom é válido apenas na primeira compra');
        END IF;
    END IF;

    v_free_shipping := v_coupon.free_shipping;

    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := p_subtotal * (v_coupon.discount_value / 100.0);
        IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
            v_discount := v_coupon.max_discount;
        END IF;
    ELSE
        v_discount := v_coupon.discount_value;
        IF v_discount > p_subtotal THEN
            v_discount := p_subtotal;
        END IF;
    END IF;

    v_discount := ROUND(v_discount, 2);

    RETURN jsonb_build_object(
        'valid', true,
        'coupon_id', v_coupon.id,
        'code', v_coupon.code,
        'discount', v_discount,
        'discount_type', v_coupon.discount_type,
        'discount_value', v_coupon.discount_value,
        'free_shipping', v_free_shipping,
        'message', 'Cupom aplicado!'
    );
END;
$function$;

-- --------------------------------------------------------------------------
-- apply_coupon_to_order — revalida e aplica cupom a um pedido existente
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_coupon_to_order(
    p_order_id uuid,
    p_code text,
    p_customer_email text,
    p_user_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_coupon RECORD;
    v_normalized_code TEXT;
    v_order RECORD;
    v_validation JSONB;
    v_discount NUMERIC(10, 2);
    v_free_shipping BOOLEAN;
BEGIN
    v_normalized_code := UPPER(TRIM(p_code));

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'order_not_found', 'message', 'Pedido não encontrado');
    END IF;

    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = v_normalized_code
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'coupon_not_found', 'message', 'Cupom não encontrado');
    END IF;

    v_validation := public.validate_coupon(
        v_normalized_code,
        v_order.subtotal,
        p_customer_email,
        p_user_id
    );

    IF NOT (v_validation->>'valid')::boolean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', v_validation->>'error',
            'message', v_validation->>'message'
        );
    END IF;

    v_discount := (v_validation->>'discount')::numeric;
    v_free_shipping := (v_validation->>'free_shipping')::boolean;

    UPDATE public.coupons
    SET times_used = times_used + 1
    WHERE id = v_coupon.id;

    INSERT INTO public.coupon_usages (
        coupon_id,
        order_id,
        user_id,
        customer_email,
        discount_applied
    ) VALUES (
        v_coupon.id,
        p_order_id,
        p_user_id,
        LOWER(p_customer_email),
        v_discount
    );

    UPDATE public.orders
    SET 
        discount_amount = v_discount,
        discount_code = v_coupon.code,
        shipping_cost = CASE WHEN v_free_shipping THEN 0 ELSE shipping_cost END,
        total = subtotal - v_discount + (CASE WHEN v_free_shipping THEN 0 ELSE shipping_cost END),
        updated_at = now()
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'coupon_code', v_coupon.code,
        'discount', v_discount,
        'free_shipping', v_free_shipping,
        'message', 'Cupom aplicado ao pedido'
    );
END;
$function$;

-- --------------------------------------------------------------------------
-- get_loyalty_balance — saldo + totais do cliente
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_loyalty_balance(
    p_customer_email text,
    p_user_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_balance INTEGER;
    v_earned INTEGER;
    v_redeemed INTEGER;
    v_expired INTEGER;
    v_pending_expiration INTEGER;
BEGIN
    SELECT COALESCE(SUM(points), 0)::INTEGER INTO v_balance
    FROM public.loyalty_points
    WHERE (p_user_id IS NOT NULL AND user_id = p_user_id)
       OR (p_customer_email IS NOT NULL AND LOWER(customer_email) = LOWER(p_customer_email))
      AND (expires_at IS NULL OR expires_at > now());

    SELECT COALESCE(SUM(points), 0)::INTEGER INTO v_earned
    FROM public.loyalty_points
    WHERE ((p_user_id IS NOT NULL AND user_id = p_user_id)
       OR (p_customer_email IS NOT NULL AND LOWER(customer_email) = LOWER(p_customer_email)))
      AND type = 'earned';

    SELECT COALESCE(SUM(ABS(points)), 0)::INTEGER INTO v_redeemed
    FROM public.loyalty_points
    WHERE ((p_user_id IS NOT NULL AND user_id = p_user_id)
       OR (p_customer_email IS NOT NULL AND LOWER(customer_email) = LOWER(p_customer_email)))
      AND type = 'redeemed';

    SELECT COALESCE(SUM(ABS(points)), 0)::INTEGER INTO v_expired
    FROM public.loyalty_points
    WHERE ((p_user_id IS NOT NULL AND user_id = p_user_id)
       OR (p_customer_email IS NOT NULL AND LOWER(customer_email) = LOWER(p_customer_email)))
      AND type = 'expired';

    SELECT COALESCE(SUM(points), 0)::INTEGER INTO v_pending_expiration
    FROM public.loyalty_points
    WHERE ((p_user_id IS NOT NULL AND user_id = p_user_id)
       OR (p_customer_email IS NOT NULL AND LOWER(customer_email) = LOWER(p_customer_email)))
      AND type = 'earned'
      AND expires_at IS NOT NULL
      AND expires_at > now()
      AND expires_at <= now() + interval '30 days';

    RETURN jsonb_build_object(
        'balance', v_balance,
        'total_earned', v_earned,
        'total_redeemed', v_redeemed,
        'total_expired', v_expired,
        'pending_expiration_30d', v_pending_expiration,
        'brl_value', ROUND(v_balance / 100.0, 2)
    );
END;
$function$;

-- --------------------------------------------------------------------------
-- redeem_points_as_coupon — troca pontos por cupom (PONTOS-XXXX)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_points_as_coupon(
    p_points integer,
    p_customer_email text,
    p_user_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_balance INTEGER;
    v_discount_value NUMERIC(10, 2);
    v_coupon_id UUID;
    v_coupon_code TEXT;
    v_attempts INTEGER := 0;
    v_max_attempts INTEGER := 10;
    v_code_exists BOOLEAN;
    v_chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_loyalty_id UUID;
BEGIN
    IF p_customer_email IS NULL OR TRIM(p_customer_email) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_email', 'message', 'Email do cliente é obrigatório');
    END IF;

    p_customer_email := LOWER(TRIM(p_customer_email));

    IF p_points IS NULL OR p_points < 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'min_points', 'message', 'O resgate mínimo é de 100 pontos (R$ 1,00)');
    END IF;

    IF p_points % 100 <> 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_multiple', 'message', 'O resgate precisa ser em múltiplos de 100 pontos');
    END IF;

    SELECT COALESCE(SUM(points), 0)::INTEGER INTO v_balance
    FROM public.loyalty_points
    WHERE (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR LOWER(customer_email) = p_customer_email
    )
    AND (expires_at IS NULL OR expires_at > now());

    IF v_balance < p_points THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'insufficient_points',
            'message', 'Você tem ' || v_balance || ' pontos. Precisa de ' || p_points || '.',
            'balance', v_balance,
            'required', p_points
        );
    END IF;

    v_discount_value := ROUND(p_points / 100.0, 2);

    LOOP
        v_attempts := v_attempts + 1;
        v_coupon_code := 'PONTOS-';
        FOR i IN 1..4 LOOP
            v_coupon_code := v_coupon_code || SUBSTR(v_chars, 1 + FLOOR(RANDOM() * LENGTH(v_chars))::INTEGER, 1);
        END LOOP;

        SELECT EXISTS (
            SELECT 1 FROM public.coupons WHERE code = v_coupon_code
        ) INTO v_code_exists;

        EXIT WHEN NOT v_code_exists;

        IF v_attempts >= v_max_attempts THEN
            RETURN jsonb_build_object('success', false, 'error', 'code_generation_failed', 'message', 'Não foi possível gerar um código único. Tente novamente.');
        END IF;
    END LOOP;

    INSERT INTO public.loyalty_points (
        user_id,
        customer_email,
        points,
        type,
        description,
        expires_at
    ) VALUES (
        p_user_id,
        p_customer_email,
        -p_points,
        'redeemed',
        'Resgate de ' || p_points || ' pontos por cupom ' || v_coupon_code,
        NULL
    )
    RETURNING id INTO v_loyalty_id;

    INSERT INTO public.coupons (
        code,
        description,
        discount_type,
        discount_value,
        min_purchase,
        max_discount,
        free_shipping,
        first_purchase_only,
        usage_limit_total,
        usage_limit_per_user,
        customer_email,
        starts_at,
        expires_at,
        active
    ) VALUES (
        v_coupon_code,
        'Cupom gerado por resgate de ' || p_points || ' pontos',
        'fixed',
        v_discount_value,
        0,
        NULL,
        false,
        false,
        NULL,
        1,
        p_customer_email,
        now(),
        now() + interval '30 days',
        true
    )
    RETURNING id INTO v_coupon_id;

    UPDATE public.loyalty_points
    SET coupon_id = v_coupon_id,
        description = 'Resgate de ' || p_points || ' pontos por cupom ' || v_coupon_code
    WHERE id = v_loyalty_id;

    RETURN jsonb_build_object(
        'success', true,
        'coupon_id', v_coupon_id,
        'coupon_code', v_coupon_code,
        'points_redeemed', p_points,
        'discount_value', v_discount_value,
        'expires_at', (now() + interval '30 days')::text,
        'new_balance', v_balance - p_points,
        'message', 'Cupom ' || v_coupon_code || ' criado! Vale R$ ' || v_discount_value
    );
END;
$function$;

-- --------------------------------------------------------------------------
-- expire_loyalty_points — expira lotes vencidos (lógica B: expira só o disponível)
-- (Roda via cron job #5)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_loyalty_points()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_lote RECORD;
    v_saldo_atual INTEGER;
    v_pontos_lote INTEGER;
    v_pontos_expirar INTEGER;
    v_total_expired INTEGER := 0;
    v_total_points_expired INTEGER := 0;
    v_lotes_processados INTEGER := 0;
BEGIN
    FOR v_lote IN
        SELECT 
            id,
            user_id,
            customer_email,
            points AS pontos_originais,
            expires_at,
            description
        FROM public.loyalty_points
        WHERE type = 'earned'
          AND expired_at IS NULL
          AND expires_at IS NOT NULL
          AND expires_at <= now()
          AND points > 0
        ORDER BY expires_at ASC
    LOOP
        SELECT COALESCE(SUM(points), 0)::INTEGER INTO v_saldo_atual
        FROM public.loyalty_points
        WHERE (
            (v_lote.user_id IS NOT NULL AND user_id = v_lote.user_id)
            OR LOWER(customer_email) = LOWER(v_lote.customer_email)
        )
        AND (expires_at IS NULL OR expires_at > now());

        IF v_saldo_atual <= 0 THEN
            UPDATE public.loyalty_points SET expired_at = now() WHERE id = v_lote.id;
            v_lotes_processados := v_lotes_processados + 1;
            CONTINUE;
        END IF;

        v_pontos_lote := v_lote.pontos_originais;
        v_pontos_expirar := LEAST(v_pontos_lote, v_saldo_atual);

        IF v_pontos_expirar > v_saldo_atual THEN
            v_pontos_expirar := v_saldo_atual;
        END IF;

        IF v_pontos_expirar <= 0 THEN
            UPDATE public.loyalty_points SET expired_at = now() WHERE id = v_lote.id;
            v_lotes_processados := v_lotes_processados + 1;
            CONTINUE;
        END IF;

        INSERT INTO public.loyalty_points (
            user_id, customer_email, points, type, description, expires_at
        ) VALUES (
            v_lote.user_id,
            LOWER(v_lote.customer_email),
            -v_pontos_expirar,
            'expired',
            'Pontos expirados (lote de ' || to_char(v_lote.expires_at, 'DD/MM/YYYY') || ')',
            NULL
        );

        UPDATE public.loyalty_points SET expired_at = now() WHERE id = v_lote.id;

        v_lotes_processados := v_lotes_processados + 1;
        v_total_points_expired := v_total_points_expired + v_pontos_expirar;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'lotes_processados', v_lotes_processados,
        'total_points_expired', v_total_points_expired,
        'executed_at', now()::text
    );
END;
$function$;

-- --------------------------------------------------------------------------
-- get_loyalty_summary — lista clientes com saldo (admin)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_loyalty_summary()
RETURNS TABLE(
    customer_email text,
    user_id uuid,
    customer_name text,
    balance integer,
    total_earned integer,
    total_redeemed integer,
    total_expired integer,
    last_activity_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.admins WHERE admins.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    RETURN QUERY
    WITH grouped AS (
        SELECT 
            LOWER(lp.customer_email) AS email_key,
            (ARRAY_AGG(lp.user_id) FILTER (WHERE lp.user_id IS NOT NULL))[1] AS uid,
            COALESCE(SUM(lp.points) FILTER (
                WHERE lp.expires_at IS NULL OR lp.expires_at > now()
            ), 0)::INTEGER AS bal,
            COALESCE(SUM(lp.points) FILTER (WHERE lp.type = 'earned'), 0)::INTEGER AS earned,
            COALESCE(SUM(ABS(lp.points)) FILTER (WHERE lp.type = 'redeemed'), 0)::INTEGER AS redeemed,
            COALESCE(SUM(ABS(lp.points)) FILTER (WHERE lp.type = 'expired'), 0)::INTEGER AS expired,
            MAX(lp.created_at) AS last_activity
        FROM public.loyalty_points lp
        WHERE lp.customer_email IS NOT NULL
        GROUP BY LOWER(lp.customer_email)
    )
    SELECT 
        g.email_key AS customer_email,
        g.uid AS user_id,
        COALESCE(
            (SELECT o.customer_name 
             FROM public.orders o 
             WHERE LOWER(o.customer_email) = g.email_key
             ORDER BY o.created_at DESC 
             LIMIT 1),
            'Cliente'
        ) AS customer_name,
        g.bal AS balance,
        g.earned AS total_earned,
        g.redeemed AS total_redeemed,
        g.expired AS total_expired,
        g.last_activity AS last_activity_at
    FROM grouped g
    ORDER BY g.bal DESC, g.last_activity DESC;
END;
$function$;

-- --------------------------------------------------------------------------
-- get_loyalty_extrato — extrato paginado do cliente (admin)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_loyalty_extrato(
    p_customer_email text,
    p_type text DEFAULT NULL::text,
    p_days integer DEFAULT NULL::integer,
    p_limit integer DEFAULT 100,
    p_offset integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_admin_id UUID;
    v_transactions JSONB;
    v_total INTEGER;
    v_cutoff_date TIMESTAMPTZ;
BEGIN
    SELECT admins.user_id INTO v_admin_id
    FROM public.admins 
    WHERE admins.user_id = auth.uid()
    LIMIT 1;

    IF v_admin_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'access_denied', 'message', 'Acesso negado: admin only');
    END IF;

    p_customer_email := LOWER(TRIM(p_customer_email));

    IF p_days IS NOT NULL AND p_days > 0 THEN
        v_cutoff_date := now() - (p_days || ' days')::INTERVAL;
    END IF;

    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'id', t.id,
                'points', t.points,
                'type', t.type,
                'description', t.description,
                'order_id', t.order_id,
                'coupon_id', t.coupon_id,
                'expires_at', t.expires_at,
                'created_at', t.created_at
            )
            ORDER BY t.created_at DESC
        )
    INTO v_transactions
    FROM (
        SELECT *
        FROM public.loyalty_points
        WHERE LOWER(customer_email) = p_customer_email
          AND (p_type IS NULL OR type = p_type)
          AND (v_cutoff_date IS NULL OR created_at >= v_cutoff_date)
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) t;

    IF v_transactions IS NULL THEN
        v_transactions := '[]'::jsonb;
    END IF;

    SELECT COUNT(*)::INTEGER INTO v_total
    FROM public.loyalty_points
    WHERE LOWER(customer_email) = p_customer_email
      AND (p_type IS NULL OR type = p_type)
      AND (v_cutoff_date IS NULL OR created_at >= v_cutoff_date);

    RETURN jsonb_build_object(
        'success', true,
        'customer_email', p_customer_email,
        'transactions', v_transactions,
        'total', v_total,
        'limit', p_limit,
        'offset', p_offset
    );
END;
$function$;

-- --------------------------------------------------------------------------
-- adjust_loyalty_points — ajuste manual de pontos (admin)
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_loyalty_points(
    p_customer_email text,
    p_points integer,
    p_reason text,
    p_user_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_admin_id UUID;
    v_balance INTEGER;
    v_loyalty_id UUID;
BEGIN
    SELECT admins.user_id INTO v_admin_id
    FROM public.admins 
    WHERE admins.user_id = auth.uid()
    LIMIT 1;

    IF v_admin_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'access_denied', 'message', 'Acesso negado: admin only');
    END IF;

    p_customer_email := LOWER(TRIM(p_customer_email));

    IF p_customer_email IS NULL OR p_customer_email = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_email', 'message', 'Email do cliente é obrigatório');
    END IF;

    IF p_points IS NULL OR p_points = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_points', 'message', 'Valor dos pontos precisa ser diferente de zero');
    END IF;

    IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'invalid_reason', 'message', 'Motivo é obrigatório');
    END IF;

    IF p_points < 0 THEN
        SELECT COALESCE(SUM(points), 0)::INTEGER INTO v_balance
        FROM public.loyalty_points
        WHERE LOWER(customer_email) = p_customer_email
          AND (expires_at IS NULL OR expires_at > now());

        IF v_balance < ABS(p_points) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'insufficient_balance',
                'message', 'Cliente tem ' || v_balance || ' pontos. Não é possível remover ' || ABS(p_points) || '.',
                'balance', v_balance,
                'attempted', ABS(p_points)
            );
        END IF;
    END IF;

    IF p_user_id IS NULL THEN
        SELECT user_id INTO p_user_id
        FROM public.orders
        WHERE LOWER(customer_email) = p_customer_email
          AND user_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    INSERT INTO public.loyalty_points (
        user_id,
        customer_email,
        points,
        type,
        description,
        created_by,
        expires_at
    ) VALUES (
        p_user_id,
        p_customer_email,
        p_points,
        'adjustment',
        'Ajuste manual: ' || TRIM(p_reason),
        v_admin_id,
        NULL
    )
    RETURNING id INTO v_loyalty_id;

    SELECT COALESCE(SUM(points), 0)::INTEGER INTO v_balance
    FROM public.loyalty_points
    WHERE LOWER(customer_email) = p_customer_email
      AND (expires_at IS NULL OR expires_at > now());

    RETURN jsonb_build_object(
        'success', true,
        'loyalty_id', v_loyalty_id,
        'customer_email', p_customer_email,
        'points_adjusted', p_points,
        'new_balance', v_balance,
        'reason', TRIM(p_reason),
        'message', 'Ajuste aplicado com sucesso'
    );
END;
$function$;

-- ==========================================================================
-- 5. TRIGGERS
-- ==========================================================================

-- --------------------------------------------------------------------------
-- coupons
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_normalize_coupon_code ON public.coupons;
CREATE TRIGGER trigger_normalize_coupon_code
    BEFORE INSERT OR UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.normalize_coupon_code();

DROP TRIGGER IF EXISTS trigger_coupons_updated_at ON public.coupons;
CREATE TRIGGER trigger_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.update_coupons_updated_at();

-- --------------------------------------------------------------------------
-- loyalty_points
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_notify_points_earned ON public.loyalty_points;
CREATE TRIGGER trigger_notify_points_earned
    AFTER INSERT ON public.loyalty_points
    FOR EACH ROW EXECUTE FUNCTION public.notify_points_earned();

-- --------------------------------------------------------------------------
-- orders
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_set_guest_token ON public.orders;
CREATE TRIGGER trigger_set_guest_token
    BEFORE INSERT OR UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.set_guest_token();

DROP TRIGGER IF EXISTS trigger_set_shipped_at ON public.orders;
CREATE TRIGGER trigger_set_shipped_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.set_shipped_at();

DROP TRIGGER IF EXISTS trigger_credit_loyalty_points ON public.orders;
CREATE TRIGGER trigger_credit_loyalty_points
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.credit_loyalty_points_on_paid();

DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON public.orders;
CREATE TRIGGER trigger_notify_order_status_change
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.notify_order_status_change();

-- ⚠️ Trigger HTTP — chama a Edge Function notify-order-status via pg_net
-- (Requer a extensão pg_net; se não existir, este trigger pode falhar)
DROP TRIGGER IF EXISTS "notify-order-status" ON public.orders;
CREATE TRIGGER "notify-order-status"
    AFTER UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
        'https://dytdnemwqbzgrekamwla.supabase.co/functions/v1/notify-order-status',
        'POST',
        '{"Content-type":"application/json"}',
        '{}',
        '5000'
    );

-- --------------------------------------------------------------------------
-- products
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_products_updated_at();

-- --------------------------------------------------------------------------
-- reviews
-- --------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON public.reviews;
CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_reviews_updated_at();

DROP TRIGGER IF EXISTS trigger_notify_review_status_change ON public.reviews;
CREATE TRIGGER trigger_notify_review_status_change
    AFTER UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.notify_review_status_change();

-- ==========================================================================
-- ⚠️ TRIGGER ADICIONAL — handle_new_user (no schema auth)
-- ==========================================================================
-- Este trigger roda em auth.users (quando alguém se cadastra).
-- Como roda em outro schema, não faz parte deste arquivo. Se precisar recriar:
--
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ==========================================================================
-- 6. ÍNDICES
-- ==========================================================================
-- PKs e UNIQUE já vêm do CREATE TABLE. Aqui só os adicionais.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- coupon_usages
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON public.coupon_usages USING btree (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_email ON public.coupon_usages USING btree (customer_email);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_order ON public.coupon_usages USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON public.coupon_usages USING btree (user_id);

-- --------------------------------------------------------------------------
-- coupons
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons USING btree (active, expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons USING btree (code);
CREATE INDEX IF NOT EXISTS idx_coupons_email ON public.coupons USING btree (customer_email) WHERE (customer_email IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_coupons_expiring_email ON public.coupons USING btree (expires_at) WHERE ((email_notified_at IS NULL) AND (active = true));

-- --------------------------------------------------------------------------
-- loyalty_points
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_loyalty_points_email ON public.loyalty_points USING btree (lower(customer_email));
CREATE INDEX IF NOT EXISTS idx_loyalty_points_expired_check ON public.loyalty_points USING btree (expires_at) WHERE ((type = 'earned'::text) AND (expired_at IS NULL) AND (expires_at IS NOT NULL));
CREATE INDEX IF NOT EXISTS idx_loyalty_points_expires ON public.loyalty_points USING btree (expires_at) WHERE ((expires_at IS NOT NULL) AND (type = 'earned'::text));
CREATE INDEX IF NOT EXISTS idx_loyalty_points_order ON public.loyalty_points USING btree (order_id) WHERE (order_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_type ON public.loyalty_points USING btree (type);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON public.loyalty_points USING btree (user_id) WHERE (user_id IS NOT NULL);

-- --------------------------------------------------------------------------
-- notifications
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications USING btree (user_id, created_at DESC) WHERE (read_at IS NULL);

-- --------------------------------------------------------------------------
-- orders
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_guest_token ON public.orders USING btree (guest_token) WHERE (guest_token IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_orders_label_status ON public.orders USING btree (label_status) WHERE (label_status IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_orders_me_id ON public.orders USING btree (melhorenvio_order_id) WHERE (melhorenvio_order_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_orders_review_requested_at ON public.orders USING btree (review_requested_at) WHERE (review_requested_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON public.orders USING btree (shipped_at) WHERE (status = 'enviado'::text);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders USING btree (tracking_code) WHERE (tracking_code IS NOT NULL);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders USING btree (status);

-- --------------------------------------------------------------------------
-- reviews
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product_ref ON public.reviews USING btree (product_ref);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews USING btree (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_per_order ON public.reviews USING btree (product_ref, order_id) WHERE (order_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews USING btree (user_id);

-- --------------------------------------------------------------------------
-- shipping_quotes_cache
-- --------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shipping_cache_expires ON public.shipping_quotes_cache USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_shipping_cache_lookup ON public.shipping_quotes_cache USING btree (cep_origem, cep_destino, peso_kg, valor_declarado);

-- ==========================================================================
-- 7. CRON JOBS (pg_cron)
-- ==========================================================================
-- ⚠️ Requer extensão pg_cron habilitada.
-- ⚠️ Requer extensão pg_net habilitada (pra chamadas HTTP).
--
-- Jobs agendados (horário UTC):
--   1. request-review           — 06h UTC (03h BRT)
--   2. remind-review            — 07h UTC (04h BRT)
--   3. cleanup_old_notifications — 05h UTC (02h BRT)
--   4. notify-expiring-coupons  — 08h UTC (05h BRT)
--   5. expire_loyalty_points    — 06h UTC (03h BRT)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- Job 1: request-review — Email pedindo avaliação (~7d após envio)
-- --------------------------------------------------------------------------
SELECT cron.unschedule('request-review')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'request-review');

SELECT cron.schedule(
    'request-review',
    '0 6 * * *',
    $$
    SELECT net.http_get(
        url := 'https://dytdnemwqbzgrekamwla.supabase.co/functions/v1/request-review'
    ) AS request_id;
    $$
);

-- --------------------------------------------------------------------------
-- Job 2: remind-review — Lembrete (~5d após request)
-- --------------------------------------------------------------------------
SELECT cron.unschedule('remind-review')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'remind-review');

SELECT cron.schedule(
    'remind-review',
    '0 7 * * *',
    $$
    SELECT net.http_get(
        url := 'https://dytdnemwqbzgrekamwla.supabase.co/functions/v1/remind-review'
    ) AS request_id;
    $$
);

-- --------------------------------------------------------------------------
-- Job 3: cleanup-notifications — Deleta notificações lidas há 30+ dias
-- --------------------------------------------------------------------------
SELECT cron.unschedule('cleanup-notifications')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-notifications');

SELECT cron.schedule(
    'cleanup-notifications',
    '0 5 * * *',
    $$
    SELECT cleanup_old_notifications();
    $$
);

-- --------------------------------------------------------------------------
-- Job 4: notify-expiring-coupons — Email de cupom expirando (≤5d)
-- --------------------------------------------------------------------------
SELECT cron.unschedule('notify-expiring-coupons')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify-expiring-coupons');

SELECT cron.schedule(
    'notify-expiring-coupons',
    '0 8 * * *',
    $$
    SELECT net.http_get(
        url := 'https://dytdnemwqbzgrekamwla.supabase.co/functions/v1/notify-expiring-coupons'
    ) AS request_id;
    $$
);

-- --------------------------------------------------------------------------
-- Job 5: expire-loyalty-points — Expira lotes vencidos (lógica B)
-- --------------------------------------------------------------------------
SELECT cron.unschedule('expire-loyalty-points')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-loyalty-points');

SELECT cron.schedule(
    'expire-loyalty-points',
    '0 6 * * *',
    $$
    SELECT public.expire_loyalty_points();
    $$
);

-- ==========================================================================
-- FIM DO SCHEMA
-- ==========================================================================
-- Total:
--   - 13 tabelas
--   - 13 RLS habilitados
--   - 40 policies
--   - 24 funções
--   - 14 triggers (13 no public + 1 comentado no auth)
--   - 42 índices
--   - 5 cron jobs
--
-- Gerado em: 02/out/2026
-- Fonte da verdade: Supabase (projeto dytdnemwqbzgrekamwla)
-- ==========================================================================