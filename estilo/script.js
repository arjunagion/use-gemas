// ==========================================================================
// Estado Global
// ==========================================================================
let cart = [];
let shippingDetails = null;
let cartRestored = false; // flag: carrinho já restaurado do storage no boot
let shippingQuotes = [];       // array de cotações retornadas pela API
let selectedShipping = null;   // cotação escolhida pelo cliente (objeto)

// ==========================================================================
// Persistência do carrinho (localStorage)
// ==========================================================================
const CART_STORAGE_KEY = 'gemas_cart_v1';
const CART_EXPIRY_DAYS = 7;

function saveCartToStorage() {
    try {
        const payload = {
            items: cart,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn('Erro ao salvar carrinho:', e);
    }
}

function clearCartStorage() {
    try {
        localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) { }
}

function loadCartFromStorage() {
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return null;

        const parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.items) || !parsed.savedAt) return null;

        // Verifica expiração
        const savedDate = new Date(parsed.savedAt);
        const daysDiff = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff > CART_EXPIRY_DAYS) {
            clearCartStorage();
            return null;
        }

        return parsed.items;
    } catch (e) {
        console.warn('Erro ao carregar carrinho:', e);
        clearCartStorage();
        return null;
    }
}

let currentGallery = [];
let currentMediaIndex = 0;

let photoSwipeLightbox = null;

let whatsappNumber = "5511982053330";

let currentSlide = 0;
let autoSlideInterval = null;

let productsFromDb = [];

// Reviews (avaliações aprovadas)
let productReviewsSummary = new Map(); // ref -> { avg, count }
let currentModalReviews = [];

// Notificações (sininho)
let userNotifications = [];

// Cupom de desconto aplicado no carrinho
let appliedCoupon = null; // { code, discount, free_shipping, discount_type, discount_value }

// ==========================================================================
// Configurações do site (carregadas do Supabase)
// ==========================================================================
let siteSettings = {
    whatsapp: '5511982053330',
    instagram: 'use.gemas',
    shipping_fixed: 0,
    free_shipping_min: 0,
    banner_message: '',
    shipping_mode: 'me',
    shipping_fixed_sp: 0,
    shipping_fixed_sudeste: 0,
    shipping_fixed_sul: 0,
    shipping_fixed_centro_norte_ne: 0,
    hero_tagline: null,
    hero_title: null,
    hero_subtitle: null,
    hero_cta_text: null,
    hero_cta_link: null,
    hero_video_url: null,
    carousel_title: null,
    carousel_slides: [],
    footer_brand: null,
    footer_tagline: null,
    meta_title: null,
    meta_description: null,
    meta_og_image_url: null,
    // Fase 10.3 — Refinos
    nav_links: [],
    low_stock_threshold: 2,
    free_shipping_banner_enabled: false,
    free_shipping_banner_message: 'Faltam {falta} pro frete grátis ✨',
    free_shipping_banner_threshold_pct: 30
};

// ==========================================================================
// Supabase
// ==========================================================================
const SUPABASE_URL = 'https://dytdnemwqbzgrekamwla.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5dGRuZW13cWJ6Z3Jla2Ftd2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3ODExMTEsImV4cCI6MjEwNTM1NzExMX0.6Zb3JK1CrpSrPqtigu9ZyEm_rWLKATOiQvPRQZmCU24';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================================================
// Redirect pós-login (suporta email/senha E Google OAuth)
// ==========================================================================
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        const pendingRedirect = localStorage.getItem('gemas_redirect_after_login');
        if (pendingRedirect && pendingRedirect.startsWith('minha-conta.html')) {
            localStorage.removeItem('gemas_redirect_after_login');
            window.location.href = pendingRedirect;
        }
    }
});

// ==========================================================================
// Emojis
// ==========================================================================
const EMOJI_BAG = String.fromCodePoint(0x1F6CD, 0xFE0F);
const EMOJI_USER = String.fromCodePoint(0x1F464);
const EMOJI_DOC = String.fromCodePoint(0x1F4C4);
const EMOJI_PHONE = String.fromCodePoint(0x1F4F1);
const EMOJI_EMAIL = String.fromCodePoint(0x2709, 0xFE0F);
const EMOJI_PIN = String.fromCodePoint(0x1F4CD);
const EMOJI_MONEY = String.fromCodePoint(0x1F4B0);
const EMOJI_TRUCK = String.fromCodePoint(0x1F69A);
const EMOJI_CHECK = String.fromCodePoint(0x2705);
const EMOJI_NOTE = String.fromCodePoint(0x1F4DD);
const EMOJI_PRAY = String.fromCodePoint(0x1F64F);
const EMOJI_WAVE = String.fromCodePoint(0x1F44B);
const EMOJI_HEART = String.fromCodePoint(0x2764, 0xFE0F);
const EMOJI_CART = String.fromCodePoint(0x1F6D2);
const EMOJI_SPARKLE = String.fromCodePoint(0x2728);

// ==========================================================================
// Utilidades
// ==========================================================================
function formatCurrency(value) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

let activeToast = null;
let activeToastTimer = null;

function dismissToast(toast) {
    if (!toast) return;
    if (activeToastTimer) {
        clearTimeout(activeToastTimer);
        activeToastTimer = null;
    }
    toast.classList.remove('show');

    const finalize = () => {
        if (toast.parentNode) toast.remove();
        if (activeToast === toast) activeToast = null;
    };

    toast.addEventListener('transitionend', finalize, { once: true });
    setTimeout(finalize, 500);
}

function showToast(message, options = {}) {
    // Compatibilidade: showToast(msg, 'error') => { type: 'error' }
    if (typeof options === 'string') {
        options = { type: options };
    }

    const {
        type = 'success',
        actionLabel = null,
        actionCallback = null,
        duration = 4000
    } = options;

    const container = document.getElementById('toast-container');
    if (!container) return;

    // Substitui o toast anterior (não empilha)
    if (activeToast) {
        activeToast.remove();
        activeToast = null;
    }
    if (activeToastTimer) {
        clearTimeout(activeToastTimer);
        activeToastTimer = null;
    }

    const icon = type === 'success' ? '✓' : type === 'info' ? 'ℹ' : '⚠';

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'status');

    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = icon;

    const msgSpan = document.createElement('span');
    msgSpan.className = 'toast-message';
    msgSpan.textContent = message;

    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);

    if (actionLabel && typeof actionCallback === 'function') {
        const actionBtn = document.createElement('button');
        actionBtn.type = 'button';
        actionBtn.className = 'toast-action';
        actionBtn.textContent = actionLabel;
        actionBtn.addEventListener('click', () => {
            actionCallback();
            dismissToast(toast);
        });
        toast.appendChild(actionBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'toast-close';
    closeBtn.setAttribute('aria-label', 'Fechar aviso');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => dismissToast(toast));
    toast.appendChild(closeBtn);

    container.appendChild(toast);
    activeToast = toast;

    requestAnimationFrame(() => toast.classList.add('show'));

    activeToastTimer = setTimeout(() => dismissToast(toast), duration);
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeToast) {
        dismissToast(activeToast);
    }
});

function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Escapa uma string para uso dentro de atributos inline (onclick/onerror)
 * onde o valor vai entrar como string JS entre aspas simples.
 *
 * Estratégia dupla:
 *  - Escapa para JavaScript (backslash, aspas simples, quebra de linha)
 *  - Escapa para HTML (aspas duplas viram \x22, < > & viram escapes hex)
 *
 * Assim o valor é seguro nos DOIS contextos ao mesmo tempo.
 */
function escapeJs(str) {
    if (str == null) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\x22')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/</g, '\\x3C')
        .replace(/>/g, '\\x3E')
        .replace(/&/g, '\\x26');
}

// ==========================================================================
// Google Analytics 4 — Eventos customizados
// ==========================================================================
function trackGA(eventName, params = {}) {
    if (typeof window.gtag === 'function') {
        try {
            window.gtag('event', eventName, params);
        } catch (e) {
        }
    }
}

// ==========================================================================
// CONSENT MODE v2 — Banner de Cookies
// ==========================================================================
const COOKIE_CONSENT_KEY = 'gemas_cookie_consent';

function applyConsent(choice) {
    // Google Consent Mode
    if (typeof window.gtag === 'function') {
        if (choice === 'all') {
            gtag('consent', 'update', {
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted',
                'analytics_storage': 'granted'
            });
        } else {
            gtag('consent', 'update', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied'
            });
        }
    }

    // Meta Pixel Consent
    if (typeof window.fbq === 'function') {
        if (choice === 'all') {
            window.fbq('consent', 'grant');
        } else {
            window.fbq('consent', 'revoke');
        }
    }
}

function showCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
        setTimeout(() => banner.classList.add('visible'), 800);
    }
}

function hideCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.classList.remove('visible');
}

function handleCookieChoice(choice) {
    try {
        localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    } catch (e) {
        console.warn('Erro ao salvar consentimento:', e);
    }
    applyConsent(choice);
    hideCookieBanner();
}

function initCookieConsent() {
    let saved = null;
    try {
        saved = localStorage.getItem(COOKIE_CONSENT_KEY);
    } catch (e) { }

    if (saved === 'all' || saved === 'essential') {
        applyConsent(saved);
    } else {
        showCookieBanner();
    }
}

function getCategoryLabel(cat) {
    const map = { microcroche: 'Microcrochê', pedras: 'Pedras Naturais', colab: 'Colabs' };
    return map[cat] || cat || 'Outros';
}

// ==========================================================================
// Schema.org — Produtos dinâmicos (JSON-LD)
// ==========================================================================
function injectProductSchema() {
    if (!productsFromDb || productsFromDb.length === 0) return;

    const existing = document.getElementById('product-schema');
    if (existing) existing.remove();

    const baseUrl = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');

    const items = productsFromDb.map(p => {
        const gallery = (p.gallery || '').split(',').map(s => s.trim()).filter(Boolean);
        const firstMedia = gallery[0] || '';
        const isVideo = firstMedia.match(/\.(mov|mp4|webm|ogg)$/i);

        const schema = {
            "@type": "Product",
            "name": p.name,
            "sku": p.ref,
            "description": p.description || p.gem || p.name,
            "category": getCategoryLabel(p.category),
            "brand": {
                "@type": "Brand",
                "name": "Use Gemas"
            },
            "offers": {
                "@type": "Offer",
                "price": Number(p.price).toFixed(2),
                "priceCurrency": "BRL",
                "availability": Number(p.stock) > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                "url": baseUrl,
                "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                    .toISOString().split('T')[0],
                "seller": {
                    "@type": "Organization",
                    "name": "Use Gemas"
                },
                "shippingDetails": {
                    "@type": "OfferShippingDetails",
                    "shippingRate": {
                        "@type": "MonetaryAmount",
                        "value": "20.00",
                        "currency": "BRL"
                    },
                    "shippingDestination": {
                        "@type": "DefinedRegion",
                        "addressCountry": "BR"
                    },
                    "deliveryTime": {
                        "@type": "ShippingDeliveryTime",
                        "handlingTime": {
                            "@type": "QuantitativeValue",
                            "minValue": 1,
                            "maxValue": 3,
                            "unitCode": "DAY"
                        },
                        "transitTime": {
                            "@type": "QuantitativeValue",
                            "minValue": 2,
                            "maxValue": 10,
                            "unitCode": "DAY"
                        }
                    }
                },
                "hasMerchantReturnPolicy": {
                    "@type": "MerchantReturnPolicy",
                    "applicableCountry": "BR",
                    "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                    "merchantReturnDays": 7,
                    "returnMethod": "https://schema.org/ReturnByMail",
                    "returnFees": "https://schema.org/ReturnShippingFees",
                    "returnShippingFeesAmount": {
                        "@type": "MonetaryAmount",
                        "value": "20.00",
                        "currency": "BRL"
                    }
                }
            }
        };

        if (firstMedia && !isVideo) {
            schema.image = firstMedia.startsWith('http')
                ? firstMedia
                : baseUrl + firstMedia;
        }

        return schema;
    });

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'product-schema';
    script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Destaques da Coleção — Use Gemas",
        "description": "Joias artesanais em microcrochê e pedras naturais",
        "numberOfItems": items.length,
        "itemListElement": items.map((item, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "item": item
        }))
    });

    document.head.appendChild(script);
}

function trackMeta(eventName, params = {}) {
    if (typeof window.fbq !== 'function') return;
    try { window.fbq('track', eventName, params); } catch (e) { }
}

function trackMetaCustom(eventName, params = {}) {
    if (typeof window.fbq !== 'function') return;
    try { window.fbq('trackCustom', eventName, params); } catch (e) { }
}

// ==========================================================================
// CONFIGURAÇÕES DINÂMICAS
// ==========================================================================
async function loadSiteSettings() {
    try {
        const { data, error } = await supabaseClient
            .from('settings')
            .select('*')
            .eq('id', 1)
            .maybeSingle();

        if (error) {
            console.warn('Não foi possível carregar as configurações do site. Usando padrões.', error);
            return;
        }

        if (data) {
            siteSettings = {
                whatsapp: data.whatsapp || siteSettings.whatsapp,
                instagram: data.instagram || siteSettings.instagram,
                shipping_fixed: Number(data.shipping_fixed) || 0,
                free_shipping_min: Number(data.free_shipping_min) || 0,
                banner_message: data.banner_message || '',
                shipping_mode: data.shipping_mode || 'me',
                shipping_fixed_sp: Number(data.shipping_fixed_sp) || 0,
                shipping_fixed_sudeste: Number(data.shipping_fixed_sudeste) || 0,
                shipping_fixed_sul: Number(data.shipping_fixed_sul) || 0,
                shipping_fixed_centro_norte_ne: Number(data.shipping_fixed_centro_norte_ne) || 0,
                hero_tagline: data.hero_tagline || null,
                hero_title: data.hero_title || null,
                hero_subtitle: data.hero_subtitle || null,
                hero_cta_text: data.hero_cta_text || null,
                hero_cta_link: data.hero_cta_link || null,
                hero_video_url: data.hero_video_url || null,
                carousel_title: data.carousel_title || null,
                carousel_slides: Array.isArray(data.carousel_slides) ? data.carousel_slides : [],
                footer_brand: data.footer_brand || null,
                footer_tagline: data.footer_tagline || null,
                meta_title: data.meta_title || null,
                meta_description: data.meta_description || null,
                meta_og_image_url: data.meta_og_image_url || null,
                // Fase 10.3 — Refinos
                nav_links: Array.isArray(data.nav_links) ? data.nav_links : [],
                low_stock_threshold: data.low_stock_threshold != null ? Number(data.low_stock_threshold) : 2,
                free_shipping_banner_enabled: !!data.free_shipping_banner_enabled,
                free_shipping_banner_message: data.free_shipping_banner_message || 'Faltam {falta} pro frete grátis ✨',
                free_shipping_banner_threshold_pct: data.free_shipping_banner_threshold_pct != null ? Number(data.free_shipping_banner_threshold_pct) : 30
            };
            whatsappNumber = siteSettings.whatsapp;
        }
    } catch (e) {
    }
}

function getSiteMediaUrl(path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    // Path relativo (ex: "hero/1234-abc.mp4") → URL pública do bucket site-media
    return `${SUPABASE_URL}/storage/v1/object/public/site-media/${path}`;
}

// Aplica o menu (nav_links) nos 2 pontos do site (index + produto)
function applyNavLinks() {
    const links = Array.isArray(siteSettings?.nav_links) ? siteSettings.nav_links : [];
    if (links.length === 0) return;

    const navUl = document.querySelector('.nav-links');
    if (!navUl) return;

    navUl.innerHTML = links.map(link => {
        const onclickAttr = link.onclick ? ` onclick="${escapeHTML(link.onclick)}"` : '';
        const href = escapeHTML(link.href || '#');
        return `<li><a href="${href}"${onclickAttr}>${escapeHTML(link.label || '')}</a></li>`;
    }).join('');
}

// Banner condicional de frete grátis (só se ativo + dentro do threshold)
function updateFreeShippingBanner(subtotal) {
    const banner = document.getElementById('free-shipping-banner');
    const goldenBanner = document.getElementById('site-banner');
    if (!banner) return;

    // Helper: mostra o dourado + reajusta a navbar
    const showGolden = () => {
        if (!goldenBanner) return;
        goldenBanner.style.display = 'block';
        // Recalcula altura do dourado e empurra navbar
        requestAnimationFrame(() => {
            const h = goldenBanner.offsetHeight || 0;
            const navbar = document.querySelector('.navbar');
            if (navbar && h > 0) navbar.style.top = h + 'px';
        });
    };

    // Helper: esconde o dourado + empurra navbar pro topo (o dinâmico assume)
    const hideGolden = () => {
        if (!goldenBanner) return;
        goldenBanner.style.display = 'none';
        const navbar = document.querySelector('.navbar');
        const dynamicH = banner.offsetHeight || 0;
        if (navbar) navbar.style.top = dynamicH + 'px';
    };

    const enabled = siteSettings?.free_shipping_banner_enabled;
    const min = Number(siteSettings?.free_shipping_min || 0);
    const thresholdPct = Number(siteSettings?.free_shipping_banner_threshold_pct || 30);

    if (!enabled || min <= 0 || subtotal <= 0) {
        banner.style.display = 'none';
        showGolden();
        return;
    }

    // Se já passou do mínimo → esconde (frete grátis já tá ativo, banner é redundante)
    if (subtotal >= min) {
        banner.style.display = 'none';
        showGolden();
        return;
    }

    const falta = min - subtotal;
    const thresholdValue = min * (thresholdPct / 100);

    // Se ainda falta MUITO (> threshold), esconde
    if (falta > thresholdValue) {
        banner.style.display = 'none';
        showGolden();
        return;
    }

    const message = (siteSettings?.free_shipping_banner_message || 'Faltam {falta} pro frete grátis ✨')
        .replace('{falta}', formatCurrency(falta));

    banner.textContent = message;
    banner.style.display = 'block';
    hideGolden();
}

// ==========================================================================
// TEMA DINÂMICO (Fase 10.5 — Biblioteca de Temas)
// ==========================================================================

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
        r: parseInt(h.substr(0, 2), 16),
        g: parseInt(h.substr(2, 2), 16),
        b: parseInt(h.substr(4, 2), 16)
    };
}

function rgbToHex(r, g, b) {
    const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
}

function lighten(hex, percent) {
    // percent: 0-100. Positivo = clareia, negativo = escurece
    const { r, g, b } = hexToRgb(hex);
    const factor = percent / 100;
    if (factor > 0) {
        return rgbToHex(
            r + (255 - r) * factor,
            g + (255 - g) * factor,
            b + (255 - b) * factor
        );
    } else {
        const f = 1 + factor;
        return rgbToHex(r * f, g * f, b * f);
    }
}

const ALLOWED_HEADING_FONTS = ['Cormorant Garamond', 'Playfair Display', 'Libre Baskerville', 'DM Serif Display', 'Italiana', 'Lora'];
const ALLOWED_BODY_FONTS = ['Montserrat', 'Inter', 'DM Sans', 'Work Sans', 'Lato', 'Jost'];

let loadedFonts = new Set();

async function loadActiveTheme() {
    try {
        // 1. Busca o active_theme_id do settings
        const { data: settingsRow, error: settingsErr } = await supabaseClient
            .from('settings')
            .select('active_theme_id')
            .eq('id', 1)
            .maybeSingle();

        if (settingsErr) throw settingsErr;

        const themeId = settingsRow?.active_theme_id;
        if (!themeId) return null;

        // 2. Busca o tema
        const { data: theme, error: themeErr } = await supabaseClient
            .from('themes')
            .select('id, name, palette, typography, context')
            .eq('id', themeId)
            .maybeSingle();

        if (themeErr) throw themeErr;
        return theme || null;
    } catch (e) {
        console.warn('[Theme] Erro ao carregar tema:', e);
        return null;
    }
}

function applyThemeToRoot(theme) {
    if (!theme || !theme.palette) return;

    const root = document.documentElement;
    const p = theme.palette;
    const t = theme.typography || {};

    // ============================================================
    // Accent (dourado)
    // ============================================================
    if (p.accent) {
        root.style.setProperty('--gold', p.accent);
        root.style.setProperty('--gold-hover', lighten(p.accent, 15));
    }

    // ============================================================
    // Fundos (nomes REAIS do CSS)
    // ============================================================
    if (p.bg) {
        root.style.setProperty('--bg-main', p.bg);
        root.style.setProperty('--bg-card', lighten(p.bg, 5));
        root.style.setProperty('--bg-elevated', lighten(p.bg, 3));
    }

    // ============================================================
    // Textos (nomes REAIS do CSS)
    // ============================================================
    if (p.text) {
        root.style.setProperty('--text-primary', p.text);
    }
    if (p.text_muted) {
        root.style.setProperty('--text-muted', p.text_muted);
    }

    // ============================================================
    // Tipografia
    // ============================================================
    if (t.heading_font && ALLOWED_HEADING_FONTS.includes(t.heading_font)) {
        root.style.setProperty('--font-title', `'${t.heading_font}', serif`);
        ensureGoogleFont(t.heading_font, ['400', '600', '700']);
    }

    if (t.body_font && ALLOWED_BODY_FONTS.includes(t.body_font)) {
        root.style.setProperty('--font-body', `'${t.body_font}', sans-serif`);
        ensureGoogleFont(t.body_font, ['300', '400', '500', '600', '700']);
    }
}

function hexToRgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ensureGoogleFont(fontName, weights) {
    if (loadedFonts.has(fontName)) return;
    loadedFonts.add(fontName);

    // Se já tem Cormorant/Montserrat carregado via link estático, não precisa recarregar
    if (fontName === 'Cormorant Garamond' || fontName === 'Montserrat') return;

    const family = fontName.replace(/ /g, '+');
    const weightStr = weights.join(';');
    const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weightStr}&display=swap`;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
}

async function loadAndApplyTheme() {
    const theme = await loadActiveTheme();
    if (theme) {
        applyThemeToRoot(theme);
        window.__useGemasTheme = theme;
        try {
            localStorage.setItem('gemas_active_theme', JSON.stringify(theme));
        } catch (e) { /* ignora */ }
    } else {
        try { localStorage.removeItem('gemas_active_theme'); } catch (e) {}
    }
}

// Aplica tema cacheado sincronamente (evita FOUC)
(function applyCachedThemeEarly() {
    try {
        const cached = localStorage.getItem('gemas_active_theme');
        if (cached) {
            const theme = JSON.parse(cached);
            if (typeof applyThemeToRoot === 'function') {
                applyThemeToRoot(theme);
            }
        }
    } catch (e) { /* ignora */ }
})();

function applyHeroSettings() {
    const s = siteSettings || {};

    const tagEl = document.getElementById('hero-tagline');
    if (tagEl && s.hero_tagline) tagEl.textContent = s.hero_tagline;

    const titleEl = document.getElementById('hero-title');
    if (titleEl && s.hero_title) titleEl.textContent = s.hero_title;

    const subEl = document.getElementById('hero-subtitle');
    if (subEl && s.hero_subtitle) subEl.textContent = s.hero_subtitle;

    const ctaEl = document.getElementById('hero-cta');
    if (ctaEl) {
        if (s.hero_cta_text) ctaEl.textContent = s.hero_cta_text;
        if (s.hero_cta_link) ctaEl.setAttribute('href', s.hero_cta_link);
    }

    if (s.hero_video_url) {
        const videoEl = document.getElementById('hero-video');
        if (videoEl) videoEl.src = getSiteMediaUrl(s.hero_video_url);
    }
}

function applyCarouselSettings() {
    const s = siteSettings || {};
    const slides = Array.isArray(s.carousel_slides) ? s.carousel_slides : [];

    // Título da seção
    const titleEl = document.getElementById('carousel-title');
    if (titleEl && s.carousel_title) titleEl.textContent = s.carousel_title;

    // Se não tem slides configurados, esconde a seção inteira
    if (slides.length === 0) {
        const section = document.getElementById('experiencia');
        if (section) section.style.display = 'none';
        return;
    }

    // Renderiza slides
    const track = document.getElementById('carousel-track');
    if (track) {
        track.innerHTML = slides.map((slide, i) => `
            <div class="carousel-slide ${i === 0 ? 'active' : ''}">
                <div class="slide-media">
                    ${slide.video_url
                        ? `<video src="${escapeHTML(getSiteMediaUrl(slide.video_url))}" muted loop playsinline preload="metadata" aria-hidden="true"></video>`
                        : '<div class="media-placeholder-empty"></div>'}
                </div>
                <div class="slide-content">
                    ${slide.badge ? `<span class="slide-badge">${escapeHTML(slide.badge)}</span>` : ''}
                    <h3>${escapeHTML(slide.title || '')}</h3>
                    <p>${slide.text || ''}</p>
                </div>
            </div>
        `).join('');
    }

    // Renderiza dots
    const dots = document.getElementById('carousel-dots');
    if (dots) {
        dots.innerHTML = slides.map((_, i) =>
            `<span class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})" role="button" tabindex="0" aria-label="Ir para slide ${i + 1}"></span>`
        ).join('');
    }

    // Reinicia o estado do carrossel
    if (typeof resetCarouselState === 'function') {
        resetCarouselState();
    }
}

function applyFooterSettings() {
    const s = siteSettings || {};

    const brandEl = document.getElementById('footer-brand');
    if (brandEl && s.footer_brand) brandEl.textContent = s.footer_brand;

    const tagEl = document.getElementById('footer-tagline');
    if (tagEl && s.footer_tagline) tagEl.textContent = s.footer_tagline;
}

function applyMetaSettings() {
    const s = siteSettings || {};

    if (s.meta_title) {
        document.title = s.meta_title;
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', s.meta_title);
        const twTitle = document.querySelector('meta[name="twitter:title"]');
        if (twTitle) twTitle.setAttribute('content', s.meta_title);
    }

    if (s.meta_description) {
        const descEl = document.querySelector('meta[name="description"]');
        if (descEl) descEl.setAttribute('content', s.meta_description);

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', s.meta_description);

        const twDesc = document.querySelector('meta[name="twitter:description"]');
        if (twDesc) twDesc.setAttribute('content', s.meta_description);
    }

    if (s.meta_og_image_url) {
        const ogImage = document.querySelector('meta[property="og:image"]');
        const twImage = document.querySelector('meta[name="twitter:image"]');
        const absoluteUrl = getSiteMediaUrl(s.meta_og_image_url);

        if (ogImage) ogImage.setAttribute('content', absoluteUrl);
        if (twImage) twImage.setAttribute('content', absoluteUrl);
    }
}

function renderBanner() {
    const existing = document.getElementById('site-banner');
    if (existing) existing.remove();

    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.style.top = '';

    if (!siteSettings.banner_message) return;

    const banner = document.createElement('div');
    banner.id = 'site-banner';
    banner.textContent = siteSettings.banner_message;

    Object.assign(banner.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        zIndex: '999',
        background: 'linear-gradient(135deg, #d4af37 0%, #aa820a 100%)',
        color: '#0e0e10',
        textAlign: 'center',
        padding: '0.55rem 1rem',
        fontSize: '0.78rem',
        fontWeight: '600',
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        fontFamily: "'Montserrat', sans-serif",
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
    });

    document.body.insertBefore(banner, document.body.firstChild);

    requestAnimationFrame(() => {
        const bannerHeight = banner.offsetHeight;
        if (navbar && bannerHeight > 0) {
            navbar.style.top = bannerHeight + 'px';
        }
    });
}

function updateDynamicLinks() {
    document.querySelectorAll('a[href*="instagram.com"]').forEach(a => {
        a.href = `https://instagram.com/${siteSettings.instagram}`;
        if (a.textContent.trim().startsWith('@')) {
            a.textContent = `@${siteSettings.instagram}`;
        }
    });

    document.querySelectorAll('a[href*="api.whatsapp.com"]').forEach(a => {
        try {
            const url = new URL(a.href);
            url.searchParams.set('phone', siteSettings.whatsapp);
            a.href = url.toString();
        } catch (e) {
            a.href = `https://api.whatsapp.com/send?phone=${siteSettings.whatsapp}`;
        }
    });
}

// ==========================================================================
// PRODUTOS — Carregar do Supabase
// ==========================================================================
async function loadProductsFromDb() {
    const grid = document.getElementById('products-grid');
    if (!grid) {

        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erro ao carregar produtos:', error);
            grid.innerHTML = '<div class="empty-state"><p>Erro ao carregar produtos.</p></div>';
            return;
        }

        productsFromDb = (data || []).filter(p => p.active === true);

        renderProductsGrid();
    } catch (e) {
        console.error('Erro de conexão:', e);
        grid.innerHTML = '<div class="empty-state"><p>Erro de conexão.</p></div>';
    }
}

function processPendingReorder() {
    let raw;
    try {
        raw = localStorage.getItem('gemas_reorder_pending');
    } catch (e) {
        return;
    }
    if (!raw) return;

    // Limpa a chave imediatamente (evita repetir ao recarregar)
    try { localStorage.removeItem('gemas_reorder_pending'); } catch (e) { }

    let payload;
    try {
        payload = JSON.parse(raw);
    } catch (e) {
        return; // JSON inválido → ignora silenciosamente
    }

    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
        return;
    }

    const totalValue = payload.items.reduce((sum, i) => sum + Number(i.price) * (Number(i.quantity) || 1), 0);

    let addedCount = 0;
    let unavailableCount = 0;

    payload.items.forEach(item => {
        const ref = item.ref;
        const name = item.name;
        const price = Number(item.price);
        const quantity = Math.max(1, Number(item.quantity) || 1);

        const product = productsFromDb.find(p => p.ref === ref);
        if (!product || Number(product.stock) <= 0) {
            unavailableCount++;
            return;
        }

        const inCart = cart.find(c => c.ref === ref);
        const currentQty = inCart ? inCart.quantity : 0;
        const toAdd = Math.min(quantity, Number(product.stock) - currentQty);

        if (toAdd <= 0) {
            unavailableCount++;
            return;
        }

        let addedUnits = 0;
        for (let k = 0; k < toAdd; k++) {
            if (addToCart(name, ref, price)) addedUnits++;
        }

        if (addedUnits > 0) {
            addedCount++;
        } else {
            unavailableCount++;
        }
    });

    // Analytics: reorder
    trackGA('reorder', {
        from_order_id: payload.from_order_id || '',
        items_count: payload.items.length,
        value: totalValue
    });
    trackMetaCustom('Reorder', {
        from_order_id: payload.from_order_id || '',
        items_count: payload.items.length,
        value: totalValue
    });

    // Feedback
    if (addedCount > 0 && unavailableCount === 0) {
        showToast(`${addedCount} produtos adicionados ao carrinho`, 'success');
    } else if (addedCount > 0 && unavailableCount > 0) {
        showToast(`${addedCount} produtos adicionados. ${unavailableCount} não estão mais disponíveis.`, 'info');
    } else {
        showToast(`${unavailableCount} produtos não estão disponíveis no momento.`, 'error');
    }

    // Scroll suave até a vitrine após 1s
    setTimeout(() => {
        const target = document.getElementById('colecao');
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
}

function renderProductsGrid() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (productsFromDb.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>Nenhum produto disponível no momento.</p></div>';
        return;
    }

    grid.innerHTML = productsFromDb.map(p => {
        const galleryItems = (p.gallery || '').split(',').map(s => s.trim()).filter(Boolean);
        const firstMedia = galleryItems[0] || '';
        const isVideo = firstMedia.match(/\.(mov|mp4|webm|ogg)$/i);

        const stockNum = Number(p.stock) || 0;
        const isOutOfStock = stockNum <= 0;
        const isLowStock = stockNum > 0 && stockNum <= 2;

        const mediaHTML = isVideo
            ? `<video src="${escapeHTML(firstMedia)}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`
            : (firstMedia
                ? `<img src="${escapeHTML(firstMedia)}" alt="${escapeHTML(p.name)}" />`
                : `<div style="width:100%;height:100%;background:#222;display:flex;align-items:center;justify-content:center;color:#666;font-size:0.8rem;">Sem mídia</div>`);

        let stockBadge = '';
        if (isOutOfStock) {
            stockBadge = `<span class="low-stock-badge" style="background:rgba(14,14,16,0.92);color:#d4af37;border:1px solid rgba(212,175,55,0.55);">✦ Estoque em breve</span>`;
        } else if (isLowStock) {
            stockBadge = `<span class="low-stock-badge">⚡ Últimas unidades</span>`;
        }

        const ratingSummary = productReviewsSummary.get(p.ref);
        const ratingBadge = ratingSummary
            ? `<span class="product-rating-badge">${String.fromCodePoint(0x2B50)} ${ratingSummary.avg} (${ratingSummary.count})</span>`
            : '';

        const cartButtonHTML = isOutOfStock
            ? `<button class="btn-add-cart" disabled
                   style="opacity:0.45;cursor:not-allowed;border-color:rgba(255,255,255,0.15);color:#888;pointer-events:none;">
                   Em produção
               </button>`
            : `<button class="btn-add-cart"
                   onclick="addToCart('${escapeJs(p.name)}', '${escapeJs(p.ref)}', ${Number(p.price)})">
                   Adicionar ao Carrinho
               </button>`;

        return `
            <div class="product-card" data-category="${escapeHTML(p.category)}"
                 data-name="${escapeHTML(p.name)}"
                 data-ref="${escapeHTML(p.ref)}"
                 data-price="${Number(p.price).toFixed(2)}"
                 data-gem="${escapeHTML(p.gem || '')}"
                 data-desc="${escapeHTML(p.description || '')}"
                 data-materials="${escapeHTML(p.materials || '')}"
                 data-gallery="${escapeHTML(p.gallery || '')}"
                 data-stock="${stockNum}">

                <div class="product-img" onclick="openProductModalFromCard(this.parentElement)">
                    ${mediaHTML}
                    ${stockBadge}
                    <button type="button" class="btn-favorite"
                        onclick="toggleFavorite(event, '${escapeJs(p.name)}', '${escapeJs(p.ref)}', ${Number(p.price)})"
                        aria-label="Adicionar ${escapeHTML(p.name)} aos favoritos">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                    <button type="button" class="btn-share-card"
                        onclick="event.stopPropagation(); shareProduct('${escapeJs(p.name)}', '${escapeJs(p.ref)}', ${Number(p.price)})"
                        aria-label="Compartilhar ${escapeHTML(p.name)} no WhatsApp">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                        </svg>
                    </button>
                </div>
                <div class="product-info">
                    <h3 onclick="openProductModalFromCard(this.parentElement.parentElement)" style="cursor: pointer;">${escapeHTML(p.name)}</h3>
                    <p class="gem-type">${escapeHTML(p.gem || '')}</p>
                    ${ratingBadge}
                    <span class="price">${formatCurrency(p.price)}</span>
                    ${cartButtonHTML}
                </div>
            </div>
        `;
    }).join('');

    if (typeof updateFavoritesUI === 'function') {
        updateFavoritesUI();
    }

    // ====== Schema.org — injeta dados estruturados dos produtos ======
    injectProductSchema();

    // ====== GA4: view_item_list ======
    trackGA('view_item_list', {
        item_list_id: 'vitrine_principal',
        item_list_name: 'Destaques da Coleção',
        items: productsFromDb.map(p => ({
            item_id: p.ref,
            item_name: p.name,
            item_category: getCategoryLabel(p.category),
            price: Number(p.price),
            quantity: 1
        }))
    });

    // ====== Meta: ViewContent (lista) ======
    trackMeta('ViewContent', {
        content_ids: productsFromDb.map(p => p.ref),
        content_type: 'product',
        content_name: 'Destaques da Coleção'
    });
}

// ==========================================================================
// Carrossel
// ==========================================================================
function getCarouselElements() {
    return {
        slides: document.querySelectorAll('.carousel-slide'),
        dots: document.querySelectorAll('.carousel-dots .dot')
    };
}

function showSlide(index) {
    const { slides, dots } = getCarouselElements();
    if (!slides || slides.length === 0) return;

    if (index >= slides.length) currentSlide = 0;
    else if (index < 0) currentSlide = slides.length - 1;
    else currentSlide = index;

    slides.forEach((slide, i) => {
        const isCurrent = i === currentSlide;
        slide.classList.toggle('active', isCurrent);

        const video = slide.querySelector('video');
        if (video) {
            if (isCurrent) {
                try { video.currentTime = 0; } catch (e) { }
                video.play().catch(() => { });
            } else {
                video.pause();
            }
        }
    });

    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

function moveSlide(step) { showSlide(currentSlide + step); resetAutoSlide(); }
function goToSlide(index) { showSlide(index); resetAutoSlide(); }

function startAutoSlide() {
    stopAutoSlide();
    autoSlideInterval = setInterval(() => { showSlide(currentSlide + 1); }, 6000);
}

function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
}

function resetAutoSlide() { stopAutoSlide(); startAutoSlide(); }

function resetCarouselState() {
    currentSlide = 0;
    showSlide(0);
    resetAutoSlide();
}

// ==========================================================================
// Carrinho — Drawer
// ==========================================================================
function toggleCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    const notificationsDrawer = document.getElementById('notifications-drawer');
    if (cartDrawer) {
        const willOpen = !cartDrawer.classList.contains('open');
        cartDrawer.classList.toggle('open');
        if (willOpen && wishlistDrawer) wishlistDrawer.classList.remove('open');
        if (willOpen && notificationsDrawer) notificationsDrawer.classList.remove('open');
        if (willOpen) trackViewCart(); // ====== GA4: view_cart ======
    }
}

function openCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    if (cartDrawer && !cartDrawer.classList.contains('open')) {
        cartDrawer.classList.add('open');
        if (wishlistDrawer) wishlistDrawer.classList.remove('open');
        trackViewCart(); // ====== GA4: view_cart ======
    }
}

function trackViewCart() {
    if (cart.length === 0) return;
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    trackGA('view_cart', {
        currency: 'BRL',
        value: total,
        items: cart.map(i => ({
            item_id: i.ref,
            item_name: i.name,
            price: Number(i.price),
            quantity: Number(i.quantity)
        }))
    });

    trackMetaCustom('ViewCart', {
        content_ids: cart.map(i => i.ref),
        content_type: 'product',
        contents: cart.map(i => ({ id: i.ref, quantity: Number(i.quantity), item_price: Number(i.price) })),
        value: total,
        currency: 'BRL',
        num_items: cart.reduce((s, i) => s + Number(i.quantity), 0)
    });
}

// ==========================================================================
// Autenticação
// ==========================================================================
function openAuthModal(tab = 'login') {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        switchAuthTab(tab);
        clearAuthFeedback();
        modal.classList.add('open');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('open');
        clearAuthFeedback();
        resetRegisterValidation();
    }
}

function switchAuthTab(tabName) {
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');

    clearAuthFeedback();

    if (tabName === 'login') {
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
        if (loginForm) loginForm.classList.add('active');
        if (registerForm) registerForm.classList.remove('active');
    } else {
        resetRegisterValidation();
        if (registerTab) registerTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
        if (registerForm) registerForm.classList.add('active');
        if (loginForm) loginForm.classList.remove('active');
    }
}

function showAuthFeedback(message, type = 'error') {
    const feedbackEl = document.getElementById('auth-feedback');
    if (feedbackEl) {
        feedbackEl.className = `auth-feedback ${type}`;
        feedbackEl.innerText = message;
    }
}

function clearAuthFeedback() {
    const feedbackEl = document.getElementById('auth-feedback');
    if (feedbackEl) {
        feedbackEl.className = 'auth-feedback';
        feedbackEl.innerText = '';
    }
}

function translateAuthError(error) {
    if (!error) return 'Erro inesperado. Tente novamente.';

    const code = String(error.code || '').toLowerCase();
    const message = String(error.message || '').toLowerCase();

    // Erro de rede
    if (error instanceof TypeError || /fetch failed|failed to fetch|network|internet|connection/i.test(message)) {
        return 'Erro de conexão. Verifique sua internet.';
    }

    // Muitas tentativas / rate limit
    if (code.includes('rate_limit') || code.includes('too_many') || /rate limit|too many/i.test(message)) {
        return 'Muitas tentativas. Aguarde alguns minutos.';
    }

    // Credenciais inválidas (login)
    if (code === 'invalid_credentials' || /invalid login credentials|incorrect email or password/i.test(message)) {
        return 'E-mail ou senha incorretos.';
    }

    // E-mail não confirmado
    if (code === 'email_not_confirmed' || /email not confirmed|confirm your email/i.test(message)) {
        return 'Confirme seu e-mail antes de entrar.';
    }

    // E-mail já cadastrado
    if (code === 'user_already_exists' || /already registered|already been registered|user already/i.test(message)) {
        return 'Este e-mail já está cadastrado. Faça login em vez de criar nova conta.';
    }

    // Senha curta
    if (code === 'weak_password' || /password should be at least|at least 6 characters/i.test(message)) {
        return 'A senha precisa ter pelo menos 6 caracteres.';
    }

    // E-mail inválido
    if (code === 'validation_failed' || /invalid email|invalid format|unable to validate email/i.test(message)) {
        return 'E-mail inválido. Confira e tente novamente.';
    }

    return 'Erro inesperado. Tente novamente.';
}

