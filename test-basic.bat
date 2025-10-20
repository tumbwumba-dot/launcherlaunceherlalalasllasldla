@echo off
chcp 65001 > nul
title Тестирование Reduxion Launcher

echo.
echo ========================================
echo   ТЕСТИРОВАНИЕ REDUXION LAUNCHER
echo ========================================
echo.

echo Шаг 1: Проверка файлов...
if not exist "test-simple.html" (
    echo Ошибка: Файл test-simple.html не найден!
    pause
    exit /b 1
)

if not exist "main.js" (
    echo Ошибка: Файл main.js не найден!
    pause
    exit /b 1
)

echo Все необходимые файлы найдены.

echo.
echo Шаг 2: Установка зависимостей...
call npm install electron@^25.0.0 --save-dev

echo.
echo Шаг 3: Запуск тестовой страницы...
echo.
echo ========================================
echo   ТЕСТОВАЯ СТРАНИЦА
echo ========================================
echo.
echo Тестовая страница проверит:
echo - Загрузку Electron API
echo - Работу основных функций
echo - Обработку ошибок
echo.
echo Если тестовая страница работает - основное приложение тоже будет работать.
echo.

npx electron test-simple.html

echo.
echo Тестирование завершено.
pause