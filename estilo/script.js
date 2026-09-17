// Lista onde os itens do carrinho ficam guardados
let cart = [];

// Dados do Frete
let shippingCost = 0;
let shippingDetails = null; // Guardará o CEP e a Cidade/UF do cliente

// Número do WhatsApp da Use Gemas (+55 11 98205-3330)
const whatsappNumber = "5511982053330"; 

// Alterna o carrinho entre aberto/fechado
function toggleCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer) {
        cartDrawer.classList.toggle('open');
    }
}

// Força a abertura do carrinho
function openCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer && !cartDrawer.classList.contains('open')) {
        cartDrawer.classList.add('open');
    }
}

// Adiciona um item ao carrinho
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

// Altera a quantidade (+1 ou -1)
function updateQuantity(index, delta) {
    cart[index].quantity += delta;

    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }

    updateCartUI();
}

// Remove o item do carrinho
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// Formatação para Moeda Brasileira (R$)
function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Consulta de CEP via API ViaCEP
async function calculateShipping() {
    const cepInput = document.getElementById('cep-input');
    const shippingResult = document.getElementById('shipping-result');
    
    if (!cepInput || !shippingResult) return;

    const cep = cepInput.value.replace(/\D/g, ''); // Mantém apenas números

    if (cep.length !== 8) {
        shippingResult.innerHTML = `<span style="color: #ff6b6b;">Digite um CEP válido com 8 dígitos.</span>`;
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
            // Cotação fixa/estimada de frete padrão (exemplo: R$ 20,00)
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
                    <span>Envio Estimado (Correios):</span>
                    <strong style="color: #d4af37;">${formatCurrency(estimatedFreight)}</strong>
                </div>
            `;
        }
    } catch (error) {
        shippingResult.innerHTML = `<span style="color: #ff6b6b;">Erro ao calcular. Tente novamente.</span>`;
        shippingCost = 0;
        shippingDetails = null;
    }

    updateCartUI();
}

// Atualiza a visualização do carrinho e os totais
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

// Envia a mensagem completa para o WhatsApp
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

// Máscara automática de CEP (00000-000) e Scroll suave
document.addEventListener('DOMContentLoaded', () => {
    const cepInput = document.getElementById('cep-input');
    if (cepInput) {
        cepInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 5) {
                value = value.replace(/^(\d{5})(\d)/, '$1-$2');
            }
            e.target.value = value;
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