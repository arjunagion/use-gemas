import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==========================================================================
// ⚠️ NOTA IMPORTANTE — Melhor Envio recusa sender_doc === customer_doc
// ==========================================================================
//
// O Melhor Envio bloqueia a geração de etiqueta quando o CPF/CNPJ do
// remetente (settings.melhorenvio_sender_doc) é IGUAL ao do destinatário
// (order.customer_doc). É uma proteção contra auto-envio.
//
// COMO ISSO APARECE EM TESTE:
// - Durante testes locais, ao testar o fluxo completo sozinho, você acaba
//   usando o MESMO CPF no remetente e no destinatário.
// - O ME retorna erro do tipo "não é possível enviar para o mesmo CPF"
//   ou algo similar no step1 (/api/v2/me/cart).
//
// COMO CONTORNAR EM TESTE:
// - Use CPFs diferentes no remetente e destinatário.
// - Crie um pedido de teste com dados fictícios (nome, CPF, endereço
//   diferentes do seu).
// - OU use o modo sandbox do ME (MELHORENVIO_SANDBOX=true) — ainda assim,
//   o bloqueio pode ocorrer.
//
// NÃO É BUG DO PROJETO — é uma regra do próprio ME.
//
// ==========================================================================

const MELHORENVIO_ACCESS_TOKEN = Deno.env.get("MELHORENVIO_ACCESS_TOKEN");
const MELHORENVIO_SANDBOX = Deno.env.get("MELHORENVIO_SANDBOX") === "true";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

const ME_API_BASE = MELHORENVIO_SANDBOX
    ? "https://sandbox.melhorenvio.com.br"
    : "https://www.melhorenvio.com.br";

const USER_AGENT = "Use Gemas (arjunabwr@gmail.com)";

