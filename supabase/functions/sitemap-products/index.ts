import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const BASE_URL = "https://usegemas.com.br";

serve(async (req: Request) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            return new Response("Config missing", { status: 500 });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const { data: products, error } = await supabase
            .from("products")
            .select("ref, created_at, updated_at")
            .eq("active", true)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erro ao buscar produtos:", error);
            return new Response("Erro ao gerar sitemap", { status: 500 });
        }

        const now = new Date().toISOString().split("T")[0];

        const urls = (products || []).map(p => {
            const lastmod = (p.updated_at || p.created_at || new Date().toISOString())
                .split("T")[0];
            return `    <url>
        <loc>${BASE_URL}/produto.html?ref=${encodeURIComponent(p.ref)}</loc>
        <lastmod>${lastmod}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;
        }).join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        return new Response(xml, {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/xml; charset=utf-8",
                "Cache-Control": "public, max-age=3600",
            },
        });
    } catch (error) {
        console.error("Erro inesperado:", error);
        return new Response("Erro inesperado", { status: 500 });
    }
});