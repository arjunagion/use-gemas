import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==========================================================================
// Configuração
// ==========================================================================
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const BASE_URL = "https://usegemas.com.br";
const SITE_BASE_URL = "https://usegemas.com.br/";

// ==========================================================================
// Tipos
// ==========================================================================
interface Product {
    ref: string;
    name: string;
    price: number;
    stock: number;
    active: boolean;
    category: string | null;
    gem: string | null;
    description: string | null;
    materials: string | null;
    gallery: string | null;
    created_at: string;
}

// ==========================================================================
// Utilidades
// ==========================================================================
function escapeXml(str: string | null | undefined): string {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

/**
 * Normaliza uma URL de imagem:
 * - Se já é absoluta (http/https), retorna como está
 * - Se é caminho relativo, prefixa com o domínio do site
 */
function normalizeImageUrl(url: string | null | undefined): string {
    if (!url) return "";
    const trimmed = String(url).trim();
    if (!trimmed) return "";

    // Já é absoluta
    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    // Caminho relativo — prefixa com o site
    return SITE_BASE_URL + trimmed.replace(/^\/+/, "");
}

/**
 * Pega a primeira IMAGEM da galeria (ignora vídeos .mp4/.mov).
 * Retorna a URL pública completa ou null.
 */
function getFirstImage(gallery: string | null): string | null {
    if (!gallery) return null;

    const items = gallery.split(",").map((s) => s.trim()).filter(Boolean);

    for (const item of items) {
        const isVideo = /\.(mp4|mov|webm|ogg)$/i.test(item);
        if (!isVideo) return normalizeImageUrl(item);
    }
    return null;
}

/**
 * Pega todas as imagens (exceto a primeira, que vira image_link).
 */
function getAdditionalImages(gallery: string | null): string[] {
    if (!gallery) return [];

    const items = gallery.split(",").map((s) => s.trim()).filter(Boolean);
    const images = items
        .filter((item) => !/\.(mp4|mov|webm|ogg)$/i.test(item))
        .map(normalizeImageUrl);

    // Retorna todas menos a primeira
    return images.slice(1);
}

/**
 * Mapeia a categoria interna pra categoria oficial do Google.
 */
function getGoogleCategory(category: string | null): string {
    const map: Record<string, string> = {
        microcroche: "Apparel & Accessories > Jewelry > Necklaces",
        pedras: "Apparel & Accessories > Jewelry",
        colab: "Apparel & Accessories > Jewelry",
    };
    return map[category || ""] || "Apparel & Accessories > Jewelry";
}

/**
 * Formata preço no padrão Google: "149.00 BRL"
 */
function formatPrice(price: number): string {
    return `${Number(price).toFixed(2)} BRL`;
}

// ==========================================================================
// Geração do XML
// ==========================================================================
function buildFeedXml(products: Product[]): string {
    const now = new Date().toUTCString();

    const items = products
        .map((p) => {
            // Validações básicas — pula produtos sem dados essenciais
            if (!p.ref || !p.name || !p.price) return null;

            // REF de teste (AAAAAAAAAAAA) — pula
            if (/^A+$/i.test(p.ref.trim())) return null;

            const imageLink = getFirstImage(p.gallery);
            if (!imageLink) return null; // Pula produtos sem imagem

            const additionalImages = getAdditionalImages(p.gallery);
            const availability = Number(p.stock) > 0 ? "in stock" : "out of stock";
            const title = `${p.name} — Use Gemas`.slice(0, 150);
            const description = (
                p.description ||
                p.materials ||
                p.gem ||
                `${p.name} artesanal em microcrochê e pedras naturais.`
            ).slice(0, 5000);

            const additionalImagesXml = additionalImages
                .slice(0, 10)
                .map((img) => `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`)
                .join("\n");

            return `    <item>
      <g:id>${escapeXml(p.ref)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${BASE_URL}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
${additionalImagesXml}
      <g:price>${formatPrice(p.price)}</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Use Gemas</g:brand>
      <g:identifier_exists>no</g:identifier_exists>
      <g:google_product_category>${escapeXml(getGoogleCategory(p.category))}</g:google_product_category>
      <g:product_type>${escapeXml(p.category || "Joias")}</g:product_type>
      <g:shipping>
        <g:country>BR</g:country>
        <g:service>Padrão</g:service>
        <g:price>20.00 BRL</g:price>
      </g:shipping>
    </item>`;
        })
        .filter(Boolean)
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Use Gemas — Feed de Produtos</title>
    <link>${BASE_URL}</link>
    <description>Joias artesanais em microcrochê e pedras naturais</description>
    <lastBuildDate>${now}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

// ==========================================================================
// Handler principal
// ==========================================================================
serve(async (req: Request) => {
    // CORS — permite qualquer origem (Google precisa disso)
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    // Preflight OPTIONS
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Só aceita GET
    if (req.method !== "GET") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.error("Variáveis de ambiente ausentes");
            return new Response(
                JSON.stringify({ error: "Configuração ausente" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const { data, error } = await supabase
            .from("products")
            .select("ref, name, price, stock, active, category, gem, description, materials, gallery, created_at")
            .eq("active", true)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erro ao buscar produtos:", error);
            return new Response(
                JSON.stringify({ error: "Erro ao buscar produtos" }),
                {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                },
            );
        }

        const xml = buildFeedXml((data || []) as Product[]);

        return new Response(xml, {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/xml; charset=utf-8",
                "Cache-Control": "public, max-age=3600", // cache 1h
            },
        });
    } catch (error) {
        console.error("Erro inesperado:", error);
        return new Response(
            JSON.stringify({ error: "Erro inesperado", detalhes: String(error) }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
        );
    }
});