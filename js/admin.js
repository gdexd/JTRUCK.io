// ===== РАБОТА С LOCALSTORAGE =====
function getProducts() {
    try {
        const products = localStorage.getItem('products');
        return products ? JSON.parse(products) : [];
    } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
        return [];
    }
}

function saveProducts(products) {
    try {
        localStorage.setItem('products', JSON.stringify(products));
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении товаров:', error);
        alert('Ошибка при сохранении товаров. Проверьте данные.');
        return false;
    }
}

function getSpecials() {
    try {
        const specials = localStorage.getItem('specials');
        return specials ? JSON.parse(specials) : [
            { id: 1, title: 'Грузовик Volvo', price: 1500000, link: '#' },
            { id: 2, title: 'Экскаватор CAT', price: 2500000, link: '#' }
        ];
    } catch (error) {
        console.error('Ошибка при загрузке спецпредложений:', error);
        return [];
    }
}

function saveSpecials(specials) {
    try {
        localStorage.setItem('specials', JSON.stringify(specials));
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении спецпредложений:', error);
        return false;
    }
}

function getParts() {
    try {
        const parts = localStorage.getItem('parts');
        return parts ? JSON.parse(parts) : [
            { id: 1, name: 'Двигатель', link: '#' },
            { id: 2, name: 'Колеса', link: '#' },
            { id: 3, name: 'Кабина', link: '#' }
        ];
    } catch (error) {
        console.error('Ошибка при загрузке запчастей:', error);
        return [];
    }
}