async function handleForgotPassword(event) {
    event.preventDefault();
    clearAuthFeedback();

    const emailInput = document.getElementById('login-email');
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';

    if (!email || !validateEmail(email)) {
        showAuthFeedback('Informe seu e-mail de cadastro no campo acima pra redefinir a senha.', 'error');
        if (emailInput) emailInput.focus();
        return;
    }

    const link = document.querySelector('.forgot-password');
    const originalText = link ? link.innerText : 'Esqueceu a senha?';
    if (link) {
        link.style.pointerEvents = 'none';
        link.style.opacity = '0.6';
        link.innerText = 'Enviando...';
    }

    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}reset-password.html`
        });

        if (error) {
            console.error('Erro ao enviar e-mail de recuperação:', error);
            showAuthFeedback('Não foi possível enviar o e-mail. Tente novamente em instantes.', 'error');
            return;
        }

        showAuthFeedback(`Enviamos um link de redefinição para ${email}. Confira sua caixa de entrada e o spam.`, 'success');
    } catch (e) {
        console.error('Erro inesperado:', e);
        showAuthFeedback('Erro inesperado. Tente novamente.', 'error');
    } finally {
        if (link) {
            link.style.pointerEvents = '';
            link.style.opacity = '';
            link.innerText = originalText;
        }
    }
}

function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    const open = btn.querySelector('.eye-open');
    const closed = btn.querySelector('.eye-closed');
    if (open) open.style.display = isPassword ? 'none' : '';
    if (closed) closed.style.display = isPassword ? '' : 'none';

    btn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
}

function getPasswordStrength(password) {
    if (!password) return { level: 0, label: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    if (hasUpper && hasLower) score++;

    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let level = 1;
    if (score >= 4) level = 4;
    else if (score === 3) level = 3;
    else if (score === 2) level = 2;

    const labels = {
        1: 'Senha fraca',
        2: 'Senha média',
        3: 'Senha boa',
        4: 'Senha forte'
    };

    return { level, label: labels[level] };
}

function updatePasswordStrength() {
    const passwordInput = document.getElementById('reg-password');
    const strengthEl = document.getElementById('reg-password-strength');
    const labelEl = document.getElementById('reg-strength-label');
    if (!passwordInput || !strengthEl || !labelEl) return;

    const password = passwordInput.value;
    const { level, label } = getPasswordStrength(password);

    if (password.length === 0) {
        strengthEl.hidden = true;
        return;
    }

    strengthEl.hidden = false;

    strengthEl.querySelectorAll('.strength-segment').forEach((seg, index) => {
        seg.classList.remove('level-1', 'level-2', 'level-3', 'level-4');
        if (index < level) seg.classList.add('level-' + level);
    });

    labelEl.textContent = label;
    labelEl.classList.remove('level-1', 'level-2', 'level-3', 'level-4');
    labelEl.classList.add('level-' + level);
}

function resetPasswordStrength() {
    const strengthEl = document.getElementById('reg-password-strength');
    const labelEl = document.getElementById('reg-strength-label');

    if (strengthEl) {
        strengthEl.hidden = true;
        strengthEl.querySelectorAll('.strength-segment').forEach(seg => {
            seg.classList.remove('level-1', 'level-2', 'level-3', 'level-4');
        });
    }

    if (labelEl) {
        labelEl.textContent = '';
        labelEl.classList.remove('level-1', 'level-2', 'level-3', 'level-4');
    }
}

function setFieldStatus(inputEl, isValid, message = '') {
    if (!inputEl) return;

    let msgEl = inputEl.closest('.form-group').querySelector('.field-msg');
    if (!msgEl) {
        msgEl = document.createElement('small');
        msgEl.className = 'field-msg';
        msgEl.style.fontSize = '0.75rem';
        msgEl.style.marginTop = '4px';
        msgEl.style.display = 'block';
        inputEl.closest('.form-group').appendChild(msgEl);
    }

    if (isValid === true) {
        inputEl.classList.remove('input-error');
        inputEl.classList.add('input-success');
        msgEl.innerText = '';
        msgEl.style.color = '#6bfbce';
    } else if (isValid === false) {
        inputEl.classList.remove('input-success');
        inputEl.classList.add('input-error');
        msgEl.innerText = message;
        msgEl.style.color = '#ff6b6b';
    } else {
        inputEl.classList.remove('input-error', 'input-success');
        msgEl.innerText = message || '';
        msgEl.style.color = '#aaa';
    }
}

function resetRegisterValidation() {
    const inputs = ['reg-name', 'reg-email', 'reg-password', 'reg-confirm-password'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            setFieldStatus(el, null);
            if (id === 'reg-password') setFieldStatus(el, null, 'Mínimo de 6 caracteres.');
        }
    });
    resetPasswordStrength();
}

function setupRegisterLiveValidation() {
    const nameInput = document.getElementById('reg-name');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const confirmInput = document.getElementById('reg-confirm-password');

    if (nameInput) {
        nameInput.addEventListener('input', () => {
            const val = nameInput.value.trim();
            if (val.length === 0) setFieldStatus(nameInput, false, 'O nome é obrigatório.');
            else if (val.length < 3) setFieldStatus(nameInput, false, 'Digite ao menos 3 caracteres.');
            else setFieldStatus(nameInput, true);
        });
    }

    if (emailInput) {
        emailInput.addEventListener('input', () => {
            const val = emailInput.value.trim();
            if (val.length === 0) setFieldStatus(emailInput, false, 'O e-mail é obrigatório.');
            else if (!validateEmail(val)) setFieldStatus(emailInput, false, 'Informe um e-mail válido.');
            else setFieldStatus(emailInput, true);
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const val = passwordInput.value;
            updatePasswordStrength();

            if (val.length === 0) setFieldStatus(passwordInput, false, 'A senha é obrigatória.');
            else if (val.length < 6) setFieldStatus(passwordInput, false, `Senha muito curta (${val.length}/6).`);
            else setFieldStatus(passwordInput, true);

            if (confirmInput && confirmInput.value.length > 0) {
                confirmInput.dispatchEvent(new Event('input'));
            }
        });
    }

    if (confirmInput) {
        confirmInput.addEventListener('input', () => {
            const confirmVal = confirmInput.value;
            const passVal = passwordInput ? passwordInput.value : '';
            if (confirmVal.length === 0) setFieldStatus(confirmInput, false, 'Confirme a sua senha.');
            else if (confirmVal !== passVal) setFieldStatus(confirmInput, false, 'As senhas não coincidem.');
            else setFieldStatus(confirmInput, true);
        });
    }
}

async function handleRegister(event) {
    event.preventDefault();
    clearAuthFeedback();

    const nameInput = document.getElementById('reg-name');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const confirmInput = document.getElementById('reg-confirm-password');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirm = confirmInput ? confirmInput.value : '';

    let hasError = false;

    if (!name || name.length < 3) { setFieldStatus(nameInput, false, 'Informe seu nome completo.'); hasError = true; }
    if (!email || !validateEmail(email)) { setFieldStatus(emailInput, false, 'E-mail inválido.'); hasError = true; }
    if (!password || password.length < 6) { setFieldStatus(passwordInput, false, 'A senha deve conter no mínimo 6 caracteres.'); hasError = true; }
    if (!confirm || password !== confirm) { setFieldStatus(confirmInput, false, 'As senhas não coincidem.'); hasError = true; }

    if (hasError) {
        showAuthFeedback('Por favor, corrija os campos sinalizados em vermelho.', 'error');
        return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.innerText : 'Cadastrar';
    if (btn) { btn.disabled = true; btn.innerText = 'Cadastrando...'; }

    let result;
    try {
        result = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: { data: { name: name } }
        });
    } catch (networkError) {
        if (btn) { btn.disabled = false; btn.innerText = originalText; }
        showAuthFeedback(translateAuthError(networkError), 'error');
        return;
    }

    if (btn) { btn.disabled = false; btn.innerText = originalText; }

    if (result.error) {
        showAuthFeedback(translateAuthError(result.error), 'error');
        return;
    }

    showAuthFeedback('Conta criada com sucesso!', 'success');
    await syncLocalToCloud();
    await loadFavorites();
    await loadCheckoutData();
    updateFavoritesUI();
    updateCartUI();
    updateUserSessionUI();

    setTimeout(() => {
        closeAuthModal();
        if (nameInput) nameInput.value = '';
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (confirmInput) confirmInput.value = '';
    }, 1200);
}

async function handleLogin(event) {
    event.preventDefault();
    clearAuthFeedback();

    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
        showAuthFeedback('Preencha o e-mail e a senha.', 'error');
        return;
    }

    const btn = event.target.querySelector('button[type="submit"]');
    const originalText = btn ? btn.innerText : 'Acessar';
    if (btn) { btn.disabled = true; btn.innerText = 'Entrando...'; }

    let result;
    try {
        result = await supabaseClient.auth.signInWithPassword({ email, password });
    } catch (networkError) {
        if (btn) { btn.disabled = false; btn.innerText = originalText; }
        showAuthFeedback(translateAuthError(networkError), 'error');
        return;
    }

    if (btn) { btn.disabled = false; btn.innerText = originalText; }

    if (result.error) {
        showAuthFeedback(translateAuthError(result.error), 'error');
        return;
    }

    showAuthFeedback('Login realizado com sucesso!', 'success');

    await syncLocalToCloud();
    await loadFavorites();
    await loadCheckoutData();
    updateFavoritesUI();
    updateCartUI();
    updateUserSessionUI();

    setTimeout(() => {
        closeAuthModal();
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }, 1000);
}

async function handleGoogleLogin() {
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'https://usegemas.com.br'
            }
        });
        if (error) showAuthFeedback(translateAuthError(error), 'error');
    } catch (e) {
        showAuthFeedback(translateAuthError(e), 'error');
    }
}

async function handleLogout() {
    await supabaseClient.auth.signOut();
    favorites = [];
    loadFavorites();
    updateFavoritesUI();
    updateUserSessionUI();
}

async function updateUserSessionUI() {
    const userBtn = document.getElementById('user-btn');
    if (!userBtn) return;

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single();

        const fullName = profile?.name || user.email.split('@')[0];
        const firstName = fullName.split(' ')[0];
        const initial = firstName.charAt(0).toUpperCase();

        userBtn.className = 'site-user-btn';
        userBtn.innerHTML = `
            <span class="site-user-btn-avatar">${initial}</span>
            <span class="site-user-btn-label">Perfil</span>
        `;
        userBtn.onclick = () => { window.location.href = 'minha-conta.html'; };
        userBtn.title = "Minha Conta";
        userBtn.setAttribute('aria-label', 'Ir para Minha Conta');

        // Carrega notificações (sininho)
        loadNotifications();
    } else {
        userBtn.className = 'btn-icon';
        userBtn.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        `;
        userBtn.onclick = () => openAuthModal('login');
        userBtn.title = "Entrar / Cadastrar";
        userBtn.setAttribute('aria-label', 'Entrar ou criar conta');

        // Esconde o sininho de notificações
        const bellBtn = document.getElementById('nav-bell-btn');
        if (bellBtn) bellBtn.style.display = 'none';
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

async function syncLocalToCloud() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    try {
        const localFavs = JSON.parse(localStorage.getItem('gemas_favorites') || '[]');
        if (Array.isArray(localFavs) && localFavs.length > 0) {
            for (const fav of localFavs) {
                const { data: existing } = await supabaseClient
                    .from('favorites')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('product_ref', fav.ref)
                    .maybeSingle();

                if (!existing) {
                    await supabaseClient.from('favorites').insert({
                        user_id: user.id,
                        product_name: fav.name,
                        product_ref: fav.ref,
                        product_price: fav.price
                    });
                }
            }
        }
    } catch (e) {

    }
}

// ==========================================================================
// Modal de Produto
// ==========================================================================
function openProductModalFromCard(cardElement) {
    if (!cardElement) return;

    const name = cardElement.getAttribute('data-name');
    const ref = cardElement.getAttribute('data-ref');
    const price = parseFloat(cardElement.getAttribute('data-price'));
    const gem = cardElement.getAttribute('data-gem');
    const desc = cardElement.getAttribute('data-desc');
    const materials = cardElement.getAttribute('data-materials');
    const galleryRaw = cardElement.getAttribute('data-gallery');
    const stock = parseInt(cardElement.getAttribute('data-stock'), 10) || 0;

    const gallery = galleryRaw ? galleryRaw.split(',').map(item => item.trim()) : [];

    openProductModal(name, ref, price, gem, desc, materials, gallery, stock);
}

async function openProductModal(name, ref, price, gemType, description, materials, gallery, stock = 1) {
    const modal = document.getElementById('product-modal');
    if (!modal) return;

    document.getElementById('modal-title').innerText = name;
    document.getElementById('modal-ref').innerText = `REF: ${ref}`;
    document.getElementById('modal-gem').innerText = gemType;
    document.getElementById('modal-price').innerText = formatCurrency(price);
    document.getElementById('modal-desc').innerText = description;
    document.getElementById('modal-materials').innerText = materials;

    currentGallery = gallery.length > 0 ? gallery : [];
    currentMediaIndex = 0;

    renderModalMedia();

    const addBtn = document.getElementById('modal-add-btn');
    if (addBtn) {
        if (Number(stock) > 0) {
            addBtn.disabled = false;
            addBtn.innerText = 'Adicionar ao Carrinho';
            addBtn.style.opacity = '1';
            addBtn.style.cursor = 'pointer';
            addBtn.style.background = '';
            addBtn.style.color = '';
            addBtn.style.border = '';
            addBtn.onclick = () => {
                addToCart(name, ref, price);
                closeProductModal();
            };
        } else {
            addBtn.disabled = true;
            addBtn.innerText = 'Em produção';
            addBtn.style.opacity = '0.45';
            addBtn.style.cursor = 'not-allowed';
            addBtn.style.background = 'transparent';
            addBtn.style.color = '#888';
            addBtn.style.border = '1px solid rgba(255, 255, 255, 0.15)';
            addBtn.onclick = null;
        }
    }

    const shareBtn = document.getElementById('modal-share-btn');
    if (shareBtn) {
        shareBtn.onclick = () => shareProduct(name, ref, price);
    }

    modal.classList.add('open');

    // ====== GA4: view_item ======
    const productInfo = productsFromDb.find(p => p.ref === ref);

    // Sugestões "Você também pode gostar"
    renderRelatedProducts(ref, productInfo ? productInfo.category : '');
    const infoCol = modal.querySelector('.modal-info');
    if (infoCol) infoCol.scrollTop = 0;

    // Avaliações aprovadas do produto
    currentModalReviews = await loadProductReviews(ref);
    renderReviewsSummary(currentModalReviews);
    renderReviewsList(ref, currentModalReviews);
    checkCanReview(ref);

    trackGA('view_item', {
        currency: 'BRL',
        value: Number(price),
        items: [{
            item_id: ref,
            item_name: name,
            item_category: productInfo ? getCategoryLabel(productInfo.category) : 'Outros',
            price: Number(price),
            quantity: 1
        }]
    });

    // ====== Meta: ViewContent ======
    trackMeta('ViewContent', {
        content_ids: [ref],
        content_type: 'product',
        content_name: name,
        content_category: productInfo ? getCategoryLabel(productInfo.category) : 'Outros',
        value: Number(price),
        currency: 'BRL'
    });
}

/**
 * Handler para onerror de <video>/<img> no modal de produto.
 * Substitui a mídia quebrada por uma div de fallback.
 *
 * Chamado inline: onerror="handleMediaError(this)"
 */
function handleMediaError(el) {
    if (!el || !el.parentElement) return;

    const fallback = document.createElement('div');
    fallback.style.color = '#666';
    fallback.style.textAlign = 'center';
    fallback.style.padding = '2rem';
    fallback.style.fontSize = '0.9rem';
    fallback.style.width = '100%';
    fallback.textContent = 'Mídia indisponível';

    el.parentElement.replaceChild(fallback, el);
}

function renderModalMedia() {
    const wrapper = document.getElementById('modal-media-wrapper');
    const dotsContainer = document.getElementById('gallery-dots');
    const prevBtn = document.querySelector('#product-modal .modal-nav.prev-btn');
    const nextBtn = document.querySelector('#product-modal .modal-nav.next-btn');

    if (!wrapper) return;

    if (currentGallery.length === 0) {
        wrapper.innerHTML = `<div style="color:#666;text-align:center;padding:2rem;font-size:0.9rem;width:100%;">Mídia indisponível</div>`;
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (dotsContainer) dotsContainer.innerHTML = '';
        return;
    }

    if (currentGallery.length <= 1) {
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    } else {
        if (prevBtn) prevBtn.style.display = 'flex';
        if (nextBtn) nextBtn.style.display = 'flex';
    }

    const currentSrc = currentGallery[currentMediaIndex];
    const isVideo = currentSrc.match(/\.(mov|mp4|webm|ogg)$/i);
    const safeSrc = escapeHTML(currentSrc);

    const zoomIconSVG = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
    `;

    const zoomHintHTML = `
        <div class="zoom-hint" title="Clique para ampliar">
            ${zoomIconSVG}
            <span>Ampliar</span>
        </div>
    `;

    if (isVideo) {
        wrapper.innerHTML = `
            <video src="${safeSrc}" autoplay muted loop playsinline preload="metadata" 
                   onerror="handleMediaError(this)"></video>
            ${zoomHintHTML}
        `;
    } else {
        wrapper.innerHTML = `
            <img src="${safeSrc}" alt="Detalhe do Produto" 
                 onerror="handleMediaError(this)" />
            ${zoomHintHTML}
        `;
    }

    const mediaEl = wrapper.querySelector('video, img');
    if (mediaEl) {
        mediaEl.addEventListener('click', () => openPhotoSwipeAtCurrentIndex());
    }

    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        if (currentGallery.length > 1) {
            currentGallery.forEach((_, idx) => {
                dotsContainer.innerHTML += `<div class="dot ${idx === currentMediaIndex ? 'active' : ''}" onclick="setModalMediaIndex(${idx})"></div>`;
            });
        }
    }
}

function navigateModalGallery(direction) {
    if (currentGallery.length <= 1) return;
    currentMediaIndex += direction;
    if (currentMediaIndex < 0) currentMediaIndex = currentGallery.length - 1;
    else if (currentMediaIndex >= currentGallery.length) currentMediaIndex = 0;
    renderModalMedia();
}

function setModalMediaIndex(index) {
    currentMediaIndex = index;
    renderModalMedia();
}

function closeProductModal() {
    closePhotoSwipeIfOpen();
    const modal = document.getElementById('product-modal');
    if (modal) modal.classList.remove('open');
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function openRelatedProduct(ref) {
    const product = productsFromDb.find(p => p.ref === ref);
    if (!product) return;

    const modalContent = document.querySelector('#product-modal .modal-content');
    if (modalContent) modalContent.classList.add('fade-switch');

    setTimeout(() => {
        openProductModal(
            product.name,
            product.ref,
            Number(product.price),
            product.gem || '',
            product.description || '',
            product.materials || '',
            (product.gallery || '').split(',').map(s => s.trim()).filter(Boolean),
            Number(product.stock) || 0
        );
        if (modalContent) modalContent.classList.remove('fade-switch');
    }, 120);
}

function renderRelatedProducts(currentRef, currentCategory) {
    const section = document.getElementById('related-section');
    const grid = document.getElementById('related-grid');
    if (!section || !grid) return;

    // Filtra em memória: ativos, com estoque, excluindo o produto atual
    const candidates = productsFromDb.filter(p => p.ref !== currentRef && Number(p.stock) > 0);

    if (candidates.length === 0) {
        section.hidden = true;
        return;
    }

    // Prioridade 1: mesma categoria. Prioridade 2: outras (embaralhadas)
    const sameCategory = candidates.filter(p => p.category === currentCategory);
    const others = shuffleArray(candidates.filter(p => p.category !== currentCategory));
    const selected = sameCategory.concat(others).slice(0, 3);

    if (selected.length === 0) {
        section.hidden = true;
        return;
    }

    section.hidden = false;

    grid.innerHTML = selected.map(p => {
        const firstMedia = (p.gallery || '').split(',').map(s => s.trim()).filter(Boolean)[0] || '';
        const isVideo = firstMedia.match(/\.(mov|mp4|webm|ogg)$/i);
        const mediaHTML = isVideo
            ? `<video src="${escapeHTML(firstMedia)}" muted loop playsinline preload="metadata" aria-hidden="true"></video>`
            : (firstMedia
                ? `<img src="${escapeHTML(firstMedia)}" alt="${escapeHTML(p.name)}" loading="lazy" />`
                : `<div class="related-card-media-empty"></div>`);

        return `<div class="related-card" onclick="openRelatedProduct('${escapeJs(p.ref)}')" role="button" tabindex="0" aria-label="Ver ${escapeHTML(p.name)}"><div class="related-card-media">${mediaHTML}</div><div class="related-card-name">${escapeHTML(p.name)}</div><div class="related-card-price">${formatCurrency(p.price)}</div></div>`;
    }).join('');

    // Analytics opcional: view_item_list
    trackGA('view_item_list', {
        item_list_id: 'produtos_relacionados',
        item_list_name: 'Produtos Relacionados',
        items: selected.map(p => ({
            item_id: p.ref,
            item_name: p.name,
            item_category: getCategoryLabel(p.category),
            price: Number(p.price),
            quantity: 1
        }))
    });
}

async function shareProduct(name, ref, price) {
    const GEM = String.fromCodePoint(0x1F48E); // 💎
    const STAR = String.fromCodePoint(0x2726); // ✦

    const title = `Use Gemas — ${name}`;
    const text =
        `Olha essa peça que linda na Use Gemas! ${GEM}\n\n` +
        `${STAR} ${name}\n` +
        `REF: ${ref}\n` +
        `Valor: ${formatCurrency(price)}\n\n` +
        `Veja aqui:`;
    const url = `https://usegemas.com.br/#produto-${ref}`;

    // 1. API nativa de compartilhamento (folha do sistema operacional)
    if (typeof navigator.share === 'function') {
        try {
            await navigator.share({ title, text, url });
            trackShareEvent('navigator.share', ref, name);
        } catch (err) {
            // Usuário cancelou → ignora silenciosamente
            if (err && err.name === 'AbortError') return;

            // Erro diferente → fallback pro WhatsApp Web
            shareViaWhatsApp(text, url, ref, name);
        }
        return;
    }

    // 2. Fallback: WhatsApp Web
    shareViaWhatsApp(text, url, ref, name);
}

