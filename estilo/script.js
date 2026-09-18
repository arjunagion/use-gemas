// ==========================================================================
// Estado Global
// ==========================================================================
let cart = [];
let shippingCost = 0;
let shippingDetails = null;

// Controle do Carrossel do Modal
let currentGallery = [];
let currentMediaIndex = 0;

const whatsappNumber = "5511982053330"; 

// ==========================================================================
// Controle do Carrinho (Drawer)
// ==========================================================================
function toggleCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer) {
        cartDrawer.classList.toggle('open');
    }
}

function openCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer && !cartDrawer.classList.contains('open')) {
        cartDrawer.classList.add('open');
    }
}

/* ==========================================================================
   Controle dos Modais de Autenticação (Login / Criar Conta)
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
    resetRegisterValidation();

    if (tabName === 'login') {
        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
        if (loginForm) loginForm.classList.add('active');
        if (registerForm) registerForm.classList.remove('active');
    } else {
        if (registerTab) registerTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
        if (registerForm) registerForm.classList.add('active');
        if (loginForm) loginForm.classList.remove('active');
    }
}

// Exibe mensagem geral no modal de autenticação
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

// Tratamento do clique no link "Esqueceu a senha?"
function handleForgotPassword(event) {
    event.preventDefault();
    const emailInput = document.getElementById('login-email');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email) {
        showAuthFeedback('Digite seu e-mail no campo acima para redefinir a senha.', 'error');
    } else {
        showAuthFeedback(`Instruções de redefinição enviadas para ${email}!`, 'success');
    }
}

// ==========================================================================
// Validações Visuais e Feedback dos Campos do Cadastro
// ==========================================================================

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
                setFieldStatus(emailInput, false, 'Informe um e-mail válido (ex: nome@dominio.com).');
            } else {
                setFieldStatus(emailInput, true);
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('input', () => {
            const val = passwordInput.value;
            if (val.length === 0) {
                setFieldStatus(passwordInput, false, 'A senha é obrigatória (min. 6 caracteres).');
            } else if (val.length < 6) {
                setFieldStatus(passwordInput, false, `Senha muito curta (${val.length}/6 caracteres).`);
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

// ==========================================================================
// Regras de Negócio de Autenticação (localStorage)
// ==========================================================================
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
    const userBtn = document.getElementById('user-auth-btn');
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
// Controle do Modal de Produtos & Galeria
// ==========================================================================
function openProductModalFromCard(cardElement) {
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
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (!wrapper) return;

    if (currentGallery.length === 0) {
        wrapper.innerHTML = `<p style="color: #666; text-align: center; margin-top: 40%;">Sem mídia disponível</p>`;
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
    const isVideo = currentSrc.match(/\.(mov|mp4|webm)$/i);

    if (isVideo) {
        wrapper.innerHTML = `<video src="${currentSrc}" autoplay muted loop playsinline></video>`;
    } else {
        wrapper.innerHTML = `<img src="${currentSrc}" alt="Detalhe do Produto" />`;
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
// Operações do Carrinho de Compras
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
// Cálculo de Frete (ViaCEP API)
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
// Eventos Globais e Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    updateUserSessionUI();
    setupRegisterLiveValidation();

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
});