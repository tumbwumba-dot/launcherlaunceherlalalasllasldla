@echo off
chcp 65001 > nul
title Создание онлайн-установщика Reduxion

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  Создание онлайн-установщика (Web Installer)     ║
echo ╚════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/4] Подготовка лаунчера для загрузки...

REM Проверяем наличие собранного лаунчера
if not exist "launcher-dist\Reduxion Launcher-win32-x64" (
    echo ❌ Сначала соберите лаунчер!
    echo    Запустите: build-single-installer.bat
    pause
    exit /b 1
)

REM Создаем папку для файлов сервера
if not exist "SERVER-FILES" mkdir "SERVER-FILES"

REM Архивируем лаунчер
echo Создание архива лаунчера...
if exist "node_modules\7zip-bin\win\x64\7za.exe" (
    node_modules\7zip-bin\win\x64\7za.exe a -tzip "SERVER-FILES\reduxion-launcher.zip" "launcher-dist\Reduxion Launcher-win32-x64\*" -mx=9 > nul
    echo ✅ Архив создан: SERVER-FILES\reduxion-launcher.zip
) else (
    echo ❌ 7-Zip не найден
    pause
    exit /b 1
)
echo.

echo [2/4] Создание онлайн-установщика...

REM Создаем минимальный установщик
if exist "web-installer-build" rd /s /q "web-installer-build"
mkdir "web-installer-build"

REM Создаем упрощенный installer-main.js для онлайн-установщика
echo const { app, BrowserWindow, ipcMain, dialog } = require('electron');> "web-installer-build\main.js"
echo const path = require('path');>> "web-installer-build\main.js"
echo const fs = require('fs');>> "web-installer-build\main.js"
echo const https = require('https');>> "web-installer-build\main.js"
echo const { execSync } = require('child_process');>> "web-installer-build\main.js"
echo.>> "web-installer-build\main.js"
echo const LAUNCHER_URL = 'YOUR_SERVER_URL/reduxion-launcher.zip'; // ЗАМЕНИТЕ НА СВОЙ URL>> "web-installer-build\main.js"
echo.>> "web-installer-build\main.js"
type "installer-main.js" >> "web-installer-build\main.js"

REM Копируем остальные файлы
copy "installer.html" "web-installer-build\" > nul
copy "installer-majestic.css" "web-installer-build\" > nul
if exist "assets\icon.ico" copy "assets\icon.ico" "web-installer-build\" > nul

REM Создаем package.json
echo {"name":"reduxion-web-installer","version":"1.0.0","main":"main.js"}> "web-installer-build\package.json"

echo ✅ Файлы подготовлены
echo.

echo [3/4] Упаковка онлайн-установщика в .exe...

cd web-installer-build
call npx electron-packager . "ReduxionSetup" --platform=win32 --arch=x64 --out=..\ --icon=icon.ico 2>nul
if errorlevel 1 (
    call npx electron-packager . "ReduxionSetup" --platform=win32 --arch=x64 --out=..\ 2>nul
)
cd ..

if exist "ReduxionSetup-win32-x64\ReduxionSetup.exe" (
    echo ✅ Онлайн-установщик создан
) else (
    echo ❌ Ошибка создания установщика
    pause
    exit /b 1
)
echo.

echo [4/4] Финализация...

REM Копируем установщик в удобное место
if not exist "READY-FOR-WEBSITE" mkdir "READY-FOR-WEBSITE"
copy "ReduxionSetup-win32-x64\ReduxionSetup.exe" "READY-FOR-WEBSITE\" > nul

REM Очистка
rd /s /q "web-installer-build" > nul 2>&1
rd /s /q "ReduxionSetup-win32-x64" > nul 2>&1

echo ✅ Завершено
echo.

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  ✅ ОНЛАЙН-УСТАНОВЩИК ГОТОВ!                     ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo 📦 Для сайта (скачивание пользователем):
echo    READY-FOR-WEBSITE\ReduxionSetup.exe
echo    Размер: ~150-200 MB (легкий установщик)
echo.
echo 📂 Для сервера (загрузите на хостинг):
echo    SERVER-FILES\reduxion-launcher.zip
echo    Размер: ~200-300 MB (сам лаунчер)
echo.
echo ⚠ ВАЖНО! Откройте installer-main.js и замените:
echo    const LAUNCHER_URL = 'YOUR_SERVER_URL/reduxion-launcher.zip';
echo    на реальный URL вашего сервера!
echo.
echo 💡 Инструкция:
echo    1. Загрузите reduxion-launcher.zip на свой сервер/хостинг
echo    2. Получите прямую ссылку на скачивание
echo    3. Вставьте эту ссылку в installer-main.js
echo    4. Пересоберите установщик этим скриптом
echo    5. Выложите ReduxionSetup.exe на сайт
echo.
pause
