// ==========================================================================
// Estado Global
// ==========================================================================
let cart = [];
let shippingCost = 0;
let shippingDetails = null;

let currentGallery = [];
let currentMediaIndex = 0;

let photoSwipeLightbox = null;

const whatsappNumber = "5511982053330";

let currentSlide = 0;
let autoSlideInterval = null;

let productsFromDb = [];
let favorites = [];
let currentTestimonialStars = 0;

// ==========================================================================
// Supabase
// ==========================================================================
const SUPABASE_URL = 'https://dytdnemwqbzgrekamwla.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5dGRuZW13cWJ6Z3Jla2Ftd2xhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3ODExMTEsImV4cCI6MjEwNTM1NzExMX0.6Zb3JK1CrpSrPqtigu9ZyEm_rWLKATOiQvPRQZmCU24';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

const WEB3FORMS_KEY = '69a758b3-d87b-4ea5-a666-424321663f86';

// ==========================================================================
// Utilidades
// ==========================================================================
function formatCurrency(value) {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escapeHTML(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ==========================================================================
// PRODUTOS — Carregar do Supabase
// ==========================================================================
async function loadProductsFromDb() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('active', true)
            .gt('stock', 0)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Erro ao carregar produtos:', error);
            grid.innerHTML = '<div class="empty-state"><p>Erro ao carregar produtos.</p></div>';
            return;
        }

        productsFromDb = data || [];
        renderProductsGrid();

    } catch (e) {
        console.error('Erro inesperado:', e);
        grid.innerHTML = '<div class="empty-state"><p>Erro de conexão.</p></div>';
    }
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

        const mediaHTML = isVideo
            ? `<video src="${escapeHTML(firstMedia)}" autoplay muted loop playsinline preload="metadata" aria-hidden="true"></video>`
            : (firstMedia
                ? `<img src="${escapeHTML(firstMedia)}" alt="${escapeHTML(p.name)}" />`
                : `<div style="width:100%;height:100%;background:#222;display:flex;align-items:center;justify-content:center;color:#666;font-size:0.8rem;">Sem mídia</div>`);

        const galleryAttr = escapeHTML(p.gallery || '');
        const nameEscaped = escapeHTML(p.name).replace(/'/g, "\\'");

        return `
            <div class="product-card" data-category="${escapeHTML(p.category)}"
                 data-name="${escapeHTML(p.name)}"
                 data-ref="${escapeHTML(p.ref)}"
                 data-price="${Number(p.price).toFixed(2)}"
                 data-gem="${escapeHTML(p.gem || '')}"
                 data-desc="${escapeHTML(p.description || '')}"
                 data-materials="${escapeHTML(p.materials || '')}"
                 data-gallery="${galleryAttr}">

                <div class="product-img" onclick="openProductModalFromCard(this.parentElement)">
                    ${mediaHTML}
                    <button type="button" class="btn-favorite"
                        onclick="toggleFavorite(event, '${nameEscaped}', '${escapeHTML(p.ref)}', ${Number(p.price)})"
                        aria-label="Adicionar ${escapeHTML(p.name)} aos favoritos">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="product-info">
                    <h3 onclick="openProductModalFromCard(this.parentElement.parentElement)" style="cursor: pointer;">${escapeHTML(p.name)}</h3>
                    <p class="gem-type">${escapeHTML(p.gem || '')}</p>
                    <span class="price">${formatCurrency(p.price)}</span>
                    <button class="btn-add-cart"
                        onclick="addToCart('${nameEscaped}', '${escapeHTML(p.ref)}', ${Number(p.price)})">
                        Adicionar ao Carrinho
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (typeof updateFavoritesUI === 'function') updateFavoritesUI();
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

    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
}

function moveSlide(step) { showSlide(currentSlide + step); resetAutoSlide(); }
function goToSlide(index) { showSlide(index); resetAutoSlide(); }

function startAutoSlide() {
    stopAutoSlide();
    autoSlideInterval = setInterval(() => showSlide(currentSlide + 1), 6000);
}

function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
}

function resetAutoSlide() { stopAutoSlide(); startAutoSlide(); }

// ==========================================================================
// Carrinho — Drawer
// ==========================================================================
function toggleCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    if (cartDrawer) {
        const willOpen = !cartDrawer.classList.contains('open');
        cartDrawer.classList.toggle('open');
        if (willOpen && wishlistDrawer) wishlistDrawer.classList.remove('open');
    }
}

function openCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    if (cartDrawer && !cartDrawer.classList.contains('open')) {
        cartDrawer.classList.add('open');
        if (wishlistDrawer) wishlistDrawer.classList.remove('open');
    }
}

// ==========================================================================
// Auth
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
    const el = document.getElementById('auth-feedback');
    if (el) {
        el.className = `auth-feedback ${type}`;
        el.innerText = message;
    }
}

function clearAuthFeedback() {
    const el = document.getElementById('auth-feedback');
    if (el) {
        el.className = 'auth-feedback';
        el.innerText = '';
    }
}

function handleForgotPassword(event) {
    event.preventDefault();
    const emailInput = document.getElementById('login-email');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email || !validateEmail(email)) {
        showAuthFeedback('Informe seu e-mail de cadastro no campo para redefinir a senha.', 'error');
        if (emailInput) emailInput.focus();
        return;
    }

    showAuthFeedback(`Instruções de redefinição enviadas para ${email}.`, 'success');
}

function setFieldStatus(inputEl, isValid, message = '') {
    if (!inputEl) return;

    let msgEl = inputEl.parentNode.querySelector('.field-msg');
    if (!msgEl) {
        msgEl = document.createElement('small');
        msgEl.className = 'field-msg';
        msgEl.style.fontSize = '0.75rem';
        msgEl.style.marginTop = '4px';
        msgEl.style.display = 'block';
        inputEl.parentNode.appendChild(msgEl);
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

    const { error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: { data: { name: name } }
    });

    if (btn) { btn.disabled = false; btn.innerText = originalText; }

    if (error) {
        showAuthFeedback(error.message.includes('already') ? 'Este e-mail já está cadastrado.' : 'Erro ao cadastrar. Tente novamente.', 'error');
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

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (btn) { btn.disabled = false; btn.innerText = originalText; }

    if (error) {
        showAuthFeedback('E-mail ou senha incorretos.', 'error');
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

        userBtn.innerHTML = `
            <span style="font-size: 0.85rem; color: #d4af37; margin-right: 0.4rem; font-weight: 500;">Olá, ${firstName}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="cursor: pointer;" title="Sair"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        `;
        userBtn.onclick = handleLogout;
        userBtn.title = "Sair da conta";
    } else {
        userBtn.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        `;
        userBtn.onclick = () => openAuthModal('login');
        userBtn.title = "Entrar / Cadastrar";
    }
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
        console.warn('Erro ao migrar favoritos:', e);
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

    const gallery = galleryRaw ? galleryRaw.split(',').map(item => item.trim()) : [];

    openProductModal(name, ref, price, gem, desc, materials, gallery);
}

