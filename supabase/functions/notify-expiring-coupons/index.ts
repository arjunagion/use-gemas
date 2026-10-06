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

const DAYS_BEFORE_EXPIRY = 5;
const DAYS_LOOKBACK_FOR_CUSTOMERS = 90;
const MAX_PUBLIC_EMAILS_PER_COUPON = 50;

// ==========================================================================
// Tipos
// ==========================================================================
interface Coupon {
    id: string;
    code: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_purchase: number;
    max_discount: number | null;
    free_shipping: boolean;
    first_purchase_only: boolean;
    customer_email: string | null;
    expires_at: string;
}

interface Customer {
    customer_email: string;
    customer_name: string | null;
}

// ==========================================================================
// Utilidades
// ==========================================================================
function formatBRL(value: number): string {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function getDiscountLabel(coupon: Coupon): string {
    if (coupon.free_shipping && Number(coupon.discount_value) === 0) {
        return "Frete grátis";
    }
    if (coupon.free_shipping) {
        return `${coupon.discount_type === 'percentage'
            ? coupon.discount_value + '%'
            : formatBRL(coupon.discount_value)} off + Frete grátis`;
    }
    if (coupon.discount_type === 'percentage') {
        return `${coupon.discount_value}% de desconto`;
    }
    return `${formatBRL(coupon.discount_value)} de desconto`;
}

function buildExpiringCouponHTML(
    coupon: Coupon,
    firstName: string,
    daysLeft: number,
): string {
    const discountLabel = getDiscountLabel(coupon);
    const daysText = daysLeft === 1 ? 'amanhã' : `em ${daysLeft} dias`;
    const description = coupon.description || '';

    const minPurchaseHTML = coupon.min_purchase > 0
        ? `<p style="margin: 0 0 16px 0; color: #7a6b5a; font-size: 13px; text-align: center;">
             <strong>Valor mínimo:</strong> ${formatBRL(coupon.min_purchase)}
           </p>`
        : '';

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seu cupom expira em breve | Use Gemas</title>
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
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <h2 style="margin: 0 0 12px 0; color: #2f2620; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 700;">Seu cupom expira em breve</h2>
                            <p style="margin: 0; color: #7a6b5a; font-size: 15px; line-height: 1.7;">Olá, ${firstName}.<br>Passando pra avisar que seu cupom expira <strong>${daysText}</strong>.</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 30px 40px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(135deg, #fdf3d9 0%, #f7e6bd 100%); border: 1px solid rgba(184, 147, 90, 0.3); border-radius: 12px; padding: 24px 20px; text-align: center;">
                                <tr>
                                    <td style="text-align: center;">
                                        <div style="font-family: 'Courier New', monospace; font-size: 22px; font-weight: 700; color: #8b6a15; letter-spacing: 3px; margin-bottom: 12px;">${coupon.code}</div>
                                        <div style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: 700; color: #b8935a; margin-bottom: 8px;">${discountLabel}</div>
                                        ${description ? `<div style="color: #7a6b5a; font-size: 13px; margin-top: 8px;">${description}</div>` : ''}
                                    </td>
                                </tr>
                            </table>

                            ${minPurchaseHTML}
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 0 40px 35px 40px; text-align: center;">
                            <p style="margin: 0 0 20px 0; color: #7a6b5a; font-size: 14px; line-height: 1.7;">Não perca a chance de aproveitar!</p>
                            <a href="${BASE_URL}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #aa820a 100%); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 30px; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Usar agora</a>
                        </td>
                    </tr>

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
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent,
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

        const now = new Date();
        const in5Days = new Date();
        in5Days.setDate(in5Days.getDate() + DAYS_BEFORE_EXPIRY);

        const cutoffCustomers = new Date();
        cutoffCustomers.setDate(cutoffCustomers.getDate() - DAYS_LOOKBACK_FOR_CUSTOMERS);

        console.log(`Buscando cupons que expiram até ${in5Days.toISOString()}`);

        // Busca cupons que expiram em ≤5 dias E ainda não foram notificados
        const { data: coupons, error } = await supabase
            .from("coupons")
            .select("*")
            .eq("active", true)
            .not("expires_at", "is", null)
            .gt("expires_at", now.toISOString())
            .lte("expires_at", in5Days.toISOString())
            .is("email_notified_at", null);

        if (error) {
            console.error("Erro ao buscar cupons:", error);
            return new Response(
                JSON.stringify({ error: "Erro ao buscar cupons", detalhes: error.message }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        if (!coupons || coupons.length === 0) {
            return new Response(
                JSON.stringify({ success: true, processed: 0, message: "Nenhum cupom elegível" }),
                { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
        }

        console.log(`${coupons.length} cupom(ns) elegível(is)`);

        let sent = 0;
        let failed = 0;
        const errors: any[] = [];

        for (const coupon of coupons as Coupon[]) {
            const daysLeft = Math.ceil(
                (new Date(coupon.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );

            try {
                let recipients: Customer[] = [];

                if (coupon.customer_email) {
                    // Cupom individual — só pro dono
                    recipients = [{ customer_email: coupon.customer_email, customer_name: null }];
                } else {
                    // Cupom público — busca clientes que compraram nos últimos 90 dias
                    const { data: orders } = await supabase
                        .from("orders")
                        .select("customer_email, customer_name")
                        .gte("created_at", cutoffCustomers.toISOString())
                        .not("customer_email", "is", null)
                        .neq("status", "cancelado");

                    // Deduplica por email (pega o nome mais recente)
                    const uniqueMap = new Map<string, Customer>();
                    (orders || []).forEach(o => {
                        if (o.customer_email && !uniqueMap.has(o.customer_email)) {
                            uniqueMap.set(o.customer_email, {
                                customer_email: o.customer_email,
                                customer_name: o.customer_name,
                            });
                        }
                    });

                    recipients = Array.from(uniqueMap.values()).slice(0, MAX_PUBLIC_EMAILS_PER_COUPON);
                }

                console.log(`Cupom ${coupon.code}: ${recipients.length} destinatário(s)`);

                for (const recipient of recipients) {
                    try {
                        const firstName = (recipient.customer_name || "").split(" ")[0] || "Olá";
                        const subject = `Seu cupom ${coupon.code} expira em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`;
                        const html = buildExpiringCouponHTML(coupon, firstName, daysLeft);

                        const result = await sendEmailViaBrevo(recipient.customer_email, subject, html);

                        if (!result.ok) {
                            console.error(`Erro ao enviar para ${recipient.customer_email}:`, result.data);
                            failed++;
                            errors.push({ coupon: coupon.code, email: recipient.customer_email, error: result.data });
                            continue;
                        }

                        console.log(`Email enviado pra ${recipient.customer_email} (cupom ${coupon.code})`);
                        sent++;
                    } catch (e) {
                        failed++;
                        errors.push({ coupon: coupon.code, email: recipient.customer_email, error: String(e) });
                    }
                }

                // Marca cupom como notificado (mesmo se alguns falharam — evita loop)
                await supabase
                    .from("coupons")
                    .update({ email_notified_at: new Date().toISOString() })
                    .eq("id", coupon.id);
            } catch (e) {
                console.error(`Erro no cupom ${coupon.code}:`, e);
                errors.push({ coupon: coupon.code, error: String(e) });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                processed: coupons.length,
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