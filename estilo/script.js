// Estado Global
let cart = [];
let shippingCost = 0;
let shippingDetails = null;

// Controle do Carrossel do Modal
let currentGallery = [];
let currentMediaIndex = 0;

const whatsappNumber = "5511982053330"; 

// Alterna o carrinho
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

// Abre o Modal pegando dados do elemento HTML
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

// Abre o Modal com Carrossel
function openProductModal(name, ref, price, gemType, description, materials, gallery) {
    const modal = document.getElementById('product-modal');
    if (!modal) return;

    document.getElementById('modal-title').innerText = name;
    document.getElementById('modal-ref').innerText = `REF: ${ref}`;
    document.getElementById('modal-gem').innerText = gemType;
    document.getElementById('modal-price').innerText = formatCurrency(price);
    document.getElementById('modal-desc').innerText = description;
    document.getElementById('modal-materials').innerText = materials;

    // Configura Mídias da Galeria
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

// Renderiza a mídia atual (Vídeo ou Foto)
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

    // Exibe ou oculta setas se houver apenas 1 mídia
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

    // Renderiza bolinhas
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        if (currentGallery.length > 1) {
            currentGallery.forEach((_, idx) => {
                dotsContainer.innerHTML += `<div class="dot ${idx === currentMediaIndex ? 'active' : ''}" onclick="setModalMediaIndex(${idx})"></div>`;
            });
        }
    }
}

// Navegação do Carrossel (< e >)
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

// Funções do Carrinho
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

// Cálculo de Frete
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

function sendToWhatsApp() {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    let subtotalPrice = 0;
    let message = "Olá! Gostaria de consultar a disponibilidade e finalizar o meu pedido dos seguintes itens da Use Gemas:\n\n";

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

// Eventos Globais
document.addEventListener('DOMContentLoaded', () => {
    const modalOverlay = document.getElementById('product-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeProductModal();
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