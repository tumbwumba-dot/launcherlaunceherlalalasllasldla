@echo off
chcp 65001 > nul
title Сборка единого EXE установщика Reduxion Launcher

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  Сборка единого установщика (один EXE файл)       ║
echo ╚════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Отключаем подписывание кода
set CSC_IDENTITY_AUTO_DISCOVERY=false

echo [1/5] Проверка зависимостей...
if not exist "node_modules" (
    echo ⚠ Устанавливаю зависимости...
    call npm install
    if errorlevel 1 goto :error
)
echo ✅ Зависимости готовы
echo.

echo [2/5] Сборка лаунчера...
echo Это может занять время...

REM Завершаем процессы
taskkill /F /IM "Reduxion Launcher.exe" > nul 2>&1
timeout /t 1 /nobreak > nul

REM Удаляем старую сборку
if exist "launcher-dist" (
    rd /s /q "launcher-dist" > nul 2>&1
    timeout /t 2 /nobreak > nul
)

call npx electron-packager . "Reduxion Launcher" --platform=win32 --arch=x64 --out=launcher-dist --ignore="installer.*" --ignore="electron-builder.*" --ignore="launcher-dist" --ignore="installer-dist.*" --ignore="temp-installer.*" --ignore="test-dist" --ignore=".*\.bat"
if errorlevel 1 goto :error
echo ✅ Лаунчер собран
echo.

echo [3/5] Подготовка файлов для установщика...
REM Создаем временную папку
if exist "temp-single-installer" rd /s /q "temp-single-installer"
mkdir "temp-single-installer"

REM Копируем файлы установщика
copy "installer-main.js" "temp-single-installer\main.js" > nul
copy "installer.html" "temp-single-installer\" > nul
copy "installer-majestic.css" "temp-single-installer\" > nul
copy "downloader.js" "temp-single-installer\" > nul
if exist "assets" xcopy "assets" "temp-single-installer\assets\" /E /I /Q > nul

REM Копируем node_modules
echo Копирование зависимостей...
xcopy "node_modules" "temp-single-installer\node_modules\" /E /I /Q > nul

REM Копируем собранный лаунчер
if exist "launcher-dist\Reduxion Launcher-win32-x64" (
    echo Копирование лаунчера...
    xcopy "launcher-dist\Reduxion Launcher-win32-x64" "temp-single-installer\launcher-dist\Reduxion Launcher-win32-x64\" /E /I /Q > nul
)

REM Создаем специальный package.json для установщика
echo {"name":"reduxion-installer","version":"1.0.0","main":"main.js","description":"Reduxion Launcher Installer"}> "temp-single-installer\package.json"

echo ✅ Подготовка завершена
echo.

echo [4/5] Упаковка установщика в один EXE...
cd temp-single-installer

call npx electron-packager . "ReduxionLauncherSetup" --platform=win32 --arch=x64 --out=..\ --overwrite --no-prune
if errorlevel 1 (
    cd ..
    goto :error
)

cd ..
echo ✅ Установщик упакован
echo.

echo [5/5] Финальная обработка...

REM Переименовываем для удобства
if exist "ReduxionLauncherSetup-win32-x64" (
    if not exist "FINAL-INSTALLER" mkdir "FINAL-INSTALLER"
    
    REM Копируем весь установщик
    xcopy "ReduxionLauncherSetup-win32-x64" "FINAL-INSTALLER\" /E /I /Y /Q > nul
    
    REM Удаляем временные файлы
    rd /s /q "temp-single-installer" > nul 2>&1
    rd /s /q "ReduxionLauncherSetup-win32-x64" > nul 2>&1
    
    echo ✅ Обработка завершена
)
echo.

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  ✅ СБОРКА ЗАВЕРШЕНА УСПЕШНО!                     ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo 📦 Готовый установщик:
echo    FINAL-INSTALLER\ReduxionLauncherSetup.exe
echo.
echo 📝 Важно: Для запуска установщику нужны все файлы
echo    из папки FINAL-INSTALLER. Скопируйте всю папку
echo    целиком для распространения.
echo.
echo 💡 Альтернатива: Используйте архиватор (7-Zip, WinRAR)
echo    для создания самораспаковывающегося .exe из
echo    папки FINAL-INSTALLER
echo.
pause
exit /b 0

:error
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  ❌ ОШИБКА СБОРКИ                                 ║
echo ╚════════════════════════════════════════════════════╝
echo.
pause
exit /b 1
