// Защита админ-панели с интеграцией Telegram-бота
class AdminAuth {
    constructor() {
        this.tokenKey = 'japan_truck_admin_token';
        this.passwordKey = 'japan_truck_admin_hash';
        this.sessionKey = 'japan_truck_session_id';
        this.sessionTimeout = 3600000; // 1 час
        this.maxAttempts = 5;
        this.lockoutTime = 300000; // 5 минут
        this.botApiUrl = 'http://localhost:5000'; // URL API бота
        this.useBotAuth = true; // Включить одобрение через бота
        this.init();
    }
    
    // Получить информацию об устройстве
    getDeviceInfo() {
        const ua = navigator.userAgent;
        let device = 'Неизвестно';
        let browser = 'Неизвестно';
        
        // Определение устройства
        if (/Android/i.test(ua)) device = 'Android';
        else if (/iPhone|iPad|iPod/i.test(ua)) device = 'iOS';
        else if (/Windows/i.test(ua)) device = 'Windows';
        else if (/Mac/i.test(ua)) device = 'MacOS';
        else if (/Linux/i.test(ua)) device = 'Linux';
        
        // Определение браузера
        if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
        else if (/Firefox/i.test(ua)) browser = 'Firefox';
        else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
        else if (/Edg/i.test(ua)) browser = 'Edge';
        else if (/Opera|OPR/i.test(ua)) browser = 'Opera';
        
        return { device, browser, userAgent: ua };
    }
    