function shareViaWhatsApp(text, url, ref, name) {
    const message = `${text} ${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    trackShareEvent('whatsapp_fallback', ref, name);
}

function trackShareEvent(method, ref, name) {
    trackGA('share', {
        method,
        content_type: 'product',
        item_id: ref,
        item_name: name
    });

    trackMetaCustom('Share', {
        method,
        content_type: 'product',
        content_ids: [ref],
        content_name: name
    });
}

// ==========================================================================
// Filtro de categoria + busca de produtos
// ==========================================================================
let currentCategory = 'all';
let currentSearchTerm = '';
let searchDebounceTimer = null;

function filterProducts(category, element) {
    currentCategory = category;

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');

    applyProductFilters();
}

function onProductSearchInput(input) {
    const value = input.value;
    const clearBtn = document.getElementById('search-clear');
    if (clearBtn) clearBtn.hidden = value.length === 0;

    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
        currentSearchTerm = value;
        applyProductFilters();
    }, 250);
}

function clearProductSearch() {
    const input = document.getElementById('product-search');
    const clearBtn = document.getElementById('search-clear');

    clearTimeout(searchDebounceTimer);
    currentSearchTerm = '';

    if (input) input.value = '';
    if (clearBtn) clearBtn.hidden = true;

    applyProductFilters();
    if (input) input.focus();
}

function applyProductFilters() {
    const term = currentSearchTerm.trim().toLowerCase();
    const products = document.querySelectorAll('.product-card');
    let visibleCount = 0;

    products.forEach(product => {
        const productCategory = product.getAttribute('data-category');
        const matchesCategory = currentCategory === 'all' || productCategory === currentCategory;

        let matchesSearch = true;
        if (term) {
            const name = (product.getAttribute('data-name') || '').toLowerCase();
            const ref = (product.getAttribute('data-ref') || '').toLowerCase();
            const gem = (product.getAttribute('data-gem') || '').toLowerCase();
            matchesSearch = name.includes(term) || ref.includes(term) || gem.includes(term);
        }

        if (matchesCategory && matchesSearch) {
            product.classList.remove('hide');
            visibleCount++;
        } else {
            product.classList.add('hide');
        }
    });

    updateSearchEmptyState(term, visibleCount);
}

function updateSearchEmptyState(term, visibleCount) {
    const emptyEl = document.getElementById('products-empty');
    const emptyText = document.getElementById('products-empty-text');
    if (!emptyEl || !emptyText) return;

    const hasProducts = productsFromDb.length > 0;
    const shouldShow = !!term && visibleCount === 0 && hasProducts;

    if (shouldShow) {
        emptyText.textContent = `Nenhum produto encontrado pra "${currentSearchTerm.trim()}".`;
        emptyEl.hidden = false;
    } else {
        emptyEl.hidden = true;
    }
}

// ==========================================================================
// Carrinho — Lógica com validação de estoque
// ==========================================================================
function addToCart(name, ref, price) {
    const product = productsFromDb.find(p => p.ref === ref);

    if (!product) {
        showToast(`"${name}" não está mais disponível.`, 'error');
        return false;
    }

    if (Number(product.stock) <= 0) {
        showToast(`"${name}" está em produção no momento. Adicione aos favoritos pra ser avisado(a) quando voltar!`, 'error');
        return false;
    }

    const existingItem = cart.find(item => item.ref === ref);
    const currentQty = existingItem ? existingItem.quantity : 0;

    if (currentQty + 1 > Number(product.stock)) {
        showToast(`Só temos ${product.stock} unidade(s) de "${name}" em estoque.`, 'error');
        return false;
    }

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, ref, price, quantity: 1 });
    }

    updateCartUI();
    saveCartToStorage();
    showToast(`${name} adicionado ao carrinho`, {
        actionLabel: 'Ver carrinho',
        actionCallback: () => openCart()
    });

    // ====== GA4: add_to_cart ======
    trackGA('add_to_cart', {
        currency: 'BRL',
        value: Number(price),
        items: [{
            item_id: ref,
            item_name: name,
            item_category: getCategoryLabel(product.category),
            price: Number(price),
            quantity: 1
        }]
    });

    // ====== Meta: AddToCart ======
    trackMeta('AddToCart', {
        content_ids: [ref],
        content_type: 'product',
        content_name: name,
        content_category: getCategoryLabel(product.category),
        value: Number(price),
        currency: 'BRL'
    });

    return true;
}

function updateQuantity(index, delta) {
    const item = cart[index];
    if (!item) return;

    const product = productsFromDb.find(p => p.ref === item.ref);
    const newQty = item.quantity + delta;

    if (delta > 0 && product && newQty > Number(product.stock)) {
        showToast(`Só temos ${product.stock} unidade(s) de "${item.name}" em estoque.`, 'error');
        return;
    }

    item.quantity = newQty;

    if (item.quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCartUI();
    saveCartToStorage();
}

function removeFromCart(index) {
    const item = cart[index];
    if (!item) return;

    // ====== GA4: remove_from_cart ======
    trackGA('remove_from_cart', {
        currency: 'BRL',
        value: Number(item.price) * Number(item.quantity),
        items: [{
            item_id: item.ref,
            item_name: item.name,
            price: Number(item.price),
            quantity: Number(item.quantity)
        }]
    });

    // ====== Meta: RemoveFromCart ======
    trackMetaCustom('RemoveFromCart', {
        content_ids: [item.ref],
        content_type: 'product',
        content_name: item.name,
        value: Number(item.price) * Number(item.quantity),
        currency: 'BRL'
    });

    cart.splice(index, 1);
    updateCartUI();
    saveCartToStorage();
}

// ==========================================================================
// Persistência do carrinho (revalidação)
// ==========================================================================
async function revalidateCartAfterRestore(savedItems) {
    if (!Array.isArray(savedItems) || savedItems.length === 0) {
        return { validItems: [], removedItems: [] };
    }

    // Pega os refs pra buscar no banco
    const refs = savedItems.map(item => item.ref).filter(Boolean);
    if (refs.length === 0) {
        return { validItems: [], removedItems: savedItems.map(i => i.name || i.ref) };
    }

    // Busca estado atual dos produtos
    const { data: freshProducts, error } = await supabaseClient
        .from('products')
        .select('ref, name, price, stock, active')
        .in('ref', refs);

    if (error) {
        console.error('Erro ao revalidar carrinho:', error);
        // Em caso de erro de rede, mantém o carrinho como tá
        return { validItems: savedItems, removedItems: [] };
    }

    const productsMap = new Map((freshProducts || []).map(p => [p.ref, p]));
    const validItems = [];
    const removedItems = [];

    for (const item of savedItems) {
        const product = productsMap.get(item.ref);

        // 1. Produto sumiu?
        if (!product) {
            removedItems.push(item.name || item.ref);
            continue;
        }

        // 2. Produto inativo?
        if (!product.active) {
            removedItems.push(product.name);
            continue;
        }

        // 3. Sem estoque?
        if (Number(product.stock) <= 0) {
            removedItems.push(product.name);
            continue;
        }

        // 4. Preço mudou?
        const newPrice = Number(product.price);
        const priceChanged = Math.abs(newPrice - Number(item.price)) > 0.01;

        // 5. Quantidade > estoque? (ajusta pra o máximo disponível)
        const newQuantity = Math.min(Number(item.quantity), Number(product.stock));
        const quantityAdjusted = newQuantity !== Number(item.quantity);

        // Adiciona item (com ajustes se necessário)
        validItems.push({
            name: product.name,           // atualiza o nome também
            ref: product.ref,
            price: newPrice,              // preço atualizado
            quantity: newQuantity
        });

        // Avisa se preço ou quantidade mudou
        if (priceChanged) {
            console.info(`Preço de "${product.name}" mudou: R$ ${item.price} → R$ ${newPrice}`);
        }
        if (quantityAdjusted) {
            console.info(`Quantidade de "${product.name}" ajustada: ${item.quantity} → ${newQuantity}`);
        }
    }

    return { validItems, removedItems };
}

async function restoreCartFromStorage() {
    const savedItems = loadCartFromStorage();

    if (!savedItems || savedItems.length === 0) {
        return;
    }

    const { validItems, removedItems } = await revalidateCartAfterRestore(savedItems);

    // Aplica itens válidos
    if (validItems.length > 0) {
        cart = validItems;
        saveCartToStorage(); // atualiza com preços/quantidades ajustados
    } else {
        cart = [];
        clearCartStorage();
    }

    // Avisa sobre itens removidos
    if (removedItems.length > 0) {
        const msg = removedItems.length === 1
            ? `"${removedItems[0]}" não está mais disponível e foi removido do carrinho.`
            : `${removedItems.length} itens não estão mais disponíveis e foram removidos do carrinho.`;

        if (typeof showToast === 'function') {
            showToast(msg, 'info');
        } else {
            console.warn(msg);
        }
    }

    // Se o carrinho ficou vazio, remove o cupom também
    if (cart.length === 0 && appliedCoupon) {
        appliedCoupon = null;
        localStorage.removeItem('gemas_applied_coupon');
        renderAppliedCoupon();
    }

    updateCartUI();

    // Revalida o cupom aplicado (o subtotal pode ter mudado)
    if (appliedCoupon && cart.length > 0) {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const { data: { user } } = await supabaseClient.auth.getUser();
        const checkoutData = JSON.parse(localStorage.getItem('gemas_checkout_data') || 'null');
        const customerEmail = user?.email || checkoutData?.email || null;
        const userId = user?.id || null;

        try {
            const { data, error } = await supabaseClient.rpc('validate_coupon', {
                p_code: appliedCoupon.code,
                p_subtotal: subtotal,
                p_customer_email: customerEmail,
                p_user_id: userId
            });

            if (error || !data || !data.valid) {
                // Cupom não vale mais
                console.warn('Cupom não é mais válido:', data?.message);
                appliedCoupon = null;
                localStorage.removeItem('gemas_applied_coupon');
                renderAppliedCoupon();

                if (typeof showToast === 'function') {
                    showToast('O cupom aplicado não é mais válido e foi removido.', 'info');
                }
            } else {
                // Cupom ainda vale — atualiza valor do desconto (pode ter mudado)
                appliedCoupon.discount = Number(data.discount);
                appliedCoupon.free_shipping = data.free_shipping;
                localStorage.setItem('gemas_applied_coupon', JSON.stringify(appliedCoupon));
                renderAppliedCoupon();
                updateCartUI();
            }
        } catch (e) {
            console.warn('Erro ao revalidar cupom:', e);
        }
    }
}

// ==========================================================================
// Frete
// ==========================================================================
function getEffectiveShipping(subtotal) {
    // a) Cliente escolheu frete real (Melhor Envio)
    if (selectedShipping) {
        return Number(selectedShipping.price) || 0;
    }

    // b) Frete grátis (método 'free' ou mínimo atingido)
    if ((shippingDetails && shippingDetails.method === 'free') || isFreeShippingApplied(subtotal)) {
        return 0;
    }

    // c) Frete fixo ativo (fallback)
    const shippingFixed = Number(siteSettings?.shipping_fixed) || 0;
    if (shippingFixed > 0) {
        return shippingFixed;
    }

    // d) Frete fixo desativado e nenhum frete escolhido → a calcular
    return null;
}

function isFreeShippingApplied(subtotal) {
    return siteSettings.free_shipping_min > 0
        && subtotal >= siteSettings.free_shipping_min;
}

/**
 * Identifica a região pelo PREFIXO (2 primeiros dígitos) do CEP.
 * Alinhado com a tabela dos Correios:
 *   01-19 → SP
 *   20-39 → RJ/ES/MG (Sudeste)
 *   40-79 → BA/SE/NE/PA/AM/DF/GO/MT/MS/TO (Centro-Oeste + Norte + Nordeste)
 *   80-99 → PR/SC/RS (Sul)
 */
function getRegionKeyFromCep(cep) {
    const cepClean = String(cep || '').replace(/\D/g, '');
    if (cepClean.length < 2) return null;

    const prefix2 = parseInt(cepClean.slice(0, 2), 10);
    if (isNaN(prefix2)) return null;

    // SP: 01-19
    if (prefix2 <= 19) return 'shipping_fixed_sp';

    // Sudeste (RJ/ES/MG): 20-39
    if (prefix2 <= 39) return 'shipping_fixed_sudeste';

    // Sul (PR/SC/RS): 80-99
    if (prefix2 >= 80) return 'shipping_fixed_sul';

    // Centro-Oeste + Norte + Nordeste (BA/SE/PE/CE/PA/DF/etc): 40-79
    return 'shipping_fixed_centro_norte_ne';
}

/**
 * Retorna o valor do frete fixo aplicável pro CEP.
 * Ordem de prioridade:
 *   1. Valor específico da região (se > 0)
 *   2. Valor global shipping_fixed (se > 0)
 *   3. 0 (sem fallback)
 */
function getFixedShippingForCep(cep) {
    const regionKey = getRegionKeyFromCep(cep);
    const regional = regionKey ? Number(siteSettings?.[regionKey] || 0) : 0;
    const global = Number(siteSettings?.shipping_fixed || 0);

    if (regional > 0) return { value: regional, source: regionKey };
    if (global > 0) return { value: global, source: 'shipping_fixed' };
    return { value: 0, source: null };
}

async function calculateShipping() {
    const input = document.getElementById('cep-input');
    const btn = document.getElementById('btn-calculate-shipping');
    const feedback = document.getElementById('shipping-feedback');
    const optionsEl = document.getElementById('shipping-options');
    const inputWrapper = document.getElementById('shipping-input-wrapper');

    if (!input || !btn || !feedback || !optionsEl) return;

    // Modo 'fixed' — ignora ME completamente
    const mode = siteSettings?.shipping_mode || 'me';
    if (mode === 'fixed') {
        const cepDigitado = input.value.replace(/\D/g, '');

        if (cepDigitado.length !== 8) {
            feedback.className = 'shipping-feedback error';
            feedback.innerText = 'Digite seu CEP pra calcular o frete.';
            return;
        }

        const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const freeMin = Number(siteSettings?.free_shipping_min || 0);
        const isFree = freeMin > 0 && subtotal >= freeMin;

        // Valor aplicável: específico da região > global
        const fixedInfo = getFixedShippingForCep(cepDigitado);
        const fixedValue = fixedInfo.value;

        selectedShipping = null;
        shippingDetails = {
            method: 'Fixo',
            carrier: 'Padrão',
            price: isFree ? 0 : fixedValue,
            is_fallback: false,
            region: fixedInfo.source
        };

        feedback.className = 'shipping-feedback';
        feedback.innerText = '';
        inputWrapper.style.display = 'none';
        optionsEl.style.display = 'block';
        optionsEl.innerHTML = `
            <div class="shipping-option selected ${isFree ? 'free-shipping' : ''}">
                <div class="shipping-option-info">
                    <div class="shipping-option-name">${isFree ? 'FRETE GRÁTIS ✨' : 'Frete padrão'}</div>
                    <div class="shipping-option-meta">${isFree ? 'Sua compra passou do mínimo' : 'Valor fixo aplicado pra sua região'}</div>
                </div>
                <div class="shipping-option-price">${isFree ? 'GRÁTIS' : formatCurrency(fixedValue)}</div>
            </div>
            <button type="button" class="btn-change-cep" onclick="resetShipping()">
                Calcular outro CEP
            </button>
        `;
        updateCartUI();
        return;
    }

    // Pega CEP limpo
    const cep = input.value.replace(/\D/g, '');

    if (cep.length !== 8) {
        feedback.className = 'shipping-feedback error';
        feedback.innerText = 'Digite um CEP válido (8 dígitos)';
        return;
    }

    // Salva no localStorage
    try { localStorage.setItem('gemas_shipping_cep', cep); } catch (e) {}

    // Bloqueia botão
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Calculando...';
    feedback.className = 'shipping-feedback';
    feedback.innerText = '';

    try {
        // Calcula subtotal + valor declarado
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const valorDeclarado = subtotal;

        // Chama Edge Function
        const response = await fetch(
            'https://dytdnemwqbzgrekamwla.supabase.co/functions/v1/calculate-shipping',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cep_destino: cep,
                    peso_kg: 1.0,
                    valor_declarado: valorDeclarado
                })
            }
        );

        if (!response.ok) {
            throw new Error('Falha ao calcular frete');
        }

        const data = await response.json();

        if (!data.success || !data.quotes || data.quotes.length === 0) {
            throw new Error('Nenhuma opção de frete disponível pra esse CEP');
        }

        // Salva quotes global
        shippingQuotes = data.quotes;

        // Verifica frete grátis
        const freeShippingMin = Number(siteSettings?.free_shipping_min || 400);
        const isFreeShipping = subtotal >= freeShippingMin;

        // Renderiza
        renderShippingOptions(isFreeShipping);

        // Esconde input de CEP, mostra opções
        inputWrapper.style.display = 'none';
        optionsEl.style.display = 'block';

    } catch (e) {
        console.error('Erro ao calcular frete:', e);

        // ME falhou — tenta fallback fixo (região > global)
        const fixedInfo = getFixedShippingForCep(cep);
        const fixedFallback = fixedInfo.value;

        const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const freeMin = Number(siteSettings?.free_shipping_min || 0);
        const isFree = freeMin > 0 && subtotal >= freeMin;

        if (fixedFallback > 0) {
            selectedShipping = null;
            shippingDetails = {
                method: 'Fixo',
                carrier: 'Padrão',
                price: isFree ? 0 : fixedFallback,
                is_fallback: true,
                region: fixedInfo.source
            };

            inputWrapper.style.display = 'none';
            optionsEl.style.display = 'block';
            optionsEl.innerHTML = `
                <div class="shipping-option selected ${isFree ? 'free-shipping' : ''}">
                    <div class="shipping-option-info">
                        <div class="shipping-option-name">${isFree ? 'FRETE GRÁTIS ✨' : 'Frete padrão'}</div>
                        <div class="shipping-option-meta">${isFree ? 'Sua compra passou do mínimo' : 'Frete fixo aplicado como reserva'}</div>
                    </div>
                    <div class="shipping-option-price">${isFree ? 'GRÁTIS' : formatCurrency(fixedFallback)}</div>
                </div>
                <button type="button" class="btn-change-cep" onclick="resetShipping()">
                    Calcular outro CEP
                </button>
            `;
            updateCartUI();
            return;
        }

        // Sem fallback — mostra erro
        feedback.className = 'shipping-feedback error';
        feedback.innerText = 'Frete indisponível no momento. Fale com a gente no WhatsApp.';
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

function renderShippingOptions(isFreeShipping) {
    const optionsEl = document.getElementById('shipping-options');
    if (!optionsEl) return;

    // Caso 1: frete grátis
    if (isFreeShipping) {
        optionsEl.innerHTML = `
            <div class="shipping-option selected free-shipping" 
                 onclick="selectShippingOption('free')">
                <div class="shipping-option-radio">
                    <input type="radio" name="shipping-option" value="free" checked>
                </div>
                <div class="shipping-option-info">
                    <div class="shipping-option-name">FRETE GRÁTIS ✨</div>
                    <div class="shipping-option-meta">Aproveite! Sua compra passou do mínimo</div>
                </div>
                <div class="shipping-option-price">GRÁTIS</div>
            </div>
            <button type="button" class="btn-change-cep" onclick="resetShipping()">
                Calcular outro CEP
            </button>
        `;

        // Aplica frete grátis
        shippingDetails = { method: 'free', carrier: 'Grátis', price: 0 };
        updateCartUI();
        return;
    }

    // Caso 2: cotações normais
    optionsEl.innerHTML = shippingQuotes.map((quote, idx) => {
        const isSelected = idx === 0;
        const selectedClass = isSelected ? 'selected' : '';
        const checkedAttr = isSelected ? 'checked' : '';
        const days = quote.delivery_time;
        const daysText = days === 1 ? '1 dia útil' : `${days} dias úteis`;
        const carrierName = quote.company.name;

        return `
            <div class="shipping-option ${selectedClass}" 
                 onclick="selectShippingOption(${idx})">
                <div class="shipping-option-radio">
                    <input type="radio" name="shipping-option" 
                           value="${idx}" ${checkedAttr}>
                </div>
                <div class="shipping-option-info">
                    <div class="shipping-option-name">
                        ${escapeHTML(carrierName)} ${escapeHTML(quote.name)}
                    </div>
                    <div class="shipping-option-meta">${daysText}</div>
                </div>
                <div class="shipping-option-price">
                    ${escapeHTML(quote.price_formatted)}
                </div>
            </div>
        `;
    }).join('') + `
        <button type="button" class="btn-change-cep" onclick="resetShipping()">
            Calcular outro CEP
        </button>
    `;

    // Seleciona automaticamente a primeira opção (menor preço)
    if (shippingQuotes.length > 0) {
        selectShippingOption(0);
    }
}

function selectShippingOption(index) {
    const optionsEl = document.getElementById('shipping-options');
    if (!optionsEl) return;

    // Remove seleção visual anterior
    optionsEl.querySelectorAll('.shipping-option').forEach(el => {
        el.classList.remove('selected');
    });

    // Caso frete grátis
    if (index === 'free') {
        const freeEl = optionsEl.querySelector('.shipping-option.free-shipping');
        if (freeEl) freeEl.classList.add('selected');
        const radio = freeEl?.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;

        selectedShipping = null;
        shippingDetails = { method: 'free', carrier: 'Grátis', price: 0 };
        updateCartUI();
        return;
    }

    // Caso normal
    const idx = Number(index);
    const options = optionsEl.querySelectorAll('.shipping-option:not(.free-shipping)');
    const selectedEl = options[idx];
    if (!selectedEl) return;

    selectedEl.classList.add('selected');
    const radio = selectedEl.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;

    const quote = shippingQuotes[idx];
    if (!quote) return;

    selectedShipping = quote;
    shippingDetails = {
        method: quote.name,
        carrier: quote.company.name,
        price: Number(quote.price),
        delivery_time: quote.delivery_time,
        service_id: quote.id
    };

    updateCartUI();
}

function resetShipping() {
    const inputWrapper = document.getElementById('shipping-input-wrapper');
    const optionsEl = document.getElementById('shipping-options');
    const input = document.getElementById('cep-input');
    const feedback = document.getElementById('shipping-feedback');

    shippingQuotes = [];
    selectedShipping = null;
    shippingDetails = null;

    if (inputWrapper) inputWrapper.style.display = 'block';
    if (optionsEl) {
        optionsEl.style.display = 'none';
        optionsEl.innerHTML = '';
    }
    if (input) input.value = '';
    if (feedback) {
        feedback.className = 'shipping-feedback';
        feedback.innerText = '';
    }

    // Limpa CEP salvo
    try { localStorage.removeItem('gemas_shipping_cep'); } catch (e) {}

    updateCartUI();
}

// Máscara automática do CEP
function applyCEPMask(value) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return digits.slice(0, 5) + '-' + digits.slice(5);
}

// Inicializa máscara + restaura CEP salvo
function initShipping() {
    const input = document.getElementById('cep-input');
    if (!input) return;

    // Aplica máscara enquanto digita
    input.addEventListener('input', (e) => {
        e.target.value = applyCEPMask(e.target.value);
    });

    // Restaura CEP salvo (se tiver)
    try {
        const savedCep = localStorage.getItem('gemas_shipping_cep');
        if (savedCep && savedCep.length === 8) {
            input.value = applyCEPMask(savedCep);
            // Só calcula automaticamente se o carrinho tiver itens
            if (cart.length > 0) {
                setTimeout(() => calculateShipping(), 300);
            }
        }
    } catch (e) {}
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartSubtotalElement = document.getElementById('cart-subtotal');
    const cartShippingElement = document.getElementById('cart-shipping-cost');
    const cartTotalElement = document.getElementById('cart-total');

    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';

    let totalItems = 0;
    let subtotalPrice = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p style="color: #888; text-align: center; margin-top: 2rem;">Seu carrinho está vazio.</p>`;
        shippingDetails = null;
        const cepInput = document.getElementById('cep-input');
        if (cepInput) cepInput.value = '';

        // Só remove cupom se o carrinho JÁ foi restaurado
        // (evita apagar cupom durante o boot)
        if (cartRestored && appliedCoupon) {
            appliedCoupon = null;
            localStorage.removeItem('gemas_applied_coupon');
            renderAppliedCoupon();
        }
    } else {
        cart.forEach((item, index) => {
            totalItems += item.quantity;
            const itemSubtotal = item.price * item.quantity;
            subtotalPrice += itemSubtotal;

            cartItemsContainer.innerHTML += `
                <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.03); padding: 0.8rem 1rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 0.8rem;">
                    <div>
                        <h4 style="font-family: var(--font-title, serif); font-size: 1.1rem; color: #f5f5f5; margin: 0;">${item.name}</h4>
                        <small style="color: #d4af37;">REF: ${item.ref}</small>
                        <div style="font-size: 0.85rem; color: #aaa; margin-top: 2px;">${formatCurrency(item.price)} cada</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.8rem;">
                        <div style="display: flex; align-items: center; background: #222226; border-radius: 4px; border: 1px solid rgba(212, 175, 55, 0.3);">
                            <button onclick="updateQuantity(${index}, -1)" style="background: none; border: none; color: #d4af37; padding: 0.2rem 0.6rem; cursor: pointer; font-size: 1rem; font-weight: bold;">-</button>
                            <span style="color: #f5f5f5; font-size: 0.9rem; font-weight: 600; padding: 0 0.3rem;">${item.quantity}</span>
                            <button onclick="updateQuantity(${index}, 1)" style="background: none; border: none; color: #d4af37; padding: 0.2rem 0.6rem; cursor: pointer; font-size: 1rem; font-weight: bold;">+</button>
                        </div>
                        <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #ff5555; cursor: pointer; font-size: 1.1rem; line-height: 1;" title="Remover item">&times;</button>
                    </div>
                </div>
            `;
        });
    }

    let effectiveShipping = getEffectiveShipping(subtotalPrice);

    // Calcula desconto do cupom
    let discountAmount = 0;
    let discountCode = '';

    if (appliedCoupon) {
        discountAmount = Number(appliedCoupon.discount) || 0;

        // Se for cupom de frete grátis, zera o frete
        if (appliedCoupon.free_shipping) {
            effectiveShipping = 0;
        }

        discountCode = appliedCoupon.code;
    }

    const finalTotal = subtotalPrice + (effectiveShipping || 0) - discountAmount;

    if (cartCount) cartCount.innerText = totalItems;
    if (cartSubtotalElement) cartSubtotalElement.innerText = formatCurrency(subtotalPrice);

    if (cartShippingElement) {
        if (effectiveShipping === null) {
            cartShippingElement.innerText = 'A calcular';
            cartShippingElement.style.color = '#888';
        } else if (effectiveShipping === 0) {
            cartShippingElement.innerText = 'GRÁTIS ✨';
            cartShippingElement.style.color = '#51cf66';
        } else {
            cartShippingElement.innerText = formatCurrency(effectiveShipping);
            cartShippingElement.style.color = '#d4af37';
        }
    }

    // Linha de desconto
    const discountRow = document.getElementById('cart-discount-row');
    const discountCodeEl = document.getElementById('cart-discount-code');
    const discountAmountEl = document.getElementById('cart-discount-amount');

    if (discountRow && discountCodeEl && discountAmountEl) {
        if (discountAmount > 0) {
            discountRow.style.display = 'flex';
            discountCodeEl.innerText = discountCode;
            discountAmountEl.innerText = '-' + formatCurrency(discountAmount);
        } else {
            discountRow.style.display = 'none';
        }
    }

    if (cartTotalElement) {
        if (effectiveShipping === null) {
            cartTotalElement.innerHTML = `${formatCurrency(finalTotal)} <small style="font-size: 0.7rem; color: #888; font-weight: 400;">(frete não incluso)</small>`;
        } else {
            cartTotalElement.innerText = formatCurrency(finalTotal);
        }
    }

    // Atualiza o botão "Ver meus cupons"
    updateCouponsSeeAllBtn();

    // Atualiza banner de frete grátis (Fase 10.3)
    const subtotal = cart.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
    updateFreeShippingBanner(subtotal);
}

