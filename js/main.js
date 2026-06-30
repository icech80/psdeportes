// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== MOBILE MENU =====
navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// ===== ACTIVE NAV LINK ON SCROLL =====
const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + sectionId) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveNav);

// ===== SCROLL ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, index * 100);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
});

// ===== PRODUCTS - GOOGLE SHEETS INTEGRATION =====
// La hoja debe estar publicada en la web (Archivo → Compartir → Publicar en la web)
// Columnas: Nombre | Descripcion | Precio | Categoria | Imagen | Badge

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQm15IMiupaKgGrpGUP9bUihPHCe3S5QMF2kCCvKsJUkelREmIW47lE0xjfFR1JlLZtjXkpwDFaPXzx/pub?output=csv';

const productsGrid = document.getElementById('productsGrid');
const productsFilter = document.getElementById('productsFilter');

// Iconos por defecto según categoría
const categoryIcons = {
    'ropa': 'fa-tshirt',
    'calzado': 'fa-shoe-prints',
    'implementos': 'fa-futbol',
    'accesorios': 'fa-dumbbell',
    'fitness': 'fa-dumbbell',
    'outdoor': 'fa-hiking'
};

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Parsear header (primera fila)
    const headers = parseCSVLine(lines[0]);

    // Parsear filas de datos
    return lines.slice(1).map(line => {
        const cols = parseCSVLine(line);
        return {
            nombre: (cols[0] || '').trim(),
            descripcion: (cols[1] || '').trim(),
            precio: (cols[2] || '').trim(),
            categoria: (cols[3] || '').toLowerCase().trim(),
            imagen: (cols[4] || '').trim(),
            badge: (cols[5] || '').trim()
        };
    }).filter(p => p.nombre);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

async function loadProducts() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const text = await response.text();

        const products = parseCSV(text);

        if (products.length === 0) {
            productsGrid.innerHTML = '<p class="products-empty">No hay productos disponibles.</p>';
            return;
        }

        // Generar filtros dinámicos desde categorías
        const categories = [...new Set(products.map(p => p.categoria).filter(c => c))];
        renderFilters(categories);

        // Renderizar productos
        renderProducts(products);

    } catch (error) {
        console.error('Error cargando productos:', error);
        productsGrid.innerHTML = `
            <div class="products-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>No se pudieron cargar los productos. Intenta más tarde.</p>
            </div>`;
    }
}

function renderFilters(categories) {
    let filtersHTML = '<button class="filter-btn active" data-filter="all">Todos</button>';
    categories.forEach(cat => {
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        filtersHTML += `<button class="filter-btn" data-filter="${cat}">${label}</button>`;
    });
    productsFilter.innerHTML = filtersHTML;

    // Re-bindear eventos de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');

            document.querySelectorAll('.product-card').forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.classList.remove('hidden');
                    card.style.animation = 'fadeIn 0.5s ease forwards';
                } else {
                    card.classList.add('hidden');
                }
            });
        });
    });
}

function convertDriveUrl(url) {
    if (!url) return '';
    // Extraer el ID del archivo de cualquier formato de link de Google Drive
    let fileId = '';
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,        // /file/d/ID/view
        /[?&]id=([a-zA-Z0-9_-]+)/,             // ?id=ID o &id=ID
        /\/d\/([a-zA-Z0-9_-]+)/,               // /d/ID
        /^([a-zA-Z0-9_-]{20,})$/                // Solo el ID directo
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            fileId = match[1];
            break;
        }
    }

    if (fileId) {
        // Usar lh3.googleusercontent.com que no da 403
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // Si no es link de Drive, devolver tal cual (imgbb, imgur, etc.)
    return url;
}

function formatPrice(value) {
    // Si ya tiene $ o formato, devolverlo tal cual
    if (!value) return '';
    const str = value.toString().trim();
    if (str.startsWith('$')) return str;
    // Remover caracteres no numéricos excepto punto/coma
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    if (isNaN(num)) return str;
    return '$' + num.toLocaleString('es-CL');
}

