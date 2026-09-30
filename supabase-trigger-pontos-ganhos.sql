-- =============================================================================
-- Use Gemas — Trigger: notificação REAL de "pontos ganhos"
-- -----------------------------------------------------------------------------
-- Substitui a abordagem antiga (notificação virtual via localStorage), que
-- "queimava" a notificação na primeira página aberta.
--
-- Agora, ao inserir uma linha em loyalty_points com type = 'earned', uma
-- notificação REAL é criada na tabela notifications — igual a order_paid,
-- review_approved, etc. O trigger roda 1x por linha, então não duplica.
--
-- COMO RODAR:
--   Supabase Dashboard → SQL Editor → cole este arquivo inteiro → RUN.
--   É idempotente: pode rodar de novo sem duplicar (drop + create).
-- =============================================================================

-- 1) Função acionada pelo trigger
CREATE OR REPLACE FUNCTION public.notify_points_earned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_points_formatted text;
    v_brl_value text;
BEGIN
    -- Só interessa "ganho" de pontos (ignora resgates/expirações)
    IF NEW.type IS DISTINCT FROM 'earned' THEN
        RETURN NEW;
    END IF;

    -- Guest (sem user_id) não tem sininho → não cria notificação
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Pontos no padrão brasileiro (ex: 1234 → "1.234")
    v_points_formatted := reverse(
        regexp_replace(
            reverse(COALESCE(NEW.points, 0)::text),
            '([0-9]{3})(?=[0-9])',
            '\1.',
            'g'
        )
    );

    -- 100 pontos = R$ 1,00 (ex: 1234 → "12,34")
    v_brl_value := replace(
        to_char(COALESCE(NEW.points, 0)::numeric / 100, 'FM999999990.00'),
        '.',
        ','
    );

    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        link,
        metadata,
        read_at
    )
    VALUES (
        NEW.user_id,
        'points_earned',
        -- chr(128142) = emoji de diamante (U+1F48E)
        'Você ganhou ' || v_points_formatted || ' pontos! ' || chr(128142),
        'Vale R$ ' || v_brl_value || ' de desconto no próximo pedido',
        'minha-conta.html#beneficios',
        jsonb_build_object(
            'points', COALESCE(NEW.points, 0),
            'order_id', NEW.order_id,
            'loyalty_point_id', NEW.id
        ),
        NULL
    );

    RETURN NEW;
END;
$$;

-- 2) Trigger AFTER INSERT na loyalty_points
DROP TRIGGER IF EXISTS trg_notify_points_earned ON public.loyalty_points;

CREATE TRIGGER trg_notify_points_earned
AFTER INSERT ON public.loyalty_points
FOR EACH ROW
EXECUTE FUNCTION public.notify_points_earned();