// ==========================================================================
// Cupom de desconto
// ==========================================================================
async function applyCoupon() {
    const input = document.getElementById('coupon-input');
    const btn = document.getElementById('btn-apply-coupon');
    const feedback = document.getElementById('coupon-feedback');

    if (!input || !btn || !feedback) return;

    const code = input.value.trim().toUpperCase();

    // Validação básica
    if (!code) {
        feedback.className = 'coupon-feedback error';
        feedback.innerText = 'Digite um código de cupom';
        return;
    }

    // Bloqueia o botão
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Aplicando...';
    feedback.className = 'coupon-feedback';
    feedback.innerText = '';

    try {
        // Calcula subtotal atual
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (subtotal <= 0) {
            feedback.className = 'coupon-feedback error';
            feedback.innerText = 'Carrinho vazio';
            return;
        }

        // Pega dados do cliente (email + user_id)
        const { data: { user } } = await supabaseClient.auth.getUser();
        const checkoutData = JSON.parse(localStorage.getItem('gemas_checkout_data') || 'null');
        const customerEmail = user?.email || checkoutData?.email || null;
        const userId = user?.id || null;

        // Chama RPC de validação
        const { data, error } = await supabaseClient.rpc('validate_coupon', {
            p_code: code,
            p_subtotal: subtotal,
            p_customer_email: customerEmail,
            p_user_id: userId
        });

        if (error) {
            console.error('Erro ao validar cupom:', error);
            feedback.className = 'coupon-feedback error';
            feedback.innerText = 'Erro ao validar cupom. Tente novamente.';
            return;
        }

        // Verifica se é válido
        if (!data.valid) {
            feedback.className = 'coupon-feedback error';
            feedback.innerText = data.message || 'Cupom inválido';
            return;
        }

        // Aplica o cupom
        appliedCoupon = {
            code: code,
            coupon_id: data.coupon_id,
            discount: Number(data.discount),
            discount_type: data.discount_type,
            discount_value: Number(data.discount_value),
            free_shipping: data.free_shipping
        };

        // Salva em localStorage pra persistir
        localStorage.setItem('gemas_applied_coupon', JSON.stringify(appliedCoupon));

        // Atualiza UI
        renderAppliedCoupon();
        updateCartUI();

        // Limpa o input
        input.value = '';

        // Feedback de sucesso
        feedback.className = 'coupon-feedback success';
        feedback.innerText = `✓ Cupom aplicado! Você economizou ${formatCurrency(data.discount)}`;

        setTimeout(() => {
            feedback.innerText = '';
            feedback.className = 'coupon-feedback';
        }, 4000);

    } catch (e) {
        console.error('Erro inesperado:', e);
        feedback.className = 'coupon-feedback error';
        feedback.innerText = 'Erro inesperado. Tente novamente.';
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

function removeCoupon() {
    appliedCoupon = null;
    localStorage.removeItem('gemas_applied_coupon');

    renderAppliedCoupon();
    updateCartUI();

    // Feedback
    const feedback = document.getElementById('coupon-feedback');
    if (feedback) {
        feedback.className = 'coupon-feedback';
        feedback.innerText = '';
    }
}

function renderAppliedCoupon() {
    const inputWrapper = document.getElementById('coupon-input-wrapper');
    const appliedBox = document.getElementById('coupon-applied');
    const appliedCode = document.getElementById('coupon-applied-code');
    const appliedDesc = document.getElementById('coupon-applied-desc');

    if (!inputWrapper || !appliedBox) return;

    if (appliedCoupon) {
        inputWrapper.style.display = 'none';
        appliedBox.style.display = 'flex';

        if (appliedCode) appliedCode.innerText = appliedCoupon.code;

        if (appliedDesc) {
            if (appliedCoupon.free_shipping) {
                appliedDesc.innerText = 'Frete grátis' + (appliedCoupon.discount > 0 ? ' + ' + formatCurrency(appliedCoupon.discount) : '');
            } else if (appliedCoupon.discount_type === 'percentage') {
                appliedDesc.innerText = `${appliedCoupon.discount_value}% de desconto`;
            } else {
                appliedDesc.innerText = `${formatCurrency(appliedCoupon.discount_value)} de desconto`;
            }
        }
    } else {
        inputWrapper.style.display = 'block';
        appliedBox.style.display = 'none';
    }
}

function loadAppliedCoupon() {
    try {
        const saved = JSON.parse(localStorage.getItem('gemas_applied_coupon') || 'null');
        if (saved && saved.code && saved.discount !== undefined) {
            appliedCoupon = saved;
            renderAppliedCoupon();
        }
    } catch (e) {
        console.warn('Erro ao carregar cupom salvo:', e);
    }
}

/**
 * Busca cupons disponíveis pro cliente com status de aplicabilidade.
 */
async function loadAvailableCoupons(options = {}) {
    const { customerEmail = null, userId = null, subtotal = 0 } = options;

    const now = new Date();

    try {
        // 1. Busca cupons ativos que ainda não expiraram
        let query = supabaseClient
            .from('coupons')
            .select('id, code, description, discount_type, discount_value, min_purchase, max_discount, free_shipping, first_purchase_only, customer_email, usage_limit_total, usage_limit_per_user, times_used, starts_at, expires_at')
            .eq('active', true)
            .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`);

        // Filtro de email
        if (customerEmail) {
            query = query.or(`customer_email.is.null,customer_email.eq.${customerEmail}`);
        } else {
            query = query.is('customer_email', null);
        }

        const { data: coupons, error } = await query;

        if (error) {
            console.error('Erro ao buscar cupons:', error);
            return [];
        }

        if (!coupons || coupons.length === 0) return [];

        // 2. Busca usos desse cliente
        let usages = [];

        if (userId) {
            // Cliente logado: busca só por user_id (mais confiável, evita problemas de policy)
            const { data: usagesData, error: usagesError } = await supabaseClient
                .from('coupon_usages')
                .select('coupon_id, user_id')
                .eq('user_id', userId);

            if (usagesError) {
                console.warn('Erro ao buscar usos por user_id:', usagesError);
            }
            usages = usagesData || [];

        } else if (customerEmail) {
            // Guest: busca por email (RLS permite anon nesse caso)
            const { data: usagesData, error: usagesError } = await supabaseClient
                .from('coupon_usages')
                .select('coupon_id, customer_email')
                .ilike('customer_email', customerEmail);

            if (usagesError) {
                console.warn('Erro ao buscar usos por email:', usagesError);
            }
            usages = usagesData || [];
        }

        // Mapa de "coupon_id → qtd usada por esse cliente"
        const userUsageMap = new Map();
        usages.forEach(u => {
            userUsageMap.set(u.coupon_id, (userUsageMap.get(u.coupon_id) || 0) + 1);
        });

        // 3. Verifica se cliente já comprou (só se logado — busca por user_id)
        let hasPreviousOrders = false;
        if (userId) {
            const { data: prevOrders, error: ordersError } = await supabaseClient
                .from('orders')
                .select('id')
                .eq('user_id', userId)
                .in('status', ['pago', 'produzindo', 'enviado'])
                .limit(1);

            if (ordersError) {
                console.warn('Erro ao buscar pedidos anteriores:', ordersError);
            }

            hasPreviousOrders = (prevOrders && prevOrders.length > 0);
        }

        // 4. Processa cada cupom
        const processed = coupons.map(coupon => {
            let daysLeft = null;
            if (coupon.expires_at) {
                const expiresAt = new Date(coupon.expires_at);
                daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
            }

            // Preview do desconto
            let discountPreview = 0;
            if (subtotal > 0) {
                if (coupon.discount_type === 'percentage') {
                    discountPreview = subtotal * (Number(coupon.discount_value) / 100);
                    if (coupon.max_discount && discountPreview > Number(coupon.max_discount)) {
                        discountPreview = Number(coupon.max_discount);
                    }
                } else {
                    discountPreview = Number(coupon.discount_value);
                    if (discountPreview > subtotal) discountPreview = subtotal;
                }
                discountPreview = Math.round(discountPreview * 100) / 100;
            }

            // Verifica aplicabilidade
            let applicable = true;
            let reason = null;

            const userUsageCount = userUsageMap.get(coupon.id) || 0;
            if (coupon.usage_limit_per_user && userUsageCount >= coupon.usage_limit_per_user) {
                applicable = false;
                reason = 'Você já usou este cupom';
            }

            if (applicable && coupon.usage_limit_total && coupon.times_used >= coupon.usage_limit_total) {
                applicable = false;
                reason = 'Este cupom atingiu o limite de usos';
            }

            if (applicable && Number(coupon.min_purchase) > 0 && subtotal < Number(coupon.min_purchase)) {
                applicable = false;
                reason = `Precisa de ${formatCurrency(coupon.min_purchase)} de compra`;
            }

            if (applicable && coupon.first_purchase_only && hasPreviousOrders) {
                applicable = false;
                reason = 'Válido apenas na primeira compra';
            }

            if (appliedCoupon && appliedCoupon.code === coupon.code) {
                applicable = false;
                reason = 'Já aplicado';
            }

            return {
                id: coupon.id,
                code: coupon.code,
                description: coupon.description || '',
                discount_type: coupon.discount_type,
                discount_value: Number(coupon.discount_value),
                min_purchase: Number(coupon.min_purchase || 0),
                max_discount: coupon.max_discount ? Number(coupon.max_discount) : null,
                free_shipping: !!coupon.free_shipping,
                first_purchase_only: !!coupon.first_purchase_only,
                customer_email: coupon.customer_email,
                expires_at: coupon.expires_at,
                days_left: daysLeft,
                is_individual: !!coupon.customer_email,
                applicable,
                reason,
                discount_preview: discountPreview
            };
        });

        // 5. Ordena: aplicáveis primeiro, depois por dias restantes, depois por desconto
        processed.sort((a, b) => {
            if (a.applicable !== b.applicable) return a.applicable ? -1 : 1;

            if (a.days_left !== null && b.days_left !== null) {
                if (a.days_left !== b.days_left) return a.days_left - b.days_left;
            }

            return b.discount_preview - a.discount_preview;
        });

        return processed;

    } catch (e) {
        console.error('Erro inesperado ao carregar cupons:', e);
        return [];
    }
}

function getCouponDiscountLabel(coupon) {
    if (coupon.free_shipping && coupon.discount_value === 0) {
        return 'Frete grátis';
    }

    let base;
    if (coupon.discount_type === 'percentage') {
        base = `${coupon.discount_value}% off`;
    } else {
        base = `${formatCurrency(coupon.discount_value)} off`;
    }

    if (coupon.free_shipping) {
        base += ' + frete grátis';
    }

    return base;
}

function getCouponExpiryLabel(coupon) {
    if (!coupon.expires_at || coupon.days_left === null) {
        return 'Sem data de expiração';
    }

    if (coupon.days_left === 0) return 'Expira hoje';
    if (coupon.days_left === 1) return 'Expira amanhã';
    if (coupon.days_left <= 5) return `Expira em ${coupon.days_left} dias`;

    return `Válido até ${new Date(coupon.expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
}

// ==========================================================================
// Modal de Cupons no Carrinho
// ==========================================================================
let availableCouponsCache = [];

async function openCouponsModal() {
    const modal = document.getElementById('coupons-modal');
    const list = document.getElementById('coupons-modal-list');

    if (!modal || !list) return;

    const TICKET = String.fromCodePoint(0x1F39F, 0xFE0F);
    const WARN = String.fromCodePoint(0x26A0, 0xFE0F);

    // Abre modal primeiro (com loading)
    list.innerHTML = '<div class="coupons-modal-loading"><div class="spinner"></div><p>Carregando cupons...</p></div>';
    modal.classList.add('open');

    // Calcula subtotal atual
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Pega email + user_id
    const { data: { user } } = await supabaseClient.auth.getUser();
    const checkoutData = JSON.parse(localStorage.getItem('gemas_checkout_data') || 'null');
    const customerEmail = user?.email || checkoutData?.email || null;
    const userId = user?.id || null;

    // Busca cupons
    const coupons = await loadAvailableCoupons({
        customerEmail,
        userId,
        subtotal
    });

    // Filtra só aplicáveis
    const applicable = coupons.filter(c => c.applicable);
    availableCouponsCache = applicable;

    // Renderiza
    if (applicable.length === 0) {
        list.innerHTML = `
            <div class="coupons-modal-empty">
                <span class="icon">${TICKET}</span>
                <h4>Nenhum cupom disponível</h4>
                <p>Você não tem cupons aplicáveis no momento.</p>
                <p class="coupons-modal-empty-hint">Fique de olho nas nossas redes sociais pra novidades!</p>
            </div>
        `;
        return;
    }

    list.innerHTML = applicable.map(coupon => {
        const discountLabel = getCouponDiscountLabel(coupon);
        const expiryLabel = getCouponExpiryLabel(coupon);
        const urgencyClass = (coupon.days_left !== null && coupon.days_left <= 3) ? 'urgent' : '';

        return `
            <div class="coupon-modal-card ${urgencyClass}">
                <div class="coupon-modal-card-header">
                    <span class="coupon-modal-card-icon">${TICKET}</span>
                    <div class="coupon-modal-card-code">${escapeHTML(coupon.code)}</div>
                    ${coupon.is_individual ? '<span class="coupon-modal-card-indiv">Exclusivo</span>' : ''}
                </div>

                <div class="coupon-modal-card-discount">${escapeHTML(discountLabel)}</div>

                ${coupon.description ? `<div class="coupon-modal-card-desc">${escapeHTML(coupon.description)}</div>` : ''}

                <div class="coupon-modal-card-expiry ${urgencyClass}">
                    ${urgencyClass ? WARN + ' ' : ''}${escapeHTML(expiryLabel)}
                </div>

                <div class="coupon-modal-card-preview">
                    Você economiza: <strong>${formatCurrency(coupon.discount_preview)}</strong>
                </div>

                <button type="button" class="btn-apply-coupon-modal" onclick="applyCouponFromModal('${escapeHTML(coupon.code)}')">
                    Aplicar este cupom
                </button>
            </div>
        `;
    }).join('');
}

function closeCouponsModal() {
    document.getElementById('coupons-modal').classList.remove('open');
}

async function applyCouponFromModal(code) {
    // Preenche o input de cupom com o código
    const input = document.getElementById('coupon-input');
    if (input) {
        input.value = code;
    }

    // Fecha o modal
    closeCouponsModal();

    // Chama a função que aplica (já existe)
    await applyCoupon();
}

// Atualiza contador do botão "Ver meus cupons"
async function updateCouponsSeeAllBtn() {
    const btn = document.getElementById('coupon-see-all-btn');
    const countEl = document.getElementById('coupon-see-all-count');

    if (!btn) return;

    // Se não tem carrinho, esconde
    if (!cart || cart.length === 0) {
        btn.style.display = 'none';
        return;
    }

    // Calcula subtotal
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Pega email + user_id
    const { data: { user } } = await supabaseClient.auth.getUser();
    const checkoutData = JSON.parse(localStorage.getItem('gemas_checkout_data') || 'null');
    const customerEmail = user?.email || checkoutData?.email || null;
    const userId = user?.id || null;

    const coupons = await loadAvailableCoupons({
        customerEmail,
        userId,
        subtotal
    });

    const applicable = coupons.filter(c => c.applicable);

    if (applicable.length === 0) {
        btn.style.display = 'none';
        return;
    }

    btn.style.display = 'inline-flex';
    if (countEl) {
        countEl.innerText = applicable.length;
        countEl.style.display = 'inline-flex';
    }
}

// ==========================================================================
// WhatsApp
// ==========================================================================
function sendToWhatsApp(itemsParam = null) {
    const itemsToSend = itemsParam || cart;

    if (itemsToSend.length === 0) {
        showToast("Seu carrinho está vazio!", 'error');
        return;
    }

    const checkoutData = JSON.parse(localStorage.getItem('gemas_checkout_data') || 'null');

    let subtotalPrice = 0;
    let message = "";

    message += EMOJI_BAG + " *NOVO PEDIDO — USE GEMAS*\n";
    message += "━━━━━━━━━━━━━━━━━━\n";

    if (checkoutData && checkoutData.name) {
        message += EMOJI_USER + ` *Cliente:* ${checkoutData.name}\n`;
        if (checkoutData.email) message += EMOJI_EMAIL + ` *E-mail:* ${checkoutData.email}\n`;
        if (checkoutData.doc) message += EMOJI_DOC + ` *CPF/CNPJ:* ${checkoutData.doc}\n`;
        if (checkoutData.phone) message += EMOJI_PHONE + ` *Telefone:* ${checkoutData.phone}\n`;
    }

    if (checkoutData && checkoutData.cep) {
        message += "\n━━━━━━━━━━━━━━━━━━\n";
        message += EMOJI_PIN + " *ENDEREÇO DE ENTREGA*\n";
        message += `${checkoutData.street}, ${checkoutData.number}`;
        if (checkoutData.complement) message += ` - ${checkoutData.complement}`;
        message += `\n${checkoutData.neighborhood}\n`;
        message += `${checkoutData.city}/${checkoutData.state}\n`;
        message += `CEP: ${checkoutData.cep}\n`;
    }

    message += "\n━━━━━━━━━━━━━━━━━━\n";
    message += "*ITENS DO PEDIDO:*\n";
    itemsToSend.forEach((item) => {
        const itemSubtotal = item.price * item.quantity;
        subtotalPrice += itemSubtotal;
        message += `• ${item.quantity}x ${item.name} (REF: ${item.ref}) — ${formatCurrency(itemSubtotal)}\n`;
    });

    message += "━━━━━━━━━━━━━━━━━━\n";
    message += EMOJI_MONEY + ` *Subtotal:* ${formatCurrency(subtotalPrice)}\n`;

    const freeApplied = isFreeShippingApplied(subtotalPrice);
    const effectiveShipping = getEffectiveShipping(subtotalPrice);

    let finalShipping = effectiveShipping;
    if (appliedCoupon && appliedCoupon.free_shipping) {
        finalShipping = 0;
    }
    if (finalShipping === null) finalShipping = 0;

    if (selectedShipping) {
        // Frete real escolhido (Melhor Envio)
        const carrier = selectedShipping.company?.name || '';
        const method = selectedShipping.name || '';
        const shippingLabel = [method, carrier].filter(Boolean).join(' — ');
        message += EMOJI_TRUCK + ` *Frete:* ${formatCurrency(finalShipping)} (${shippingLabel})\n`;
        if (selectedShipping.delivery_time) {
            const days = Number(selectedShipping.delivery_time);
            const daysText = days === 1 ? '1 dia útil' : `${days} dias úteis`;
            message += ` *Prazo estimado:* ${daysText}\n`;
        }
    } else if (shippingDetails && shippingDetails.method === 'free') {
        message += EMOJI_TRUCK + ` *Frete:* GRÁTIS ✨\n`;
        message += ` *Prazo estimado:* 7 dias úteis\n`;
    } else if (freeApplied || (appliedCoupon && appliedCoupon.free_shipping)) {
        message += EMOJI_TRUCK + ` *Frete:* GRÁTIS ✨\n`;
    } else if (finalShipping > 0) {
        message += EMOJI_TRUCK + ` *Frete:* ${formatCurrency(finalShipping)}\n`;
    } else {
        message += EMOJI_TRUCK + ` *Frete:* Pendente (calcular por CEP)\n`;
    }

    if (appliedCoupon && appliedCoupon.discount > 0) {
        message += EMOJI_MONEY + ` *Cupom ${appliedCoupon.code}:* -${formatCurrency(appliedCoupon.discount)}\n`;
    }

    const totalWithDiscount = subtotalPrice + finalShipping - (appliedCoupon?.discount || 0);
    message += EMOJI_CHECK + ` *TOTAL:* ${formatCurrency(totalWithDiscount)}\n`;

    if (checkoutData && checkoutData.notes) {
        message += "\n━━━━━━━━━━━━━━━━━━\n";
        message += EMOJI_NOTE + ` *Observações:*\n${checkoutData.notes}\n`;
    }

    message += "\n━━━━━━━━━━━━━━━━━━\n";
    message += "Aguardo confirmação do pagamento e envio! " + EMOJI_PRAY;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}

// ==========================================================================
// Favoritos
// ==========================================================================
let favorites = [];

async function loadFavorites() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user) {
        const { data, error } = await supabaseClient
            .from('favorites')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (!error && data) {
            favorites = data.map(f => ({
                name: f.product_name,
                ref: f.product_ref,
                price: parseFloat(f.product_price)
            }));
        }
    } else {
        try {
            favorites = JSON.parse(localStorage.getItem('gemas_favorites') || '[]');
            if (!Array.isArray(favorites)) favorites = [];
        } catch (e) {
            favorites = [];
        }
    }
}

async function saveFavorites() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    localStorage.setItem('gemas_favorites', JSON.stringify(favorites));

    if (user) {
        await supabaseClient.from('favorites').delete().eq('user_id', user.id);
        if (favorites.length > 0) {
            const rows = favorites.map(f => ({
                user_id: user.id,
                product_name: f.name,
                product_ref: f.ref,
                product_price: f.price
            }));
            await supabaseClient.from('favorites').insert(rows);
        }
    }
}

function isFavorite(ref) {
    return favorites.some(f => f.ref === ref);
}

async function toggleFavorite(event, name, ref, price) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const index = favorites.findIndex(f => f.ref === ref);

    if (index >= 0) {
        // Remove dos favoritos
        favorites.splice(index, 1);
    } else {
        // Adiciona aos favoritos
        favorites.push({ name, ref, price });

        // ====== GA4: add_to_wishlist ======
        const productInfo = productsFromDb.find(p => p.ref === ref);
        trackGA('add_to_wishlist', {
            currency: 'BRL',
            value: Number(price),
            items: [{
                item_id: ref,
                item_name: name,
                item_category: productInfo ? getCategoryLabel(productInfo.category) : 'Outros',
                price: Number(price),
                quantity: 1
            }]
        });

        // ====== Meta: AddToWishlist ======
        trackMeta('AddToWishlist', {
            content_ids: [ref],
            content_type: 'product',
            content_name: name,
            value: Number(price),
            currency: 'BRL'
        });
    }

    await saveFavorites();
    updateFavoritesUI();
}

function updateFavoritesUI() {
    const countEl = document.getElementById('wishlist-count');
    if (countEl) countEl.innerText = favorites.length;

    document.querySelectorAll('.product-card').forEach(card => {
        const ref = card.getAttribute('data-ref');
        const btn = card.querySelector('.btn-favorite');
        if (!btn) return;

        if (isFavorite(ref)) {
            btn.classList.add('active');
            btn.setAttribute('aria-label', 'Remover dos favoritos');
        } else {
            btn.classList.remove('active');
            btn.setAttribute('aria-label', 'Adicionar aos favoritos');
        }
    });

    renderWishlistItems();
}

function renderWishlistItems() {
    const container = document.getElementById('wishlist-items');
    if (!container) return;

    if (favorites.length === 0) {
        container.innerHTML = `
            <p class="wishlist-empty">
                Sua lista de favoritos está vazia.<br>
                Toque no ${EMOJI_HEART} de qualquer peça para salvar aqui.
            </p>
        `;
        return;
    }

    container.innerHTML = '';
    favorites.forEach((item, index) => {
        container.innerHTML += `
            <div class="wishlist-item">
                <div class="wishlist-item-info">
                    <h4>${item.name}</h4>
                    <small>REF: ${item.ref}</small>
                    <div class="wishlist-price">${formatCurrency(item.price)}</div>
                </div>
                <div class="wishlist-item-actions">
                    <button onclick="moveFavoriteToCart(${index})" title="Adicionar ao carrinho" aria-label="Adicionar ao carrinho">${EMOJI_CART}</button>
                    <button class="btn-remove-fav" onclick="removeFromFavorites(${index})" title="Remover dos favoritos" aria-label="Remover">&times;</button>
                </div>
            </div>
        `;
    });
}

async function removeFromFavorites(index) {
    if (index < 0 || index >= favorites.length) return;
    favorites.splice(index, 1);
    await saveFavorites();
    updateFavoritesUI();
}

async function moveFavoriteToCart(index) {
    const item = favorites[index];
    if (!item) return;

    const added = addToCart(item.name, item.ref, item.price);
    if (!added) return;

    favorites.splice(index, 1);
    await saveFavorites();
    updateFavoritesUI();
}

function toggleWishlist() {
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    const cartDrawer = document.getElementById('cart-drawer');
    const notificationsDrawer = document.getElementById('notifications-drawer');
    if (wishlistDrawer) {
        const willOpen = !wishlistDrawer.classList.contains('open');
        wishlistDrawer.classList.toggle('open');
        if (willOpen && cartDrawer) cartDrawer.classList.remove('open');
        if (willOpen && notificationsDrawer) notificationsDrawer.classList.remove('open');
    }
}

function closeWishlist() {
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    if (wishlistDrawer) wishlistDrawer.classList.remove('open');
}

async function addAllFavoritesToCart() {
    if (favorites.length === 0) {
        showToast('Sua lista de favoritos está vazia.', 'error');
        return;
    }

    const itemsToAdd = [...favorites];
    const failedIndexes = [];

    itemsToAdd.forEach((item, idx) => {
        const added = addToCart(item.name, item.ref, item.price);
        if (!added) failedIndexes.push(idx);
    });

    if (failedIndexes.length === itemsToAdd.length) {
        showToast('Nenhum dos favoritos está disponível no momento.', 'error');
        return;
    }

    favorites = favorites.filter((_, idx) => failedIndexes.includes(idx));
    await saveFavorites();
    updateFavoritesUI();
    closeWishlist();
}

// ==========================================================================
// Avaliações de produto (reviews)
// ==========================================================================
async function loadReviewsSummary() {
    try {
        const { data, error } = await supabaseClient
            .from('reviews')
            .select('product_ref, rating')
            .eq('status', 'approved');

        if (error) {
            console.error('Erro ao carregar resumo de reviews:', error);
            return;
        }

        const byRef = new Map();
        (data || []).forEach(r => {
            if (!byRef.has(r.product_ref)) byRef.set(r.product_ref, { sum: 0, count: 0 });
            const agg = byRef.get(r.product_ref);
            agg.sum += Number(r.rating || 0);
            agg.count += 1;
        });

        productReviewsSummary = new Map();
        byRef.forEach((agg, ref) => {
            productReviewsSummary.set(ref, {
                avg: (agg.sum / agg.count).toFixed(1),
                count: agg.count
            });
        });
    } catch (e) {
        console.error('Erro ao carregar resumo de reviews:', e);
    }
}

function buildStarsHTML(rating) {
    const rounded = Math.round(Number(rating) || 0);
    let html = '';
    for (let i = 1; i <= 5; i++) {
        html += `<span class="review-star-char${i <= rounded ? ' active' : ''}">${i <= rounded ? '★' : '☆'}</span>`;
    }
    return html;
}

function formatReviewerName(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'Cliente';
    const first = parts[0];
    const secondInitial = parts.length > 1 ? parts[1].charAt(0).toUpperCase() + '.' : '';
    return secondInitial ? `${first} ${secondInitial}` : first;
}

function formatReviewDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[d.getMonth()]}/${d.getFullYear()}`;
}

async function loadProductReviews(productRef) {
    const { data, error } = await supabaseClient
        .from('reviews')
        .select('*')
        .eq('product_ref', productRef)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar reviews:', error);
        return [];
    }
    return data || [];
}

function renderReviewsSummary(reviews) {
    const el = document.getElementById('reviews-summary');
    if (!el) return;
    if (!reviews || reviews.length === 0) {
        el.hidden = true;
        el.innerHTML = '';
        return;
    }

    const total = reviews.length;
    const avg = (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / total).toFixed(1);

    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
        const v = Math.round(Number(r.rating) || 0);
        if (v >= 1 && v <= 5) dist[v]++;
    });

    const bars = [5, 4, 3, 2, 1].map(star => {
        const pct = Math.round((dist[star] / total) * 100);
        return `<div class="reviews-dist-row">
            <span class="reviews-dist-label">${star}★</span>
            <div class="reviews-dist-bar"><div class="reviews-dist-fill" style="width:${pct}%"></div></div>
            <span class="reviews-dist-pct">${pct}%</span>
        </div>`;
    }).join('');

    el.innerHTML = `
        <div class="reviews-summary-left">
            <div class="reviews-summary-avg">${avg}</div>
            <div class="reviews-summary-stars">${buildStarsHTML(avg)}</div>
            <div class="reviews-summary-count">${total} ${total === 1 ? 'avaliação' : 'avaliações'}</div>
        </div>
        <div class="reviews-dist">${bars}</div>
    `;
    el.hidden = false;
}

function buildReviewHTML(r, idx) {
    const name = formatReviewerName(r.customer_name);
    const date = formatReviewDate(r.created_at);
    const verified = r.verified_purchase
        ? `<span class="review-verified">Compra verificada ${String.fromCodePoint(0x2705)}</span>`
        : '';
    const title = r.title ? `<div class="review-item-title">${escapeHTML(r.title)}</div>` : '';

    const comment = r.comment || '';
    let commentHTML;
    if (comment.length > 200) {
        commentHTML = `<span class="review-comment-trunc">${escapeHTML(comment.slice(0, 200))}…</span><span class="review-full" hidden>${escapeHTML(comment.slice(200))}</span> <button type="button" class="review-read-more" onclick="toggleReviewReadMore(this)">Ler mais</button>`;
    } else {
        commentHTML = escapeHTML(comment);
    }

    const photos = (r.photos || '').split(',').map(s => s.trim()).filter(Boolean);
    let photosHTML = '';
    if (photos.length) {
        const shown = photos.slice(0, 3);
        const extra = photos.length - shown.length;
        photosHTML = `<div class="review-photos">${shown.map((ph, pi) =>
            `<img src="${escapeHTML(ph)}" alt="Foto da avaliação" class="review-photo-thumb" loading="lazy" onclick="openReviewPhotoSwipe(${idx}, ${pi})" />`
        ).join('')}${extra > 0 ? `<span class="review-photos-more">+${extra} fotos</span>` : ''}</div>`;
    }

    let adminHTML = '';
    if (r.admin_response) {
        adminHTML = `<div class="review-admin-response">
            <div class="review-admin-header">Resposta da Use Gemas</div>
            <p>${escapeHTML(r.admin_response)}</p>
        </div>`;
    }

    return `<div class="review-item">
        <div class="review-item-stars">${buildStarsHTML(r.rating)}</div>
        <div class="review-item-meta">
            <span class="review-item-author">${escapeHTML(name)}</span>
            ${verified}
            <span class="review-item-date">${date}</span>
        </div>
        ${title}
        <p class="review-item-comment">${commentHTML}</p>
        ${photosHTML}
        ${adminHTML}
    </div>`;
}

function toggleReviewReadMore(btn) {
    const p = btn.parentNode;
    const trunc = p.querySelector('.review-comment-trunc');
    const full = p.querySelector('.review-full');
    if (trunc) trunc.hidden = true;
    if (full) full.hidden = false;
    btn.hidden = true;
}

function renderReviewsList(ref, reviews) {
    const section = document.getElementById('reviews-section');
    const list = document.getElementById('reviews-list');
    const avgEl = document.getElementById('reviews-section-avg');
    const viewAllBtn = document.getElementById('reviews-view-all');
    if (!section || !list) return;

    if (!reviews || reviews.length === 0) {
        section.hidden = true;
        list.innerHTML = '';
        return;
    }

    const total = reviews.length;
    const avg = (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / total).toFixed(1);
    if (avgEl) avgEl.innerHTML = `${buildStarsHTML(avg)} ${avg} · ${total} ${total === 1 ? 'avaliação' : 'avaliações'}`;

    const shown = reviews.slice(0, 3);
    list.innerHTML = shown.map((r, idx) => buildReviewHTML(r, idx)).join('');

    if (viewAllBtn) {
        viewAllBtn.hidden = total <= 3;
        viewAllBtn.onclick = () => showAllReviews(ref, reviews);
    }

    section.hidden = false;
}

function showAllReviews(ref, reviews) {
    const list = document.getElementById('reviews-list');
    const viewAllBtn = document.getElementById('reviews-view-all');
    if (!list) return;
    list.innerHTML = reviews.map((r, idx) => buildReviewHTML(r, idx)).join('');
    if (viewAllBtn) viewAllBtn.hidden = true;
    list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function openReviewPhotoSwipe(reviewIdx, photoIdx) {
    const review = currentModalReviews[reviewIdx];
    if (!review) return;
    const photos = (review.photos || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!photos.length) return;
    openPhotoSwipeFromUrls(photos, photoIdx || 0);
}

async function checkCanReview(ref) {
    const cta = document.getElementById('reviews-cta');
    if (!cta) return;
    cta.hidden = true;

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select('items, status')
            .eq('user_id', user.id);
        if (error || !orders) return;

        const bought = orders.some(o =>
            (o.status === 'enviado' || o.status === 'entregue') &&
            Array.isArray(o.items) &&
            o.items.some(i => i.ref === ref)
        );
        if (!bought) return;

        cta.hidden = false;
        cta.innerHTML = `${String.fromCodePoint(0x2B50)} Avaliar este produto`;
        cta.onclick = () => { window.location.href = 'minha-conta.html'; };
    } catch (e) {
        // ignora silenciosamente
    }
}

function openPhotoSwipeFromUrls(urls, startIndex = 0) {
    if (!urls || urls.length === 0) return;

    if (photoSwipeLightbox) {
        try { photoSwipeLightbox.destroy(); } catch (e) { }
        photoSwipeLightbox = null;
    }

    const dataSource = urls.map((src) => ({ src, width: 1200, height: 1600, msrc: src }));

    let galleryEl = document.getElementById('pswp-gallery');
    if (!galleryEl) {
        galleryEl = document.createElement('div');
        galleryEl.id = 'pswp-gallery';
        galleryEl.className = 'pswp-gallery';
        galleryEl.style.display = 'none';
        document.body.appendChild(galleryEl);
    }

    Promise.all([
        import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe-lightbox.esm.min.js'),
        import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.esm.min.js')
    ])
        .then(([lightboxModule, pswpModule]) => {
            const PhotoSwipeLightbox = lightboxModule.default;
            const PhotoSwipe = pswpModule.default;

            photoSwipeLightbox = new PhotoSwipeLightbox({
                dataSource,
                pswpModule: () => Promise.resolve(PhotoSwipe),
                bgOpacity: 0.95,
                showHideAnimationType: 'zoom',
                zoomAnimationDuration: 300,
                wheelToZoom: true,
                pinchToClose: true,
                closeOnVerticalDrag: true,
                escKey: true,
                arrowKeys: true,
                clickToCloseNonZoomable: true
            });

            photoSwipeLightbox.init();
            photoSwipeLightbox.loadAndOpen(Math.max(0, Math.min(startIndex, dataSource.length - 1)));
        })
        .catch((err) => {
            console.warn('PhotoSwipe não pôde ser carregado:', err);
            window.open(urls[Math.max(0, Math.min(startIndex, urls.length - 1))], '_blank');
        });
}

// ==========================================================================
// PhotoSwipe
// ==========================================================================
function buildPhotoSwipeData() {
    return currentGallery.map((src) => {
        const isVideo = src.match(/\.(mov|mp4|webm|ogg)$/i);
        if (isVideo) {
            return { src, width: 1280, height: 720, type: 'video', videoSrc: src, msrc: src };
        }
        return { src, width: 1200, height: 1600, msrc: src };
    });
}

function openPhotoSwipeAtCurrentIndex() {
    if (currentGallery.length === 0) return;

    if (photoSwipeLightbox) {
        try { photoSwipeLightbox.destroy(); } catch (e) { }
        photoSwipeLightbox = null;
    }

    const dataSource = buildPhotoSwipeData();

    let galleryEl = document.getElementById('pswp-gallery');
    if (!galleryEl) {
        galleryEl = document.createElement('div');
        galleryEl.id = 'pswp-gallery';
        galleryEl.className = 'pswp-gallery';
        galleryEl.style.display = 'none';
        document.body.appendChild(galleryEl);
    }

    Promise.all([
        import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe-lightbox.esm.min.js'),
        import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.esm.min.js')
    ])
        .then(([lightboxModule, pswpModule]) => {
            const PhotoSwipeLightbox = lightboxModule.default;
            const PhotoSwipe = pswpModule.default;

            photoSwipeLightbox = new PhotoSwipeLightbox({
                dataSource,
                pswpModule: () => Promise.resolve(PhotoSwipe),
                bgOpacity: 0.95,
                showHideAnimationType: 'zoom',
                zoomAnimationDuration: 300,
                wheelToZoom: true,
                pinchToClose: true,
                closeOnVerticalDrag: true,
                escKey: true,
                arrowKeys: true,
                clickToCloseNonZoomable: true
            });

            photoSwipeLightbox.init();
            photoSwipeLightbox.loadAndOpen(currentMediaIndex);
        })
        .catch((err) => {
            console.warn('PhotoSwipe não pôde ser carregado:', err);
            window.open(currentGallery[currentMediaIndex], '_blank');
        });
}

function closePhotoSwipeIfOpen() {
    if (photoSwipeLightbox) {
        try { photoSwipeLightbox.destroy(); } catch (e) { }
        photoSwipeLightbox = null;
    }
}

// ==========================================================================
// Reviews da home (Fase 10.4) — featured + fallback recentes
// ==========================================================================
async function loadHomeReviews() {
    const grid = document.getElementById('testimonials-grid');
    const emptyEl = document.getElementById('testimonials-empty');
    if (!grid) return;

    try {
        // 1. Busca destacadas primeiro
        const { data: featured, error: errF } = await supabaseClient
            .from('reviews')
            .select('id, product_ref, customer_name, rating, title, comment, photos, verified_purchase, created_at, featured')
            .eq('status', 'approved')
            .eq('featured', true)
            .order('created_at', { ascending: false })
            .limit(6);

        if (errF) throw errF;

        let reviews = featured || [];

        // 2. Se faltar, completa com recentes aprovadas (sem duplicar)
        if (reviews.length < 6) {
            const excludeIds = reviews.map(r => r.id);
            let query = supabaseClient
                .from('reviews')
                .select('id, product_ref, customer_name, rating, title, comment, photos, verified_purchase, created_at, featured')
                .eq('status', 'approved')
                .order('created_at', { ascending: false })
                .limit(6 - reviews.length);

            if (excludeIds.length > 0) {
                query = query.not('id', 'in', `(${excludeIds.join(',')})`);
            }

            const { data: recent, error: errR } = await query;
            if (errR) throw errR;

            reviews = reviews.concat(recent || []);
        }

        // 3. Renderiza
        if (reviews.length === 0) {
            grid.style.display = 'none';
            if (emptyEl) emptyEl.hidden = false;
            return;
        }

        // Mapa de nomes de produtos (busca de 1 query)
        const refs = [...new Set(reviews.map(r => r.product_ref))];
        const { data: products } = await supabaseClient
            .from('products')
            .select('ref, name')
            .in('ref', refs);

        const productMap = new Map((products || []).map(p => [p.ref, p.name]));

        grid.innerHTML = reviews.map(r => renderHomeReviewCard(r, productMap)).join('');

        // JSON-LD AggregateRating (SEO)
        injectAggregateRatingSchema(reviews);

    } catch (e) {
        console.error('[HomeReviews] Erro:', e);
        grid.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
    }
}

function renderHomeReviewCard(review, productMap) {
    const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const productName = productMap.get(review.product_ref) || review.product_ref;

    // Foto (primeira da lista)
    const photos = (review.photos || '').split(',').map(s => s.trim()).filter(Boolean);
    const photosJson = JSON.stringify(photos).replace(/"/g, '&quot;');
    const photoHTML = photos.length > 0
        ? `<div class="testimonial-photo" role="button" tabindex="0"
                onclick='openReviewPhotosLightbox(${photosJson}, 0)'
                onkeydown='if(event.key==="Enter"||event.key===" "){event.preventDefault();openReviewPhotosLightbox(${photosJson}, 0);}'>
                <img src="${escapeHTML(photos[0])}" alt="Foto da avaliação" loading="lazy">
                ${photos.length > 1 ? `<span class="testimonial-photo-count">${photos.length} fotos</span>` : ''}
           </div>`
        : '';

    // Nome com abreviação (Marina R.)
    const nameParts = (review.customer_name || '').trim().split(/\s+/);
    const displayName = nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
        : nameParts[0] || 'Cliente';

    // Trunca comentário longo
    const comment = (review.comment || '').slice(0, 180) + ((review.comment || '').length > 180 ? '...' : '');

    const verifiedHTML = review.verified_purchase
        ? '<span class="testimonial-verified">✅ Compra verificada</span>'
        : '';

    return `
        <article class="testimonial-card">
            <div class="testimonial-stars" aria-label="Avaliação: ${rating} estrelas">${stars}</div>
            ${photoHTML}
            <p class="testimonial-text">${escapeHTML(comment)}</p>
            <footer class="testimonial-author">
                ${verifiedHTML}
                <span class="testimonial-name">${escapeHTML(displayName)}</span>
                <span class="testimonial-product">${escapeHTML(productName)}</span>
            </footer>
        </article>
    `;
}

function injectAggregateRatingSchema(reviews) {
    if (reviews.length === 0) return;

    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Use Gemas",
        "url": "https://usegemas.com.br/",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": avg.toFixed(1),
            "reviewCount": reviews.length,
            "bestRating": "5",
            "worstRating": "1"
        }
    };

    const existing = document.getElementById('ug-aggregate-schema');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'ug-aggregate-schema';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
}

async function openReviewPhotosLightbox(photos, startIndex = 0) {
    if (!photos || photos.length === 0) return;

    try {
        const [lb, pswp] = await Promise.all([
            import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe-lightbox.esm.min.js'),
            import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.esm.min.js')
        ]);
        const PhotoSwipeLightbox = lb.default;
        const PhotoSwipe = pswp.default;

        const dataSource = photos.map(url => ({
            src: url,
            width: 1200,
            height: 1600,
            msrc: url
        }));

        const lightbox = new PhotoSwipeLightbox({
            dataSource,
            pswpModule: () => Promise.resolve(PhotoSwipe),
            bgOpacity: 0.95,
            showHideAnimationType: 'zoom'
        });
        lightbox.init();
        lightbox.loadAndOpen(startIndex);
    } catch (e) {
        console.warn('PhotoSwipe fallback:', e);
        window.open(photos[startIndex], '_blank');
    }
}

// ==========================================================================
// FEEDBACK (Fase 10.4 — reciclagem Web3Forms → tabela feedbacks)
// ==========================================================================
let feedbackRating = 0;

function openFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;

    // Reset
    const form = document.getElementById('feedback-form');
    if (form) form.reset();
    const counter = document.getElementById('fb-char-count');
    if (counter) counter.textContent = '0';

    const fb = document.getElementById('feedback-form-feedback');
    if (fb) { fb.className = 'feedback-form-feedback'; fb.textContent = ''; }

    // Reset estrelas
    feedbackRating = 0;
    document.querySelectorAll('.feedback-star').forEach(s => s.classList.remove('active'));

    // Pré-preenche com dados do usuário logado (se houver)
    if (typeof supabaseClient !== 'undefined') {
        supabaseClient.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                const emailInput = document.getElementById('fb-email');
                if (emailInput && !emailInput.value) emailInput.value = user.email || '';
            }
        }).catch(() => {});
    }

    modal.classList.add('open');
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (modal) modal.classList.remove('open');
}

function paintFeedbackStars(value) {
    document.querySelectorAll('.feedback-star').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.value, 10) <= value);
    });
}

async function submitFeedback(event) {
    event.preventDefault();

    const fb = document.getElementById('feedback-form-feedback');
    const btn = document.getElementById('feedback-submit-btn');

    if (fb) { fb.className = 'feedback-form-feedback'; fb.textContent = ''; }

    const name = (document.getElementById('fb-name')?.value || '').trim();
    const email = (document.getElementById('fb-email')?.value || '').trim();
    const category = document.getElementById('fb-category')?.value || null;
    const message = (document.getElementById('fb-message')?.value || '').trim();

    if (message.length < 5) {
        if (fb) {
            fb.className = 'feedback-form-feedback error';
            fb.textContent = 'Escreva uma mensagem com pelo menos 5 caracteres.';
        }
        return;
    }

    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Enviando...';

    try {
        // Pega user_id se estiver logado (opcional)
        let userId = null;
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            userId = user?.id || null;
        } catch (e) { /* anônimo */ }

        const payload = {
            user_id: userId,
            customer_name: name || null,
            customer_email: email || null,
            rating: feedbackRating > 0 ? feedbackRating : null,
            category: category,
            message: message,
            status: 'new'
        };

        const { error } = await supabaseClient
            .from('feedbacks')
            .insert(payload);

        if (error) throw error;

        // Sucesso
        if (fb) {
            fb.className = 'feedback-form-feedback success';
            fb.textContent = '💛 Obrigada! Seu feedback foi recebido.';
        }

        // Fecha após 1.5s
        setTimeout(() => {
            closeFeedbackModal();
            if (typeof trackGA === 'function') {
                trackGA('feedback_submitted', { category, has_rating: feedbackRating > 0 });
            }
        }, 1500);

    } catch (e) {
        console.error('[Feedback] Erro:', e);
        if (fb) {
            fb.className = 'feedback-form-feedback error';
            fb.textContent = 'Não foi possível enviar. Tente novamente em alguns instantes.';
        }
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// Bind (roda após DOMContentLoaded)
document.addEventListener('DOMContentLoaded', () => {
    // Estrelas
    document.querySelectorAll('.feedback-star').forEach(btn => {
        const v = parseInt(btn.dataset.value, 10);
        btn.addEventListener('mouseenter', () => paintFeedbackStars(v));
        btn.addEventListener('mouseleave', () => paintFeedbackStars(feedbackRating));
        btn.addEventListener('click', () => {
            feedbackRating = v;
            paintFeedbackStars(v);
        });
    });

    // Contador do textarea
    const msgEl = document.getElementById('fb-message');
    const counterEl = document.getElementById('fb-char-count');
    if (msgEl && counterEl) {
        msgEl.addEventListener('input', () => {
            counterEl.textContent = msgEl.value.length;
        });
    }

    // Submit
    const form = document.getElementById('feedback-form');
    if (form) form.addEventListener('submit', submitFeedback);

    // Fecha com ESC / clique fora
    const modal = document.getElementById('feedback-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeFeedbackModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('open')) closeFeedbackModal();
        });
    }
});

// ==========================================================================
// Checkout
// ==========================================================================
async function openCheckoutModal() {
    if (cart.length === 0) { showToast('Seu carrinho está vazio.', 'error'); return; }

    // Se o frete ainda não foi definido (shipping_fixed = 0 e sem Melhor Envio),
    // e o cliente tem dados de checkout (logado ou CEP salvo), bloqueia.
    const subtotalForShipping = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    if (getEffectiveShipping(subtotalForShipping) === null) {
        const checkoutData = JSON.parse(localStorage.getItem('gemas_checkout_data') || 'null');
        let hasCheckoutInfo = !!(checkoutData && checkoutData.cep);

        if (!hasCheckoutInfo) {
            try {
                const { data: { user } } = await supabaseClient.auth.getUser();
                hasCheckoutInfo = !!user;
            } catch (e) { hasCheckoutInfo = false; }
        }

        if (hasCheckoutInfo) {
            showToast('Calcule o frete antes de finalizar', 'error');
            return;
        }
    }

    const cartDrawer = document.getElementById('cart-drawer');
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    if (cartDrawer) cartDrawer.classList.remove('open');
    if (wishlistDrawer) wishlistDrawer.classList.remove('open');

    loadCheckoutData();

    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.add('open');

    // ====== GA4: begin_checkout ======
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    trackGA('begin_checkout', {
        currency: 'BRL',
        value: total,
        items: cart.map(i => ({
            item_id: i.ref,
            item_name: i.name,
            price: Number(i.price),
            quantity: Number(i.quantity)
        }))
    });

    // ====== Meta: InitiateCheckout ======
    trackMeta('InitiateCheckout', {
        content_ids: cart.map(i => i.ref),
        content_type: 'product',
        contents: cart.map(i => ({ id: i.ref, quantity: Number(i.quantity), item_price: Number(i.price) })),
        value: total,
        currency: 'BRL',
        num_items: cart.reduce((s, i) => s + Number(i.quantity), 0)
    });
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('open');
    clearCheckoutFeedback();
    clearCheckoutErrors();
}

async function loadCheckoutData() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    let saved = null;

    if (user) {
        const { data } = await supabaseClient
            .from('checkout_data')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
        if (data) saved = data;
    }

    if (!saved) {
        try { saved = JSON.parse(localStorage.getItem('gemas_checkout_data') || 'null'); } catch (e) { saved = null; }
    }

    if (!saved) {
        // Sem nada salvo: pré-preenche email com o da conta (se logado)
        if (user && user.email) {
            const emailEl = document.getElementById('ck-email');
            if (emailEl) emailEl.value = user.email;
        }
        return;
    }

    const fields = ['name', 'email', 'doc', 'phone', 'cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'notes'];
    fields.forEach(field => {
        const el = document.getElementById('ck-' + field);
        if (el && saved[field]) el.value = saved[field];
    });

    // Fallback: se o email ainda estiver vazio e o cliente estiver logado, usa o email da conta
    if (user && user.email) {
        const emailEl = document.getElementById('ck-email');
        if (emailEl && !emailEl.value) emailEl.value = user.email;
    }
}

async function saveCheckoutData() {
    const fields = ['name', 'email', 'doc', 'phone', 'cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'notes'];
    const data = {};
    fields.forEach(field => {
        const el = document.getElementById('ck-' + field);
        if (el) data[field] = el.value.trim();
    });

    localStorage.setItem('gemas_checkout_data', JSON.stringify(data));

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        // Remove o email antes de salvar no Supabase:
        // a tabela checkout_data não precisa dessa coluna, e o email do usuário
        // logado é recuperado diretamente de auth (user.email) em saveOrderToDb().
        const { email, ...dataForDb } = data;
        await supabaseClient.from('checkout_data').upsert({
            user_id: user.id,
            ...dataForDb,
            updated_at: new Date().toISOString()
        });
    }
}

function clearCheckoutFeedback() {
    const el = document.getElementById('checkout-feedback');
    if (el) { el.className = 'checkout-feedback'; el.innerText = ''; }
}

function showCheckoutFeedback(message, type = 'error') {
    const el = document.getElementById('checkout-feedback');
    if (el) {
        el.className = `checkout-feedback ${type}`;
        el.innerText = message;
        el.style.whiteSpace = 'pre-line';
    }
}

function clearCheckoutErrors() {
    document.querySelectorAll('#checkout-form .input-error').forEach(el => el.classList.remove('input-error'));
    const cepFeedback = document.getElementById('ck-cep-feedback');
    if (cepFeedback) { cepFeedback.innerText = ''; cepFeedback.style.color = ''; }
}

function maskCpfCnpj(value) {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
        return digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function maskPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
        return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    }
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

function maskCep(value) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/(\d{5})(\d{1,3})/, '$1-$2');
}

function setupCheckoutMasks() {
    const docInput = document.getElementById('ck-doc');
    const phoneInput = document.getElementById('ck-phone');
    const cepInput = document.getElementById('ck-cep');

    if (docInput) docInput.addEventListener('input', (e) => { e.target.value = maskCpfCnpj(e.target.value); });
    if (phoneInput) phoneInput.addEventListener('input', (e) => { e.target.value = maskPhone(e.target.value); });
    if (cepInput) {
        cepInput.addEventListener('input', (e) => { e.target.value = maskCep(e.target.value); });
        cepInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); searchCepCheckout(); }
        });
    }
}

async function searchCepCheckout() {
    const cepInput = document.getElementById('ck-cep');
    const feedback = document.getElementById('ck-cep-feedback');
    if (!cepInput || !feedback) return;

    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) { feedback.style.color = '#ff6b6b'; feedback.innerText = 'Digite um CEP com 8 dígitos.'; return; }

    feedback.style.color = '#d4af37';
    feedback.innerText = 'Buscando...';

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) { feedback.style.color = '#ff6b6b'; feedback.innerText = 'CEP não encontrado.'; return; }

        const streetEl = document.getElementById('ck-street');
        const neighborhoodEl = document.getElementById('ck-neighborhood');
        const cityEl = document.getElementById('ck-city');
        const stateEl = document.getElementById('ck-state');

        if (streetEl) streetEl.value = data.logradouro || '';
        if (neighborhoodEl) neighborhoodEl.value = data.bairro || '';
        if (cityEl) cityEl.value = data.localidade || '';
        if (stateEl) stateEl.value = data.uf || '';

        feedback.style.color = '#6bfbce';
        feedback.innerText = EMOJI_PIN + ' ' + data.localidade + ' - ' + data.uf;

        const numberEl = document.getElementById('ck-number');
        if (numberEl) numberEl.focus();
    } catch (err) {
        feedback.style.color = '#ff6b6b';
        feedback.innerText = 'Erro de conexão. Tente novamente.';
    }
}

function validateCheckoutForm() {
    clearCheckoutErrors();

    const fields = [
        { id: 'ck-name', validate: v => v.length >= 3 },
        { id: 'ck-doc', validate: v => v.replace(/\D/g, '').length >= 11 },
        { id: 'ck-cep', validate: v => v.replace(/\D/g, '').length === 8 },
        { id: 'ck-street', validate: v => v.length >= 2 },
        { id: 'ck-number', validate: v => v.length >= 1 },
        { id: 'ck-neighborhood', validate: v => v.length >= 2 },
        { id: 'ck-city', validate: v => v.length >= 2 },
        { id: 'ck-state', validate: v => v.length === 2 }
    ];

    let firstInvalid = null;

    for (const field of fields) {
        const el = document.getElementById(field.id);
        if (!el) continue;
        if (!field.validate(el.value.trim())) {
            el.classList.add('input-error');
            if (!firstInvalid) firstInvalid = el;
        }
    }

    // Validação "soft" do e-mail: só marca se o campo existir, estiver preenchido e for inválido.
    // Se estiver vazio, é permitido (guest pode comprar sem informar e-mail).
    const emailEl = document.getElementById('ck-email');
    if (emailEl) {
        const emailVal = emailEl.value.trim();
        if (emailVal && !validateEmail(emailVal)) {
            emailEl.classList.add('input-error');
            if (!firstInvalid) firstInvalid = emailEl;
        }
    }

    if (firstInvalid) {
        firstInvalid.focus();
        showCheckoutFeedback('Por favor, corrija os campos destacados em vermelho.', 'error');
        return false;
    }
    return true;
}

// ==========================================================================
// Revalidação de estoque ANTES de salvar o pedido
// ==========================================================================
async function revalidateStockBeforeCheckout() {
    const refs = cart.map(item => item.ref);

    const { data, error } = await supabaseClient
        .from('products')
        .select('ref, name, stock, active')
        .in('ref', refs);

    if (error) {
        console.error('Erro ao validar estoque:', error);
        return { ok: false, message: 'Erro ao validar estoque. Tente novamente.' };
    }

    const problems = [];

    for (const item of cart) {
        const product = (data || []).find(p => p.ref === item.ref);

        if (!product) {
            problems.push(`"${item.name}" não está mais disponível.`);
            continue;
        }

        if (!product.active) {
            problems.push(`"${item.name}" está esgotado.`);
            continue;
        }

        if (Number(product.stock) < item.quantity) {
            problems.push(`"${item.name}" só tem ${product.stock} unidade(s) em estoque (você pediu ${item.quantity}).`);
        }
    }

    if (problems.length > 0) {
        return { ok: false, message: problems.join('\n') };
    }

    return { ok: true };
}

// ==========================================================================
// Salvar pedido no Supabase (SEM baixar estoque)
// ==========================================================================
async function saveOrderToDb() {
    const checkoutData = JSON.parse(localStorage.getItem('gemas_checkout_data') || 'null');
    if (!checkoutData || cart.length === 0) return null;

    const { data: { user } } = await supabaseClient.auth.getUser();

    let subtotalPrice = 0;
    const items = cart.map(item => {
        const itemSubtotal = item.price * item.quantity;
        subtotalPrice += itemSubtotal;
        return {
            name: item.name,
            ref: item.ref,
            price: item.price,
            quantity: item.quantity
        };
    });

    const effectiveShipping = getEffectiveShipping(subtotalPrice);

    let finalShipping = effectiveShipping;
    let discountAmount = 0;
    let discountCode = null;

    if (appliedCoupon) {
        discountAmount = Number(appliedCoupon.discount) || 0;
        discountCode = appliedCoupon.code;
        if (appliedCoupon.free_shipping) finalShipping = 0;
    }

    if (finalShipping === null) finalShipping = 0;

    const finalTotal = subtotalPrice + finalShipping - discountAmount;

    // Prepara os campos de frete do Melhor Envio
    let meShippingFields = {
        shipping_method: null,
        shipping_service_id: null,
        shipping_carrier: null,
        shipping_estimated_days: null,
        shipping_quote_data: null
    };

    if (selectedShipping) {
        // Cliente escolheu frete real
        meShippingFields = {
            shipping_method: selectedShipping.name || null,
            shipping_service_id: selectedShipping.id ? String(selectedShipping.id) : null,
            shipping_carrier: selectedShipping.company?.name || null,
            shipping_estimated_days: selectedShipping.delivery_time || null,
            shipping_quote_data: selectedShipping
        };
    } else if (shippingDetails && shippingDetails.method === 'free') {
        // Cliente ganhou frete grátis
        meShippingFields = {
            shipping_method: 'FREE',
            shipping_service_id: null,
            shipping_carrier: 'Grátis',
            shipping_estimated_days: 7,
            shipping_quote_data: null
        };
    }

    const orderPayload = {
        user_id: user?.id || null,
        customer_name: checkoutData.name,
        customer_doc: checkoutData.doc,
        customer_phone: checkoutData.phone,
        customer_email: user?.email || checkoutData.email || null,
        cep: checkoutData.cep,
        street: checkoutData.street,
        number: checkoutData.number,
        complement: checkoutData.complement,
        neighborhood: checkoutData.neighborhood,
        city: checkoutData.city,
        state: checkoutData.state,
        notes: checkoutData.notes,
        items: items,
        subtotal: subtotalPrice,
        shipping_cost: finalShipping,
        ...meShippingFields,
        discount_amount: discountAmount,
        discount_code: discountCode,
        total: finalTotal,
        status: 'novo'
    };

    const { data, error } = await supabaseClient
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();

    if (error) {
        console.error('Erro ao salvar pedido:', error);
        return null;
    }

    // Se tem cupom aplicado, chama RPC pra registrar o uso
    if (appliedCoupon && data) {
        const customerEmail = user?.email || checkoutData.email || null;
        const userId = user?.id || null;

        try {
            const { data: rpcResult, error: rpcError } = await supabaseClient.rpc('apply_coupon_to_order', {
                p_order_id: data.id,
                p_code: appliedCoupon.code,
                p_customer_email: customerEmail,
                p_user_id: userId
            });

            if (rpcError) {
                console.error('Erro ao aplicar cupom no pedido:', rpcError);
            } else if (!rpcResult || !rpcResult.success) {
                console.warn('Cupom não pôde ser aplicado:', rpcResult?.message);
            }
        } catch (e) {
            console.error('Erro inesperado ao aplicar cupom:', e);
        }

        // Limpa cupons notificados (pra futuras notificações)
        try {
            let notifiedIds = JSON.parse(localStorage.getItem('gemas_coupons_notified') || '[]');
            if (appliedCoupon && appliedCoupon.coupon_id) {
                notifiedIds = notifiedIds.filter(id => id !== appliedCoupon.coupon_id);
            }
            localStorage.setItem('gemas_coupons_notified', JSON.stringify(notifiedIds));
        } catch (e) { }

        // Limpa cupom aplicado após uso
        appliedCoupon = null;
        localStorage.removeItem('gemas_applied_coupon');
        renderAppliedCoupon();
    }

    return data;
}

// ==========================================================================
// Submissão do checkout
// ==========================================================================
async function handleCheckoutSubmit(event) {
    event.preventDefault();

    if (!validateCheckoutForm()) return;

    const submitBtn = document.getElementById('checkout-submit');
    const originalText = submitBtn ? submitBtn.innerText : 'Continuar pelo WhatsApp';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Validando estoque...';
    }

    try {
        const stockCheck = await revalidateStockBeforeCheckout();
        if (!stockCheck.ok) {
            showCheckoutFeedback(stockCheck.message, 'error');
            return;
        }

        if (submitBtn) submitBtn.innerText = 'Salvando pedido...';

        await saveCheckoutData();

        const checkoutData = JSON.parse(localStorage.getItem('gemas_checkout_data'));
        if (checkoutData && checkoutData.cep) {
            await fetchShippingForCheckout(checkoutData.cep);
        }

        const order = await saveOrderToDb();

        if (!order) {
            showCheckoutFeedback('Erro ao salvar pedido. Tente novamente.', 'error');
            return;
        }

        // ====== GA4: purchase ======
        trackGA('purchase', {
            transaction_id: order.id,
            currency: 'BRL',
            value: Number(order.total),
            shipping: Number(order.shipping_cost || 0),
            items: (order.items || []).map(i => ({
                item_id: i.ref,
                item_name: i.name,
                price: Number(i.price),
                quantity: Number(i.quantity)
            }))
        });

        // ====== Meta: Purchase ======
        trackMeta('Purchase', {
            content_ids: (order.items || []).map(i => i.ref),
            content_type: 'product',
            contents: (order.items || []).map(i => ({ id: i.ref, quantity: Number(i.quantity), item_price: Number(i.price) })),
            value: Number(order.total),
            currency: 'BRL',
            num_items: (order.items || []).reduce((s, i) => s + Number(i.quantity), 0)
        });

        const itemsSnapshot = [...cart];

        closeCheckoutModal();
        cart = [];
        clearCartStorage();
        updateCartUI();

        sendToWhatsApp(itemsSnapshot);

    } catch (e) {
        console.error('Erro no checkout:', e);
        showCheckoutFeedback('Erro ao finalizar. Tente novamente.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    }
}

async function fetchShippingForCheckout(cepRaw) {
    const cep = cepRaw.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
            shippingDetails = { cep: data.cep, city: data.localidade, uf: data.uf };
            updateCartUI();
        }
    } catch (err) { }
}

function handleDoubtClick() {
    const checkoutData = JSON.parse(localStorage.getItem('gemas_checkout_data') || 'null');
    let message = "Olá! " + EMOJI_WAVE + " Tenho uma dúvida sobre a Use Gemas.";

    if (checkoutData && checkoutData.name) {
        message = `Olá! Meu nome é *${checkoutData.name}*. Tenho uma dúvida sobre a Use Gemas.`;
    }
    if (cart.length > 0) {
        message += "\n\n(Estou com itens no carrinho, mas tenho uma dúvida antes de finalizar.)";
    }

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encoded}`, '_blank');
}

