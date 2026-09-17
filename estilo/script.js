// Lista onde os itens do carrinho ficam guardados
let cart = [];

// Número do WhatsApp da Use Gemas (+55 11 98205-3330)
const whatsappNumber = "5511982053330"; 

// Função para abrir e fechar a gaveta do carrinho
function toggleCart() {
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer) {
        cartDrawer.classList.toggle('open');
    }
}

// Função chamada pelos botões dos produtos (Recebe Nome e Código REF)
function addToCart(name, ref) {
    cart.push({ name, ref });
    updateCartUI();
    toggleCart(); // Abre a gaveta automaticamente ao adicionar um item
}

// Função para atualizar a lista na tela e o contador de itens
function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');

    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    cart.forEach((item, index) => {
        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <div>
                    <h4 style="font-family: var(--font-title); font-size: 1.1rem; color: var(--text-light);">${item.name}</h4>
                    <small style="color: var(--accent-gold);">REF: ${item.ref}</small>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff5555; cursor:pointer; font-size: 0.8rem;">Remover</button>
            </div>
        `;
    });

    if (cartCount) cartCount.innerText = cart.length;
}

// Função para remover um item do carrinho
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

// Função para montar a mensagem apenas com nomes e códigos REF (sem valores)
function sendToWhatsApp() {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    let message = "Olá! Gostaria de consultar a disponibilidade e finalizar o meu pedido dos seguintes itens da Use Gemas:\n\n";

    cart.forEach((item) => {
        message += `• ${item.name} (REF: ${item.ref})\n`;
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