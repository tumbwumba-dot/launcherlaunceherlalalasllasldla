@echo off
chcp 65001 > nul
title Запуск установщика Reduxion Launcher

cls
echo.
echo ╔════════════════════════════════════════╗
echo ║  Установщик Reduxion Launcher v1.0    ║
echo ╚════════════════════════════════════════╝
echo.

REM Переходим в папку с лаунчером
cd /d "%~dp0"

echo [1/3] Проверка файлов установщика...
if not exist "installer.html" (
    echo ❌ Ошибка: Файл installer.html не найден!
    pause
    exit /b 1
)

if not exist "installer-styles.css" (
    echo ❌ Ошибка: Файл installer-styles.css не найден!
    pause
    exit /b 1
)

if not exist "installer-main.js" (
    echo ❌ Ошибка: Файл installer-main.js не найден!
    pause
    exit /b 1
)

echo ✅ Все файлы установщика найдены

echo.
echo [2/3] Проверка зависимостей...
if not exist "node_modules\electron" (
    echo ⚠ Electron не установлен. Устанавливаю...
    echo Это может занять несколько минут при первом запуске...
    call npm install electron --save-dev
    if errorlevel 1 (
        echo ❌ Ошибка установки Electron!
        pause
        exit /b 1
    )
)

echo ✅ Зависимости готовы

echo.
echo [3/3] Запуск установщика...
echo.
echo ═══════════════════════════════════════════
echo   Окно установщика откроется через 2 сек
echo ═══════════════════════════════════════════
echo.

timeout /t 2 /nobreak > nul

REM Запускаем Electron напрямую с installer-main.js
npx electron installer-main.js

if errorlevel 1 (
    echo.
    echo ❌ Ошибка запуска установщика!
    echo.
    echo Попробуйте:
    echo 1. Удалить папку node_modules
    echo 2. Запустить: npm install
    echo 3. Снова запустить этот файл
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Установщик закрыт
pause