// ==========================================================================
// NOTIFICAÇÕES (sininho)
// ==========================================================================
async function loadNotifications() {
    // Limpa chave legada da abordagem antiga (pontos ganhos virtuais)
    try { localStorage.removeItem('gemas_points_notified'); } catch (e) { }

    const { data: { user } } = await supabaseClient.auth.getUser();

    const bellBtn = document.getElementById('nav-bell-btn');
    if (!user) {
        if (bellBtn) bellBtn.style.display = 'none';
        userNotifications = [];
        return;
    }

    if (bellBtn) bellBtn.style.display = 'flex';

    const { data, error } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Erro ao carregar notificações:', error);
        return;
    }

    const realNotifications = data || [];

    // Notificações virtuais: reviews pendentes + cupons expirando
    const [reviewVirtuals, expiringCoupons] = await Promise.all([
        loadPendingReviewsForBadge(),
        loadExpiringCoupons()
    ]);
    const virtualNotifications = [...reviewVirtuals, ...expiringCoupons];

    // Junta tudo
    userNotifications = [...virtualNotifications, ...realNotifications];

    // Ordena: não-lidas primeiro, depois por data DESC
    userNotifications.sort((a, b) => {
        const aUnread = !a.read_at ? 0 : 1;
        const bUnread = !b.read_at ? 0 : 1;

        if (aUnread !== bUnread) return aUnread - bUnread;

        return new Date(b.created_at) - new Date(a.created_at);
    });

    renderNotifications();
    updateNotificationsBadge();
}

