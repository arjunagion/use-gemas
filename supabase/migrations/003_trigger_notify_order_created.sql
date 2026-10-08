-- ==========================================================================
-- Trigger: notify-order-created
-- --------------------------------------------------------------------------
-- Dispara a Edge Function `notify-order-created` a cada novo pedido inserido
-- em `orders`. A Edge Function envia email "Pedido Recebido" pro cliente e
-- pro dono.
--
-- Padrão: supabase_functions.http_request (o mesmo do notify-order-status).
-- Chamada assíncrona, timeout 5000ms.
--
-- A Edge Function precisa ter "Verify JWT" DESATIVADO no painel (senão
-- o trigger recebe 401). Já configurado em produção.
-- ==========================================================================

DROP TRIGGER IF EXISTS "notify-order-created" ON public.orders;

CREATE TRIGGER "notify-order-created"
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request(
        'https://dytdnemwqbzgrekamwla.supabase.co/functions/v1/notify-order-created',
        'POST',
        '{"Content-type":"application/json"}',
        '{}',
        '5000'
    );
