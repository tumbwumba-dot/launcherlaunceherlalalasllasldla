@echo off
chcp 65001 > nul
title Сборка Reduxion Launcher и Installer в EXE

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  Сборка EXE файлов Reduxion Launcher              ║
echo ╚════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Отключаем подписывание кода
set CSC_IDENTITY_AUTO_DISCOVERY=false

echo [1/4] Проверка зависимостей...
echo Очистка кэша npm и electron-builder...
call npm cache clean --force > nul 2>&1
rd /s /q "%LOCALAPPDATA%\electron-builder\Cache" > nul 2>&1

if not exist "node_modules" (
    echo ⚠ Устанавливаю зависимости...
    call npm install
    if errorlevel 1 (
        echo ❌ Ошибка установки зависимостей!
        goto :error
    )
)
echo ✅ Зависимости готовы
echo.

echo [2/4] Сборка лаунчера в EXE...
echo Это может занять несколько минут...
echo.

REM Завершаем процессы лаунчера если они запущены
taskkill /F /IM "Reduxion Launcher.exe" > nul 2>&1
timeout /t 1 /nobreak > nul

REM Удаляем старые сборки
if exist "launcher-dist" (
    echo Удаление старой сборки лаунчера...
    rd /s /q "launcher-dist" > nul 2>&1
    if exist "launcher-dist" (
        echo Использую альтернативный метод удаления...
        rmdir /s /q "launcher-dist" > nul 2>&1
    )
    timeout /t 2 /nobreak > nul
)

echo Выполняется: npx electron-packager . "Reduxion Launcher" --platform=win32 --arch=x64 --out=launcher-dist
echo.
call npx electron-packager . "Reduxion Launcher" --platform=win32 --arch=x64 --out=launcher-dist --ignore="installer.*" --ignore="electron-builder.*" --ignore="launcher-dist" --ignore="installer-dist.*" --ignore="temp-installer.*" --ignore="test-dist" --ignore="SFX-Installer" --ignore="Ready-to-Upload" --ignore="build" --ignore="dist" --ignore=".bat$"
if errorlevel 1 (
    echo ❌ Ошибка сборки лаунчера!
    echo.
    echo Возможные причины:
    echo - Запущен Reduxion Launcher.exe из предыдущей сборки
    echo - Открыта папка launcher-dist в проводнике
    echo - Антивирус блокирует удаление файлов
    echo.
    echo Попробуйте:
    echo 1. Перезагрузить компьютер
    echo 2. Отключить антивирус временно
    echo 3. Вручную удалить папку launcher-dist
    goto :error
)
echo ✅ Лаунчер собран
echo.

echo [3/4] Копирование лаунчера для установщика...
if exist "launcher-dist\Reduxion Launcher-win32-x64" (
    echo ✅ Лаунчер готов для упаковки в установщик
    echo    Путь: launcher-dist\Reduxion Launcher-win32-x64\
) else (
    echo ❌ Папка с лаунчером не найдена!
    goto :error
)
echo.

echo [4/4] Сборка установщика в EXE...
echo.

REM Завершаем процессы установщика если они запущены
taskkill /F /IM "ReduxionInstaller.exe" > nul 2>&1
timeout /t 1 /nobreak > nul

REM Удаляем старые сборки
if exist "installer-dist-final" (
    echo Удаление старой сборки установщика...
    rd /s /q "installer-dist-final" > nul 2>&1
    if exist "installer-dist-final" (
        echo Использую альтернативный метод удаления...
        rmdir /s /q "installer-dist-final" > nul 2>&1
    )
    timeout /t 2 /nobreak > nul
)

echo Подготовка файлов установщика...

REM Создаем временную папку для установщика
if exist "temp-installer-build" rd /s /q "temp-installer-build"
mkdir "temp-installer-build"

REM Копируем только файлы установщика
copy "installer-main.js" "temp-installer-build\main.js" > nul
copy "installer.html" "temp-installer-build\" > nul
copy "installer-majestic.css" "temp-installer-build\" > nul
copy "downloader.js" "temp-installer-build\" > nul
copy "package.json" "temp-installer-build\" > nul
if exist "assets" xcopy "assets" "temp-installer-build\assets\" /E /I /Q > nul

REM Копируем ВСЕ node_modules для установщика (проще и надежнее)
echo Копирование всех зависимостей (это займет время)...
xcopy "node_modules" "temp-installer-build\node_modules\" /E /I /Q > nul

REM Копируем собранный лаунчер в папку установщика
if exist "launcher-dist\Reduxion Launcher-win32-x64" (
    echo Копирование лаунчера в установщик...
    xcopy "launcher-dist\Reduxion Launcher-win32-x64" "temp-installer-build\launcher-dist\Reduxion Launcher-win32-x64\" /E /I /Q > nul
)

cd temp-installer-build
echo.
echo Выполняется: npx electron-packager . "ReduxionInstaller" --platform=win32 --arch=x64 --out=..\installer-dist-final
echo.
call npx electron-packager . "ReduxionInstaller" --platform=win32 --arch=x64 --out=..\installer-dist-final
cd ..

if errorlevel 1 (
    echo ❌ Ошибка сборки установщика!
    goto :error
)

REM Очистка временной папки
rd /s /q "temp-installer-build" > nul 2>&1

echo ✅ Установщик собран
echo.

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  ✅ СБОРКА ЗАВЕРШЕНА УСПЕШНО!                     ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo Готовые файлы:
echo.
echo 📁 Лаунчер:
echo    launcher-dist\Reduxion Launcher-win32-x64\Reduxion Launcher.exe
echo.
echo 📦 Установщик:
if exist "installer-dist-final\ReduxionInstaller-win32-x64\ReduxionInstaller.exe" (
    echo    installer-dist-final\ReduxionInstaller-win32-x64\ReduxionInstaller.exe
    echo.
    echo 🎉 Готово к публикации!
) else (
    echo    ⚠ Файл не найден, проверьте логи
)
echo.
echo Нажмите любую клавишу для выхода...
pause > nul
exit /b 0

:error
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  ❌ ОШИБКА СБОРКИ                                 ║
echo ╚════════════════════════════════════════════════════╝
echo.
pause
exit /b 1
