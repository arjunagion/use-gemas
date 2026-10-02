import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==========================================================================
// Configuração
// ==========================================================================
const MELHORENVIO_CLIENT_ID = Deno.env.get("MELHORENVIO_CLIENT_ID");
const MELHORENVIO_ACCESS_TOKEN = Deno.env.get("MELHORENVIO_ACCESS_TOKEN");
const MELHORENVIO_SANDBOX = Deno.env.get("MELHORENVIO_SANDBOX") === "true";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

const ME_API_BASE = MELHORENVIO_SANDBOX
    ? "https://sandbox.melhorenvio.com.br"
    : "https://www.melhorenvio.com.br";

const CACHE_TTL_HOURS = 24;
const USER_AGENT = "Use Gemas (arjunabwr@gmail.com)";

// ==========================================================================
// Tipos
// ==========================================================================
interface ShippingRequest {
    cep_destino: string;
    peso_kg?: number;
    valor_declarado?: number;
    produtos?: Array<{
        id: string;
        width: number;
        height: number;
        length: number;
        weight: number;
        insurance_value: number;
        quantity: number;
    }>;
}

interface Quote {
    id: number;
    name: string;
    price: string;
    custom_price: string;
    discount: string;
    currency: string;
    delivery_time: number;
    delivery_range: number[];
    company: {
        id: number;
        name: string;
        picture: string;
    };
    error?: string;
}

// ==========================================================================
// Helpers
// ==========================================================================
function cleanCEP(cep: string): string {
    return cep.replace(/\D/g, "");
}

function formatBRL(value: number): string {
    return value.toFixed(2).replace(".", ",");
}

// ==========================================================================
// Handler
// ==========================================================================
serve(async (req: Request) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(
            JSON.stringify({ error: "Method not allowed" }),
            { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    try {
        // Valida envs
        if (!MELHORENVIO_ACCESS_TOKEN || !MELHORENVIO_CLIENT_ID) {
            console.error("Credenciais Melhor Envio ausentes");
            return new Response(
                JSON.stringify({ error: "Configuração ausente" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Supabase config ausente");
            return new Response(
                JSON.stringify({ error: "Supabase config ausente" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Lê body
        const body: ShippingRequest = await req.json();
        const cepDestino = cleanCEP(body.cep_destino || "");

        if (cepDestino.length !== 8) {
            return new Response(
                JSON.stringify({ error: "CEP de destino inválido" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Busca config da loja
        const { data: settings, error: settingsError } = await supabase
            .from("settings")
            .select("*")
            .eq("id", 1)
            .single();

        if (settingsError || !settings) {
            console.error("Erro ao buscar settings:", settingsError);
            return new Response(
                JSON.stringify({ error: "Erro ao buscar configurações" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const cepOrigem = cleanCEP(settings.shipping_origin_cep || "");
        const pesoKg = body.peso_kg || Number(settings.shipping_default_weight_kg) || 1.0;
        const valorDeclarado = body.valor_declarado || 0;
        const length = Number(settings.shipping_default_length_cm) || 20;
        const width = Number(settings.shipping_default_width_cm) || 15;
        const height = Number(settings.shipping_default_height_cm) || 10;

        if (cepOrigem.length !== 8) {
            return new Response(
                JSON.stringify({ error: "CEP de origem não configurado" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Verifica cache
        const cacheKey = {
            cep_origem: cepOrigem,
            cep_destino: cepDestino,
            peso_kg: pesoKg,
            valor_declarado: valorDeclarado,
        };

        const { data: cached } = await supabase
            .from("shipping_quotes_cache")
            .select("quotes, expires_at")
            .eq("cep_origem", cepOrigem)
            .eq("cep_destino", cepDestino)
            .eq("peso_kg", pesoKg)
            .eq("valor_declarado", valorDeclarado)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (cached && cached.quotes) {
            console.log("Cache HIT:", cepOrigem, "->", cepDestino);
            return new Response(
                JSON.stringify({
                    success: true,
                    cached: true,
                    quotes: cached.quotes,
                    cep_origem: cepOrigem,
                    cep_destino: cepDestino,
                }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Cache MISS — chama Melhor Envio
        console.log("Cache MISS:", cepOrigem, "->", cepDestino);

        const mePayload = {
            from: { postal_code: cepOrigem },
            to: { postal_code: cepDestino },
            package: {
                height,
                width,
                length,
                weight: pesoKg,
            },
            options: {
                insurance_value: valorDeclarado,
                receipt: false,
                own_hand: false,
            },
        };

        const meResponse = await fetch(`${ME_API_BASE}/api/v2/me/shipment/calculate`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MELHORENVIO_ACCESS_TOKEN}`,
                "User-Agent": USER_AGENT,
            },
            body: JSON.stringify(mePayload),
        });

        if (!meResponse.ok) {
            const errorText = await meResponse.text();
            console.error("Erro Melhor Envio:", meResponse.status, errorText);
            return new Response(
                JSON.stringify({ error: "Erro ao calcular frete", detalhes: errorText }),
                { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const meData: Quote[] = await meResponse.json();

        // Filtra cotações válidas (sem error, com price válido)
        const validQuotes = (meData || [])
            .filter((q) => !q.error && q.price && parseFloat(q.price) > 0)
            .map((q) => ({
                id: q.id,
                name: q.name,
                price: parseFloat(q.custom_price || q.price),
                price_formatted: `R$ ${formatBRL(parseFloat(q.custom_price || q.price))}`,
                delivery_time: q.delivery_time,
                delivery_range: q.delivery_range,
                company: {
                    id: q.company.id,
                    name: q.company.name,
                    picture: q.company.picture,
                },
            }))
            .sort((a, b) => a.price - b.price);

        // Salva no cache
        if (validQuotes.length > 0) {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

            await supabase.from("shipping_quotes_cache").insert({
                cep_origem: cepOrigem,
                cep_destino: cepDestino,
                peso_kg: pesoKg,
                valor_declarado: valorDeclarado,
                quotes: validQuotes,
                expires_at: expiresAt.toISOString(),
            });
        }

        return new Response(
            JSON.stringify({
                success: true,
                cached: false,
                quotes: validQuotes,
                cep_origem: cepOrigem,
                cep_destino: cepDestino,
                total_options: validQuotes.length,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Erro inesperado:", error);
        return new Response(
            JSON.stringify({ error: "Erro inesperado", detalhes: String(error) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