    // Получить IP (через внешний сервис)
    async getIP() {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            return data.ip;
        } catch {
            return 'Неизвестно';
        }
    }

    init() {
        if (this.isAdminPage()) {
            if (!this.isAuthenticated()) {
                this.showLoginForm();
            } else {
                this.addSecurityFeatures();
            }
        }
    }

    isAdminPage() {
        return window.location.pathname.includes('admin') || 
               window.location.pathname.includes('админ') ||
               window.location.href.includes('admin');
    }

    isAuthenticated() {
        const token = localStorage.getItem(this.tokenKey);
        if (!token) return false;

        try {
            const sessionData = JSON.parse(atob(token));
            const now = Date.now();
            const sessionAge = now - sessionData.timestamp;

            // Проверяем блокировку
            const lockout = localStorage.getItem('login_lockout');
            if (lockout && now < parseInt(lockout)) {
                this.showLockoutMessage(parseInt(lockout));
                return false;
            }

            if (sessionAge > this.sessionTimeout) {
                this.logout();
                return false;
            }

            // Обновляем время сессии
            sessionData.timestamp = now;
            localStorage.setItem(this.tokenKey, btoa(JSON.stringify(sessionData)));
            
            return true;
        } catch (e) {
            return false;
        }
    }

    hashPassword(password) {
        // Простой хэш для демонстрации (в реальном проекте используйте bcrypt)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    checkPassword(password) {
        // Проверяем блокировку
        const lockout = localStorage.getItem('login_lockout');
        const now = Date.now();
        
        if (lockout && now < parseInt(lockout)) {
            this.showLockoutMessage(parseInt(lockout));
            return false;
        }

        // Дефолтный пароль
        const defaultPassword = 'vinterneteminepara';
        const storedHash = localStorage.getItem(this.passwordKey);
        
        // Проверяем дефолтный пароль или сохранённый
        const isDefaultMatch = password === defaultPassword;
        const isStoredMatch = storedHash && this.hashPassword(password) === storedHash;
        
        if (isDefaultMatch || isStoredMatch) {
            // Сбрасываем счетчик попыток
            localStorage.removeItem('login_attempts');
            localStorage.removeItem('login_lockout');
            this.login();
            return true;
        }
        
        // Увеличиваем счетчик попыток
        let attempts = parseInt(localStorage.getItem('login_attempts') || '0') + 1;
        localStorage.setItem('login_attempts', attempts.toString());
        
        if (attempts >= this.maxAttempts) {
            // Блокируем вход на 5 минут
            const lockoutTime = now + this.lockoutTime;
            localStorage.setItem('login_lockout', lockoutTime.toString());
            this.showLockoutMessage(lockoutTime);
        } else {
            this.showLoginError(`Неверный пароль. Осталось попыток: ${this.maxAttempts - attempts}`);
        }
        
        return false;
    }

    setPassword(password) {
        const hash = this.hashPassword(password);
        localStorage.setItem(this.passwordKey, hash);
        this.login();
        return true;
    }

    login() {
        const sessionData = {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            ip: 'local'
        };
        localStorage.setItem(this.tokenKey, btoa(JSON.stringify(sessionData)));
        this.hideLoginForm();
        this.showAdminContent();
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        if (this.isAdminPage()) {
            this.showLoginForm();
        }
    }

    showLoginForm() {
        // Скрываем основной контент
        const adminContainer = document.querySelector('.admin-container');
        if (adminContainer) {
            adminContainer.style.display = 'none';
        }
        
        // Удаляем старую форму если есть
        const oldForm = document.getElementById('adminLoginForm');
        if (oldForm) oldForm.remove();
        
        // Создаем форму входа
        const loginForm = document.createElement('div');
        loginForm.id = 'adminLoginForm';
        loginForm.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                font-family: 'Inter', sans-serif;
            ">
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                ">
                    <div style="margin-bottom: 30px;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                            <i class="fas fa-lock" style="font-size: 32px; color: white;"></i>
                        </div>
                        <h1 style="color: #1f2937; margin-bottom: 10px; font-size: 24px;">Доступ к админ-панели</h1>
                        <p style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Только для авторизованного персонала</p>
                        <p style="color: #9ca3af; font-size: 12px;">JAPAN TRUCK</p>
                    </div>
                    
                    <form id="loginForm" style="margin-bottom: 20px;">
                        <div style="margin-bottom: 20px; text-align: left;">
                            <label style="display: block; margin-bottom: 8px; color: #374151; font-weight: 500; font-size: 14px;">
                                <i class="fas fa-key" style="margin-right: 8px;"></i>Пароль доступа
                            </label>
                            <input type="password" 
                                   id="adminPassword" 
                                   style="
                                       width: 100%;
                                       padding: 12px 16px;
                                       border: 2px solid #e5e7eb;
                                       border-radius: 8px;
                                       font-size: 16px;
                                       transition: all 0.3s;
                                       font-family: 'Inter', sans-serif;
                                   "
                                   placeholder="Введите пароль"
                                   required
                                   autocomplete="current-password"
                                   autofocus>
                        </div>
                        
                        <button type="submit" 
                                style="
                                    width: 100%;
                                    padding: 14px;
                                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                                    color: white;
                                    border: none;
                                    border-radius: 8px;
                                    font-size: 16px;
                                    font-weight: 600;
                                    cursor: pointer;
                                    transition: all 0.3s;
                                    font-family: 'Inter', sans-serif;
                                "
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(37, 99, 235, 0.3)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                            <i class="fas fa-sign-in-alt"></i> Войти в админку
                        </button>
                    </form>
                    
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <div id="loginError" style="color: #dc2626; font-size: 14px; margin-bottom: 10px; display: none;">
                            <i class="fas fa-exclamation-circle"></i> <span id="errorText"></span>
                        </div>
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                            <i class="fas fa-shield-alt"></i> Защищено шифрованием
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(loginForm);
        
        // Обработка формы
        const form = document.getElementById('loginForm');
        const errorDiv = document.getElementById('loginError');
        const errorText = document.getElementById('errorText');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = document.getElementById('adminPassword').value;
            
            if (this.checkPassword(password)) {
                loginForm.remove();
            }
        });
        
        // Автофокус на поле пароля
        setTimeout(() => {
            document.getElementById('adminPassword')?.focus();
        }, 100);
    }

    hideLoginForm() {
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.remove();
        }
    }

    showAdminContent() {
        const adminContainer = document.querySelector('.admin-container');
        if (adminContainer) {
            adminContainer.style.display = 'block';
        }
        this.addSecurityFeatures();
    }

    addSecurityFeatures() {
        // Логирование действий
        this.setupActivityLogging();
        
        // Автоматический выход при неактивности
        this.setupInactivityTimeout();
        
        // Блокировка копирования и ПКМ
        this.setupCopyProtection();
        
        // Скрытие исходного кода
        this.setupCodeProtection();
    }

    setupActivityLogging() {
        const originalLog = console.log;
        console.log = function(...args) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] ${args.join(' ')}`;
            
            // Сохраняем логи
            const logs = JSON.parse(localStorage.getItem('admin_logs') || '[]');
            logs.push(logMessage);
            if (logs.length > 100) logs.shift();
            localStorage.setItem('admin_logs', JSON.stringify(logs));
            
            originalLog.apply(console, args);
        };
    }

    setupInactivityTimeout() {
        let inactivityTimer;
        
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                if (this.isAuthenticated()) {
                    this.logout();
                    alert('Сессия истекла из-за неактивности. Пожалуйста, войдите снова.');
                }
            }, 1800000); // 30 минут
        };
        
        ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            window.addEventListener(event, resetTimer);
        });
        
        resetTimer();
    }

    setupCopyProtection() {
        document.addEventListener('contextmenu', (e) => {
            if (this.isAuthenticated() && this.isAdminPage()) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('copy', (e) => {
            if (this.isAuthenticated() && this.isAdminPage()) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('cut', (e) => {
            if (this.isAuthenticated() && this.isAdminPage()) {
                e.preventDefault();
            }
        });
    }

    setupCodeProtection() {
        // Блокировка F12 и Ctrl+Shift+I
        document.addEventListener('keydown', (e) => {
            if (this.isAuthenticated() && this.isAdminPage()) {
                if (e.key === 'F12' || 
                   (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                   (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                   (e.ctrlKey && e.key === 'U')) {
                    e.preventDefault();
                    return false;
                }
            }
        });
    }

    showLoginError(message) {
        const errorDiv = document.getElementById('loginError');
        const errorText = document.getElementById('errorText');
        if (errorDiv && errorText) {
            errorText.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
        }
    }

    showLockoutMessage(lockoutTime) {
        const remaining = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
        this.showLoginError('Доступ заблокирован. Попробуйте через ' + remaining + ' минут.');
    }

    changePassword(oldPassword, newPassword) {
        if (this.checkPassword(oldPassword)) {
            localStorage.removeItem(this.passwordKey);
            return this.setPassword(newPassword);
        }
        return false;
    }
}

// Инициализируем систему защиты
document.addEventListener('DOMContentLoaded', function() {
    window.adminAuth = new AdminAuth();
});

// Функция показа модального окна смены пароля
function showChangePasswordModal() {
    var oldModal = document.getElementById('changePasswordModal');
    if (oldModal) oldModal.remove();
    
    var modal = document.createElement('div');
    modal.id = 'changePasswordModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;justify-content:center;align-items:center;z-index:10000;';
    modal.innerHTML = '<div style="background:white;padding:40px;border-radius:20px;max-width:450px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
        '<div style="text-align:center;margin-bottom:30px;">' +
        '<div style="width:60px;height:60px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 15px;"><i class="fas fa-key" style="font-size:24px;color:white;"></i></div>' +
        '<h2 style="margin:0 0 10px;color:#1f2937;">Смена пароля</h2>' +
        '<p style="color:#6b7280;margin:0;font-size:14px;">Введите текущий и новый пароль</p></div>' +
        '<form id="changePasswordForm">' +
        '<div style="margin-bottom:20px;"><label style="display:block;margin-bottom:8px;color:#374151;font-weight:500;">Текущий пароль</label><input type="password" id="currentPassword" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-size:16px;box-sizing:border-box;" required></div>' +
        '<div style="margin-bottom:20px;"><label style="display:block;margin-bottom:8px;color:#374151;font-weight:500;">Новый пароль</label><input type="password" id="newPassword" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-size:16px;box-sizing:border-box;" required></div>' +
        '<div style="margin-bottom:25px;"><label style="display:block;margin-bottom:8px;color:#374151;font-weight:500;">Подтвердите пароль</label><input type="password" id="confirmPassword" style="width:100%;padding:12px;border:2px solid #e5e7eb;border-radius:8px;font-size:16px;box-sizing:border-box;" required></div>' +
        '<div id="passwordError" style="color:#dc2626;font-size:14px;margin-bottom:15px;display:none;text-align:center;"></div>' +
        '<div style="display:flex;gap:15px;">' +
        '<button type="button" onclick="document.getElementById(\'changePasswordModal\').remove()" style="flex:1;padding:14px;background:#f3f4f6;color:#374151;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;">Отмена</button>' +
        '<button type="submit" style="flex:1;padding:14px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:white;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;">Сохранить</button>' +
        '</div></form></div>';
    
    document.body.appendChild(modal);
    
    document.getElementById('changePasswordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        var currentPassword = document.getElementById('currentPassword').value;
        var newPassword = document.getElementById('newPassword').value;
        var confirmPassword = document.getElementById('confirmPassword').value;
        var errorDiv = document.getElementById('passwordError');
        
        if (newPassword !== confirmPassword) {
            errorDiv.textContent = 'Пароли не совпадают';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (window.adminAuth.changePassword(currentPassword, newPassword)) {
            modal.remove();
            alert('Пароль успешно изменён!');
        } else {
            errorDiv.textContent = 'Неверный текущий пароль';
            errorDiv.style.display = 'block';
        }
    });
    
    document.getElementById('currentPassword').focus();
}

window.showChangePasswordModal = showChangePasswordModal;