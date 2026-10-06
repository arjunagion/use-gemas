import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==========================================================================
// Configuração
// ==========================================================================
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") 
    || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// ==========================================================================
// Handler
// ==========================================================================
serve(async (req: Request) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
    };

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Config ausente");
            return new Response(
                JSON.stringify({ error: "config_missing" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // DECLARA O BODY AQUI — ESSENCIAL
        const body = await req.json();
        console.log("Webhook recebido:", JSON.stringify(body, null, 2));

        // ME às vezes manda como { event, data } e às vezes direto
        const event = body.event || body.type || null;
        const data = body.data || body || null;

        console.log("Event:", event, "Data keys:", data ? Object.keys(data) : "vazio");

        // Se for payload de teste (sem event ou sem data), retorna 200 OK
        if (!event || !data) {
            console.log("Payload sem event/data — retornando 200 (teste de cadastro)");
            return new Response(
                JSON.stringify({ success: true, message: "Webhook recebido (teste)" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // Pega o ME order ID
        const meOrderId = data.id || data.order_id || data.melhorenvio_order_id;

        if (!meOrderId) {
            return new Response(
                JSON.stringify({ success: false, error: "missing_me_order_id", event }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // Busca pedido no banco
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, status, tracking_code, customer_email, customer_name, user_id")
            .eq("melhorenvio_order_id", meOrderId)
            .single();

        if (orderError || !order) {
            console.warn("Pedido não encontrado pra ME ID:", meOrderId);
            return new Response(
                JSON.stringify({ success: false, error: "order_not_found", me_order_id: meOrderId }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // ======================================================================
        // Mapeia eventos do ME → ações
        // ======================================================================
        const updatePayload: any = {};
        let shouldNotify = false;
        let notificationTitle = "";
        let notificationMessage = "";

        // Tracking code (vem em vários eventos)
        if (data.tracking) {
            updatePayload.tracking_code = data.tracking;
            updatePayload.tracking_url = `https://www.melhorenvio.com.br/rastreio/${data.tracking}`;
        }

        // Eventos
        if (event === "order.posted" || event === "order.released") {
            console.log("Pedido postado:", order.id);
        }

        if (event === "order.delivered" || data.status === "delivered") {
            updatePayload.status = "entregue";
            shouldNotify = true;
            notificationTitle = "Sua peça foi entregue!";
            notificationMessage = `Pedido chegou! Esperamos que ame. Não esqueça de avaliar.`;
        }

        if (event === "order.cancelled" || event === "order.canceled") {
            updatePayload.status = "cancelado";
            shouldNotify = true;
            notificationTitle = "Pedido cancelado";
            notificationMessage = `Seu pedido foi cancelado. Entre em contato se tiver dúvidas.`;
        }

        // Só atualiza se tiver algo
        if (Object.keys(updatePayload).length > 0) {
            const { error: updateError } = await supabase
                .from("orders")
                .update(updatePayload)
                .eq("id", order.id);

            if (updateError) {
                console.error("Erro ao atualizar pedido:", updateError);
                return new Response(
                    JSON.stringify({ success: false, error: "update_failed", details: updateError }),
                    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
                );
            }

            console.log("Pedido atualizado:", order.id, updatePayload);
        }

        // Cria notificação (só se tiver user_id)
        if (shouldNotify && order.user_id) {
            const { error: notifError } = await supabase
                .from("notifications")
                .insert({
                    user_id: order.user_id,
                    type: "order_delivered",
                    title: notificationTitle,
                    message: notificationMessage,
                    link: `minha-conta.html`,
                    metadata: {
                        order_id: order.id,
                        tracking_code: data.tracking || null,
                        event,
                    },
                    read_at: null,
                });

            if (notifError) {
                console.error("Erro ao criar notificação:", notifError);
            } else {
                console.log("Notificação criada pra user:", order.user_id);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                event,
                order_id: order.id,
                updated_fields: Object.keys(updatePayload),
                notification_sent: shouldNotify && !!order.user_id,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );

    } catch (error) {
        console.error("Erro inesperado:", error);
        return new Response(
            JSON.stringify({ success: false, error: "unexpected_error", message: String(error) }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
});