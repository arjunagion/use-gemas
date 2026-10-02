import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ==========================================================================
// Configuração
// ==========================================================================
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const FROM_NAME = "Use Gemas";
const FROM_EMAIL = "pedidos@usegemas.com.br";
const BASE_URL = "https://usegemas.com.br";
const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=5511982053330";

// Configuração: dias de espera após o primeiro email
const DAYS_AFTER_REQUEST = 5;

// ==========================================================================
// Tipos
// ==========================================================================
interface OrderItem {
    name: string;
    ref: string;
    price: number;
    quantity: number;
}

interface Order {
    id: string;
    customer_name: string;
    customer_email: string | null;
    items: OrderItem[];
    shipped_at: string;
    review_requested_at: string;
    review_reminder_sent_at: string | null;
}

// ==========================================================================
// HTML do email (lembrete)
// ==========================================================================
function buildReviewReminderHTML(order: Order): string {
    const firstName = (order.customer_name || "").split(" ")[0] || "Olá";

    const itemsHTML = (order.items || [])
        .map(
            (item) => `
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #2f2620; font-family: 'Helvetica Neue', Arial, sans-serif;">
                <strong style="color: #2f2620; font-size: 14px;">${item.name}</strong><br>
                <span style="color: #888; font-size: 11px; letter-spacing: 0.5px;">REF: ${item.ref}</span>
            </td>
        </tr>
    `,
        )
        .join("");

    const reviewLink = `${BASE_URL}/minha-conta.html?review=${order.id}`;

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ainda dá tempo de avaliar 💛 | Use Gemas</title>
</head>
<body style="margin: 0; padding: 0; background: #f7f1e8; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f7f1e8; padding: 30px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background: #fdfaf4; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(47, 38, 32, 0.08);">

                    <!-- Header -->
                    <tr>
                        <td style="background: #0e0e10; padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #d4af37; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; letter-spacing: 3px; font-weight: 700;">USE GEMAS</h1>
                            <p style="margin: 6px 0 0 0; color: #888; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Joias Artesanais</p>
                        </td>
                    </tr>

                    <!-- Headline -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 15px;">💛</div>
                            <h2 style="margin: 0 0 12px 0; color: #2f2620; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 700;">Ainda dá tempo de avaliar</h2>
                            <p style="margin: 0; color: #7a6b5a; font-size: 15px; line-height: 1.7;">Oi, ${firstName}.<br>Vi que você ainda não contou como foi sua experiência com a peça. Sua opinião faz toda diferença pra gente. 💛</p>
                        </td>
                    </tr>

                    <!-- Itens comprados -->
                    <tr>
                        <td style="padding: 30px 40px 0 40px;">
                            <h3 style="margin: 0 0 12px 0; color: #2f2620; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; border-bottom: 1px solid #ede4d3; padding-bottom: 8px;">Lembra da sua compra?</h3>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                ${itemsHTML}
                            </table>
                        </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                        <td style="padding: 35px 40px; text-align: center;">
                            <p style="margin: 0 0 20px 0; color: #7a6b5a; font-size: 14px; line-height: 1.7;">Leva menos de 1 minuto. Sua avaliação ajuda outras clientes a escolherem com confiança.</p>
                            <a href="${reviewLink}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #aa820a 100%); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 30px; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">⭐ Avaliar agora</a>
                            <p style="margin: 20px 0 0 0; color: #a89987; font-size: 11px;">Se você já avaliou, desconsidere este email. 💛</p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: #f7f1e8; padding: 24px 40px; text-align: center; border-top: 1px solid #ede4d3;">
                            <p style="margin: 0 0 8px 0; color: #a89987; font-size: 11px; letter-spacing: 0.5px;">Alguma dúvida? Fale com a gente pelo <a href="${WHATSAPP_URL}" style="color: #b8935a; text-decoration: underline;">WhatsApp</a>.</p>
                            <p style="margin: 0; color: #a89987; font-size: 11px;">&copy; ${new Date().getFullYear()} Use Gemas. Todos os direitos reservados.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

// ==========================================================================
// Envio via Brevo
// ==========================================================================
async function sendEmailViaBrevo(
    to: string,
    subject: string,
    htmlContent: string,
): Promise<{ ok: boolean; data: any }> {
    if (!BREVO_API_KEY) {
        return { ok: false, data: { error: "BREVO_API_KEY não configurada" } };
    }

    const body = {
        sender: {
            name: FROM_NAME,
            email: FROM_EMAIL,
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
    };

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        body: JSON.stringify(body),
    });

    let data: any = null;
    try {
        data = await response.json();
    } catch (e) {
        data = { error: "Resposta não-JSON do Brevo", status: response.status };
    }

    return { ok: response.ok, data };
}

