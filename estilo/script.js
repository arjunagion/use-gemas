// ==========================================================================
// Estado Global
// ==========================================================================
let cart = [];
let shippingCost = 0;
let shippingDetails = null;

// Controle do Carrossel do Modal
let currentGallery = [];
let currentMediaIndex = 0;

// Controle do PhotoSwipe (galeria ampliada com zoom)
let photoSwipeLightbox = null;

const whatsappNumber = "5511982053330";

// Controle do Carrossel Principal
let currentSlide = 0;
let autoSlideInterval = null;

// ==========================================================================
// Controle do Carrossel de Essência & Cuidados (Escopo Global)
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
                try {
                    video.currentTime = 0;
                } catch (e) { /* ignora se metadata ainda não carregou */ }
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

function moveSlide(step) {
    showSlide(currentSlide + step);
    resetAutoSlide();
}

function goToSlide(index) {
    showSlide(index);
    resetAutoSlide();
}

function startAutoSlide() {
    stopAutoSlide();
    autoSlideInterval = setInterval(() => {
        showSlide(currentSlide + 1);
    }, 6000);
}

function stopAutoSlide() {
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
    }
}

function resetAutoSlide() {
    stopAutoSlide();
    startAutoSlide();
}

// ==========================================================================
// Controle do Carrinho (Drawer)
// ==========================================================================
function toggleCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    if (cartDrawer) {
        const willOpen = !cartDrawer.classList.contains('open');
        cartDrawer.classList.toggle('open');
        if (willOpen && wishlistDrawer) {
            wishlistDrawer.classList.remove('open');
        }
    }
}

function openCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    if (cartDrawer && !cartDrawer.classList.contains('open')) {
        cartDrawer.classList.add('open');
        if (wishlistDrawer) {
            wishlistDrawer.classList.remove('open');
        }
    }
}

/* ==========================================================================
   Controle dos Modais de Autenticação
   ========================================================================== */
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
            if (id === 'reg-password') {
                setFieldStatus(el, null, 'Mínimo de 6 caracteres.');
            }
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
            if (val.length === 0) {
                setFieldStatus(nameInput, false, 'O nome é obrigatório.');
            } else if (val.length < 3) {
                setFieldStatus(nameInput, false, 'Digite ao menos 3 caracteres.');
            } else {
                setFieldStatus(nameInput, true);
            }
        });
    }

    if (emailInput) {
        emailInput.addEventListener('input', () => {
            const val = emailInput.value.trim();
            if (val.length === 0) {
                setFieldStatus(emailInput, false, 'O e-mail é obrigatório.');
            } else if (!validateEmail(val)) {
                setFieldStatus(emailInput, false, 'Informe um e-mail válido.');
            } else {
                setFieldStatus(emailInput, true);
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const val = passwordInput.value;
            if (val.length === 0) {
                setFieldStatus(passwordInput, false, 'A senha é obrigatória.');
            } else if (val.length < 6) {
                setFieldStatus(passwordInput, false, `Senha muito curta (${val.length}/6).`);
            } else {
                setFieldStatus(passwordInput, true);
            }

            if (confirmInput && confirmInput.value.length > 0) {
                confirmInput.dispatchEvent(new Event('input'));
            }
        });
    }

    if (confirmInput) {
        confirmInput.addEventListener('input', () => {
            const confirmVal = confirmInput.value;
            const passVal = passwordInput ? passwordInput.value : '';

            if (confirmVal.length === 0) {
                setFieldStatus(confirmInput, false, 'Confirme a sua senha.');
            } else if (confirmVal !== passVal) {
                setFieldStatus(confirmInput, false, 'As senhas não coincidem.');
            } else {
                setFieldStatus(confirmInput, true);
            }
        });
    }
}

