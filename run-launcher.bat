@echo off
chcp 65001 > nul
title Запуск Reduxion Launcher

echo.
echo ========================================
echo   Запуск Reduxion Launcher
echo ========================================
echo.

echo Шаг 1: Проверка зависимостей...
if not exist "node_modules\electron\package.json" (
    echo Установка Electron...
    call npm install electron@^25.0.0 --save-dev
)

echo.
echo Шаг 2: Запуск лаунчера...
echo.
echo ========================================
echo   Лаунчер запущен!
echo ========================================
echo.
echo Для закрытия лаунчера нажмите Ctrl+C
echo.

npx electron .

echo.
echo Лаунчер закрыт.
pause