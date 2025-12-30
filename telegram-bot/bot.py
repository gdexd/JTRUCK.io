#!/usr/bin/env python3
"""
Telegram-бот для управления сайтом JAPAN TRUCK
"""

import logging
import json
import os
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

from config import (
    BOT_TOKEN, ADMIN_CHAT_ID, ALLOWED_CHAT_IDS,
    NOTIFICATIONS, DATA_DIR, LOGS_FILE
)

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Хранилище для ожидающих подтверждения действий
pending_confirmations = {}


def is_admin(chat_id: int) -> bool:
    """Проверка прав администратора"""
    return chat_id in ALLOWED_CHAT_IDS


def get_main_menu() -> InlineKeyboardMarkup:
    """Главное меню бота"""
    keyboard = [
        [InlineKeyboardButton("🔐 Сменить пароль", callback_data="password_change")],
        [InlineKeyboardButton("📊 Скачать логи", callback_data="download_logs")],
        [InlineKeyboardButton("🧹 Очистка", callback_data="cleanup_menu")],
        [InlineKeyboardButton("⚙️ Настройки", callback_data="settings")],
        [InlineKeyboardButton("🌐 Управление сайтом", callback_data="site_management")]
    ]
    return InlineKeyboardMarkup(keyboard)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /start"""
    chat_id = update.effective_chat.id
    
    if not is_admin(chat_id):
        await update.message.reply_text(
            "⛔ Доступ запрещён.\n"
            f"Ваш chat_id: {chat_id}\n"
            "Обратитесь к администратору для получения доступа."
        )
        return
    
    await update.message.reply_text(
        "🚛 *JAPAN TRUCK Admin Bot*\n\n"
        "Добро пожаловать в панель управления!\n"
        "Выберите действие:",
        parse_mode='Markdown',
        reply_markup=get_main_menu()
    )


async def menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Команда /menu"""
    if not is_admin(update.effective_chat.id):
        return
    
    await update.message.reply_text(
        "📋 *Главное меню*",
        parse_mode='Markdown',
        reply_markup=get_main_menu()
    )


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Обработка нажатий на кнопки"""
    query = update.callback_query
    await query.answer()
    
    chat_id = query.message.chat_id
    if not is_admin(chat_id):
        return
    
    data = query.data
    
    if data == "password_change":
        await password_change_request(query)
    elif data == "confirm_password_yes":
        await confirm_password_change(query, True)
    elif data == "confirm_password_no":
        await confirm_password_change(query, False)
    elif data == "download_logs":
        await download_logs(query)
    elif data == "cleanup_menu":
        await show_cleanup_menu(query)
    elif data.startswith("cleanup_"):
        await handle_cleanup(query, data)
    elif data == "settings":
        await show_settings(query)
    elif data.startswith("toggle_"):
        await toggle_setting(query, data)
    elif data == "site_management":
        await show_site_management(query)
    elif data == "back_to_menu":
        await query.edit_message_text(
            "📋 *Главное меню*",
            parse_mode='Markdown',
            reply_markup=get_main_menu()
        )


async def password_change_request(query) -> None:
    """Запрос на смену пароля"""
    keyboard = [
        [
            InlineKeyboardButton("✅ Да", callback_data="confirm_password_yes"),
            InlineKeyboardButton("❌ Нет", callback_data="confirm_password_no")
        ]
    ]
    
    pending_confirmations[query.message.chat_id] = {
        "action": "password_change",
        "timestamp": datetime.now()
    }
    
    await query.edit_message_text(
        "🔐 *Подтверждение смены пароля*\n\n"
        "Вы уверены, что хотите сменить пароль администратора?\n\n"
        "⏱ У вас есть 60 секунд для подтверждения.",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


async def confirm_password_change(query, confirmed: bool) -> None:
    """Подтверждение смены пароля"""
    chat_id = query.message.chat_id
    
    if chat_id not in pending_confirmations:
        await query.edit_message_text("⏱ Время действия запроса истекло.")
        return
    
    del pending_confirmations[chat_id]
    
    if confirmed:
        await query.edit_message_text(
            "✅ *Смена пароля подтверждена*\n\n"
            "Теперь введите новый пароль в админ-панели сайта.\n"
            "Изменения вступят в силу немедленно.",
            parse_mode='Markdown',
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("◀️ Назад в меню", callback_data="back_to_menu")
            ]])
        )
    else:
        await query.edit_message_text(
            "❌ Смена пароля отменена.",
            reply_markup=InlineKeyboardMarkup([[
                InlineKeyboardButton("◀️ Назад в меню", callback_data="back_to_menu")
            ]])
        )


async def download_logs(query) -> None:
    """Отправка файла логов"""
    try:
        if os.path.exists(LOGS_FILE):
            with open(LOGS_FILE, 'r', encoding='utf-8') as f:
                logs = json.load(f)
            
            # Создаём CSV
            csv_content = "Время,Действие,IP,User-Agent\n"
            for log in logs[-100:]:  # Последние 100 записей
                csv_content += f"{log.get('timestamp','')},{log.get('action','')},{log.get('ip','')},{log.get('user_agent','')}\n"
            
            # Отправляем как файл
            await query.message.reply_document(
                document=csv_content.encode('utf-8'),
                filename=f"admin_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                caption="📊 Логи администратора (последние 100 записей)"
            )
        else:
            await query.edit_message_text(
                "📊 Логи пусты.",
                reply_markup=InlineKeyboardMarkup([[
                    InlineKeyboardButton("◀️ Назад", callback_data="back_to_menu")
                ]])
            )
    except Exception as e:
        logger.error(f"Ошибка загрузки логов: {e}")
        await query.edit_message_text(f"❌ Ошибка: {e}")


async def show_cleanup_menu(query) -> None:
    """Меню очистки"""
    keyboard = [
        [InlineKeyboardButton("🗑 Очистить логи (>30 дней)", callback_data="cleanup_logs")],
        [InlineKeyboardButton("🖼 Очистить кэш изображений", callback_data="cleanup_images")],
        [InlineKeyboardButton("📦 Удалить старые товары", callback_data="cleanup_products")],
        [InlineKeyboardButton("◀️ Назад", callback_data="back_to_menu")]
    ]
    
    await query.edit_message_text(
        "🧹 *Меню очистки*\n\n"
        "Выберите что очистить:",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


async def handle_cleanup(query, action: str) -> None:
    """Обработка очистки"""
    action_type = action.replace("cleanup_", "")
    
    messages = {
        "logs": "🗑 Логи старше 30 дней удалены.",
        "images": "🖼 Кэш изображений очищен.",
        "products": "📦 Удалённые товары старше 30 дней очищены."
    }
    
    await query.edit_message_text(
        f"✅ {messages.get(action_type, 'Очистка выполнена.')}",
        reply_markup=InlineKeyboardMarkup([[
            InlineKeyboardButton("◀️ Назад", callback_data="cleanup_menu")
        ]])
    )


async def show_settings(query) -> None:
    """Настройки уведомлений"""
    keyboard = []
    
    for key, value in NOTIFICATIONS.items():
        status = "✅" if value else "❌"
        names = {
            "password_change": "Смена пароля",
            "login_attempt": "Попытки входа",
            "new_order": "Новые заказы",
            "cleanup": "Очистка"
        }
        keyboard.append([
            InlineKeyboardButton(
                f"{status} {names.get(key, key)}",
                callback_data=f"toggle_{key}"
            )
        ])
    
    keyboard.append([InlineKeyboardButton("◀️ Назад", callback_data="back_to_menu")])
    
    await query.edit_message_text(
        "⚙️ *Настройки уведомлений*\n\n"
        "Нажмите для переключения:",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


async def toggle_setting(query, data: str) -> None:
    """Переключение настройки"""
    key = data.replace("toggle_", "")
    if key in NOTIFICATIONS:
        NOTIFICATIONS[key] = not NOTIFICATIONS[key]
    await show_settings(query)


async def show_site_management(query) -> None:
    """Управление сайтом"""
    keyboard = [
        [InlineKeyboardButton("🔄 Обновить кэш", callback_data="site_refresh")],
        [InlineKeyboardButton("📊 Статистика", callback_data="site_stats")],
        [InlineKeyboardButton("◀️ Назад", callback_data="back_to_menu")]
    ]
    
    await query.edit_message_text(
        "🌐 *Управление сайтом*\n\n"
        "Выберите действие:",
        parse_mode='Markdown',
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


async def send_notification(app, message: str, notification_type: str = None) -> None:
    """Отправка уведомления администратору"""
    if notification_type and not NOTIFICATIONS.get(notification_type, True):
        return
    
    try:
        await app.bot.send_message(
            chat_id=ADMIN_CHAT_ID,
            text=message,
            parse_mode='Markdown'
        )
    except Exception as e:
        logger.error(f"Ошибка отправки уведомления: {e}")


def main() -> None:
    """Запуск бота"""
    if BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        print("❌ Ошибка: Укажите токен бота в config.py")
        return
    
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Обработчики команд
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("menu", menu))
    
    # Обработчик кнопок
    application.add_handler(CallbackQueryHandler(handle_callback))
    
    print("🚛 JAPAN TRUCK Bot запущен!")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()