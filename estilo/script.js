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
function addToCart(name, ref, price) {
    const existingItem = cart.find(item => item.ref === ref);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, ref, price, quantity: 1 });
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

// Função auxiliar para formatar números para a moeda brasileira (R$)
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Atualiza a visualização do carrinho, os totais e o contador da navbar
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotalElement = document.getElementById('cart-total');

    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    let totalItems = 0;
    let totalPrice = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `<p style="color: #888; text-align: center; margin-top: 2rem;">Seu carrinho está vazio.</p>`;
    } else {
        cart.forEach((item, index) => {
            totalItems += item.quantity;
            const itemSubtotal = item.price * item.quantity;
            totalPrice += itemSubtotal;

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

    if (cartCount) cartCount.innerText = totalItems;
    if (cartTotalElement) cartTotalElement.innerText = formatCurrency(totalPrice);
}

// Monta e envia a mensagem para o WhatsApp com as quantidades e valor total
function sendToWhatsApp() {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    let totalPrice = 0;
    let message = "Olá! Gostaria de consultar a disponibilidade e finalizar o meu pedido dos seguintes itens da Use Gemas:\n\n";

    cart.forEach((item) => {
        const itemSubtotal = item.price * item.quantity;
        totalPrice += itemSubtotal;
        message += `• ${item.quantity}x ${item.name} (REF: ${item.ref}) - ${formatCurrency(itemSubtotal)}\n`;
    });

    message += `\n*Valor Total Estimado:* ${formatCurrency(totalPrice)}`;
    message += "\n\nPor favor, confirme as opções de frete e pagamento!";

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