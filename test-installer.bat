@echo off
chcp 65001 > nul
title Тестирование установщика Reduxion Launcher

echo.
echo ========================================
echo   Тестирование установщика
echo ========================================
echo.

echo Шаг 1: Проверка файлов установщика...
if not exist "installer.html" (
    echo Ошибка: Файл installer.html не найден!
    pause
    exit /b 1
)

if not exist "installer-styles.css" (
    echo Ошибка: Файл installer-styles.css не найден!
    pause
    exit /b 1
)

if not exist "installer-main.js" (
    echo Ошибка: Файл installer-main.js не найден!
    pause
    exit /b 1
)

echo Все файлы установщика найдены.

echo.
echo Шаг 2: Установка зависимостей...
call npm install electron@^25.0.0 --save
call npm install fs-extra@^11.1.1 --save

echo.
echo Шаг 3: Запуск установщика для тестирования...
echo.
echo ========================================
echo   Запуск установщика в тестовом режиме
echo ========================================
echo.
echo Установщик откроется в новом окне.
echo Для закрытия установщика используйте Ctrl+C в этом окне.
echo.

npx electron . --installer

echo.
echo Тестирование завершено.
pause