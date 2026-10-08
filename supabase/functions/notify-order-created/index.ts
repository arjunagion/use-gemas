import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const FROM_NAME = "Use Gemas";
const FROM_EMAIL = "pedidos@usegemas.com.br";
const OWNER_EMAIL = "contato@usegemas.com.br";
const BASE_URL = "https://usegemas.com.br";
const ADMIN_URL = `${BASE_URL}/admin.html`;
const WHATSAPP_URL = "https://api.whatsapp.com/send?phone=5511982053330";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
    name: string;
    ref: string;
    price: number;
    quantity: number;
}

interface OrderRecord {
    id: string;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    items: OrderItem[];
    subtotal: number;
    shipping_cost: number;
    discount_amount: number | null;
    discount_code: string | null;
    total: number;
    created_at: string;
}

interface WebhookPayload {
    type: string;
    table: string;
    record: OrderRecord;
    old_record: OrderRecord | null;
}

interface BrevoResult {
    ok: boolean;
    data: unknown;
}

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...CORS_HEADERS,
            "Content-Type": "application/json",
        },
    });
}

function escapeHTML(value: unknown): string {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;",
        };
        return entities[character];
    });
}

function formatBRL(value: number): string {
    return Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function buildItemsHTML(items: OrderItem[] | null | undefined): string {
    if (!items?.length) {
        return `<tr><td colspan="2" style="padding: 10px 0; color: #888; font-family: 'Helvetica Neue', Arial, sans-serif;">—</td></tr>`;
    }

    return items
        .map((item) => `
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #2f2620; font-family: 'Helvetica Neue', Arial, sans-serif;">
                <strong style="color: #2f2620; font-size: 14px;">${escapeHTML(item.name)}</strong><br>
                <span style="color: #888; font-size: 11px; letter-spacing: 0.5px;">REF: ${escapeHTML(item.ref)} · ${Number(item.quantity) || 0}x ${formatBRL(item.price)}</span>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; color: #b8935a; font-weight: 700; font-family: 'Helvetica Neue', Arial, sans-serif;">
                ${formatBRL((Number(item.price) || 0) * (Number(item.quantity) || 0))}
            </td>
        </tr>
    `)
        .join("");
}

function buildEmailHTML(order: OrderRecord, isOwnerEmail: boolean): string {
    const customerName = order.customer_name || "";
    const firstName = customerName.split(" ")[0] || "Olá";
    const greeting = firstName === "Olá" ? "Olá" : `Olá, ${escapeHTML(firstName)}.`;
    const orderDate = new Date(order.created_at);
    const orderDateLabel = Number.isNaN(orderDate.getTime())
        ? "Data indisponível"
        : orderDate.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    const discount = Number(order.discount_amount) || 0;
    const discountRow = discount > 0
        ? `
                                <tr>
                                    <td style="color: #7a6b5a; font-size: 13px; padding: 4px 0;">Desconto${order.discount_code ? ` (${escapeHTML(order.discount_code)})` : ""}</td>
                                    <td style="color: #2f2620; font-size: 13px; text-align: right; padding: 4px 0;">-${formatBRL(discount)}</td>
                                </tr>`
        : "";
    const ownerCTA = isOwnerEmail
        ? `
                    <tr>
                        <td style="padding: 0 40px 35px; text-align: center;">
                            <a href="${ADMIN_URL}" style="display: inline-block; background: #b8935a; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 25px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Abrir no admin</a>
                        </td>
                    </tr>`
        : "";

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pedido recebido | Use Gemas</title>
</head>
<body style="margin: 0; padding: 0; background: #f7f1e8; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f7f1e8; padding: 30px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 580px; background: #fdfaf4; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(47, 38, 32, 0.08);">
                    <tr>
                        <td style="background: #0e0e10; padding: 30px 40px; text-align: center;">
                            <h1 style="margin: 0; color: #d4af37; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; letter-spacing: 3px; font-weight: 700;">USE GEMAS</h1>
                            <p style="margin: 6px 0 0 0; color: #888; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Joias Artesanais</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <span style="display: inline-block; background: #5a8a5a; color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px;">PEDIDO RECEBIDO</span>
                            <h2 style="margin: 0 0 12px; color: #2f2620; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 700;">Pedido recebido!</h2>
                            <p style="margin: 0; color: #7a6b5a; font-size: 15px; line-height: 1.7;">${greeting}<br>Recebemos seu pedido. Em breve você recebe a confirmação de pagamento.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px 0;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f7f1e8; border-radius: 10px; padding: 16px 20px;">
                                <tr>
                                    <td style="color: #7a6b5a; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Pedido feito em</td>
                                    <td style="color: #2f2620; font-size: 13px; font-weight: 600; text-align: right;">${orderDateLabel}</td>
                                </tr>
                                <tr>
                                    <td style="color: #7a6b5a; font-size: 12px; padding-top: 6px;">Número do pedido</td>
                                    <td style="color: #2f2620; font-size: 13px; font-weight: 600; text-align: right; padding-top: 6px;">${escapeHTML(String(order.id).slice(0, 8))}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px 40px 0;">
                            <h3 style="margin: 0 0 12px; color: #2f2620; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; border-bottom: 1px solid #ede4d3; padding-bottom: 8px;">Itens do pedido</h3>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                ${buildItemsHTML(order.items)}
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px 40px 0;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: #f7f1e8; border-radius: 10px; padding: 16px 20px;">
                                <tr>
                                    <td style="color: #7a6b5a; font-size: 13px; padding: 4px 0;">Subtotal</td>
                                    <td style="color: #2f2620; font-size: 13px; text-align: right; padding: 4px 0;">${formatBRL(order.subtotal)}</td>
                                </tr>
                                <tr>
                                    <td style="color: #7a6b5a; font-size: 13px; padding: 4px 0;">Frete</td>
                                    <td style="color: #2f2620; font-size: 13px; text-align: right; padding: 4px 0;">${Number(order.shipping_cost) === 0 ? "GRÁTIS" : formatBRL(order.shipping_cost)}</td>
                                </tr>
                                ${discountRow}
                                <tr>
                                    <td style="color: #2f2620; font-size: 16px; font-weight: 700; padding: 10px 0 0; border-top: 1px solid #ede4d3;">Total</td>
                                    <td style="color: #b8935a; font-size: 18px; font-weight: 700; text-align: right; padding: 10px 0 0; border-top: 1px solid #ede4d3;">${formatBRL(order.total)}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 35px 40px; text-align: center;">
                            <p style="margin: 0 0 16px; color: #7a6b5a; font-size: 14px;">Alguma dúvida sobre o pedido? Fale com a gente.</p>
                            <a href="${WHATSAPP_URL}" style="display: inline-block; background: #25d366; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 25px; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Falar no WhatsApp</a>
                        </td>
                    </tr>
                    ${ownerCTA}
                    <tr>
                        <td style="background: #f7f1e8; padding: 24px 40px; text-align: center; border-top: 1px solid #ede4d3;">
                            <p style="margin: 0 0 8px; color: #a89987; font-size: 11px; letter-spacing: 0.5px;">Arte viva em pedras e microcristais.</p>
                            <p style="margin: 0; color: #a89987; font-size: 11px;">&copy; ${new Date().getFullYear()} Use Gemas. Todos os direitos reservados.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

async function sendEmailViaBrevo(
    to: string,
    subject: string,
    htmlContent: string,
): Promise<BrevoResult> {
    if (!BREVO_API_KEY) {
        return { ok: false, data: { error: "BREVO_API_KEY não configurada" } };
    }

    try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            body: JSON.stringify({
                sender: { name: FROM_NAME, email: FROM_EMAIL },
                to: [{ email: to }],
                subject,
                htmlContent,
            }),
        });

        let data: unknown;
        try {
            data = await response.json();
        } catch {
            data = { error: "Resposta não-JSON do Brevo", status: response.status };
        }
        return { ok: response.ok, data };
    } catch (error) {
        return { ok: false, data: { error: String(error) } };
    }
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }

    try {
        const payload = await req.json() as WebhookPayload;
        console.log("[notify-order-created] Webhook recebido", {
            type: payload?.type,
            table: payload?.table,
            orderId: payload?.record?.id,
        });

        if (payload?.type !== "INSERT" || payload?.table !== "orders") {
            return jsonResponse({ success: true, skipped: "Tipo ou tabela não monitorados", sent: [], failed: [] });
        }
        if (!payload.record || typeof payload.record !== "object") {
            return jsonResponse({ success: false, error: "Registro do pedido ausente" }, 400);
        }

        const order = payload.record;
        const sent: string[] = [];
        const failed: Array<{ to: string; error: unknown }> = [];
        const subject = `Pedido ${String(order.id).slice(0, 8)} recebido — Use Gemas`;

        if (order.customer_email) {
            const customerResult = await sendEmailViaBrevo(
                order.customer_email,
                subject,
                buildEmailHTML(order, false),
            );
            if (customerResult.ok) {
                console.log(`[notify-order-created] Email enviado para cliente ${order.customer_email}`);
                sent.push(order.customer_email);
            } else {
                console.error("[notify-order-created] Erro do Brevo para cliente:", customerResult.data);
                failed.push({ to: order.customer_email, error: customerResult.data });
            }
        } else {
            sent.push("skipped_owner_only");
        }

        const ownerResult = await sendEmailViaBrevo(
            OWNER_EMAIL,
            subject,
            buildEmailHTML(order, true),
        );
        if (ownerResult.ok) {
            console.log(`[notify-order-created] Email enviado para dono ${OWNER_EMAIL}`);
            sent.push(OWNER_EMAIL);
        } else {
            console.error("[notify-order-created] Erro do Brevo para dono:", ownerResult.data);
            failed.push({ to: OWNER_EMAIL, error: ownerResult.data });
        }

        return jsonResponse(
            { success: failed.length === 0, sent, failed },
            failed.length > 0 ? 500 : 200,
        );
    } catch (error) {
        console.error("[notify-order-created] Erro inesperado:", error);
        return jsonResponse({ success: false, error: "Erro inesperado", detalhes: String(error), sent: [], failed: [] }, 500);
    }
});