function handleRegister(event) {
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

    if (!name || name.length < 3) {
        setFieldStatus(nameInput, false, 'Informe seu nome completo.');
        hasError = true;
    }

    if (!email || !validateEmail(email)) {
        setFieldStatus(emailInput, false, 'E-mail inválido.');
        hasError = true;
    }

    if (!password || password.length < 6) {
        setFieldStatus(passwordInput, false, 'A senha deve conter no mínimo 6 caracteres.');
        hasError = true;
    }

    if (!confirm || password !== confirm) {
        setFieldStatus(confirmInput, false, 'As senhas não coincidem.');
        hasError = true;
    }

    if (hasError) {
        showAuthFeedback('Por favor, corrija os campos sinalizados em vermelho.', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('gemas_users') || '[]');
    const userExists = users.some(u => u.email === email);

    if (userExists) {
        setFieldStatus(emailInput, false, 'Este e-mail já está cadastrado.');
        showAuthFeedback('Este e-mail já está cadastrado no sistema.', 'error');
        return;
    }

    const newUser = { name, email, password };
    users.push(newUser);
    localStorage.setItem('gemas_users', JSON.stringify(users));
    localStorage.setItem('gemas_current_user', JSON.stringify({ name, email }));

    showAuthFeedback('Conta criada com sucesso!', 'success');
    updateUserSessionUI();

    setTimeout(() => {
        closeAuthModal();
        if (nameInput) nameInput.value = '';
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
        if (confirmInput) confirmInput.value = '';
    }, 1200);
}

function handleLogin(event) {
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

    const users = JSON.parse(localStorage.getItem('gemas_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        showAuthFeedback('E-mail ou senha incorretos.', 'error');
        return;
    }

    localStorage.setItem('gemas_current_user', JSON.stringify({ name: user.name, email: user.email }));
    showAuthFeedback('Login realizado com sucesso!', 'success');
    updateUserSessionUI();

    setTimeout(() => {
        closeAuthModal();
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
    }, 1000);
}

function handleLogout() {
    localStorage.removeItem('gemas_current_user');
    updateUserSessionUI();
}

function updateUserSessionUI() {
    const userBtn = document.getElementById('user-btn');
    const currentUser = JSON.parse(localStorage.getItem('gemas_current_user'));

    if (!userBtn) return;

    if (currentUser) {
        const firstName = currentUser.name.split(' ')[0];
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

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ==========================================================================
// Controle do Modal de Produtos
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

    // Ícone de zoom (lupa)
    const zoomIconSVG = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
    `;

    // Indicador visual "Ampliar"
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

    // Adiciona o clique para abrir o PhotoSwipe na mídia atual
    const mediaEl = wrapper.querySelector('video, img');
    if (mediaEl) {
        mediaEl.addEventListener('click', () => {
            openPhotoSwipeAtCurrentIndex();
        });
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

    if (currentMediaIndex < 0) {
        currentMediaIndex = currentGallery.length - 1;
    } else if (currentMediaIndex >= currentGallery.length) {
        currentMediaIndex = 0;
    }

    renderModalMedia();
}

function setModalMediaIndex(index) {
    currentMediaIndex = index;
    renderModalMedia();
}

function closeProductModal() {
    // Fecha PhotoSwipe se estiver aberto
    closePhotoSwipeIfOpen();

    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.remove('open');
    }
}

// ==========================================================================
// Filtro por Categoria
// ==========================================================================
function filterProducts(category, element) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));

    if (element) {
        element.classList.add('active');
    }

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
// Operações do Carrinho
// ==========================================================================
function addToCart(name, ref, price) {
    const existingItem = cart.find(item => item.ref === ref);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, ref, price, quantity: 1 });
    }

    updateCartUI();
    openCart();
}

function updateQuantity(index, delta) {
    cart[index].quantity += delta;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ==========================================================================
// Cálculo de Frete (ViaCEP)
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
            shippingDetails = {
                cep: data.cep,
                city: data.localidade,
                uf: data.uf
            };

            shippingResult.innerHTML = `
                <div style="color: #6bfbce; font-weight: 500;">📍 ${data.localidade} - ${data.uf}</div>
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
    if (cartShippingElement) {
        cartShippingElement.innerText = shippingCost > 0 ? formatCurrency(shippingCost) : 'A calcular';
    }
    if (cartTotalElement) cartTotalElement.innerText = formatCurrency(finalTotal);
}

// ==========================================================================
// Envio do Pedido via WhatsApp
// ==========================================================================
function sendToWhatsApp() {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('gemas_current_user'));
    let subtotalPrice = 0;
    let message = "Olá! Gostaria de consultar a disponibilidade e finalizar o meu pedido dos seguintes itens da Use Gemas:\n\n";

    if (currentUser) {
        message = `Olá! Meu nome é *${currentUser.name}* (${currentUser.email}). Gostaria de consultar a disponibilidade e finalizar o meu pedido na Use Gemas:\n\n`;
    }

    cart.forEach((item) => {
        const itemSubtotal = item.price * item.quantity;
        subtotalPrice += itemSubtotal;
        message += `• ${item.quantity}x ${item.name} (REF: ${item.ref}) - ${formatCurrency(itemSubtotal)}\n`;
    });

    message += `\n*Subtotal:* ${formatCurrency(subtotalPrice)}`;

    if (shippingDetails) {
        message += `\n*Entrega para:* ${shippingDetails.city}/${shippingDetails.uf} (CEP: ${shippingDetails.cep})`;
        message += `\n*Frete Estimado:* ${formatCurrency(shippingCost)}`;
        message += `\n*Valor Total Estimado:* ${formatCurrency(subtotalPrice + shippingCost)}`;
    } else {
        message += `\n*Frete:* Pendente de cotação por CEP`;
        message += `\n*Valor Total (sem frete):* ${formatCurrency(subtotalPrice)}`;
    }

    message += "\n\nPor favor, confirme as opções de pagamento e o envio!";

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(whatsappURL, '_blank');
}

// ==========================================================================
// Favoritos / Lista de Desejos
// ==========================================================================
let favorites = [];

function loadFavorites() {
    try {
        favorites = JSON.parse(localStorage.getItem('gemas_favorites') || '[]');
        if (!Array.isArray(favorites)) favorites = [];
    } catch (e) {
        favorites = [];
    }
}

function saveFavorites() {
    localStorage.setItem('gemas_favorites', JSON.stringify(favorites));
}

function isFavorite(ref) {
    return favorites.some(f => f.ref === ref);
}

function toggleFavorite(event, name, ref, price) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const index = favorites.findIndex(f => f.ref === ref);

    if (index >= 0) {
        favorites.splice(index, 1);
    } else {
        favorites.push({ name, ref, price });
    }

    saveFavorites();
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
                Toque no ❤️ de qualquer peça para salvar aqui.
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
                    <button onclick="moveFavoriteToCart(${index})" title="Adicionar ao carrinho" aria-label="Adicionar ao carrinho">🛒</button>
                    <button class="btn-remove-fav" onclick="removeFromFavorites(${index})" title="Remover dos favoritos" aria-label="Remover">&times;</button>
                </div>
            </div>
        `;
    });
}

function removeFromFavorites(index) {
    if (index < 0 || index >= favorites.length) return;
    favorites.splice(index, 1);
    saveFavorites();
    updateFavoritesUI();
}

function moveFavoriteToCart(index) {
    const item = favorites[index];
    if (!item) return;

    addToCart(item.name, item.ref, item.price);

    favorites.splice(index, 1);
    saveFavorites();
    updateFavoritesUI();
}

function toggleWishlist() {
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    const cartDrawer = document.getElementById('cart-drawer');
    if (wishlistDrawer) {
        const willOpen = !wishlistDrawer.classList.contains('open');
        wishlistDrawer.classList.toggle('open');
        if (willOpen && cartDrawer) {
            cartDrawer.classList.remove('open');
        }
    }
}

function openWishlist() {
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    const cartDrawer = document.getElementById('cart-drawer');
    if (wishlistDrawer && !wishlistDrawer.classList.contains('open')) {
        wishlistDrawer.classList.add('open');
        if (cartDrawer) cartDrawer.classList.remove('open');
    }
}

function closeWishlist() {
    const wishlistDrawer = document.getElementById('wishlist-drawer');
    if (wishlistDrawer) wishlistDrawer.classList.remove('open');
}

function addAllFavoritesToCart() {
    if (favorites.length === 0) {
        alert('Sua lista de favoritos está vazia.');
        return;
    }

    const itemsToAdd = [...favorites];
    itemsToAdd.forEach(item => {
        addToCart(item.name, item.ref, item.price);
    });

    favorites = [];
    saveFavorites();
    updateFavoritesUI();
    closeWishlist();
}

// ==========================================================================
// PhotoSwipe — Galeria Ampliada com Zoom
// ==========================================================================

/**
 * Monta o array de dados do PhotoSwipe a partir da galeria do produto atual
 */
function buildPhotoSwipeData() {
    return currentGallery.map((src) => {
        const isVideo = src.match(/\.(mov|mp4|webm|ogg)$/i);

        if (isVideo) {
            return {
                src: src,
                width: 1280,
                height: 720,
                type: 'video',
                videoSrc: src,
                msrc: src
            };
        }

        return {
            src: src,
            width: 1200,
            height: 1600,
            msrc: src
        };
    });
}

/**
 * Abre o PhotoSwipe no índice atual da galeria do modal
 */
function openPhotoSwipeAtCurrentIndex() {
    if (currentGallery.length === 0) return;

    // Destroi instância anterior se existir
    if (photoSwipeLightbox) {
        try {
            photoSwipeLightbox.destroy();
        } catch (e) { /* ignora */ }
        photoSwipeLightbox = null;
    }

    const dataSource = buildPhotoSwipeData();

    // Garante que o container exista
    let galleryEl = document.getElementById('pswp-gallery');
    if (!galleryEl) {
        galleryEl = document.createElement('div');
        galleryEl.id = 'pswp-gallery';
        galleryEl.className = 'pswp-gallery';
        galleryEl.style.display = 'none';
        document.body.appendChild(galleryEl);
    }

    // Importa e inicializa o PhotoSwipe dinamicamente
    Promise.all([
        import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe-lightbox.esm.min.js'),
        import('https://cdn.jsdelivr.net/npm/photoswipe@5.4.4/dist/photoswipe.esm.min.js')
    ])
        .then(([lightboxModule, pswpModule]) => {
            const PhotoSwipeLightbox = lightboxModule.default;
            const PhotoSwipe = pswpModule.default;

            photoSwipeLightbox = new PhotoSwipeLightbox({
                dataSource: dataSource,
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
            // Fallback: abre a mídia em nova aba
            window.open(currentGallery[currentMediaIndex], '_blank');
        });
}

/**
 * Fecha o PhotoSwipe se estiver aberto
 */
function closePhotoSwipeIfOpen() {
    if (photoSwipeLightbox) {
        try {
            photoSwipeLightbox.destroy();
        } catch (e) { /* ignora */ }
        photoSwipeLightbox = null;
    }
}

// ==========================================================================
// Depoimentos — Envio via Web3Forms
// ==========================================================================
const WEB3FORMS_KEY = '69a758b3-d87b-4ea5-a666-424321663f86';
let currentTestimonialStars = 0;

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

    starRating.addEventListener('mouseleave', () => {
        updateStarsUI(currentTestimonialStars);
    });
}

function updateStarsUI(value) {
    const stars = document.querySelectorAll('#star-rating .star');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index < value);
        star.classList.remove('hovered');
    });
}

function highlightStars(value) {
    const stars = document.querySelectorAll('#star-rating .star');
    stars.forEach((star, index) => {
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

    // Validações
    if (!name || name.length < 2) {
        showTestimonialFeedback('Por favor, informe seu nome.', 'error');
        if (nameInput) nameInput.focus();
        return;
    }

    if (!stars || parseInt(stars, 10) < 1) {
        showTestimonialFeedback('Por favor, escolha uma avaliação de 1 a 5 estrelas.', 'error');
        return;
    }

    if (!comment || comment.length < 10) {
        showTestimonialFeedback('Conte um pouco mais sobre sua experiência (mínimo 10 caracteres).', 'error');
        if (commentInput) commentInput.focus();
        return;
    }

    // Bloqueia botão durante envio
    const originalText = submitBtn ? submitBtn.innerText : 'Enviar';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Enviando...';
    }

    try {
        const formData = new FormData(form);
        formData.set('stars', `${stars} de 5`);

        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showTestimonialFeedback('✨ Depoimento enviado com sucesso! Obrigado por compartilhar.', 'success');
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
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    }
}

// ==========================================================================
// Eventos Globais e Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    updateUserSessionUI();
    loadFavorites();
    updateFavoritesUI();
    setupRegisterLiveValidation();
    setupStarRating();

    const testimonialForm = document.getElementById('testimonial-form');
    if (testimonialForm) {
        testimonialForm.addEventListener('submit', handleTestimonialSubmit);
    }

    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', handleLogin);
    }

    const formRegister = document.getElementById('form-register');
    if (formRegister) {
        formRegister.addEventListener('submit', handleRegister);
    }

    const modalOverlay = document.getElementById('product-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeProductModal();
            }
        });
    }

    const authOverlay = document.getElementById('auth-modal');
    if (authOverlay) {
        authOverlay.addEventListener('click', (e) => {
            if (e.target === authOverlay) {
                closeAuthModal();
            }
        });
    }

    const cepInput = document.getElementById('cep-input');
    if (cepInput) {
        cepInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) {
                value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            }
            e.target.value = value;
        });

        cepInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                calculateShipping();
            }
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

    // Inicialização do Carrossel de Essência & Cuidados
    const carouselContainer = document.getElementById('infoCarousel');
    if (carouselContainer) {
        showSlide(0);
        startAutoSlide();

        carouselContainer.addEventListener('mouseenter', stopAutoSlide);
        carouselContainer.addEventListener('mouseleave', startAutoSlide);
    }
});