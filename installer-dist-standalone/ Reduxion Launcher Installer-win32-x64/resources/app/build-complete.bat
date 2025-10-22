@echo off
chcp 65001 > nul
title Полная сборка Reduxion Launcher - Complete Build

echo ========================================
echo   ПОЛНАЯ СБОРКА REDUXION LAUNCHER
echo ========================================
echo.
echo 🚀 Полная автоматизированная сборка
echo 📦 Лаунчер + Установщик + Портативные версии
echo.
echo ========================================
echo.

REM Проверка наличия всех необходимых файлов
echo [ШАГ 1/7] Проверка всех необходимых файлов...
echo.

set "ERRORS_FOUND=0"

echo Проверка файлов лаунчера...
if not exist "modern-launcher.html" (
    echo ❌ Файл modern-launcher.html не найден!
    set /a "ERRORS_FOUND+=1"
)

if not exist "modern-styles.css" (
    echo ❌ Файл modern-styles.css не найден!
    set /a "ERRORS_FOUND+=1"
)

echo Проверка файлов установщика...
if not exist "installer.html" (
    echo ❌ Файл installer.html не найден!
    set /a "ERRORS_FOUND+=1"
)

if not exist "installer-styles.css" (
    echo ❌ Файл installer-styles.css не найден!
    set /a "ERRORS_FOUND+=1"
)

if not exist "installer-main.js" (
    echo ❌ Файл installer-main.js не найден!
    set /a "ERRORS_FOUND+=1"
)

echo Проверка конфигурационных файлов...
if not exist "package.json" (
    echo ❌ Файл package.json не найден!
    set /a "ERRORS_FOUND+=1"
)

if not exist "package-installer.json" (
    echo ❌ Файл package-installer.json не найден!
    set /a "ERRORS_FOUND+=1"
)

if %ERRORS_FOUND% GTR 0 (
    echo.
    echo ❌ Найдено %ERRORS_FOUND% ошибок в файлах проекта!
    echo Исправьте ошибки и запустите сборку заново.
    pause
    exit /b 1
)

echo ✅ Все необходимые файлы найдены
echo.

REM Очистка предыдущих сборок
echo [ШАГ 2/7] Очистка предыдущих сборок...
echo.

if exist "dist" (
    echo Очистка папки dist...
    rmdir /s /q "dist" 2>nul
)

if exist "installer-dist" (
    echo Очистка папки installer-dist...
    rmdir /s /q "installer-dist" 2>nul
)

if exist "build" (
    echo Очистка папки build...
    rmdir /s /q "build" 2>nul
)

echo ✅ Очистка завершена
echo.

REM Установка зависимостей
echo [ШАГ 3/7] Установка зависимостей...
echo.

if not exist "node_modules" (
    echo Установка основных зависимостей...
    call npm install
    if errorlevel 1 (
        echo ❌ Ошибка при установке зависимостей!
        pause
        exit /b 1
    )
) else (
    echo ✅ Основные зависимости уже установлены
)

REM Установка electron-builder если отсутствует
call npm list electron-builder >nul 2>&1
if errorlevel 1 (
    echo Установка electron-builder...
    call npm install electron-builder --save-dev
    if errorlevel 1 (
        echo ❌ Ошибка при установке electron-builder!
        pause
        exit /b 1
    )
)

echo ✅ Зависимости готовы
echo.

REM Подготовка ресурсов
echo [ШАГ 4/7] Подготовка ресурсов...
echo.

REM Создание базовой структуры ресурсов
if not exist "assets" (
    echo Создание папки ресурсов...
    mkdir "assets" 2>nul
)

REM Проверка наличия иконки
if not exist "assets\icon.svg" (
    echo ⚠️ Иконка не найдена - будет использоваться системная иконка по умолчанию
) else (
    echo ✅ Иконка найдена
)

echo ✅ Ресурсы подготовлены
echo.

REM Сборка лаунчера
echo [ШАГ 5/7] Сборка лаунчера...
echo ========================================
echo.

echo Сборка основного лаунчера...
call npm run build-win
if errorlevel 1 (
    echo ❌ Ошибка при сборке лаунчера!
    echo Попробуйте собрать лаунчер отдельно с помощью build-launcher.bat
    pause
    exit /b 1
)

echo ✅ Лаунчер собран успешно
echo.

REM Сборка установщика
echo [ШАГ 6/7] Сборка установщика...
echo ========================================
echo.

echo Сборка установщика лаунчера...
call npx electron-builder --config package-installer.json --win --publish=never
if errorlevel 1 (
    echo ❌ Ошибка при сборке установщика!
    echo Попробуйте собрать установщик отдельно с помощью build-installer.bat
    pause
    exit /b 1
)