async function loadPendingReviewsForBadge() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return [];

    // Busca pedidos com status 'enviado'/'entregue' que ainda NÃO têm review
    const { data: orders, error } = await supabaseClient
        .from('orders')
        .select('id, items, shipped_at, status')
        .eq('user_id', user.id)
        .in('status', ['enviado', 'entregue']);

    if (error) {
        console.error('Erro ao carregar pedidos para notificação:', error);
        return [];
    }

    if (!orders || orders.length === 0) return [];

    // Pega IDs dos pedidos que já têm review
    const orderIds = orders.map(o => o.id);

    const { data: reviews, error: reviewsError } = await supabaseClient
        .from('reviews')
        .select('order_id, product_ref')
        .in('order_id', orderIds);

    if (reviewsError) {
        console.error('Erro ao carregar reviews para notificação:', reviewsError);
        // Continua — assume que nenhum tem review
    }

    // Set de "orderId:productRef" que já tem review
    const reviewedSet = new Set(
        (reviews || []).map(r => `${r.order_id}:${r.product_ref}`)
    );

    // Monta virtuais: cada item sem review = 1 virtual
    const virtuals = [];
    orders.forEach(order => {
        (order.items || []).forEach(item => {
            if (!reviewedSet.has(`${order.id}:${item.ref}`)) {
                virtuals.push({
                    id: `virtual:review:${order.id}:${item.ref}`,
                    is_virtual: true,
                    type: 'review_pending',
                    title: 'Avalie sua compra ' + String.fromCodePoint(0x2B50),
                    message: `Conte como foi sua experiência com ${item.name}`,
                    link: `minha-conta.html?review=${order.id}`,
                    metadata: { order_id: order.id, product_ref: item.ref },
                    read_at: null,
                    created_at: order.shipped_at || new Date().toISOString()
                });
            }
        });
    });

    return virtuals;
}