function renderProducts(products) {
    let html = '';
    products.forEach((product, index) => {
        const icon = categoryIcons[product.categoria] || 'fa-box';
        const badgeHTML = product.badge ? `<span class="product-badge">${product.badge}</span>` : '';
        const imgUrl = convertDriveUrl(product.imagen);
        const imageHTML = imgUrl
            ? `<img src="${imgUrl}" alt="${product.nombre}" loading="lazy">`
            : `<i class="fas ${icon}"></i>`;
        const precio = formatPrice(product.precio);

        html += `
            <div class="product-card animate-on-scroll" data-category="${product.categoria}" data-index="${index}">
                <div class="product-image">
                    ${imageHTML}
                    ${badgeHTML}
                </div>
                <div class="product-info">
                    <h3>${product.nombre}</h3>
                    <p>${product.descripcion}</p>
                    <span class="product-price">${precio}</span>
                </div>
            </div>`;
    });

    productsGrid.innerHTML = html;

    // Re-observar animaciones
    productsGrid.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // Bind click para abrir modal
    productsGrid.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', () => {
            const idx = parseInt(card.getAttribute('data-index'));
            openProductModal(products[idx]);
        });
    });
}

// ===== PRODUCT MODAL =====
const productModal = document.getElementById('productModal');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalName = document.getElementById('modalName');
const modalDesc = document.getElementById('modalDesc');
const modalPrice = document.getElementById('modalPrice');
const modalCategory = document.getElementById('modalCategory');
const modalWhatsApp = document.getElementById('modalWhatsApp');

function openProductModal(product) {
    const imgUrl = convertDriveUrl(product.imagen);
    const precio = formatPrice(product.precio);
    const icon = categoryIcons[product.categoria] || 'fa-box';

    if (imgUrl) {
        modalImage.innerHTML = `<img src="${imgUrl}" alt="${product.nombre}">`;
    } else {
        modalImage.innerHTML = `<i class="fas ${icon}"></i>`;
    }

    modalName.textContent = product.nombre;
    modalDesc.textContent = product.descripcion;
    modalPrice.textContent = precio;
    modalCategory.textContent = product.categoria;

    // WhatsApp link con nombre del producto
    const msg = encodeURIComponent(`Hola, me interesa el producto: ${product.nombre} (${precio})`);
    modalWhatsApp.href = `https://wa.me/56931423601?text=${msg}`;

    productModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    productModal.classList.remove('active');
    document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeProductModal);

productModal.addEventListener('click', (e) => {
    if (e.target === productModal) closeProductModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && productModal.classList.contains('active')) {
        closeProductModal();
    }
});

// Cargar productos al iniciar
loadProducts();

// ===== COUNTER ANIMATION =====
const statNumbers = document.querySelectorAll('.stat-number');

function animateCounters() {
    statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                stat.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                stat.textContent = target;
            }
        };

        updateCounter();
    });
}

const statsSection = document.querySelector('.section-stats');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

if (statsSection) {
    statsObserver.observe(statsSection);
}

// ===== BACK TO TOP =====
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const asunto = document.getElementById('asunto').value.trim();
        const mensaje = document.getElementById('mensaje').value.trim();

        if (!nombre || !email || !mensaje) {
            showNotification('Por favor completa los campos obligatorios.', 'error');
            return;
        }

        // Simular envío
        const btn = contactForm.querySelector('button[type="submit"]');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        btn.disabled = true;

        setTimeout(() => {
            showNotification('¡Mensaje enviado con éxito! Te responderemos pronto.', 'success');
            contactForm.reset();
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensaje';
            btn.disabled = false;
        }, 1500);
    });
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#00c853' : '#ff5252'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.95rem;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 90vw;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ===== HERO PARTICLES =====
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 6 + 2}px;
            height: ${Math.random() * 6 + 2}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float ${Math.random() * 8 + 4}s ease-in-out infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(particle);
    }
}

createParticles();

// ===== INJECT KEYFRAMES =====
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
    @keyframes float {
        0%, 100% { transform: translateY(0) translateX(0); }
        25% { transform: translateY(-20px) translateX(10px); }
        50% { transform: translateY(-10px) translateX(-10px); }
        75% { transform: translateY(-30px) translateX(5px); }
    }
`;
document.head.appendChild(style);

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
