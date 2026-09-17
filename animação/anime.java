// Efeito de transição suave na navegação e scroll da Navbar
document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(14, 14, 16, 0.95)';
            navbar.style.padding = '0.9rem 0';
        } else {
            navbar.style.background = 'rgba(14, 14, 16, 0.85)';
            navbar.style.padding = '1.2rem 0';
        }
    });
});