async function loadExpiringCoupons() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    const checkoutData = JSON.parse(localStorage.getItem('gemas_checkout_data') || 'null');
    const customerEmail = user?.email || checkoutData?.email || null;

    if (!customerEmail) return [];

    const now = new Date();
    const in5Days = new Date();
    in5Days.setDate(in5Days.getDate() + 5);

    // Busca cupons que:
    // - Estão ativos
    // - Vão expirar entre agora e 5 dias
    // - São do cliente (individual) OU públicos
    const { data: coupons, error } = await supabaseClient
        .from('coupons')
        .select('id, code, description, discount_type, discount_value, free_shipping, expires_at, customer_email, min_purchase')
        .eq('active', true)
        .not('expires_at', 'is', null)
        .gt('expires_at', now.toISOString())
        .lte('expires_at', in5Days.toISOString())
        .or(`customer_email.is.null,customer_email.eq.${customerEmail}`);

    if (error) {
        console.error('Erro ao carregar cupons expirando:', error);
        return [];
    }

    if (!coupons || coupons.length === 0) return [];

    // Verifica quais já foram notificados (localStorage)
    let notifiedIds = [];
    try {
        notifiedIds = JSON.parse(localStorage.getItem('gemas_coupons_notified') || '[]');
    } catch (e) { notifiedIds = []; }

    // Filtra só os que ainda não foram notificados
    const notYetNotified = coupons.filter(c => !notifiedIds.includes(c.id));

    // Marca como notificados
    const newNotifiedIds = [...new Set([...notifiedIds, ...notYetNotified.map(c => c.id)])];
    try {
        localStorage.setItem('gemas_coupons_notified', JSON.stringify(newNotifiedIds));
    } catch (e) { }

    // Cria notificações virtuais
    return notYetNotified.map(coupon => {
        const expiresAt = new Date(coupon.expires_at);
        const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

        let discountLabel;
        if (coupon.free_shipping && Number(coupon.discount_value) === 0) {
            discountLabel = 'frete grátis';
        } else if (coupon.discount_type === 'percentage') {
            discountLabel = `${coupon.discount_value}% de desconto`;
        } else {
            discountLabel = `R$ ${Number(coupon.discount_value).toFixed(2).replace('.', ',')} de desconto`;
        }

        const daysText = daysLeft === 1 ? '1 dia' : `${daysLeft} dias`;

        return {
            id: `virtual:coupon_expiring:${coupon.id}`,
            is_virtual: true,
            type: 'coupon_expiring',
            title: `Cupom ${coupon.code} expira em ${daysText}`,
            message: `Aproveite ${discountLabel} antes que acabe!`,
            link: `index.html#colecao`,
            metadata: {
                coupon_id: coupon.id,
                code: coupon.code,
                expires_at: coupon.expires_at
            },
            read_at: null,
            created_at: new Date().toISOString()
        };
    });
}

function renderNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    if (userNotifications.length === 0) {
        container.innerHTML = `
            <div class="notifications-empty">
                <span class="icon">${String.fromCodePoint(0x1F514)}</span>
                <p>Nenhuma notificação por aqui</p>
                <small>Quando houver novidades, você será avisada.</small>
            </div>
        `;
        return;
    }

    const typeIcons = {
        order_paid: String.fromCodePoint(0x1F4B3),
        order_shipped: String.fromCodePoint(0x1F69A),
        review_approved: String.fromCodePoint(0x2B50),
        review_rejected: String.fromCodePoint(0x1F49B),
        review_pending: String.fromCodePoint(0x2B50),
        coupon_expiring: String.fromCodePoint(0x1F39F, 0xFE0F),
        points_earned: String.fromCodePoint(0x1F48E),
        coupon: String.fromCodePoint(0x1F381),
        welcome: String.fromCodePoint(0x2728),
        custom: String.fromCodePoint(0x1F514)
    };

    container.innerHTML = userNotifications.map(n => {
        const isUnread = !n.read_at;
        const icon = typeIcons[n.type] || String.fromCodePoint(0x1F514);
        const timeAgo = formatTimeAgo(n.created_at);

        return `
            <div class="notification-item ${isUnread ? 'unread' : 'read'} ${n.is_virtual ? 'virtual' : ''}"
                 data-id="${n.id}"
                 onclick="handleNotificationClick('${n.id}')">
                <div class="notification-icon">${icon}</div>
                <div class="notification-content">
                    <div class="notification-title">${escapeHTML(n.title)}</div>
                    <div class="notification-message">${escapeHTML(n.message)}</div>
                    <div class="notification-time">${timeAgo}</div>
                    ${n.is_virtual ? '<div class="notification-virtual-hint">Ação pendente</div>' : ''}
                </div>
                ${isUnread ? '<div class="notification-dot"></div>' : ''}
            </div>
        `;
    }).join('');
}

function formatTimeAgo(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin}min atrás`;
    if (diffH < 24) return `${diffH}h atrás`;
    if (diffD < 7) return `${diffD}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function updateNotificationsBadge() {
    const unreadCount = userNotifications.filter(n => !n.read_at).length;
    const badge = document.getElementById('nav-bell-badge');
    const markAllBtn = document.getElementById('btn-mark-all-read');

    if (badge) {
        if (unreadCount > 0) {
            badge.innerText = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    if (markAllBtn) {
        markAllBtn.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    }
}

function toggleNotificationsDrawer() {
    const drawer = document.getElementById('notifications-drawer');
    const cartDrawer = document.getElementById('cart-drawer');
    const wishlistDrawer = document.getElementById('wishlist-drawer');

    if (!drawer) return;

    const willOpen = !drawer.classList.contains('open');
    drawer.classList.toggle('open');

    if (willOpen) {
        if (cartDrawer) cartDrawer.classList.remove('open');
        if (wishlistDrawer) wishlistDrawer.classList.remove('open');
    }
}

async function handleNotificationClick(id) {
    const notification = userNotifications.find(n => n.id === id);
    if (!notification) return;

    // Se for VIRTUAL: não tenta marcar como lida (não existe no banco)
    // Só navega pro link
    if (notification.is_virtual) {
        toggleNotificationsDrawer();
        setTimeout(() => {
            if (notification.link) {
                window.location.href = notification.link;
            }
        }, 200);
        return;
    }

    if (!notification.read_at) {
        const { error } = await supabaseClient
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id);

        if (!error) {
            notification.read_at = new Date().toISOString();
            renderNotifications();
            updateNotificationsBadge();
        }
    }

    if (notification.link) {
        toggleNotificationsDrawer();
        setTimeout(() => {
            window.location.href = notification.link;
        }, 200);
    }
}

async function markAllNotificationsAsRead() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const unreadIds = userNotifications
        .filter(n => !n.read_at && !n.is_virtual)
        .map(n => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabaseClient
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

    if (error) {
        console.error('Erro ao marcar como lidas:', error);
        return;
    }

    const now = new Date().toISOString();
    userNotifications.forEach(n => {
        if (unreadIds.includes(n.id)) n.read_at = now;
    });

    renderNotifications();
    updateNotificationsBadge();
}

// ==========================================================================
// Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadSiteSettings();
    applyHeroSettings();
    applyCarouselSettings();
    applyFooterSettings();
    applyMetaSettings();
    loadAndApplyTheme();
    applyNavLinks();

    // Recalcula subtotal atual e atualiza banner de frete grátis
    const subtotalAtual = (typeof cart !== 'undefined' && Array.isArray(cart))
        ? cart.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0)
        : 0;
    updateFreeShippingBanner(subtotalAtual);

    // Fase 10.3 — garante que o banner apareça mesmo se o carrinho foi restaurado
    // do localStorage antes do loadSiteSettings resolver
    setTimeout(() => {
        const subtotal = (typeof cart !== 'undefined' && Array.isArray(cart))
            ? cart.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0)
            : 0;
        updateFreeShippingBanner(subtotal);
    }, 500);

    renderBanner();
    updateDynamicLinks();

    initCookieConsent();

    await loadReviewsSummary();

    loadHomeReviews();

    await loadProductsFromDb();

    processPendingReorder();

    setupRegisterLiveValidation();
    setupCheckoutMasks();

    await updateUserSessionUI();
    await loadFavorites();
    await loadCheckoutData();

    // Carrega cupom antes do carrinho (pra ambos serem restaurados juntos)
    loadAppliedCoupon();

    // Restaura carrinho do storage (com revalidação)
    await restoreCartFromStorage();
    cartRestored = true;

    updateFavoritesUI();
    updateCartUI();
    updateCouponsSeeAllBtn();
    initShipping();

    // Verifica se deve abrir o carrinho automaticamente (?open_cart=1)
    const openCartParams = new URLSearchParams(window.location.search);
    if (openCartParams.get('open_cart') === '1') {
        // Limpa o parâmetro da URL (pra não reabrir em F5)
        window.history.replaceState({}, document.title, window.location.pathname);

        // Só abre se o carrinho tiver itens
        if (cart.length > 0) {
            setTimeout(() => {
                const cartDrawer = document.getElementById('cart-drawer');
                const wishlistDrawer = document.getElementById('wishlist-drawer');
                const notificationsDrawer = document.getElementById('notifications-drawer');

                if (cartDrawer && !cartDrawer.classList.contains('open')) {
                    cartDrawer.classList.add('open');
                    // Fecha os outros drawers (padrão)
                    if (wishlistDrawer) wishlistDrawer.classList.remove('open');
                    if (notificationsDrawer) notificationsDrawer.classList.remove('open');
                    trackViewCart(); // dispara GA4
                }
            }, 500);
        }
    }

    // Fecha o modal de cupons com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('coupons-modal');
            if (modal && modal.classList.contains('open')) {
                closeCouponsModal();
            }
        }
    });

    // Fecha o modal de cupons clicando fora
    const couponsModal = document.getElementById('coupons-modal');
    if (couponsModal) {
        couponsModal.addEventListener('click', (e) => {
            if (e.target === couponsModal) closeCouponsModal();
        });
    }

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);

    const checkoutOverlay = document.getElementById('checkout-modal');
    if (checkoutOverlay) {
        checkoutOverlay.addEventListener('click', (e) => {
            if (e.target === checkoutOverlay) closeCheckoutModal();
        });
    }

    const formLogin = document.getElementById('form-login');
    if (formLogin) formLogin.addEventListener('submit', handleLogin);

    const formRegister = document.getElementById('form-register');
    if (formRegister) formRegister.addEventListener('submit', handleRegister);

    const modalOverlay = document.getElementById('product-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeProductModal();
        });
    }

    const authOverlay = document.getElementById('auth-modal');
    if (authOverlay) {
        authOverlay.addEventListener('click', (e) => {
            if (e.target === authOverlay) closeAuthModal();
        });
    }

    const cepInput = document.getElementById('cep-input');
    if (cepInput) {
        cepInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); calculateShipping(); }
        });
    }

    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(14, 14, 16, 0.95)';
                navbar.style.padding = '0.9rem 0';
            } else {
                navbar.style.background = 'rgba(14, 14, 16, 0.85)';
                navbar.style.padding = '1.2rem 0';
            }
        });
    }

    const carouselContainer = document.getElementById('infoCarousel');
    if (carouselContainer) {
        showSlide(0);
        startAutoSlide();
        carouselContainer.addEventListener('mouseenter', stopAutoSlide);
        carouselContainer.addEventListener('mouseleave', startAutoSlide);
    }

    // ====== Botão flutuante "Voltar ao topo" ======
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let backToTopTicking = false;

        const updateBackToTop = () => {
            backToTopBtn.classList.toggle('visible', window.scrollY > 400);
            backToTopTicking = false;
        };

        window.addEventListener('scroll', () => {
            if (!backToTopTicking) {
                backToTopTicking = true;
                window.requestAnimationFrame(updateBackToTop);
            }
        }, { passive: true });

        backToTopBtn.addEventListener('click', () => {
            const supportsSmooth = 'scrollBehavior' in document.documentElement.style;
            if (prefersReducedMotion || !supportsSmooth) {
                window.scrollTo(0, 0);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        updateBackToTop();
    }

    // Verifica se deve abrir modal de login automaticamente (?login=1)
    const loginUrlParams = new URLSearchParams(window.location.search);
    if (loginUrlParams.get('login') === '1') {
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
            openAuthModal('login');
        }, 300);
    }
});

// ==========================================================================
// PWA — Banner custom de instalação
// ==========================================================================
const PWA_BANNER_KEY = 'gemas_pwa_banner_dismissed_at';
const PWA_BANNER_DELAY = 30000; // 30 segundos
const PWA_DISMISS_DAYS = 30;    // 30 dias

let deferredPwaPrompt = null;
let pwaBannerTimer = null;

/**
 * Verifica se pode mostrar o banner:
 * - Não tá em modo standalone (já instalado)
 * - Não dispensou recentemente (30 dias)
 * - Existe beforeinstallprompt disponível (navegador suporta)
 */
function canShowPwaBanner() {
    // Já instalado?
    const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;

    if (isStandalone) return false;

    // Dispensou recentemente?
    try {
        const dismissedAt = localStorage.getItem(PWA_BANNER_KEY);
        if (dismissedAt) {
            const daysDiff = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
            if (daysDiff < PWA_DISMISS_DAYS) return false;
        }
    } catch (e) { }

    // Tem prompt disponível?
    if (!deferredPwaPrompt) return false;

    return true;
}

function showPwaBanner() {
    if (!canShowPwaBanner()) return;

    const banner = document.getElementById('pwa-install-banner');
    if (!banner) return;

    banner.classList.add('visible');
}

function hidePwaBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.classList.remove('visible');

    if (pwaBannerTimer) {
        clearTimeout(pwaBannerTimer);
        pwaBannerTimer = null;
    }
}

// Captura o evento beforeinstallprompt (Android Chrome)
window.addEventListener('beforeinstallprompt', (e) => {
    // Previne o banner automático do Chrome
    e.preventDefault();

    // Guarda o evento pra disparar depois
    deferredPwaPrompt = e;

    // Agenda o banner custom (após 30s)
    if (pwaBannerTimer) clearTimeout(pwaBannerTimer);
    pwaBannerTimer = setTimeout(() => {
        showPwaBanner();
    }, PWA_BANNER_DELAY);
});

// Detecta se foi instalado
window.addEventListener('appinstalled', () => {
    console.log('[PWA] App instalado com sucesso!');
    hidePwaBanner();
    try {
        localStorage.setItem(PWA_BANNER_KEY, Date.now().toString());
    } catch (e) { }
});

async function handlePwaInstall() {
    if (!deferredPwaPrompt) {
        hidePwaBanner();
        return;
    }

    try {
        // Dispara o prompt nativo do Chrome
        deferredPwaPrompt.prompt();

        // Aguarda a resposta do usuário
        const { outcome } = await deferredPwaPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('[PWA] Usuário aceitou instalar');
        } else {
            console.log('[PWA] Usuário rejeitou instalar');
            // Marca como dispensado por 30 dias
            try {
                localStorage.setItem(PWA_BANNER_KEY, Date.now().toString());
            } catch (e) { }
        }
    } catch (e) {
        console.warn('[PWA] Erro no prompt:', e);
    }

    // Limpa o prompt (só pode ser usado uma vez)
    deferredPwaPrompt = null;
    hidePwaBanner();
}

function handlePwaSkip() {
    hidePwaBanner();

    // Marca como dispensado por 30 dias
    try {
        localStorage.setItem(PWA_BANNER_KEY, Date.now().toString());
    } catch (e) { }
}