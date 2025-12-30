# Конфигурация Telegram-бота JAPAN TRUCK

# Токен бота (получить у @BotFather)
BOT_TOKEN = "8494003030:AAE0ICiW4M6I1RWz5JLO35qyRze6-UJca00"

# ID администратора (получить у @userinfobot)
ADMIN_CHAT_ID = 8510341773

# Белый список chat_id для управления
ALLOWED_CHAT_IDS = [ADMIN_CHAT_ID]

# URL сайта
SITE_URL = "https://gdexd.github.io/JTRUCK.io/"
API_URL = f"{SITE_URL}/api"

# Настройки уведомлений
NOTIFICATIONS = {
    "password_change": True,
    "login_attempt": True,
    "new_order": True,
    "cleanup": True
}

# Время жизни токена подтверждения (в секундах)
CONFIRMATION_TOKEN_TTL = 60

# Пути к файлам
DATA_DIR = "../api/data"
LOGS_FILE = f"{DATA_DIR}/admin_logs.json"