function saveParts(parts) {
    try {
        localStorage.setItem('parts', JSON.stringify(parts));
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении запчастей:', error);
        return false;
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function formatPrice(price) {
    if (!price && price !== 0) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function getCategoryName(categoryKey) {
    const categories = {
        'trucks': 'Грузовики',
        'excavators': 'Экскаваторы',
        'bulldozers': 'Бульдозеры',
        'cranes': 'Краны',
        'loaders': 'Погрузчики',
        'trailers': 'Прицепы'
    };
    return categories[categoryKey] || categoryKey || 'Не указано';
}

// ===== СИСТЕМА ОЧИСТКИ =====
function initCleanupSystem() {
    // Проверяем целостность данных при загрузке
    setTimeout(() => {
        cleanupOrphanedData();
    }, 1000);
    
    // Добавляем кнопку очистки в интерфейс
    addCleanupButton();
}

function cleanupOrphanedData() {
    const products = getProducts();
    let cleanedCount = 0;
    
    // Очищаем товары без обязательных полей
    const validProducts = products.filter(product => {
        if (!product.model || !product.article || !product.price) {
            cleanedCount++;
            return false;
        }
        return true;
    });
    
    if (cleanedCount > 0) {
        saveProducts(validProducts);
        console.log(`Очищено ${cleanedCount} некорректных товаров`);
        
        // Если мы на странице товаров, обновляем таблицу
        if (document.getElementById('productsTab')?.classList.contains('active')) {
            loadProducts();
        }
    }
}

function addCleanupButton() {
    const tabsContainer = document.querySelector('.tabs');
    if (!tabsContainer) return;
    
    const cleanupBtn = document.createElement('button');
    cleanupBtn.className = 'tab-btn cleanup-btn';
    cleanupBtn.innerHTML = '<i class="fas fa-broom"></i> Очистка';
    cleanupBtn.dataset.tab = 'cleanup';
    
    cleanupBtn.addEventListener('click', function() {
        // Создаем таб очистки если его нет
        if (!document.getElementById('cleanupTab')) {
            createCleanupTab();
        }
        
        // Показываем таб очистки
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
        });
        
        document.getElementById('cleanupTab').classList.add('active');
        this.classList.add('active');
    });
    
    tabsContainer.appendChild(cleanupBtn);
}

function createCleanupTab() {
    const container = document.querySelector('.tab-content-container');
    if (!container) return;
    
    const cleanupTab = document.createElement('div');
    cleanupTab.className = 'tab-content';
    cleanupTab.id = 'cleanupTab';
    
    cleanupTab.innerHTML = `
        <div class="admin-section">
            <h2><i class="fas fa-broom"></i> Система очистки и обслуживания</h2>
            
            <div class="cleanup-stats">
                <div class="cleanup-stat-card" style="border-left: 4px solid #ef4444;">
                    <h4>Некорректные товары</h4>
                    <div id="invalidProductsCount">Загрузка...</div>
                    <button class="btn-cleanup" onclick="cleanInvalidProducts()">
                        <i class="fas fa-trash"></i> Очистить
                    </button>
                </div>
                
                <div class="cleanup-stat-card" style="border-left: 4px solid #f59e0b;">
                    <h4>Дубликаты артикулов</h4>
                    <div id="duplicateProductsCount">Загрузка...</div>
                    <button class="btn-cleanup" onclick="cleanDuplicateProducts()">
                        <i class="fas fa-clone"></i> Исправить
                    </button>
                </div>
                
                <div class="cleanup-stat-card" style="border-left: 4px solid #3b82f6;">
                    <h4>Бэкап данных</h4>
                    <div>${getDataSize()} КБ</div>
                    <button class="btn-cleanup" onclick="createBackup()">
                        <i class="fas fa-save"></i> Создать бэкап
                    </button>
                </div>
            </div>
            
            <div class="cleanup-actions">
                <h3>Опасные операции</h3>
                <div class="danger-zone">
                    <button class="btn-danger" onclick="exportData()">
                        <i class="fas fa-download"></i> Экспорт всех данных
                    </button>
                    
                    <label class="btn-danger btn-file-upload">
                        <i class="fas fa-upload"></i> Импорт данных
                        <input type="file" id="importFile" accept=".json" 
                               style="display: none;" onchange="importData(event)">
                    </label>
                    
                    <button class="btn-danger" onclick="clearAllData()">
                        <i class="fas fa-skull-crossbones"></i> Удалить ВСЕ данные
                    </button>
                </div>
            </div>
            
            <div class="system-info">
                <h3>Информация о системе</h3>
                <div class="info-grid">
                    <div>Всего товаров: <span id="totalProductsInfo">0</span></div>
                    <div>Спецпредложений: <span id="totalSpecialsInfo">0</span></div>
                    <div>Запчастей: <span id="totalPartsInfo">0</span></div>
                    <div>Размер данных: <span id="totalSizeInfo">0 КБ</span></div>
                    <div>Последнее обновление: <span id="lastUpdateInfo">${new Date().toLocaleString()}</span></div>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(cleanupTab);
    updateCleanupStats();
}

function updateCleanupStats() {
    const products = getProducts();
    const specials = getSpecials();
    const parts = getParts();
    
    // Находим некорректные товары
    const invalidProducts = products.filter(p => !p.model || !p.article || !p.price);
    document.getElementById('invalidProductsCount').innerHTML = 
        `${invalidProducts.length} шт.`;
    
    // Находим дубликаты артикулов
    const articleCount = {};
    products.forEach(p => {
        if (p.article) {
            articleCount[p.article] = (articleCount[p.article] || 0) + 1;
        }
    });
    
    const duplicates = Object.entries(articleCount)
        .filter(([_, count]) => count > 1)
        .length;
    
    document.getElementById('duplicateProductsCount').innerHTML = 
        `${duplicates} дубликатов`;
    
    // Обновляем системную информацию
    document.getElementById('totalProductsInfo').textContent = products.length;
    document.getElementById('totalSpecialsInfo').textContent = specials.length;
    document.getElementById('totalPartsInfo').textContent = parts.length;
    document.getElementById('totalSizeInfo').textContent = getDataSize() + ' КБ';
}

function getDataSize() {
    let total = 0;
    ['products', 'specials', 'parts'].forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            total += new Blob([data]).size;
        }
    });
    return Math.round(total / 1024 * 100) / 100;
}

// ===== ОПЕРАЦИИ ОЧИСТКИ =====
function cleanInvalidProducts() {
    const products = getProducts();
    const validProducts = products.filter(p => p.model && p.article && p.price);
    const removedCount = products.length - validProducts.length;
    
    if (removedCount === 0) {
        alert('Некорректных товаров не найдено!');
        return;
    }
    
    if (confirm(`Удалить ${removedCount} некорректных товаров?`)) {
        saveProducts(validProducts);
        loadProducts();
        updateStats();
        updateCleanupStats();
        alert(`Удалено ${removedCount} некорректных товаров`);
    }
}

function cleanDuplicateProducts() {
    const products = getProducts();
    const seen = new Set();
    const uniqueProducts = [];
    const duplicates = [];
    
    products.forEach(product => {
        const key = product.article?.toLowerCase();
        if (key && !seen.has(key)) {
            seen.add(key);
            uniqueProducts.push(product);
        } else {
            duplicates.push(product);
        }
    });
    
    if (duplicates.length === 0) {
        alert('Дубликатов не найдено!');
        return;
    }
    
    if (confirm(`Найдено ${duplicates.length} дубликатов. Удалить их?`)) {
        saveProducts(uniqueProducts);
        loadProducts();
        updateStats();
        updateCleanupStats();
        alert(`Удалено ${duplicates.length} дубликатов`);
    }
}

// ===== ЭКСПОРТ/ИМПОРТ ДАННЫХ =====
function exportData() {
    const data = {
        products: getProducts(),
        specials: getSpecials(),
        parts: getParts(),
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `site-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Данные успешно экспортированы!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm('ВНИМАНИЕ! Импорт данных перезапишет текущие. Продолжить?')) {
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Проверяем структуру данных
            if (data.products && Array.isArray(data.products)) {
                saveProducts(data.products);
            }
            if (data.specials && Array.isArray(data.specials)) {
                saveSpecials(data.specials);
            }
            if (data.parts && Array.isArray(data.parts)) {
                saveParts(data.parts);
            }
            
            // Обновляем интерфейс
            loadData();
            updateStats();
            updateCleanupStats();
            
            alert('Данные успешно импортированы!');
        } catch (error) {
            alert('Ошибка при импорте данных: ' + error.message);
        }
        
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

function createBackup() {
    exportData();
}

function clearAllData() {
    if (!confirm('ВНИМАНИЕ! Это удалит ВСЕ данные: товары, спецпредложения, запчасти. Действие необратимо!')) {
        return;
    }
    
    const password = prompt('Для подтверждения введите пароль "УДАЛИТЬ":');
    if (password !== 'УДАЛИТЬ') {
        alert('Отменено: неверный пароль');
        return;
    }
    
    localStorage.removeItem('products');
    localStorage.removeItem('specials');
    localStorage.removeItem('parts');
    
    loadData();
    updateStats();
    updateCleanupStats();
    
    alert('Все данные были удалены!');
}

// ===== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ИНТЕРФЕЙСА =====
function searchProducts() {
    const searchTerm = document.getElementById('productSearch')?.value.toLowerCase() || '';
    const tbody = document.getElementById('productsTableBody');
    const products = getProducts();
    
    if (!tbody) return;
    
    if (!searchTerm) {
        loadProducts();
        return;
    }
    
    const filteredProducts = products.filter(product => 
        product.model?.toLowerCase().includes(searchTerm) ||
        product.article?.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
    );
    
    tbody.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; display: block;"></i>
                    <p>Товары не найдены</p>
                </td>
            </tr>
        `;
        return;
    }
    
    filteredProducts.forEach(product => {
        const imageUrl = product.images && product.images.length > 0 ? 
            product.images[0] : '';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="product-image-admin">
                    ${imageUrl ? 
                        `<img src="${imageUrl}" alt="${product.model}">` : 
                        `<i class="fas fa-truck"></i>`
                    }
                </div>
            </td>
            <td>
                <strong>${product.model}</strong>
                ${product.brand ? `<div style="font-size:12px;color:#6b7280;">${product.brand}</div>` : ''}
            </td>
            <td>${product.article}</td>
            <td>
                <span style="padding:4px 8px;background:#e0f2fe;color:#0369a1;border-radius:4px;font-size:12px;">
                    ${getCategoryName(product.category)}
                </span>
            </td>
            <td>${formatPrice(product.price)} ₽</td>
            <td>
                <span style="color:${product.inStock ? '#10b981' : '#f59e0b'}">
                    ${product.inStock ? 'В наличии' : 'Под заказ'}
                </span>
            </td>
            <td>
                <div class="action-buttons-small">
                    <button class="btn-sm btn-edit" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-sm btn-delete" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Добавляем поддержку клавиши Enter в поиске
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
    }
});

// Обновляем статистику каждые 30 секунд
setInterval(() => {
    if (document.getElementById('cleanupTab')?.classList.contains('active')) {
        updateCleanupStats();
    }
}, 30000);

console.log('Админ-панель инициализирована полностью');

// ===== ЭКСПОРТ ДАННЫХ =====
function exportAllData() {
    const modal = document.createElement('div');
    modal.id = 'exportModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;';
    modal.innerHTML = `
        <div style="background:white;padding:40px;border-radius:20px;max-width:500px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
            <div style="text-align:center;margin-bottom:30px;">
                <div style="width:60px;height:60px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;">
                    <i class="fas fa-download" style="font-size:24px;color:white;"></i>
                </div>
                <h2 style="margin:0 0 10px;color:#1f2937;">Экспорт данных</h2>
                <p style="color:#6b7280;margin:0;font-size:14px;">Выберите формат для экспорта</p>
            </div>
            <div style="display:flex;flex-direction:column;gap:15px;">
                <button onclick="exportToJSON()" style="padding:15px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:white;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;">
                    <i class="fas fa-file-code"></i> Экспорт в JSON
                </button>
                <button onclick="exportToCSV()" style="padding:15px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;">
                    <i class="fas fa-file-csv"></i> Экспорт в CSV
                </button>
                <button onclick="document.getElementById('exportModal').remove()" style="padding:15px;background:#f3f4f6;color:#374151;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;">
                    <i class="fas fa-times"></i> Отмена
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function exportToJSON() {
    const data = {
        products: JSON.parse(localStorage.getItem('japanTruckProducts') || '[]'),
        specials: JSON.parse(localStorage.getItem('japanTruckSpecials') || '[]'),
        parts: JSON.parse(localStorage.getItem('japanTruckParts') || '[]'),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `japan_truck_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    document.getElementById('exportModal')?.remove();
    alert('✅ Данные успешно экспортированы в JSON!');
}

function exportToCSV() {
    const products = JSON.parse(localStorage.getItem('japanTruckProducts') || '[]');
    
    let csv = 'ID,Артикул,Модель,Категория,Бренд,Год,Цена,Старая цена,В наличии,Описание\n';
    
    products.forEach(p => {
        csv += `${p.id},"${p.article || ''}","${p.model || ''}","${p.category || ''}","${p.brand || ''}",${p.year || ''},${p.price || 0},${p.oldPrice || ''},${p.inStock ? 'Да' : 'Нет'},"${(p.description || '').replace(/"/g, '""')}"\n`;
    });
    
    const blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `japan_truck_products_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    document.getElementById('exportModal')?.remove();
    alert('✅ Товары успешно экспортированы в CSV!');
}

// ===== ВКЛАДКА ОЧИСТКИ =====
function cleanupLogs() {
    if (!confirm('Удалить логи старше 30 дней?')) return;
    
    const logs = JSON.parse(localStorage.getItem('admin_logs') || '[]');
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const filtered = logs.filter(log => {
        const logDate = new Date(log.timestamp || log).getTime();
        return logDate > thirtyDaysAgo;
    });
    
    localStorage.setItem('admin_logs', JSON.stringify(filtered));
    alert(`✅ Удалено ${logs.length - filtered.length} старых записей`);
}

function optimizeImages() {
    alert('🖼 Оптимизация изображений запущена.\nВ демо-режиме эта функция недоступна.');
}

function cleanupDatabase() {
    if (!confirm('Очистить неиспользуемые данные из базы?')) return;
    
    // Очистка удалённых товаров старше 30 дней
    const deleted = JSON.parse(localStorage.getItem('deletedProducts') || '[]');
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const remaining = deleted.filter(item => {
        return item.deletedAt && new Date(item.deletedAt).getTime() > thirtyDaysAgo;
    });
    
    localStorage.setItem('deletedProducts', JSON.stringify(remaining));
    alert(`✅ База данных очищена. Удалено ${deleted.length - remaining.length} записей.`);
}

// ===== DRAG & DROP ЗАГРУЗКА ФОТО =====
let uploadedImages = [];

document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
            dropZone.addEventListener(event, preventDefaults);
        });
        
        ['dragenter', 'dragover'].forEach(event => {
            dropZone.addEventListener(event, () => dropZone.classList.add('drag-over'));
        });
        
        ['dragleave', 'drop'].forEach(event => {
            dropZone.addEventListener(event, () => dropZone.classList.remove('drag-over'));
        });
        
        dropZone.addEventListener('drop', handleDrop);
    }
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const files = e.dataTransfer.files;
    handleFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    [...files].forEach(file => {
        if (!file.type.match('image/(jpeg|png)')) {
            alert('❌ Разрешены только JPG и PNG файлы');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('❌ Файл слишком большой (max 5MB)');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImages.push(e.target.result);
            updateImagePreview();
        };
        reader.readAsDataURL(file);
    });
}

function updateImagePreview() {
    const preview = document.getElementById('productImagesPreview');
    if (!preview) return;
    
    preview.innerHTML = uploadedImages.map((img, i) => `
        <div style="position:relative;display:inline-block;margin:5px;">
            <img src="${img}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;border:2px solid #e5e7eb;">
            <button type="button" onclick="removeImage(${i})" style="position:absolute;top:-8px;right:-8px;width:24px;height:24px;background:#ef4444;color:white;border:none;border-radius:50%;cursor:pointer;font-size:12px;">×</button>
        </div>
    `).join('');
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    updateImagePreview();
}

// ===== SOFT DELETE =====
function deleteProduct(id) {
    if (!confirm('Удалить товар? Он будет храниться 30 дней в корзине.')) return;
    
    const products = JSON.parse(localStorage.getItem('japanTruckProducts') || '[]');
    const product = products.find(p => p.id === id);
    
    if (product) {
        // Помечаем как удалённый
        product.deletedAt = new Date().toISOString();
        
        // Переносим в корзину
        const deleted = JSON.parse(localStorage.getItem('deletedProducts') || '[]');
        deleted.push(product);
        localStorage.setItem('deletedProducts', JSON.stringify(deleted));
        
        // Удаляем из основного списка
        const remaining = products.filter(p => p.id !== id);
        localStorage.setItem('japanTruckProducts', JSON.stringify(remaining));
        
        alert('✅ Товар перемещён в корзину на 30 дней');
        displayAdminProducts();
        logAction('Товар удалён: ' + product.model);
    }
}

function restoreProduct(id) {
    const deleted = JSON.parse(localStorage.getItem('deletedProducts') || '[]');
    const product = deleted.find(p => p.id === id);
    
    if (product) {
        delete product.deletedAt;
        
        // Возвращаем в основной список
        const products = JSON.parse(localStorage.getItem('japanTruckProducts') || '[]');
        products.push(product);
        localStorage.setItem('japanTruckProducts', JSON.stringify(products));
        
        // Удаляем из корзины
        const remaining = deleted.filter(p => p.id !== id);
        localStorage.setItem('deletedProducts', JSON.stringify(remaining));
        
        alert('✅ Товар восстановлен');
        displayAdminProducts();
        logAction('Товар восстановлен: ' + product.model);
    }
}

function permanentDelete(id) {
    if (!confirm('Удалить товар НАВСЕГДА? Это действие необратимо!')) return;
    
    const deleted = JSON.parse(localStorage.getItem('deletedProducts') || '[]');
    const product = deleted.find(p => p.id === id);
    const remaining = deleted.filter(p => p.id !== id);
    localStorage.setItem('deletedProducts', JSON.stringify(remaining));
    
    alert('✅ Товар удалён навсегда');
    displayAdminProducts();
    if (product) logAction('Товар удалён навсегда: ' + product.model);
}

// ===== ЛОГИРОВАНИЕ =====
function logAction(action) {
    const logs = JSON.parse(localStorage.getItem('admin_logs') || '[]');
    logs.push({
        timestamp: new Date().toISOString(),
        action: action,
        ip: 'local'
    });
    if (logs.length > 500) logs.shift();
    localStorage.setItem('admin_logs', JSON.stringify(logs));
}

// ===== СОХРАНЕНИЕ ТОВАРА =====
function saveProduct() {
    const article = document.getElementById('productArticle')?.value;
    const model = document.getElementById('productModel')?.value;
    const category = document.getElementById('productCategory')?.value;
    const price = document.getElementById('productPrice')?.value;
    
    if (!article || !model || !category || !price) {
        alert('❌ Заполните обязательные поля');
        return;
    }
    
    const products = JSON.parse(localStorage.getItem('japanTruckProducts') || '[]');
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    
    const product = {
        id: newId,
        article,
        model,
        category,
        brand: document.getElementById('productBrand')?.value || '',
        year: parseInt(document.getElementById('productYear')?.value) || null,
        capacity: parseFloat(document.getElementById('productCapacity')?.value) || null,
        boom: parseFloat(document.getElementById('productBoom')?.value) || null,
        price: parseInt(price),
        oldPrice: parseInt(document.getElementById('productOldPrice')?.value) || null,
        inStock: document.getElementById('productInStock')?.value === 'true',
        description: document.getElementById('productDescription')?.value || '',
        images: uploadedImages.length > 0 ? uploadedImages : []
    };
    
    products.push(product);
    localStorage.setItem('japanTruckProducts', JSON.stringify(products));
    
    clearProductForm();
    alert('✅ Товар успешно добавлен!');
    displayAdminProducts();
    logAction('Добавлен товар: ' + model);
}

function clearProductForm() {
    document.getElementById('productForm')?.reset();
    uploadedImages = [];
    updateImagePreview();
    showToast('Форма очищена', 'Все поля сброшены', 'info');
}

// ===== ТАБЫ =====
function switchTab(tabName) {
    // Убираем active со всех кнопок и контента
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Добавляем active на нужные элементы
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    document.getElementById(tabName + 'Tab')?.classList.add('active');
    
    // Загружаем данные для таба
    if (tabName === 'products') displayAdminProducts();
    if (tabName === 'customorder') loadCustomOrderText();
    if (tabName === 'generators') displayGenerators();
}

// ===== ОТОБРАЖЕНИЕ ТОВАРОВ =====
function displayAdminProducts() {
    const products = JSON.parse(localStorage.getItem('japanTruckProducts') || '[]');
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#9ca3af;">Нет товаров. Добавьте первый товар!</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>
                <div class="product-image-admin">
                    ${p.images && p.images[0] ? `<img src="${p.images[0]}" alt="${p.model}">` : '<i class="fas fa-truck"></i>'}
                </div>
            </td>
            <td><strong>${p.model || 'Без названия'}</strong></td>
            <td>${p.article || '-'}</td>
            <td>${getCategoryName(p.category)}</td>
            <td><strong style="color:#f97316;">${formatPrice(p.price)} ₽</strong></td>
            <td><span style="background:${p.inStock ? '#d1fae5' : '#fef3c7'};color:${p.inStock ? '#059669' : '#d97706'};padding:4px 10px;border-radius:20px;font-size:12px;">${p.inStock ? 'В наличии' : 'Под заказ'}</span></td>
            <td>
                <div class="action-buttons-small">
                    <button class="btn-sm btn-edit" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="btn-sm btn-delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function editProduct(id) {
    const products = JSON.parse(localStorage.getItem('japanTruckProducts') || '[]');
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    document.getElementById('productArticle').value = product.article || '';
    document.getElementById('productModel').value = product.model || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productBrand').value = product.brand || '';
    document.getElementById('productYear').value = product.year || '';
    document.getElementById('productCapacity').value = product.capacity || '';
    document.getElementById('productBoom').value = product.boom || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productOldPrice').value = product.oldPrice || '';
    document.getElementById('productInStock').value = product.inStock ? 'true' : 'false';
    document.getElementById('productDescription').value = product.description || '';
    
    uploadedImages = product.images || [];
    updateImagePreview();
    
    // Удаляем товар чтобы пересохранить
    const remaining = products.filter(p => p.id !== id);
    localStorage.setItem('japanTruckProducts', JSON.stringify(remaining));
    
    window.scrollTo({top: 0, behavior: 'smooth'});
    showToast('Редактирование', 'Товар загружен в форму', 'info');
}

// ===== ПОД ЗАКАЗ =====
function loadCustomOrderText() {
    const text = localStorage.getItem('customOrderText') || `Мы осуществляем поставки спецтехники из Японии под заказ. Если вы не нашли нужную технику в нашем каталоге, мы можем привезти её специально для вас.

