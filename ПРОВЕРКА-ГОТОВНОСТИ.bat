@echo off
chcp 65001 > nul
title Проверка готовности к сборке

cls
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   Проверка готовности к сборке установщика   ║
echo ╚═══════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

set "CHECKS_PASSED=0"
set "CHECKS_TOTAL=8"

echo [1/8] Проверка Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js НЕ установлен
    echo    Скачайте: https://nodejs.org/
) else (
    node --version
    echo ✅ Node.js установлен
    set /a CHECKS_PASSED+=1
)

echo.
echo [2/8] Проверка npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ npm НЕ найден
) else (
    npm --version
    echo ✅ npm найден
    set /a CHECKS_PASSED+=1
)

echo.
echo [3/8] Проверка основных файлов...
if not exist "main.js" (
    echo ❌ main.js НЕ найден
) else (
    echo ✅ main.js найден
    set /a CHECKS_PASSED+=1
)

echo.
echo [4/8] Проверка package.json...
if not exist "package.json" (
    echo ❌ package.json НЕ найден
) else (
    echo ✅ package.json найден
    set /a CHECKS_PASSED+=1
)

echo.
echo [5/8] Проверка electron-builder.yml...
if not exist "electron-builder.yml" (
    echo ❌ electron-builder.yml НЕ найден
) else (
    echo ✅ electron-builder.yml найден
    set /a CHECKS_PASSED+=1
)

echo.
echo [6/8] Проверка HTML файлов лаунчера...
if not exist "modern-launcher.html" (
    echo ❌ modern-launcher.html НЕ найден
) else (
    echo ✅ modern-launcher.html найден
    set /a CHECKS_PASSED+=1
)

echo.
echo [7/8] Проверка папки Ready-to-Upload...
if not exist "Ready-to-Upload" (
    echo ⚠ Папка Ready-to-Upload не существует
    mkdir "Ready-to-Upload"
    echo ✅ Папка создана
) else (
    echo ✅ Папка Ready-to-Upload существует
)
set /a CHECKS_PASSED+=1

echo.
echo [8/8] Проверка зависимостей...
if not exist "node_modules" (
    echo ⚠ node_modules не найдена
    echo    Запустите: npm install
) else (
    if exist "node_modules\electron" (
        echo ✅ Electron установлен
        set /a CHECKS_PASSED+=1
    ) else (
        echo ⚠ Electron не найден в node_modules
        echo    Запустите: npm install electron --save-dev
    )
)

echo.
echo ════════════════════════════════════════════════
echo   Результат проверки
echo ════════════════════════════════════════════════
echo.
echo Пройдено проверок: %CHECKS_PASSED% из %CHECKS_TOTAL%
echo.

if %CHECKS_PASSED% GEQ 6 (
    echo ✅ ГОТОВ К СБОРКЕ!
    echo.
    echo Можете запускать:
    echo   СОЗДАТЬ-УСТАНОВЩИК-ДЛЯ-ПОЛЬЗОВАТЕЛЕЙ.bat
    echo.
) else (
    echo ❌ НЕ ГОТОВ к сборке
    echo.
    echo Исправьте ошибки выше, затем повторите проверку.
    echo.
)

echo ════════════════════════════════════════════════
echo.

echo Дополнительная информация:
echo.
echo 📁 Текущая папка: %CD%
echo 📦 Файлы проекта:
dir /b *.json *.yml *.js 2>nul | find /v "node_modules"
echo.

echo Нажмите любую клавишу для выхода...
pause > nul
