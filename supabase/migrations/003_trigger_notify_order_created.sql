-- ==========================================================================
-- 003 — Trigger notify-order-created (pg_net)
-- --------------------------------------------------------------------------
-- Dispara a Edge Function `notify-order-created` em cada INSERT em `orders`.
-- A Edge envia emails "Pedido Recebido" pro cliente e pro dono.
--
-- Padrão: pg_net (net.http_post) — NÃO usa supabase_functions.http_request
-- porque essa extensão não está instalada neste projeto (deprecada).
--
-- ⚠️ IMPORTANTE:
-- A Edge Function `notify-order-created` PRECISA ter "Verify JWT" DESATIVADO
-- no painel do Supabase. Sem isso, a chamada do pg_net recebe 401 Unauthorized
-- e o email não sai. Sempre conferir após redeploy.
-- ==========================================================================

-- Função wrapper: monta o payload e chama a Edge via pg_net
CREATE OR REPLACE FUNCTION public.notify_order_created_via_pgnet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_payload jsonb;
BEGIN
    v_payload := jsonb_build_object(
        'type', 'INSERT',
        'table', 'orders',
        'record', row_to_json(NEW)::jsonb,
        'old_record', NULL
    );

    PERFORM net.http_post(
        url := 'https://dytdnemwqbzgrekamwla.supabase.co/functions/v1/notify-order-created',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := v_payload::text::jsonb
    );

    RETURN NEW;
END;
$$;

-- Cria o trigger
DROP TRIGGER IF EXISTS "notify-order-created" ON public.orders;

CREATE TRIGGER "notify-order-created"
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.notify_order_created_via_pgnet();