function openProductModal(name, ref, price, gemType, description, materials, gallery) {
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
        addBtn.onclick = () => {
            addToCart(name, ref, price);
            closeProductModal();
        };
    }

    modal.classList.add('open');
}

function renderModalMedia() {
    const wrapper = document.getElementById('modal-media-wrapper');
    const dotsContainer = document.getElementById('gallery-dots');
    const prevBtn = document.querySelector('#product-modal .modal-nav.prev-btn');
    const nextBtn = document.querySelector('#product-modal .modal-nav.next-btn');

    if (!wrapper) return;

    const fallbackHTML = `<div style="color:#666;text-align:center;padding:2rem;font-size:0.9rem;width:100%;">Mídia indisponível</div>`;

    if (currentGallery.length === 0) {
        wrapper.innerHTML = fallbackHTML;
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
            <video src="${currentSrc}" autoplay muted loop playsinline preload="metadata" 
                   onerror="this.parentElement.innerHTML='${fallbackHTML.replace(/'/g, "\\'")}'"></video>
            ${zoomHintHTML}
        `;
    } else {
        wrapper.innerHTML = `
            <img src="${currentSrc}" alt="Detalhe do Produto" 
                 onerror="this.parentElement.innerHTML='${fallbackHTML.replace(/'/g, "\\'")}'" />
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

// ==========================================================================
// Filtro de categoria
// ==========================================================================
function filterProducts(category, element) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');

    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        const productCategory = product.getAttribute('data-category');
        if (category === 'all' || productCategory === category) {
            product.classList.remove('hide');
        } else {
            product.classList.add('hide');
        }
    });
}

// ==========================================================================
// Carrinho — Operações
// ==========================================================================
function addToCart(name, ref, price) {
    const existingItem = cart.find(item => item.ref === ref);
    if (existingItem) existingItem.quantity += 1;
    else cart.push({ name, ref, price, quantity: 1 });
    updateCartUI();
    openCart();
}

