@echo off
chcp 65001 > nul
title Сборка установщика Reduxion Launcher

echo ========================================
echo    Сборка установщика Reduxion Launcher
echo ========================================
echo.

REM Проверка наличия необходимых файлов
echo [1/5] Проверка необходимых файлов...
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

if not exist "package-installer.json" (
    echo ❌ Ошибка: Файл package-installer.json не найден!
    pause
    exit /b 1
)

echo ✅ Все необходимые файлы найдены
echo.

REM Установка зависимостей для установщика
echo [2/5] Установка зависимостей для установщика...
if not exist "installer-node_modules" (
    echo Установка зависимостей для установщика...
    cd /d "%~dp0"
    call npm install --prefix . --save-dev electron-builder
    if errorlevel 1 (
        echo ❌ Ошибка при установке зависимостей для установщика!
        pause
        exit /b 1
    )
) else (
    echo ✅ Зависимости установщика уже установлены
)

echo.
echo [3/5] Подготовка ресурсов установщика...

REM Проверяем наличие electron-builder
call npx electron-builder --version >nul 2>&1
if errorlevel 1 (
    echo Установка electron-builder глобально...
    call npm install -g electron-builder
    if errorlevel 1 (
        echo ❌ Ошибка установки electron-builder!
        pause
        exit /b 1
    )
)

REM Создание иконки для установщика если её нет
if not exist "assets\icon.ico" (
    echo Конвертация SVG иконки в ICO формат для установщика...
    echo Примечание: Для полноценной конвертации рекомендуется использовать специализированные инструменты
    echo.
)

echo ✅ Подготовка ресурсов установщика завершена
echo.

REM Сборка установщика
echo [4/5] Сборка установщика...
echo ========================================
echo.

echo 🔧 Сборка установщика лаунчера...
echo Это может занять несколько минут...
echo.

REM Сборка установщика с помощью electron-builder и конфигурации package-installer.json
call npx electron-builder --config package-installer.json --win --publish=never
if errorlevel 1 (
    echo ❌ Ошибка при сборке установщика!
    echo.
    echo Возможные причины:
    echo - Ошибки в конфигурации package-installer.json
    echo - Отсутствуют необходимые зависимости
    echo - Ошибки в коде установщика
    echo.
    pause
    exit /b 1
)

echo.
echo [5/5] Проверка результатов сборки установщика...
echo ========================================
echo.

if exist "installer-dist" (
    echo ✅ Сборка установщика успешно завершена!
    echo.
    echo Созданные файлы в папке 'installer-dist':
    dir /b "installer-dist" 2>nul || echo Папка пуста

    echo.
    echo 📦 Готовые файлы установщика:
    if exist "installer-dist\*-Setup-*.exe" (
        echo ✅ Основной установщик: installer-dist\*-Setup-*.exe
    )
    if exist "installer-dist\*-Portable-*.exe" (
        echo ✅ Портативный установщик: installer-dist\*-Portable-*.exe
    )

    echo.
    echo ========================================
    echo   Сборка установщика завершена успешно!
    echo ========================================
    echo.
    echo 📋 Инструкции:
    echo 1. Установщик из папки 'installer-dist' распространяется отдельно
    echo 2. При запуске он скачивает актуальную версию лаунчера
    echo 3. Поддерживает автоматическую установку и создание ярлыков
    echo.
    echo 🎯 Готов к распространению!

) else (
    echo ❌ Папка installer-dist не найдена - сборка не удалась
    pause
    exit /b 1
)

echo.
pause