Работаем напрямую с японскими аукционами и поставщиками, что позволяет нам предложить лучшие цены и гарантировать качество техники.

Срок поставки: от 30 до 60 дней в зависимости от типа техники и логистики.

Предоплата: 30-50% от стоимости заказа.

Гарантия: 1 год на всю технику.`;
    document.getElementById('customOrderTextEdit').value = text;
}

function saveCustomOrderText() {
    const text = document.getElementById('customOrderTextEdit').value;
    localStorage.setItem('customOrderText', text);
    showToast('Сохранено', 'Текст страницы "ПОД ЗАКАЗ" обновлён', 'success');
    logAction('Обновлён текст страницы ПОД ЗАКАЗ');
}

// ===== ГЕНЕРАТОРЫ =====
function addGenerator() {
    const name = document.getElementById('generatorName').value;
    const price = document.getElementById('generatorPrice').value;
    const description = document.getElementById('generatorDescription').value;
    const image = document.getElementById('generatorImage').value;
    
    if (!name || !price) {
        showToast('Ошибка', 'Заполните название и цену', 'error');
        return;
    }
    
    const generators = JSON.parse(localStorage.getItem('japanTruckGenerators') || '[]');
    const newId = generators.length > 0 ? Math.max(...generators.map(g => g.id)) + 1 : 1;
    
    generators.push({
        id: newId,
        name,
        price: parseInt(price),
        description,
        image
    });
    
    localStorage.setItem('japanTruckGenerators', JSON.stringify(generators));
    
    // Очищаем форму
    document.getElementById('generatorName').value = '';
    document.getElementById('generatorPrice').value = '';
    document.getElementById('generatorDescription').value = '';
    document.getElementById('generatorImage').value = '';
    
    displayGenerators();
    showToast('Добавлено', 'Генератор добавлен в каталог', 'success');
    logAction('Добавлен генератор: ' + name);
}

function displayGenerators() {
    const generators = JSON.parse(localStorage.getItem('japanTruckGenerators') || '[]');
    const container = document.getElementById('generatorsList');
    if (!container) return;
    
    if (generators.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:40px;">Нет генераторов. Добавьте первый!</p>';
        return;
    }
    
    container.innerHTML = generators.map(g => `
        <div class="editor-item" style="display:flex;align-items:center;gap:20px;margin-bottom:15px;">
            <div style="width:80px;height:80px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                ${g.image ? `<img src="${g.image}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-bolt" style="font-size:30px;color:#d1d5db;"></i>'}
            </div>
            <div style="flex:1;">
                <h4 style="margin:0 0 5px;">${g.name}</h4>
                <p style="margin:0;color:#6b7280;font-size:14px;">${g.description || 'Без описания'}</p>
                <strong style="color:#f97316;">${formatPrice(g.price)} ₽</strong>
            </div>
            <button class="btn-remove" onclick="deleteGenerator(${g.id})"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');
}

