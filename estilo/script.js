// Lista onde os itens do carrinho ficam guardados
let cart = [];

// Número do WhatsApp da Use Gemas (+55 11 98205-3330)
const whatsappNumber = "5511982053330"; 

// Alterna o carrinho entre aberto/fechado (usado pelo ícone da navbar e botão "X")
function toggleCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer) {
        cartDrawer.classList.toggle('open');
    }
}

// Força a abertura do carrinho (garante que ele NUNCA feche ao clicar em novos produtos)
function openCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer && !cartDrawer.classList.contains('open')) {
        cartDrawer.classList.add('open');
    }
}

// Adiciona um item ou incrementa a quantidade se já existir no carrinho
function addToCart(name, ref) {
    const existingItem = cart.find(item => item.ref === ref);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, ref, quantity: 1 });
    }

    updateCartUI();
    openCart(); // Mantém/Abre o carrinho sem risco de fechar involuntariamente
}

// Altera a quantidade (+1 ou -1)
function updateQuantity(index, delta) {
    cart[index].quantity += delta;

    // Se a quantidade for zero ou menor, remove do carrinho
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCartUI();
}

// Remove o item diretamente
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// Atualiza a visualização do carrinho e o contador da navbar
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');

    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    let totalItems = 0;

    cart.forEach((item, index) => {
        totalItems += item.quantity;
        cartItemsContainer.innerHTML += `
            <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.03); padding: 0.8rem 1rem; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 0.8rem;">
                <div>
                    <h4 style="font-family: var(--font-title, serif); font-size: 1.1rem; color: #f5f5f5; margin: 0;">${item.name}</h4>
                    <small style="color: #d4af37;">REF: ${item.ref}</small>
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

    if (cartCount) cartCount.innerText = totalItems;
}

// Monta e envia a mensagem para o WhatsApp com as quantidades
function sendToWhatsApp() {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    let message = "Olá! Gostaria de consultar a disponibilidade e finalizar o meu pedido dos seguintes itens da Use Gemas:\n\n";

    cart.forEach((item) => {
        message += `• ${item.quantity}x ${item.name} (REF: ${item.ref})\n`;
    });

    message += "\nPor favor, confirme o valor total e as opções de pagamento!";

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(whatsappURL, '_blank');
}

// Suavização no Scroll da Navbar
document.addEventListener('DOMContentLoaded', () => {
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