echo ✅ Установщик собран успешно
echo.

REM Финальная проверка и отчет
echo [ШАГ 7/7] Финальная проверка и отчет...
echo ========================================
echo.

set "BUILD_SUCCESS=1"

echo Проверка папки лаунчера (dist)...
if exist "dist" (
    echo ✅ Папка dist существует
    dir /b "dist" | findstr /c:".exe" >nul
    if not errorlevel 1 (
        echo ✅ Найдены exe файлы лаунчера
    ) else (
        echo ⚠️ EXE файлы лаунчера не найдены
        set "BUILD_SUCCESS=0"
    )
) else (
    echo ❌ Папка dist не найдена
    set "BUILD_SUCCESS=0"
)

echo.
echo Проверка папки установщика (installer-dist)...
if exist "installer-dist" (
    echo ✅ Папка installer-dist существует
    dir /b "installer-dist" | findstr /c:".exe" >nul
    if not errorlevel 1 (
        echo ✅ Найдены exe файлы установщика
    ) else (
        echo ⚠️ EXE файлы установщика не найдены
        set "BUILD_SUCCESS=0"
    )
) else (
    echo ❌ Папка installer-dist не найдена
    set "BUILD_SUCCESS=0"
)

echo.
echo ========================================
echo           ОТЧЕТ СБОРКИ
echo ========================================
echo.

if %BUILD_SUCCESS% EQU 1 (
    echo 🎉 ПОЛНАЯ СБОРКА УСПЕШНО ЗАВЕРШЕНА!
    echo.
    echo 📦 СОЗДАННЫЕ ФАЙЛЫ:
    echo.

    echo 📁 ЛАУНЧЕР (папка 'dist'):
    if exist "dist" (
        echo   Файлы:
        dir /b "dist" 2>nul | findstr /c:".exe" || echo   Нет exe файлов
        echo.
        echo   Другие файлы:
        dir /b "dist" 2>nul | findstr /v /c:".exe" || echo   Нет других файлов
    )

    echo.
    echo 📁 УСТАНОВЩИК (папка 'installer-dist'):
    if exist "installer-dist" (
        echo   Файлы:
        dir /b "installer-dist" 2>nul | findstr /c:".exe" || echo   Нет exe файлов
        echo.
        echo   Другие файлы:
        dir /b "installer-dist" 2>nul | findstr /v /c:".exe" || echo   Нет других файлов
    )

    echo.
    echo 🚀 ИСПОЛЬЗОВАНИЕ:
    echo.
    echo 1️⃣ Распространение лаунчера:
    echo    Используйте файлы из папки 'dist'
    echo    - Установщик создает ярлыки в меню Пуск и на рабочем столе
    echo    - Портативная версия работает без установки
    echo.
    echo 2️⃣ Распространение установщика:
    echo    Используйте файлы из папки 'installer-dist'
    echo    - Установщик скачивает актуальную версию лаунчера с сервера
    echo    - Поддерживает автоматическую установку и настройку
    echo.
    echo 3️⃣ Разработка и тестирование:
    echo    - npm start - запуск в режиме разработки
    echo    - npm run build-win - сборка лаунчера
    echo    - build-launcher.bat - улучшенная сборка лаунчера
    echo    - build-installer.bat - сборка установщика
    echo.

) else (
    echo ❌ СБОРКА ЗАВЕРШЕНА С ОШИБКАМИ!
    echo.
    echo 🔧 РЕКОМЕНДАЦИИ:
    echo.
    echo 1. Проверьте наличие всех необходимых файлов
    echo 2. Убедитесь что установлены все зависимости
    echo 3. Попробуйте собрать компоненты по отдельности
    echo 4. Проверьте логи ошибок выше
    echo.
    echo 🔄 АЛЬТЕРНАТИВНЫЕ СПОСОБЫ СБОРКИ:
    echo.
    echo - build-launcher.bat (только лаунчер)
    echo - build-installer.bat (только установщик)
    echo - npm run build-win (базовая сборка)
    echo.
)

echo ========================================
echo Конец отчета сборки
echo ========================================
echo.

REM Запрос на открытие папок с результатами
if %BUILD_SUCCESS% EQU 1 (
    echo.
    set /p "OPEN_FOLDERS=Открыть папки с результатами сборки? (y/n): "
    if /i "!OPEN_FOLDERS!"=="y" (
        if exist "dist" start "" "dist"
        if exist "installer-dist" start "" "installer-dist"
    )
)

echo.
pause