// ==========================================================================
// Handler principal
// ==========================================================================
serve(async (req: Request) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BREVO_API_KEY) {
            console.error("Variáveis de ambiente ausentes");
            return new Response(
                JSON.stringify({ error: "Configuração ausente" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Data limite: 5 dias após o primeiro email
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - DAYS_AFTER_REQUEST);

        console.log(`Buscando pedidos com review_requested_at antes de ${cutoffDate.toISOString()}`);

        // Busca pedidos elegíveis
        const { data: orders, error } = await supabase
            .from("orders")
            .select(`
                id, 
                customer_name, 
                customer_email, 
                items, 
                shipped_at, 
                review_requested_at, 
                review_reminder_sent_at
            `)
            .not("review_requested_at", "is", null)
            .lte("review_requested_at", cutoffDate.toISOString())
            .is("review_reminder_sent_at", null)
            .not("customer_email", "is", null);

        if (error) {
            console.error("Erro ao buscar pedidos:", error);
            return new Response(
                JSON.stringify({ error: "Erro ao buscar pedidos", detalhes: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        let eligibleOrders = (orders || []) as Order[];
        console.log(`${eligibleOrders.length} pedido(s) elegível(is) pela data`);

        // Filtra os que JÁ AVALIARAM (remove da lista)
        if (eligibleOrders.length > 0) {
            const orderIds = eligibleOrders.map((o) => o.id);

            const { data: existingReviews } = await supabase
                .from("reviews")
                .select("order_id")
                .in("order_id", orderIds);

            const reviewedOrderIds = new Set((existingReviews || []).map((r) => r.order_id));

            eligibleOrders = eligibleOrders.filter((o) => !reviewedOrderIds.has(o.id));

            console.log(`${eligibleOrders.length} pedido(s) após filtrar os que já avaliaram`);
        }

        if (eligibleOrders.length === 0) {
            return new Response(
                JSON.stringify({ success: true, processed: 0, message: "Nenhum pedido elegível" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        // Processa cada pedido
        let sent = 0;
        let failed = 0;
        const errors: any[] = [];

        for (const order of eligibleOrders) {
            try {
                const subject = "💛 Ainda dá tempo de avaliar sua compra — Use Gemas";
                const html = buildReviewReminderHTML(order);

                const result = await sendEmailViaBrevo(order.customer_email!, subject, html);

                if (!result.ok) {
                    console.error(`Erro ao enviar pro pedido ${order.id}:`, result.data);
                    failed++;
                    errors.push({ order_id: order.id, error: result.data });
                    continue;
                }

                // Marca que enviou lembrete
                await supabase
                    .from("orders")
                    .update({ review_reminder_sent_at: new Date().toISOString() })
                    .eq("id", order.id);

                console.log(`Lembrete enviado para ${order.customer_email} (pedido ${order.id})`);
                sent++;
            } catch (e) {
                console.error(`Erro inesperado no pedido ${order.id}:`, e);
                failed++;
                errors.push({ order_id: order.id, error: String(e) });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                processed: eligibleOrders.length,
                sent,
                failed,
                errors: errors.length > 0 ? errors : undefined,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    } catch (error) {
        console.error("Erro inesperado:", error);
        return new Response(
            JSON.stringify({ error: "Erro inesperado", detalhes: String(error) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
});