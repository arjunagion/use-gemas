import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; // ← NOVO

// ==========================================================================
// Configuração Brevo
// ==========================================================================
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const FROM_NAME = "Use Gemas";
const FROM_EMAIL = "pedidos@usegemas.com.br";
const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=5511982053330";

// ← NOVO: Supabase (pro helper de pontos)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface OrderItem {
    name: string;
    ref: string;
    price: number;
    quantity: number;
}

interface OrderRecord {
    id: string;
    user_id: string | null;       // ← NOVO
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    items: OrderItem[];
    subtotal: number;
    shipping_cost: number;
    total: number;
    status: string;
    created_at: string;
}

interface WebhookPayload {
    type: string;
    table: string;
    record: OrderRecord;
    old_record: OrderRecord | null;
}

function formatBRL(value: number): string {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function buildItemsHTML(items: OrderItem[]): string {
    return items
        .map(
            (item) => `
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #2f2620; font-family: 'Helvetica Neue', Arial, sans-serif;">
                <strong style="color: #2f2620; font-size: 14px;">${item.name}</strong><br>
                <span style="color: #888; font-size: 11px; letter-spacing: 0.5px;">REF: ${item.ref} · ${item.quantity}x ${formatBRL(item.price)}</span>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; color: #b8935a; font-weight: 700; font-family: 'Helvetica Neue', Arial, sans-serif;">
                ${formatBRL(item.price * item.quantity)}
            </td>
        </tr>
    `,
        )
        .join("");
}

// ==========================================================================
// NOVO: Seção de pontos de fidelidade
// ==========================================================================
async function getLoyaltyPointsSection(supabase: any, order: OrderRecord): Promise<string> {
    try {
        // (a) Pontos creditados pra este pedido
        const { data: rows, error: rowsError } = await supabase
            .from("loyalty_points")
            .select("id, points, type")
            .eq("order_id", order.id)
            .eq("type", "earned");

        if (rowsError) throw rowsError;

        const earned = (rows || []).reduce(
            (sum: number, r: any) => sum + (r.points || 0), 0
        );

        if (earned <= 0) return ""; // sem pontos, pula seção

        // (b) Saldo atual (só se tiver user_id logado)
        let balancePoints = earned.toLocaleString("pt-BR");

        if (order.user_id && order.customer_email) {
            const { data: balance, error: balError } = await supabase.rpc(
                "get_loyalty_balance",
                {
                    p_customer_email: order.customer_email,
                    p_user_id: order.user_id,
                }
            );

            if (!balError && balance && balance.balance !== undefined) {
                balancePoints = Number(balance.balance).toLocaleString("pt-BR");
            }
        }

        const earnedFormatted = earned.toLocaleString("pt-BR");
        const brlValue = (earned / 100).toFixed(2).replace(".", ",");

        return `
        <!-- Seção de Pontos de Fidelidade -->
        <tr>
            <td style="padding: 30px 40px 0 40px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #fdf3d9 0%, #f7e6bd 100%); border: 1px solid rgba(184, 147, 90, 0.3); border-radius: 12px; padding: 24px 20px; text-align: center;">
                    <tr>
                        <td style="text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 12px;">💎</div>
                            <h3 style="margin: 0 0 8px 0; color: #2f2620; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; font-weight: 700;">
                                Você ganhou ${earnedFormatted} pontos!
                            </h3>
                            <p style="margin: 0 0 16px 0; color: #7a6b5a; font-size: 14px; line-height: 1.6;">
                                Vale R$ ${brlValue} de desconto no próximo pedido.
                            </p>
                            <div style="background: #fdfaf4; border-radius: 8px; padding: 12px; margin: 16px 0; display: inline-block; min-width: 180px;">
                                <div style="font-size: 11px; color: #a89987; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">
                                    Saldo atual
                                </div>
                                <div style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: 700; color: #b8935a;">
                                    ${balancePoints} pontos
                                </div>
                            </div>
                            <div style="margin-top: 8px;">
                                <a href="https://usegemas.com.br/minha-conta.html#beneficios" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #aa820a 100%); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 30px; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                                    Ver meus benefícios
                                </a>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        `;
    } catch (err) {
        console.error("[notify-order-status] Erro ao gerar seção de pontos:", err);
        return ""; // fallback: nunca quebra o email principal
    }
}

function buildEmailHTML(
    order: OrderRecord,
    status: string,
    pointsSection: string, // ← NOVO
): string {
    const firstName = (order.customer_name || "").split(" ")[0] || "Olá";

    let headline = "";
    let intro = "";
    let badge = "";
    let badgeColor = "";

    if (status === "pago") {
        headline = "Pagamento confirmado";
        intro = "Recebemos seu pagamento e já vamos começar a preparar sua peça com todo o carinho.";
        badge = "PAGO";
        badgeColor = "#5a8a5a";
    } else if (status === "enviado") {
        headline = "Sua peça foi enviada";
        intro = "Sua encomenda já está a caminho. Fique de olho no prazo de entrega.";
        badge = "ENVIADO";
        badgeColor = "#b8935a";
    }

    const orderDate = new Date(order.created_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${headline} | Use Gemas</title>
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

                    <!-- Badge + Headline -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <span style="display: inline-block; background: ${badgeColor}; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px;">${badge}</span>
                            <h2 style="margin: 0 0 12px 0; color: #2f2620; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 700;">${headline}</h2>
                            <p style="margin: 0; color: #7a6b5a; font-size: 15px; line-height: 1.7;">Olá, ${firstName}.<br>${intro}</p>
                        </td>
                    </tr>

                    <!-- Resumo do pedido -->
                    <tr>
                        <td style="padding: 20px 40px 0 40px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f7f1e8; border-radius: 10px; padding: 16px 20px;">
                                <tr>
                                    <td style="color: #7a6b5a; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Pedido feito em</td>
                                    <td style="color: #2f2620; font-size: 13px; font-weight: 600; text-align: right;">${orderDate}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Itens -->
                    <tr>
                        <td style="padding: 30px 40px 0 40px;">
                            <h3 style="margin: 0 0 12px 0; color: #2f2620; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; border-bottom: 1px solid #ede4d3; padding-bottom: 8px;">Itens do pedido</h3>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                ${buildItemsHTML(order.items || [])}
                            </table>
                        </td>
                    </tr>

                    <!-- Totais -->
                    <tr>
                        <td style="padding: 20px 40px 0 40px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f7f1e8; border-radius: 10px; padding: 16px 20px;">
                                <tr>
                                    <td style="color: #7a6b5a; font-size: 13px; padding: 4px 0;">Subtotal</td>
                                    <td style="color: #2f2620; font-size: 13px; text-align: right; padding: 4px 0;">${formatBRL(order.subtotal)}</td>
                                </tr>
                                <tr>
                                    <td style="color: #7a6b5a; font-size: 13px; padding: 4px 0;">Frete</td>
                                    <td style="color: #2f2620; font-size: 13px; text-align: right; padding: 4px 0;">${order.shipping_cost === 0 ? "GRÁTIS ✨" : formatBRL(order.shipping_cost)}</td>
                                </tr>
                                <tr>
                                    <td style="color: #2f2620; font-size: 16px; font-weight: 700; padding: 10px 0 0 0; border-top: 1px solid #ede4d3;">Total</td>
                                    <td style="color: #b8935a; font-size: 18px; font-weight: 700; text-align: right; padding: 10px 0 0 0; border-top: 1px solid #ede4d3;">${formatBRL(order.total)}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    ${pointsSection}

                    <!-- CTA WhatsApp -->
                    <tr>
                        <td style="padding: 35px 40px; text-align: center;">
                            <p style="margin: 0 0 16px 0; color: #7a6b5a; font-size: 14px;">Alguma dúvida sobre o pedido? Fale com a gente.</p>
                            <a href="${WHATSAPP_URL}" style="display: inline-block; background: #25d366; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 25px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Falar no WhatsApp</a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: #f7f1e8; padding: 24px 40px; text-align: center; border-top: 1px solid #ede4d3;">
                            <p style="margin: 0 0 8px 0; color: #a89987; font-size: 11px; letter-spacing: 0.5px;">Arte viva em pedras e microcristais.</p>
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
        to: [
            {
                email: to,
            },
        ],
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
    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const payload: WebhookPayload = await req.json();

        console.log("Webhook recebido:", JSON.stringify(payload, null, 2));

        const { type, table, record, old_record } = payload;

        if (type !== "UPDATE" || table !== "orders") {
            return new Response(JSON.stringify({ skipped: "Tipo ou tabela não monitorados" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!old_record) {
            return new Response(JSON.stringify({ skipped: "Sem old_record" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        const oldStatus = old_record.status;
        const newStatus = record.status;

        if (oldStatus === newStatus) {
            return new Response(JSON.stringify({ skipped: "Status não mudou" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        const statusesQueNotificam = ["pago", "enviado"];
        if (!statusesQueNotificam.includes(newStatus)) {
            return new Response(
                JSON.stringify({ skipped: `Status "${newStatus}" não dispara email` }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        if (!record.customer_email) {
            return new Response(JSON.stringify({ skipped: "Cliente sem email" }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        // ← NOVO: Monta seção de pontos (só quando status = pago)
        let pointsSection = "";
        if (newStatus === "pago") {
            const supabase = createClient(
                SUPABASE_URL!,
                SUPABASE_SERVICE_ROLE_KEY!
            );
            pointsSection = await getLoyaltyPointsSection(supabase, record);
        }

        const subject = newStatus === "pago"
            ? "✓ Pagamento confirmado — Use Gemas"
            : "📦 Sua peça foi enviada — Use Gemas";

        const emailHTML = buildEmailHTML(record, newStatus, pointsSection); // ← ALTERADO

        const resultado = await sendEmailViaBrevo(
            record.customer_email,
            subject,
            emailHTML,
        );

        if (!resultado.ok) {
            console.error("Erro do Brevo:", resultado.data);
            return new Response(
                JSON.stringify({ error: "Falha ao enviar email", detalhes: resultado.data }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        console.log(`Email enviado para ${record.customer_email} (status: ${newStatus})`);

        return new Response(
            JSON.stringify({
                success: true,
                messageId: resultado.data?.messageId,
                status: newStatus,
                had_points_section: pointsSection.length > 0, // ← NOVO
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        );
    } catch (error) {
        console.error("Erro inesperado:", error);
        return new Response(
            JSON.stringify({ error: "Erro inesperado", detalhes: String(error) }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
});