function updateQuantity(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) cart.splice(index, 1);
    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// ==========================================================================
// Frete
// ==========================================================================
async function calculateShipping() {
    const cepInput = document.getElementById('cep-input');
    const shippingResult = document.getElementById('shipping-result');
    if (!cepInput || !shippingResult) return;

    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) {
        shippingResult.innerHTML = `<span style="color: #ff6b6b;">Digite um CEP com 8 dígitos.</span>`;
        return;
    }

    shippingResult.innerHTML = `<span style="color: #d4af37;">Buscando localidade...</span>`;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            shippingResult.innerHTML = `<span style="color: #ff6b6b;">CEP não encontrado.</span>`;
            shippingCost = 0;
            shippingDetails = null;
        } else {
            const estimatedFreight = 20.00;
            shippingCost = estimatedFreight;
            shippingDetails = { cep: data.cep, city: data.localidade, uf: data.uf };

            shippingResult.innerHTML = `
                <div style="color: #6bfbce; font-weight: 500;">${EMOJI_PIN} ${data.localidade} - ${data.uf}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.3rem;">
                    <span style="color: #aaa;">Entrega Estimada:</span>
                    <strong style="color: #d4af37;">${formatCurrency(estimatedFreight)}</strong>
                </div>
            `;
        }
    } catch (error) {
        shippingResult.innerHTML = `<span style="color: #ff6b6b;">Erro de conexão. Tente novamente.</span>`;
        shippingCost = 0;
        shippingDetails = null;
    }

    updateCartUI();
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
        shippingCost = 0;
        shippingDetails = null;
        const shippingResult = document.getElementById('shipping-result');
        const cepInput = document.getElementById('cep-input');
        if (shippingResult) shippingResult.innerHTML = '';
        if (cepInput) cepInput.value = '';
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

    const finalTotal = subtotalPrice + shippingCost;

    if (cartCount) cartCount.innerText = totalItems;
    if (cartSubtotalElement) cartSubtotalElement.innerText = formatCurrency(subtotalPrice);
    if (cartShippingElement) cartShippingElement.innerText = shippingCost > 0 ? formatCurrency(shippingCost) : 'A calcular';
    if (cartTotalElement) cartTotalElement.innerText = formatCurrency(finalTotal);
}

// ==========================================================================
// WhatsApp
// ==========================================================================
function sendToWhatsApp() {
    const checkoutData = JSON.parse(localStorage.getItem('gemas_checkout_data') || 'null');

    let subtotalPrice = 0;
    let message = "";

    message += EMOJI_BAG + " *NOVO PEDIDO — USE GEMAS*\n";
    message += "━━━━━━━━━━━━━━━━━━\n";

    if (checkoutData && checkoutData.name) {
        message += EMOJI_USER + ` *Cliente:* ${checkoutData.name}\n`;
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
    cart.forEach((item) => {
        const itemSubtotal = item.price * item.quantity;
        subtotalPrice += itemSubtotal;
        message += `• ${item.quantity}x ${item.name} (REF: ${item.ref}) — ${formatCurrency(itemSubtotal)}\n`;
    });

    message += "━━━━━━━━━━━━━━━━━━\n";
    message += EMOJI_MONEY + ` *Subtotal:* ${formatCurrency(subtotalPrice)}\n`;

    if (shippingDetails) {
        message += EMOJI_TRUCK + ` *Frete:* ${formatCurrency(shippingCost)}\n`;
        message += EMOJI_CHECK + ` *TOTAL:* ${formatCurrency(subtotalPrice + shippingCost)}\n`;
    } else {
        message += EMOJI_TRUCK + ` *Frete:* Pendente (calcular por CEP)\n`;
        message += EMOJI_MONEY + ` *Total parcial:* ${formatCurrency(subtotalPrice)}\n`;
    }

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

    if (index >= 0) favorites.splice(index, 1);
    else favorites.push({ name, ref, price });

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

    addToCart(item.name, item.ref, item.price);
    favorites.splice(index, 1);
    await saveFavorites();
    updateFavoritesUI();
}

function toggleWishlist() {
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    const cartDrawer = document.getElementById('cart-drawer');
    if (wishlistDrawer) {
        const willOpen = !wishlistDrawer.classList.contains('open');
        wishlistDrawer.classList.toggle('open');
        if (willOpen && cartDrawer) cartDrawer.classList.remove('open');
    }
}

function closeWishlist() {
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    if (wishlistDrawer) wishlistDrawer.classList.remove('open');
}

async function addAllFavoritesToCart() {
    if (favorites.length === 0) {
        alert('Sua lista de favoritos está vazia.');
        return;
    }

    const itemsToAdd = [...favorites];
    itemsToAdd.forEach(item => addToCart(item.name, item.ref, item.price));

    favorites = [];
    await saveFavorites();
    updateFavoritesUI();
    closeWishlist();
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
// Depoimentos
// ==========================================================================
function toggleTestimonialForm() {
    const wrapper = document.getElementById('testimonial-form-wrapper');
    if (!wrapper) return;

    if (wrapper.classList.contains('open')) {
        wrapper.classList.remove('open');
        resetTestimonialForm();
    } else {
        wrapper.classList.add('open');
        setTimeout(() => {
            const nameInput = document.getElementById('t-name');
            if (nameInput) nameInput.focus();
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 120);
    }
}

function setupStarRating() {
    const starRating = document.getElementById('star-rating');
    const starsInput = document.getElementById('t-stars');
    if (!starRating) return;

    const stars = starRating.querySelectorAll('.star');

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.getAttribute('data-value'), 10);
            currentTestimonialStars = value;
            if (starsInput) starsInput.value = value;
            updateStarsUI(value);
        });

        star.addEventListener('mouseenter', () => {
            const value = parseInt(star.getAttribute('data-value'), 10);
            highlightStars(value);
        });
    });

    starRating.addEventListener('mouseleave', () => updateStarsUI(currentTestimonialStars));
}

