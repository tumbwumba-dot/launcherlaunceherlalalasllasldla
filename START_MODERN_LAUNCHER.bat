@echo off
chcp 65001 >nul
title Reduxion Launcher - Modern UI

echo ========================================
echo    Reduxion Launcher - Modern UI
echo ========================================
echo.

echo [1/3] Проверка зависимостей...
if not exist "node_modules" (
    echo Установка зависимостей...
    npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
) else (
    echo ✅ Зависимости уже установлены
)

echo.
echo [2/3] Проверка конфигурации...
if not exist "modern-launcher.html" (
    echo ❌ Файл modern-launcher.html не найден
    echo Попробуйте скачать проект заново
    pause
    exit /b 1
)

if not exist "modern-styles.css" (
    echo ❌ Файл modern-styles.css не найден
    echo Попробуйте скачать проект заново
    pause
    exit /b 1
)

echo ✅ Все файлы найдены

echo.
echo [3/3] Запуск лаунчера...
echo ========================================
echo.
echo 🚀 Запуск Reduxion Launcher...
echo 🌐 Интерфейс в стиле сайта Reduxion
echo 📁 Работа с редуксами Majestic
echo.
echo ========================================
echo.

npm start

pause