import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==========================================================================
// Configuração
// ==========================================================================
const MELHORENVIO_ACCESS_TOKEN = Deno.env.get("MELHORENVIO_ACCESS_TOKEN");
const MELHORENVIO_SANDBOX = Deno.env.get("MELHORENVIO_SANDBOX") === "true";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") 
    || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const ME_API_BASE = MELHORENVIO_SANDBOX
    ? "https://sandbox.melhorenvio.com.br"
    : "https://www.melhorenvio.com.br";

const USER_AGENT = "Use Gemas (pedidos@usegemas.com.br)";

// ==========================================================================
// Helpers
// ==========================================================================
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLabelUrlWithRetry(
    meOrderId: string,
): Promise<{ url: string | null; attempts: number; lastError: any }> {
    const delays = [0, 3000, 7000];
    let lastError: any = null;

    const modes = [
        { method: "POST" as const, body: { mode: "public", orders: [meOrderId] }, accept: "application/json" },
        { method: "GET" as const, body: undefined, accept: "application/json" },
    ];

    for (let attempt = 0; attempt < delays.length; attempt++) {
        if (delays[attempt] > 0) await sleep(delays[attempt]);

        for (const mode of modes) {
            try {
                console.log(`Tentativa ${attempt + 1} — modo: ${mode.method}`);

                const url = mode.method === "GET"
                    ? `${ME_API_BASE}/api/v2/me/shipment/print?orders=${meOrderId}`
                    : `${ME_API_BASE}/api/v2/me/shipment/print`;

                const response = await fetch(url, {
                    method: mode.method,
                    headers: {
                        "Accept": mode.accept,
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${MELHORENVIO_ACCESS_TOKEN}`,
                        "User-Agent": USER_AGENT,
                    },
                    body: mode.body ? JSON.stringify(mode.body) : undefined,
                });

                const contentType = response.headers.get("content-type") || "";
                const status = response.status;

                console.log(`  → status: ${status}, content-type: ${contentType}`);

                if (!response.ok) {
                    lastError = { reason: "not_ok", status, contentType, mode: mode.method };
                    continue;
                }

                // JSON — extrai URL direta
                if (contentType.includes("application/json")) {
                    const data = await response.json();
                    const labelUrl = data?.url
                        || (Array.isArray(data) ? data[0]?.url : null)
                        || data?.[meOrderId]?.url
                        || null;

                    if (labelUrl) {
                        return { url: labelUrl, attempts: attempt + 1, lastError: null };
                    }
                    lastError = { reason: "json_no_url", mode: mode.method, data };
                    continue;
                }

                // HTML — procura href=/imprimir/{token}
                if (contentType.includes("text/html")) {
                    const html = await response.text();

                    // Padrão específico: /imprimir/{token}
                    let match = html.match(/\/imprimir\/([a-zA-Z0-9]+)/);
                    if (match) {
                        const url = `${ME_API_BASE}/imprimir/${match[1]}`;
                        return { url, attempts: attempt + 1, lastError: null };
                    }

                    // Fallback: qualquer href com .pdf
                    match = html.match(/href=["']([^"']*\.pdf[^"']*)["']/i);
                    if (match) {
                        return { url: match[1], attempts: attempt + 1, lastError: null };
                    }

                    // Fallback: URL melhorenvio com /imprimir
                    match = html.match(/(https?:\/\/[^"'\s<>]*imprimir[^"'\s<>]*)/i);
                    if (match) {
                        return { url: match[1], attempts: attempt + 1, lastError: null };
                    }

                    lastError = {
                        reason: "html_no_pdf_url",
                        mode: mode.method,
                        htmlSnippet: html.slice(0, 800),
                    };
                    continue;
                }

                lastError = { reason: "unknown_content_type", contentType, mode: mode.method };
            } catch (e) {
                console.error(`  → exceção:`, e);
                lastError = { reason: "exception", message: String(e), mode: mode.method };
            }
        }
    }

    return { url: null, attempts: delays.length * modes.length, lastError };
}

// ==========================================================================
// Handler principal
// ==========================================================================
serve(async (req: Request) => {
    // ==========================================================================
    // CORS
    // ==========================================================================
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info, accept, origin",
        "Access-Control-Max-Age": "86400",
    };

    // Preflight OPTIONS
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders,
        });
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    try {
        // ======================================================================
        // Validação de config
        // ======================================================================
        if (!MELHORENVIO_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "config_missing",
                    message: "Configuração ausente",
                }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // ======================================================================
        // Lê body
        // ======================================================================
        const body = await req.json();
        const orderId = body.order_id;

        if (!orderId) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "missing_order_id",
                    message: "order_id é obrigatório",
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // ======================================================================
        // Busca pedido no banco
        // ======================================================================
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("id, melhorenvio_order_id, label_url, label_status")
            .eq("id", orderId)
            .single();

        console.log("SELECT result:", { order, orderError });

        if (orderError || !order) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "order_not_found",
                    message: "Pedido não encontrado",
                    debug: {
                        orderId,
                        orderError: orderError ? {
                            message: orderError.message,
                            code: orderError.code,
                            details: orderError.details,
                        } : null,
                    },
                }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        if (!order.melhorenvio_order_id) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "no_me_order_id",
                    message: "Etiqueta ainda não foi gerada pra esse pedido",
                }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // ======================================================================
        // Busca URL do PDF (com retry + POST mode:public + GET fallback)
        // ======================================================================
        console.log("Buscando URL do PDF pra ME order:", order.melhorenvio_order_id);
        const urlResult = await fetchLabelUrlWithRetry(order.melhorenvio_order_id);

        // Se achou, salva no banco
        if (urlResult.url) {
            await supabase
                .from("orders")
                .update({ label_url: urlResult.url })
                .eq("id", orderId);

            return new Response(
                JSON.stringify({
                    success: true,
                    label_url: urlResult.url,
                    attempts: urlResult.attempts,
                    message: "URL do PDF obtida com sucesso",
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // Não achou — retorna warning
        return new Response(
            JSON.stringify({
                success: false,
                error: "url_not_ready",
                message: "PDF ainda não está pronto. Tente novamente em alguns segundos.",
                details: urlResult.lastError,
            }),
            { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );

    } catch (error) {
        console.error("Erro inesperado:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: "unexpected_error",
                message: String(error),
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
});