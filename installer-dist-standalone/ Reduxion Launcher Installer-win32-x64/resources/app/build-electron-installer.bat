@echo off
chcp 65001 > nul
title Сборка Electron установщика

echo ========================================
echo   Сборка Electron установщика
echo ========================================
echo.

echo Шаг 1: Очистка старых сборок...
if exist "installer-dist" rmdir /s /q "installer-dist"
if exist "dist-installer" rmdir /s /q "dist-installer"

echo.
echo Шаг 2: Установка зависимостей...
call npm install

echo.
echo Шаг 3: Сборка установщика как Electron app...
echo.

REM Создаем временный package.json для установщика
echo {> temp-installer-package.json
echo   "name": "reduxion-installer",>> temp-installer-package.json
echo   "version": "1.0.0",>> temp-installer-package.json
echo   "main": "installer-main.js",>> temp-installer-package.json
echo   "description": "Установщик Reduxion Launcher">> temp-installer-package.json
echo }>> temp-installer-package.json

REM Собираем установщик
npx electron-packager . "ReduxionLauncherInstaller" ^
  --platform=win32 ^
  --arch=x64 ^
  --out=dist-installer ^
  --overwrite ^
  --icon=assets/icon.ico ^
  --asar=false ^
  --ignore="^/(dist|build|test-dist|node_modules|\.git)" ^
  --extra-resource=installer.html ^
  --extra-resource=installer-styles.css ^
  --extra-resource=installer-main.js ^
  --extra-resource=downloader.js ^
  --extra-resource=assets

echo.
if errorlevel 1 (
    echo ❌ Ошибка сборки!
    pause
    exit /b 1
)

echo ✅ Установщик собран успешно!
echo.
echo Папка: dist-installer\ReduxionLauncherInstaller-win32-x64
echo.

pause
