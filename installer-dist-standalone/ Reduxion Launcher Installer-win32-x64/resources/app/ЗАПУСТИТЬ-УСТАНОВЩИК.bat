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

echo [1/3] Проверка файлов...
if not exist "installer-main.js" (
    echo ❌ Ошибка: Файл installer-main.js не найден!
    goto :error
)

if not exist "installer.html" (
    echo ❌ Ошибка: Файл installer.html не найден!
    goto :error
)

if not exist "installer-styles.css" (
    echo ❌ Ошибка: Файл installer-styles.css не найден!
    goto :error
)

echo ✅ Все файлы найдены

echo.
echo [2/3] Проверка зависимостей...
if not exist "node_modules\electron" (
    echo ⚠ Electron не установлен. Устанавливаю...
    call npm install electron --save-dev
    if errorlevel 1 (
        echo ❌ Ошибка установки Electron!
        goto :error
    )
)

echo ✅ Зависимости готовы

echo.
echo [3/3] Запуск установщика...
echo.
echo ═══════════════════════════════════════════
echo   Окно установщика откроется через 2 сек
echo ═══════════════════════════════════════════
timeout /t 2 /nobreak > nul

REM Создаем временный package.json для установщика
echo {"name":"reduxion-installer","version":"1.0.0","main":"installer-main.js"}> package-temp.json

REM Запускаем Electron с файлом установщика
start "Reduxion Installer" cmd /c "npx electron installer-main.js"

echo.
echo ✅ Установщик запущен!
echo.
echo Вы можете закрыть это окно.
echo.

timeout /t 3
exit

:error
echo.
echo ═══════════════════════════════════════════
echo   Произошла ошибка!
echo ═══════════════════════════════════════════
echo.
pause
exit /b 1
