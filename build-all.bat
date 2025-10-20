@echo off
chcp 65001 > nul
title Полная сборка Reduxion Launcher

echo.
echo ========================================
echo   Полная сборка Reduxion Launcher
echo ========================================
echo.

echo Шаг 1: Проверка необходимых файлов...
if not exist "modern-launcher.html" (
    echo Ошибка: Файл modern-launcher.html не найден!
    pause
    exit /b 1
)

if not exist "installer.html" (
    echo Ошибка: Файл installer.html не найден!
    pause
    exit /b 1
)

echo Все необходимые файлы найдены.

echo.
echo Шаг 2: Установка зависимостей...
call npm install
if errorlevel 1 (
    echo Ошибка при установке зависимостей!
    pause
    exit /b 1
)

echo.
echo Шаг 3: Сборка лаунчера...
call npm run build-win
if errorlevel 1 (
    echo Ошибка при сборке лаунчера!
    pause
    exit /b 1
)

echo.
echo Шаг 4: Сборка установщика...
if exist "package-installer.json" (
    call npx electron-builder --win --config package-installer.json
) else (
    echo Предупреждение: package-installer.json не найден
)

echo.
echo Шаг 5: Проверка результатов сборки...
echo.

if exist "dist" (
    echo Папка dist (лаунчер):
    dir /b "dist" 2>nul || echo Папка пуста
) else (
    echo Папка dist не найдена
)

echo.
if exist "installer-dist" (
    echo Папка installer-dist (установщик):
    dir /b "installer-dist" 2>nul || echo Папка пуста
) else (
    echo Папка installer-dist не найдена
)

echo.
echo ========================================
echo   Сборка завершена!
echo ========================================
echo.
echo Структура созданных файлов:
echo.
echo 1. Лаунчер (папка dist):
echo    - Reduxion Launcher Setup.exe - установщик
echo.
echo 2. Установщик отдельно (папка installer-dist):
echo    - Reduxion Launcher Setup.exe - отдельный установщик
echo.
echo Для распространения используйте файлы из папки dist
echo.
pause