function updateStarsUI(value) {
    document.querySelectorAll('#star-rating .star').forEach((star, index) => {
        star.classList.toggle('active', index < value);
        star.classList.remove('hovered');
    });
}

function highlightStars(value) {
    document.querySelectorAll('#star-rating .star').forEach((star, index) => {
        star.classList.toggle('hovered', index < value);
        star.classList.remove('active');
    });
}

function showTestimonialFeedback(message, type = 'error') {
    const el = document.getElementById('testimonial-feedback');
    if (!el) return;
    el.className = `testimonial-feedback ${type}`;
    el.innerText = message;
}

function clearTestimonialFeedback() {
    const el = document.getElementById('testimonial-feedback');
    if (!el) return;
    el.className = 'testimonial-feedback';
    el.innerText = '';
}

function resetTestimonialForm() {
    const form = document.getElementById('testimonial-form');
    if (form) form.reset();
    currentTestimonialStars = 0;
    updateStarsUI(0);
    clearTestimonialFeedback();
    const starsInput = document.getElementById('t-stars');
    if (starsInput) starsInput.value = '';
}

async function handleTestimonialSubmit(event) {
    event.preventDefault();
    clearTestimonialFeedback();

    const form = event.target;
    const nameInput = form.querySelector('#t-name');
    const commentInput = form.querySelector('#t-comment');
    const starsInput = form.querySelector('#t-stars');
    const submitBtn = form.querySelector('#testimonial-submit');

    const name = nameInput ? nameInput.value.trim() : '';
    const comment = commentInput ? commentInput.value.trim() : '';
    const stars = starsInput ? starsInput.value : '';

    if (!name || name.length < 2) { showTestimonialFeedback('Por favor, informe seu nome.', 'error'); if (nameInput) nameInput.focus(); return; }
    if (!stars || parseInt(stars, 10) < 1) { showTestimonialFeedback('Por favor, escolha uma avaliação de 1 a 5 estrelas.', 'error'); return; }
    if (!comment || comment.length < 10) { showTestimonialFeedback('Conte um pouco mais sobre sua experiência (mínimo 10 caracteres).', 'error'); if (commentInput) commentInput.focus(); return; }

    const originalText = submitBtn ? submitBtn.innerText : 'Enviar';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = 'Enviando...'; }

    try {
        const formData = new FormData(form);
        formData.set('stars', `${stars} de 5`);

        const response = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.success) {
            showTestimonialFeedback(EMOJI_SPARKLE + ' Depoimento enviado com sucesso! Obrigado por compartilhar.', 'success');
            form.reset();
            currentTestimonialStars = 0;
            updateStarsUI(0);

            setTimeout(() => {
                const wrapper = document.getElementById('testimonial-form-wrapper');
                if (wrapper) wrapper.classList.remove('open');
                clearTestimonialFeedback();
            }, 3500);
        } else {
            showTestimonialFeedback('Não foi possível enviar. Tente novamente em instantes.', 'error');
        }
    } catch (err) {
        console.error('Erro no envio do depoimento:', err);
        showTestimonialFeedback('Erro de conexão. Tente novamente em instantes.', 'error');
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = originalText; }
    }
}