function cleanCEP(cep: string): string {
    return (cep || "").replace(/\D/g, "");
}
function cleanDoc(doc: string): string {
    return (doc || "").replace(/\D/g, "");
}
function cleanPhone(phone: string): string {
    return (phone || "").replace(/\D/g, "");
}
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function meRequest(endpoint: string, method: "GET" | "POST", body?: any) {
    const url = `${ME_API_BASE}${endpoint}`;
    const options: RequestInit = {
        method,
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${MELHORENVIO_ACCESS_TOKEN}`,
            "User-Agent": USER_AGENT,
        },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type") || "";
    let data: any = null;
    try {
        data = await response.json();
    } catch (e) {
        data = { error: "Resposta não-JSON", status: response.status };
    }
    return { ok: response.ok, data, status: response.status, contentType };
}

async function fetchLabelUrlWithRetry(
    meOrderId: string,
): Promise<{ url: string | null; attempts: number; lastError: any }> {
    const delays = [0, 3000, 7000];
    let lastError: any = null;

    for (let attempt = 0; attempt < delays.length; attempt++) {
        if (delays[attempt] > 0) {
            await sleep(delays[attempt]);
        }

        console.log(`Tentativa ${attempt + 1}/${delays.length}`);

        try {
            // ⚠️ Aceita HTML ou JSON
            const response = await fetch(
                `${ME_API_BASE}/api/v2/me/shipment/print?orders=${meOrderId}`,
                {
                    method: "GET",
                    headers: {
                        "Accept": "text/html,application/json;q=0.9,*/*;q=0.8",
                        "Authorization": `Bearer ${MELHORENVIO_ACCESS_TOKEN}`,
                        "User-Agent": USER_AGENT,
                    },
                },
            );

            const contentType = response.headers.get("content-type") || "";
            const status = response.status;

            console.log(`Tentativa ${attempt + 1} — status: ${status}, content-type: ${contentType}`);

            if (!response.ok) {
                lastError = { reason: "not_ok", status, contentType };
                continue;
            }

            // Caso 1 — JSON
            if (contentType.includes("application/json")) {
                const data = await response.json();
                const labelUrl = data?.url
                    || (Array.isArray(data) ? data[0]?.url : null)
                    || data?.[meOrderId]?.url
                    || null;
                if (labelUrl) {
                    return { url: labelUrl, attempts: attempt + 1, lastError: null };
                }
                lastError = { reason: "json_no_url", data };
                continue;
            }

            // Caso 2 — HTML (extrai href ou URL direta)
            if (contentType.includes("text/html")) {
                const html = await response.text();

                // Procura href com .pdf
                let match = html.match(/href=["']([^"']*\.pdf[^"']*)["']/i);
                if (match) {
                    return { url: match[1], attempts: attempt + 1, lastError: null };
                }

                // Procura qualquer URL que contenha melhorenvio e ".pdf"
                match = html.match(/https?:\/\/[^"'\s<>]*melhorenvio[^"'\s<>]*\.pdf[^"'\s<>]*/i);
                if (match) {
                    return { url: match[0], attempts: attempt + 1, lastError: null };
                }

                // Procura qualquer URL com .pdf (fallback)
                match = html.match(/https?:\/\/[^"'\s<>]*\.pdf[^"'\s<>]*/i);
                if (match) {
                    return { url: match[0], attempts: attempt + 1, lastError: null };
                }

                // Não achou — salva snapshot
                lastError = {
                    reason: "html_no_pdf_url",
                    contentType,
                    htmlSnippet: html.slice(0, 1000),
                };
                continue;
            }

            // Caso 3 — PDF direto (não deveria acontecer nesse endpoint, mas vamos guardar)
            if (contentType.includes("application/pdf")) {
                lastError = { reason: "pdf_binary_direct", note: "Precisa salvar em Storage" };
                continue;
            }

            // Caso 4 — desconhecido
            const text = await response.text();
            lastError = { reason: "unknown_content_type", contentType, textSnippet: text.slice(0, 500) };

        } catch (e) {
            console.error(`Tentativa ${attempt + 1} exceção:`, e);
            lastError = { reason: "exception", message: String(e) };
        }
    }

    return { url: null, attempts: delays.length, lastError };
}

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

    let orderId: string | null = null;
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    try {
        if (!MELHORENVIO_ACCESS_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(
                JSON.stringify({ success: false, error: "config_missing", message: "Configuração ausente" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        const body = await req.json();
        orderId = body.order_id;

        if (!orderId) {
            return new Response(
                JSON.stringify({ success: false, error: "missing_order_id", message: "order_id é obrigatório" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        const { data: order, error: orderError } = await supabase
            .from("orders").select("*").eq("id", orderId).single();

        if (orderError || !order) {
            return new Response(
                JSON.stringify({ success: false, error: "order_not_found", message: "Pedido não encontrado" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        const { data: settings, error: settingsError } = await supabase
            .from("settings").select("*").eq("id", 1).single();

        if (settingsError || !settings) {
            return new Response(
                JSON.stringify({ success: false, error: "settings_not_found", message: "Configurações não encontradas" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        const missing: string[] = [];
        if (!order.cep || !order.street || !order.number || !order.neighborhood || !order.city || !order.state) {
            missing.push("endereço do cliente");
        }
        if (!order.customer_doc) missing.push("CPF do cliente");
        if (!order.shipping_service_id) missing.push("serviço de frete");
        if (!settings.melhorenvio_sender_doc) missing.push("CPF do remetente");
        if (!settings.shipping_origin_cep) missing.push("CEP de origem");

        if (missing.length > 0) {
            const msg = `Campos obrigatórios faltando: ${missing.join(", ")}`;
            await supabase.from("orders").update({
                label_status: "error", label_error: msg,
            }).eq("id", orderId);
            return new Response(
                JSON.stringify({ success: false, error: "validation_failed", message: msg }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        const serviceId = parseInt(order.shipping_service_id);
        if (isNaN(serviceId)) {
            return new Response(
                JSON.stringify({ success: false, error: "invalid_service_id", message: "ID do serviço inválido" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        const products = (order.items || []).map((item: any) => ({
            name: item.name || "Produto",
            quantity: item.quantity || 1,
            unitary_value: Number(item.price) || 0,
        }));

        const mePayload = {
            service: serviceId,
            agency: null,
            from: {
                name: settings.melhorenvio_sender_name,
                phone: cleanPhone(settings.melhorenvio_sender_phone),
                email: settings.melhorenvio_sender_email,
                document: cleanDoc(settings.melhorenvio_sender_doc),
                address: settings.melhorenvio_sender_address,
                number: settings.melhorenvio_sender_number,
                complement: settings.melhorenvio_sender_complement || "",
                district: settings.melhorenvio_sender_district,
                city: settings.melhorenvio_sender_city,
                state_abbr: settings.melhorenvio_sender_state,
                postal_code: cleanCEP(settings.shipping_origin_cep),
            },
            to: {
                name: order.customer_name,
                phone: cleanPhone(order.customer_phone),
                email: order.customer_email,
                document: cleanDoc(order.customer_doc),
                address: order.street,
                number: order.number,
                complement: order.complement || "",
                district: order.neighborhood,
                city: order.city,
                state_abbr: order.state,
                postal_code: cleanCEP(order.cep),
            },
            products,
            volumes: {
                height: Number(settings.shipping_default_height_cm) || 10,
                width: Number(settings.shipping_default_width_cm) || 15,
                length: Number(settings.shipping_default_length_cm) || 20,
                weight: Number(settings.shipping_default_weight_kg) || 1.0,
            },
            options: {
                insurance_value: Number(order.total) || 0,
                receipt: false, own_hand: false, reverse: false, non_commercial: false,
            },
        };

        // Etapa 1
        const step1 = await meRequest("/api/v2/me/cart", "POST", mePayload);
        if (!step1.ok) {
            const msg = `Falha ao adicionar ao carrinho: ${JSON.stringify(step1.data)}`;
            await supabase.from("orders").update({ label_status: "error", label_error: msg }).eq("id", orderId);
            return new Response(
                JSON.stringify({ success: false, error: "me_cart_failed", message: msg, details: step1.data }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        const meOrderId = step1.data?.id;
        if (!meOrderId) {
            return new Response(
                JSON.stringify({ success: false, error: "me_no_order_id", message: "ME não retornou ID", details: step1.data }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // Etapa 2
        const step2 = await meRequest("/api/v2/me/shipment/checkout", "POST", { orders: [meOrderId] });
        if (!step2.ok) {
            const msg = `Falha no checkout: ${JSON.stringify(step2.data)}`;
            await supabase.from("orders").update({
                label_status: "error", label_error: msg, melhorenvio_order_id: meOrderId,
            }).eq("id", orderId);
            return new Response(
                JSON.stringify({ success: false, error: "me_checkout_failed", message: msg, details: step2.data }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // Etapa 3
        const step3 = await meRequest("/api/v2/me/shipment/generate", "POST", { orders: [meOrderId] });
        if (!step3.ok) {
            const msg = `Falha ao gerar etiqueta: ${JSON.stringify(step3.data)}`;
            await supabase.from("orders").update({
                label_status: "error", label_error: msg, melhorenvio_order_id: meOrderId,
            }).eq("id", orderId);
            return new Response(
                JSON.stringify({ success: false, error: "me_generate_failed", message: msg, details: step3.data }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // Etapa 4 (retry com parse HTML)
        const urlResult = await fetchLabelUrlWithRetry(meOrderId);

        await supabase.from("orders").update({
            melhorenvio_order_id: meOrderId,
            label_url: urlResult.url,
            label_status: "generated",
            label_generated_at: new Date().toISOString(),
            label_error: urlResult.url ? null : `URL do PDF não obtida após ${urlResult.attempts} tentativas`,
        }).eq("id", orderId);

        if (urlResult.url) {
            return new Response(
                JSON.stringify({
                    success: true,
                    label_url: urlResult.url,
                    melhorenvio_order_id: meOrderId,
                    attempts: urlResult.attempts,
                    message: `Etiqueta gerada com sucesso (${urlResult.attempts} tentativa${urlResult.attempts > 1 ? 's' : ''})`,
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                label_url: null,
                melhorenvio_order_id: meOrderId,
                warning: "PDF ainda processando no Melhor Envio",
                message: "Etiqueta gerada, mas o PDF ainda não está pronto. Use 'Buscar PDF' em alguns segundos.",
                details: urlResult.lastError,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );

    } catch (error) {
        console.error("Erro inesperado:", error);
        if (orderId) {
            try {
                await supabase.from("orders").update({
                    label_status: "error",
                    label_error: `Erro inesperado: ${String(error)}`,
                }).eq("id", orderId);
            } catch (e) { }
        }
        return new Response(
            JSON.stringify({ success: false, error: "unexpected_error", message: String(error) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
});