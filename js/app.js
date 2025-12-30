// Главный скрипт сайта
document.addEventListener('DOMContentLoaded', function() {
    console.log('JAPAN TRUCK запущен');
    
    // Создаем контейнер для toast-уведомлений
    createToastContainer();
    
    // Инициализация всех модулей
    initMobileMenu();
    initFilters();
    initModals();
    initSidebarWidgets();
    initScrollTop();
    loadAndDisplayData();
});

// ===== TOAST УВЕДОМЛЕНИЯ =====
function createToastContainer() {
    if (!document.querySelector('.toast-container')) {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
}

function showToast(title, message, type = 'info', duration = 2500) {
    const container = document.querySelector('.toast-container');
    if (!container) return;
    
    const icons = {
        success: 'fa-check',
        error: 'fa-times',
        info: 'fa-heart'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type] || icons.info}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(toast);
    
    // Автоудаление
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, duration);
    
    return toast;
}

// ===== МОБИЛЬНОЕ МЕНЮ =====
function initMobileMenu() {
    const btn = document.getElementById('mobileMenuBtn');
    const menu = document.getElementById('navMenu');
    
    if (btn && menu) {
        btn.addEventListener('click', function() {
            menu.classList.toggle('active');
            this.classList.toggle('active');
            document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
        });
        
        // Обработка выпадающих подменю на мобильных
        menu.querySelectorAll('.nav-dropdown > .dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 992) {
                    e.preventDefault();
                    const parent = this.parentElement;
                    const dropdown = parent.querySelector('.dropdown-menu');
                    
                    // Закрываем другие открытые меню
                    menu.querySelectorAll('.nav-dropdown.open').forEach(item => {
                        if (item !== parent) {
                            item.classList.remove('open');
                        }
                    });
                    
                    parent.classList.toggle('open');
                }
            });
        });
        
        // Закрытие при клике на обычную ссылку
        menu.querySelectorAll('.dropdown-menu a').forEach(link => {
            link.addEventListener('click', () => {
                menu.classList.remove('active');
                btn.classList.remove('active');
                document.body.style.overflow = '';
                menu.querySelectorAll('.nav-dropdown.open').forEach(item => {
                    item.classList.remove('open');
                });
            });
        });
        
        // Закрытие при клике вне меню
        document.addEventListener('click', function(event) {
            if (!menu.contains(event.target) && !btn.contains(event.target) && menu.classList.contains('active')) {
                menu.classList.remove('active');
                btn.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Debounce функция
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== ФИЛЬТРЫ И ПОИСК =====
function initFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const resetBtn = document.getElementById('resetFilterBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterProducts, 300));
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
}

function filterProducts() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const resetBtn = document.getElementById('resetFilterBtn');
    
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const category = categoryFilter?.value || '';
    
    // Показать/скрыть кнопку сброса
    if (resetBtn) {
        resetBtn.style.display = (searchTerm || category) ? 'flex' : 'none';
    }
    
    const products = getProducts();
    
    let filtered = products.filter(product => {
        // Поиск по названию, артикулу, бренду, году
        const searchMatch = 
            product.model.toLowerCase().includes(searchTerm) ||
            product.article.toLowerCase().includes(searchTerm) ||
            (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
            (product.year && product.year.toString().includes(searchTerm));
        
        // Фильтр по категории
        const categoryMatch = !category || product.category === category;
        
        return searchMatch && categoryMatch;
    });
    
    displayProducts(filtered, searchTerm);
}

function resetFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const resetBtn = document.getElementById('resetFilterBtn');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (resetBtn) resetBtn.style.display = 'none';
    
    displayProducts(getProducts());
    showToast('Фильтры сброшены', 'Показаны все товары', 'info', 2000);
}

// Функция подсветки совпадений
function highlightText(text, searchTerm) {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// ===== ЗАГРУЗКА ДАННЫХ =====
function loadAndDisplayData() {
    // Загружаем все данные
    const products = getProducts();
    const specials = getSpecials();
    const parts = getParts();
    
    // Отображаем
    displayProducts(products);
    displaySpecials(specials);
    displayParts(parts);
}

function getProducts() {
    const saved = localStorage.getItem('japanTruckProducts');
    if (saved) {
        return JSON.parse(saved);
    }
    
    // Стартовые данные
    return [
        {
            id: 1,
            article: "TG-500M-2021",
            model: "TADANO TG-500M",
            category: "cranes",
            brand: "TADANO",
            year: 2021,
            capacity: 5,
            boom: 12.5,
            price: 2850000,
            oldPrice: 3000000,
            inStock: true,
            images: [
                "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjZjBmNWZhIi8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM2YjcyODAiPlRhZGFubyBUTS01MDBNPC90ZXh0Pgo8L3N2Zz4K"
            ],
            description: "Автокран TADANO TG-500M, 2021 г.в., в отличном состоянии. Прямая поставка из Японии.",
            features: {
                "Двигатель": "Mitsubishi 6D24",
                "Пробег": "15 000 км",
                "Топливо": "Дизель",
                "Кабина": "С кондиционером",
                "Цвет": "Желтый",
                "Состояние": "Отличное"
            }
        }
    ];
}

function getSpecials() {
    const saved = localStorage.getItem('japanTruckSpecials');
    if (saved) {
        return JSON.parse(saved);
    }
    
    // Стартовые спецпредложения
    return [
        {
            id: 1,
            title: "Снегоуборщик MITSUBISHI MSR 1110D",
            price: 1250000,
            link: "#",
            image: ""
        },
        {
            id: 2,
            title: "Генератор NIPPON SHARYO NES13SI",
            price: 890000,
            link: "#",
            image: ""
        }
    ];
}

function getParts() {
    const saved = localStorage.getItem('japanTruckParts');
    if (saved) {
        return JSON.parse(saved);
    }
    
    // Стартовые запчасти
    return [
        { id: 1, name: "Гидромотор лебёдки", link: "#" },
        { id: 2, name: "Башня крановой установки", link: "#" },
        { id: 3, name: "1-2-3 колено стрелы", link: "#" },
        { id: 4, name: "Гидроцилиндры", link: "#" },
        { id: 5, name: "Пульт управления", link: "#" }
    ];
}

// ===== ОТОБРАЖЕНИЕ ТОВАРОВ =====
function displayProducts(products) {
    displayTable(products);
    displayMobileCards(products);
}

function displayTable(products) {
    const tbody = document.getElementById('catalogBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; display: block;"></i>
                    <p>Товары не найдены</p>
                </td>
            </tr>
        `;
        return;
    }
    
    products.forEach(product => {
        const imageUrl = product.images && product.images.length > 0 ? 
            product.images[0] : '';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="product-image-cell">
                <div class="product-image">
                    ${imageUrl ? 
                        `<img src="${imageUrl}" alt="${product.model}" loading="lazy">` : 
                        `<i class="fas fa-truck"></i>`
                    }
                </div>
            </td>
            <td>
                <div class="product-model">${product.model}</div>
                <span class="product-article">Арт: ${product.article}</span>
                ${product.brand ? `<div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${product.brand}</div>` : ''}
            </td>
            <td>${product.year || '—'}</td>
            <td>
                <div class="product-price">${formatPrice(product.price)} ₽</div>
                ${product.oldPrice ? 
                    `<div class="product-old-price" style="font-size: 14px; color: #6b7280; text-decoration: line-through;">${formatPrice(product.oldPrice)} ₽</div>` : ''
                }
            </td>
            <td>
                <span class="status-badge ${product.inStock ? 'status-instock' : 'status-order'}">
                    ${product.inStock ? 'В наличии' : 'Под заказ'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action btn-details" onclick="showProductDetails(${product.id})">
                        <i class="fas fa-eye"></i> Подробнее
                    </button>
                    <button class="btn-action btn-order" onclick="orderProduct(${product.id})">
                        <i class="fas fa-shopping-cart"></i> Заказать
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function displayMobileCards(products) {
    const container = document.getElementById('mobileCatalog');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6b7280; grid-column: 1/-1;">
                <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px;"></i>
                <p>Товары не найдены</p>
            </div>
        `;
        return;
    }
    
    products.forEach(product => {
        const imageUrl = product.images && product.images.length > 0 ? 
            product.images[0] : '';
        
        const isFav = isFavorite(product.id);
        const card = document.createElement('div');
        card.className = 'mobile-card';
        card.style.position = 'relative';
        card.innerHTML = `
            <button class="favorite-btn ${isFav ? 'active' : ''}" 
                    data-favorite-id="${product.id}"
                    onclick="event.stopPropagation(); toggleFavorite(${product.id}, this)">
                <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <div class="card-image">
                ${imageUrl ? 
                    `<img src="${imageUrl}" alt="${product.model}" loading="lazy">` : 
                    `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f5fa;color:#6b7280;">
                        <i class="fas fa-truck" style="font-size:48px;"></i>
                    </div>`
                }
            </div>
            <div class="card-content">
                <h3 class="card-title">${product.model}</h3>
                <div class="card-subtitle">Арт: ${product.article} ${product.brand ? '| Бренд: ' + product.brand : ''}</div>
                
                <div class="card-specs">
                    <div class="card-spec">
                        <span class="card-spec-label">Год</span>
                        <span>${product.year || '—'}</span>
                    </div>
                    <div class="card-spec">
                        <span class="card-spec-label">Грузоподъемность</span>
                        <span>${product.capacity ? product.capacity + ' т' : '—'}</span>
                    </div>
                    <div class="card-spec">
                        <span class="card-spec-label">Цена</span>
                        <span style="font-weight: 700; color: #f97316;">${formatPrice(product.price)} ₽</span>
                    </div>
                    <div class="card-spec">
                        <span class="card-spec-label">Статус</span>
                        <span style="color:${product.inStock ? '#10b981' : '#f59e0b'}">
                            ${product.inStock ? 'В наличии' : 'Под заказ'}
                        </span>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn-action btn-details" onclick="showProductDetails(${product.id})">
                        <i class="fas fa-eye"></i> Подробнее
                    </button>
                    <button class="btn-action btn-order" onclick="orderProduct(${product.id})">
                        <i class="fas fa-shopping-cart"></i> Заказать
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ===== ОТОБРАЖЕНИЕ СПЕЦПРЕДЛОЖЕНИЙ =====
function displaySpecials(specials) {
    const container = document.getElementById('specialsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (specials.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #6b7280;">
                <i class="fas fa-fire" style="font-size: 24px; margin-bottom: 10px; display: block;"></i>
                <p>Нет спецпредложений</p>
            </div>
        `;
        return;
    }
    
    specials.forEach(special => {
        const item = document.createElement('div');
        item.className = 'special-item';
        item.innerHTML = `
            <h4>${special.title}</h4>
            <div class="special-price">${formatPrice(special.price)} ₽</div>
            <a href="${special.link}" class="special-link">
                Подробнее <i class="fas fa-arrow-right"></i>
            </a>
        `;
        container.appendChild(item);
    });
}

// ===== ОТОБРАЖЕНИЕ ЗАПЧАСТЕЙ =====
function displayParts(parts) {
    const container = document.getElementById('partsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    parts.forEach(part => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="${part.link}">
                <i class="fas fa-cog"></i>
                ${part.name}
            </a>
        `;
        container.appendChild(li);
    });
}

// ===== МОДАЛЬНЫЕ ОКНА =====
function initModals() {
    // Кнопки открытия
    document.getElementById('contactBtn')?.addEventListener('click', () => openModal('contact'));
    document.getElementById('sidebarContactBtn')?.addEventListener('click', () => openModal('contact'));
    document.getElementById('modalClose')?.addEventListener('click', () => closeModal('product'));
    document.getElementById('contactModalClose')?.addEventListener('click', () => closeModal('contact'));
    
    // Закрытие по клику на оверлей
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    });
    
    // Закрытие по ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal('product');
            closeModal('contact');
        }
    });
}

function openModal(type) {
    const modal = document.getElementById(type + 'Modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(type) {
    const modal = document.getElementById(type + 'Modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ===== ДЕТАЛИ ТОВАРА =====
function showProductDetails(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    const modalContent = document.getElementById('productModalContent');
    if (!modalContent) return;
    
    // Создаем галерею
    const thumbnails = product.images && product.images.length > 0 ? 
        product.images.map((img, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeProductImage(this, '${img}')">
                <img src="${img}" alt="Фото ${index + 1}">
            </div>
        `).join('') : 
        '<div class="thumbnail active"><i class="fas fa-truck" style="font-size:24px;color:#6b7280;"></i></div>';
    
    // Создаем характеристики
    const features = product.features ? 
        Object.entries(product.features).map(([key, value]) => `
            <div class="spec-item">
                <span class="spec-label">${key}:</span>
                <span class="spec-value">${value}</span>
            </div>
        `).join('') : '';
    
    modalContent.innerHTML = `
        <div class="product-modal-content">
            <div class="product-gallery">
                <div class="main-product-image" id="mainProductImage">
                    ${product.images && product.images.length > 0 ? 
                        `<img src="${product.images[0]}" alt="${product.model}">` : 
                        `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f0f5fa;">
                            <i class="fas fa-truck" style="font-size:72px;color:#6b7280;"></i>
                        </div>`
                    }
                </div>
                <div class="product-thumbnails">
                    ${thumbnails}
                </div>
            </div>
            
            <div class="product-info">
                <h2>${product.model}</h2>
                <span class="product-article">Артикул: ${product.article}</span>
                
                <div class="product-price-block">
                    ${product.oldPrice ? 
                        `<div class="old-price">${formatPrice(product.oldPrice)} ₽</div>` : ''
                    }
                    <div class="current-price">${formatPrice(product.price)} ₽</div>
                </div>
                
                <div class="product-specs">
                    <div class="spec-item">
                        <span class="spec-label">Бренд:</span>
                        <span class="spec-value">${product.brand || '—'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Год выпуска:</span>
                        <span class="spec-value">${product.year || '—'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Грузоподъемность:</span>
                        <span class="spec-value">${product.capacity ? product.capacity + ' т' : '—'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Длина стрелы:</span>
                        <span class="spec-value">${product.boom ? product.boom + ' м' : '—'}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Категория:</span>
                        <span class="spec-value">${getCategoryName(product.category)}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Статус:</span>
                        <span class="spec-value" style="color:${product.inStock ? '#10b981' : '#f59e0b'}">
                            ${product.inStock ? 'В наличии' : 'Под заказ'}
                        </span>
                    </div>
                    ${features}
                </div>
                
                <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">
                    <h4 style="margin-bottom: 10px; color: #374151;">Описание</h4>
                    <p style="color: #4b5563;">${product.description || 'Описание товара отсутствует.'}</p>
                </div>
                
                <div class="product-actions">
                    <button class="btn-buy" onclick="orderProduct(${product.id})">
                        <i class="fas fa-shopping-cart"></i> Заказать
                    </button>
                    <button class="btn-favorite" onclick="toggleFavorite(${product.id})">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    openModal('product');
}

function changeProductImage(thumbnail, imageUrl) {
    // Убираем active у всех превью
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    // Добавляем active текущему
    thumbnail.classList.add('active');
    // Меняем основное изображение
    const mainImg = document.querySelector('#mainProductImage img');
    if (mainImg) {
        mainImg.src = imageUrl;
    }
}

// ===== ЗАКАЗ ТОВАРА =====
function orderProduct(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (product) {
        // Сохраняем выбранный товар для предзаполнения
        window.selectedProduct = product;
    }
    
    openModal('contact');
}

// ===== ИЗБРАННОЕ =====
function toggleFavorite(productId, buttonElement) {
    let favorites = JSON.parse(localStorage.getItem('japanTruckFavorites') || '[]');
    const index = favorites.indexOf(productId);
    
    if (index > -1) {
        favorites.splice(index, 1);
        showToast('Удалено из избранного', 'Товар убран из избранного', 'error', 2500);
        if (buttonElement) {
            buttonElement.classList.remove('active');
            buttonElement.innerHTML = '<i class="far fa-heart"></i>';
        }
    } else {
        favorites.push(productId);
        showToast('Добавлено в избранное', 'Товар добавлен в избранное', 'success', 2500);
        if (buttonElement) {
            buttonElement.classList.add('active');
            buttonElement.innerHTML = '<i class="fas fa-heart"></i>';
        }
    }
    
    localStorage.setItem('japanTruckFavorites', JSON.stringify(favorites));
    
    // Обновляем все кнопки избранного для этого товара
    document.querySelectorAll(`[data-favorite-id="${productId}"]`).forEach(btn => {
        if (favorites.includes(productId)) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-heart"></i>';
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="far fa-heart"></i>';
        }
    });
}

function isFavorite(productId) {
    const favorites = JSON.parse(localStorage.getItem('japanTruckFavorites') || '[]');
    return favorites.includes(productId);
}

// ===== ВИДЖЕТЫ САЙДБАРА =====
function initSidebarWidgets() {
    const savedStates = JSON.parse(localStorage.getItem('sidebarWidgetStates') || '{}');
    
    document.querySelectorAll('.widget-header').forEach((header, index) => {
        const toggleBtn = header.querySelector('.toggle-btn');
        const widgetId = header.parentElement.id || `widget-${index}`;
        const content = header.nextElementSibling;
        
        // Восстанавливаем сохраненное состояние
        if (savedStates[widgetId] === 'collapsed') {
            header.classList.add('active');
            content.style.maxHeight = '0';
            content.style.overflow = 'hidden';
            content.style.padding = '0 20px';
        } else {
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.overflow = 'hidden';
            content.style.transition = 'max-height 0.3s ease, padding 0.3s ease';
        }
        
        if (toggleBtn) {
            header.addEventListener('click', function() {
                const isCollapsing = !this.classList.contains('active');
                this.classList.toggle('active');
                
                if (isCollapsing) {
                    content.style.maxHeight = '0';
                    content.style.padding = '0 20px';
                    savedStates[widgetId] = 'collapsed';
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    content.style.padding = '20px';
                    savedStates[widgetId] = 'expanded';
                }
                
                // Сохраняем состояние
                localStorage.setItem('sidebarWidgetStates', JSON.stringify(savedStates));
            });
        }
    });
}

// ===== КНОПКА НАВЕРХ =====
function initScrollTop() {
    const btn = document.getElementById('scrollTop');
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });
    
    btn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== ФУНКЦИИ ДЛЯ СВЯЗИ =====
function openWhatsApp() {
    let message = "Здравствуйте! Интересует информация о технике.";
    
    if (window.selectedProduct) {
        message = `Здравствуйте! Интересует товар: ${window.selectedProduct.model} (${window.selectedProduct.article})`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/79233422340?text=${encodedMessage}`, '_blank');
}

function openTelegram() {
    window.open('https://t.me/ecokran', '_blank');
}

function openVK() {
    window.open('https://vk.com/id398793633', '_blank');
}

function callPhone() {
    window.location.href = 'tel:+79233422340';
}

function sendEmail() {
    let subject = "Запрос с сайта JAPAN TRUCK";
    let body = "Здравствуйте! Интересует информация о технике.";
    
    if (window.selectedProduct) {
        subject = `Запрос по товару: ${window.selectedProduct.model}`;
        body = `Здравствуйте! Интересует товар: ${window.selectedProduct.model} (${window.selectedProduct.article})`;
    }
    
    window.location.href = `mailto:j-truck.ru@mail.ru?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function formatPrice(price) {
    return price ? price.toLocaleString('ru-RU') : '0';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getCategoryName(category) {
    const categories = {
        'cranes': 'Крановые установки',
        'trucks': 'Грузовики',
        'loaders': 'Погрузчики',
        'manipulators': 'Манипуляторы',
        'snowblowers': 'Снегоуборщики',
        'parts': 'Запчасти'
    };
    return categories[category] || category;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 300px;
    `;
    
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Экспорт функций для глобального использования
window.showProductDetails = showProductDetails;
window.orderProduct = orderProduct;
window.toggleFavorite = toggleFavorite;
window.changeProductImage = changeProductImage;
window.openWhatsApp = openWhatsApp;
window.openTelegram = openTelegram;
window.openVK = openVK;
window.callPhone = callPhone;
window.sendEmail = sendEmail;