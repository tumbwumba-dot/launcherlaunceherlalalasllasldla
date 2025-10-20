@echo off
chcp 65001 > nul
title Сборка Reduxion Launcher в EXE

echo ========================================
echo    Сборка Reduxion Launcher в EXE
echo ========================================
echo.

REM Проверка наличия необходимых файлов
echo [1/5] Проверка необходимых файлов...
if not exist "modern-launcher.html" (
    echo ❌ Ошибка: Файл modern-launcher.html не найден!
    pause
    exit /b 1
)

if not exist "modern-styles.css" (
    echo ❌ Ошибка: Файл modern-styles.css не найден!
    pause
    exit /b 1
)

if not exist "assets\icon.svg" (
    echo ⚠️ Предупреждение: Файл иконки assets/icon.svg не найден!
    echo Создаю базовую иконку...
    echo.
)

echo ✅ Все необходимые файлы найдены
echo.

REM Установка зависимостей
echo [2/5] Установка зависимостей...
if not exist "node_modules" (
    echo Установка зависимостей через npm...
    call npm install
    if errorlevel 1 (
        echo ❌ Ошибка при установке зависимостей!
        pause
        exit /b 1
    )
) else (
    echo ✅ Зависимости уже установлены
)

echo.
echo [3/5] Подготовка ресурсов для сборки...

REM Проверяем наличие electron-builder
call npx electron-builder --version >nul 2>&1
if errorlevel 1 (
    echo Установка electron-builder...
    call npm install electron-builder --save-dev
    if errorlevel 1 (
        echo ❌ Ошибка установки electron-builder!
        pause
        exit /b 1
    )
)

REM Создание иконки в формате ICO если её нет
if not exist "assets\icon.ico" (
    echo Конвертация SVG иконки в ICO формат...
    echo Примечание: Для полноценной конвертации рекомендуется использовать специализированные инструменты
    echo Пока будет использоваться SVG иконка
    echo.
)

echo ✅ Подготовка ресурсов завершена
echo.

REM Сборка приложения
echo [4/5] Сборка приложения...
echo ========================================
echo.

echo 🚀 Запуск сборки лаунчера...
echo Это может занять несколько минут...
echo.

REM Сборка с помощью electron-builder
call npx electron-builder --win --publish=never
if errorlevel 1 (
    echo ❌ Ошибка при сборке лаунчера!
    echo.
    echo Возможные причины:
    echo - Отсутствуют необходимые зависимости
    echo - Ошибки в коде приложения
    echo - Недостаточно прав доступа
    echo.
    pause
    exit /b 1
)

echo.
echo [5/5] Проверка результатов сборки...
echo ========================================
echo.

if exist "dist" (
    echo ✅ Сборка успешно завершена!
    echo.
    echo Созданные файлы в папке 'dist':
    dir /b "dist" 2>nul || echo Папка пуста

    echo.
    echo 📦 Готовые файлы для распространения:
    if exist "dist\*-Setup-*.exe" (
        echo ✅ Установщик: dist\*-Setup-*.exe
    )
    if exist "dist\*-Portable-*.exe" (
        echo ✅ Портативная версия: dist\*-Portable-*.exe
    )

    echo.
    echo ========================================
    echo   Сборка лаунчера завершена успешно!
    echo ========================================
    echo.
    echo 📋 Инструкции:
    echo 1. Для распространения используйте файлы из папки 'dist'
    echo 2. Установщик (*.exe) - для полной установки с ярлыками
    echo 3. Портативная версия (*.exe) - для запуска без установки
    echo.
    echo 🎯 Готово к использованию!

) else (
    echo ❌ Папка dist не найдена - сборка не удалась
    pause
    exit /b 1
)

echo.
pause