function deleteGenerator(id) {
    if (!confirm('Удалить генератор?')) return;
    const generators = JSON.parse(localStorage.getItem('japanTruckGenerators') || '[]');
    const remaining = generators.filter(g => g.id !== id);
    localStorage.setItem('japanTruckGenerators', JSON.stringify(remaining));
    displayGenerators();
    showToast('Удалено', 'Генератор удалён', 'success');
}

// ===== TOAST УВЕДОМЛЕНИЯ =====
function showToast(title, message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(container);
    }
    
    const icons = { success: 'check', error: 'times', info: 'info' };
    const colors = { success: '#10b981', error: '#ef4444', info: '#f97316' };
    
    const toast = document.createElement('div');
    toast.style.cssText = `background:white;padding:15px 20px;border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,0.15);display:flex;align-items:center;gap:12px;min-width:280px;border-left:4px solid ${colors[type]};animation:slideIn 0.3s ease;`;
    toast.innerHTML = `
        <div style="width:36px;height:36px;border-radius:50%;background:${colors[type]}20;display:flex;align-items:center;justify-content:center;">
            <i class="fas fa-${icons[type]}" style="color:${colors[type]};"></i>
        </div>
        <div style="flex:1;">
            <div style="font-weight:600;color:#1f2937;">${title}</div>
            <div style="font-size:14px;color:#6b7280;">${message}</div>
        </div>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    displayAdminProducts();
    displaySpecials();
});

// Экспорт функций
window.switchTab = switchTab;
window.displayAdminProducts = displayAdminProducts;
window.editProduct = editProduct;
window.loadCustomOrderText = loadCustomOrderText;
window.saveCustomOrderText = saveCustomOrderText;
window.addGenerator = addGenerator;
window.displayGenerators = displayGenerators;
window.deleteGenerator = deleteGenerator;
window.showToast = showToast;
window.exportAllData = exportAllData;
window.exportToJSON = exportToJSON;
window.exportToCSV = exportToCSV;
window.cleanupLogs = cleanupLogs;
window.optimizeImages = optimizeImages;
window.handleFileSelect = handleFileSelect;
window.removeImage = removeImage;
window.deleteProduct = deleteProduct;
window.restoreProduct = restoreProduct;
window.permanentDelete = permanentDelete;
window.saveProduct = saveProduct;
window.clearProductForm = clearProductForm;
window.previewProduct = previewProduct;
window.viewProduct = viewProduct;
window.addSpecial = addSpecial;
window.displaySpecials = displaySpecials;
window.deleteSpecial = deleteSpecial;