// ==========================================================================
// Checkout
// ==========================================================================
function openCheckoutModal() {
    if (cart.length === 0) { alert('Seu carrinho está vazio.'); return; }

    const cartDrawer = document.getElementById('cart-drawer');
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    if (cartDrawer) cartDrawer.classList.remove('open');
    if (wishlistDrawer) wishlistDrawer.classList.remove('open');

    loadCheckoutData();

    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.add('open');
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

    if (!saved) return;

    const fields = ['name', 'doc', 'phone', 'cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'notes'];
    fields.forEach(field => {
        const el = document.getElementById('ck-' + field);
        if (el && saved[field]) el.value = saved[field];
    });
}

async function saveCheckoutData() {
    const fields = ['name', 'doc', 'phone', 'cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state', 'notes'];
    const data = {};
    fields.forEach(field => {
        const el = document.getElementById('ck-' + field);
        if (el) data[field] = el.value.trim();
    });

    localStorage.setItem('gemas_checkout_data', JSON.stringify(data));

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        await supabaseClient.from('checkout_data').upsert({
            user_id: user.id,
            ...data,
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
    if (el) { el.className = `checkout-feedback ${type}`; el.innerText = message; }
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

    if (firstInvalid) {
        firstInvalid.focus();
        showCheckoutFeedback('Por favor, corrija os campos destacados em vermelho.', 'error');
        return false;
    }
    return true;
}

async function fetchShippingForCheckout(cepRaw) {
    const cep = cepRaw.replace(/\D/g, '');
    if (cep.length !== 8) return;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
            shippingCost = 20.00;
            shippingDetails = { cep: data.cep, city: data.localidade, uf: data.uf };
            updateCartUI();
        }
    } catch (err) { }
}

// ==========================================================================
// Pedido — Salvar no Supabase
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

    const orderPayload = {
        user_id: user?.id || null,
        customer_name: checkoutData.name,
        customer_doc: checkoutData.doc,
        customer_phone: checkoutData.phone,
        customer_email: user?.email || null,
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
        shipping_cost: shippingCost || 0,
        total: subtotalPrice + (shippingCost || 0),
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

    // Decrementa estoque de cada item
    for (const item of items) {
        try {
            await supabaseClient.rpc('decrease_product_stock', {
                p_ref: item.ref,
                p_qty: item.quantity
            });
        } catch (e) {
            console.warn('Erro ao diminuir estoque de', item.ref, e);
        }
    }

    return data;
}

async function handleCheckoutSubmit(event) {
    event.preventDefault();

    if (!validateCheckoutForm()) return;

    const submitBtn = document.getElementById('checkout-submit');
    const originalText = submitBtn ? submitBtn.innerText : 'Continuar pelo WhatsApp';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Salvando pedido...';
    }

    try {
        await saveCheckoutData();

        const checkoutData = JSON.parse(localStorage.getItem('gemas_checkout_data'));
        if (checkoutData && checkoutData.cep) {
            await fetchShippingForCheckout(checkoutData.cep);
        }

        // 1) Salva pedido no banco
        const order = await saveOrderToDb();

        // 2) Fecha o modal
        closeCheckoutModal();

        // 3) Abre WhatsApp com o carrinho ainda cheio (pra montar a mensagem)
        sendToWhatsApp();

        // 4) Só agora limpa o carrinho
        if (order) {
            cart = [];
            updateCartUI();
        }

    } catch (e) {
        console.error('Erro no checkout:', e);
        alert('Erro ao finalizar. Tente novamente.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    }
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
// Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadProductsFromDb();

    setupRegisterLiveValidation();
    setupStarRating();
    setupCheckoutMasks();

    await updateUserSessionUI();
    await loadFavorites();
    await loadCheckoutData();
    updateFavoritesUI();
    updateCartUI();

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);

    const checkoutOverlay = document.getElementById('checkout-modal');
    if (checkoutOverlay) {
        checkoutOverlay.addEventListener('click', (e) => {
            if (e.target === checkoutOverlay) closeCheckoutModal();
        });
    }

    const testimonialForm = document.getElementById('testimonial-form');
    if (testimonialForm) testimonialForm.addEventListener('submit', handleTestimonialSubmit);

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
        cepInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            e.target.value = value;
        });
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
});