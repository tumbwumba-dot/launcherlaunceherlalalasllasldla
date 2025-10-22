@echo off
chcp 65001 > nul
title Сборка установщика Reduxion Launcher

cls
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   Сборка EXE установщика Reduxion Launcher   ║
echo ╚═══════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/5] Проверка окружения...
echo ────────────────────────────────────────────────

where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не установлен!
    echo.
    echo Скачайте и установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

node --version
npm --version
echo ✅ Node.js найден

echo.
echo [2/5] Очистка старых сборок...
echo ────────────────────────────────────────────────

if exist "Ready-to-Upload\*.exe" (
    echo Удаляю старые установщики...
    del /q "Ready-to-Upload\*.exe" 2>nul
)

if exist "Ready-to-Upload\*.blockmap" (
    del /q "Ready-to-Upload\*.blockmap" 2>nul
)

echo ✅ Очистка завершена

echo.
echo [3/5] Установка/обновление зависимостей...
echo ────────────────────────────────────────────────

call npm install
if errorlevel 1 (
    echo ❌ Ошибка установки зависимостей!
    pause
    exit /b 1
)

echo ✅ Зависимости установлены

echo.
echo [4/5] Сборка установщика с electron-builder...
echo ────────────────────────────────────────────────
echo Это может занять 2-5 минут...
echo.

call npm run build-installer

if errorlevel 1 (
    echo.
    echo ❌ Ошибка сборки установщика!
    echo.
    echo Возможные причины:
    echo - Нет файла assets/icon.ico
    echo - Нет файла main.js
    echo - Проблемы с конфигурацией
    echo.
    pause
    exit /b 1
)

echo.
echo [5/5] Проверка результата...
echo ────────────────────────────────────────────────

if not exist "Ready-to-Upload\*.exe" (
    echo ❌ EXE файл не найден!
    echo.
    echo Проверьте логи сборки выше
    pause
    exit /b 1
)

echo.
echo ✅ Установщик успешно собран!
echo.
echo ════════════════════════════════════════════════
echo   Готово!
echo ════════════════════════════════════════════════
echo.

for %%f in ("Ready-to-Upload\*.exe") do (
    echo Файл: %%~nxf
    echo Размер: %%~zf байт
    echo Путь: %%~dpf
)

echo.
echo Установщик находится в папке: Ready-to-Upload\
echo.
echo Нажмите любую клавишу, чтобы открыть папку...
pause > nul

explorer "Ready-to-Upload"

echo.
echo Готово! Можете загрузить EXE файл на сервер.
timeout /t 3
