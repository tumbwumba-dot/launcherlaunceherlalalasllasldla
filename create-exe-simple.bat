@echo off
chcp 65001 > nul
title Создание простых EXE файлов Reduxion Launcher

echo.
echo ========================================
echo   СОЗДАНИЕ ПРОСТЫХ EXE ФАЙЛОВ
echo ========================================
echo.

echo Шаг 1: Проверка файлов...
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

echo.
echo Шаг 2: Установка зависимостей...
call npm install electron@^25.0.0 --save-dev
call npm install electron-packager@^17.1.1 --save-dev

echo.
echo Шаг 3: Сборка лаунчера...
echo Создание исполняемого файла лаунчера...
npx electron-packager . ReduxionLauncher --platform=win32 --arch=x64 --out=dist --overwrite --icon=assets/icon.ico

if errorlevel 1 (
    echo Предупреждение: Автоматическая сборка не удалась, создаю ручную версию...
    goto manual_build
)

echo.
echo Шаг 4: Сборка установщика...
npx electron-packager . ReduxionLauncherSetup --platform=win32 --arch=x64 --out=installer-dist --overwrite --icon=assets/icon.ico

if errorlevel 1 (
    echo Предупреждение: Сборка установщика не удалась
)

:manual_build
echo.
echo Шаг 5: Создание ручной версии (если автоматическая не сработала)...
if not exist "dist" mkdir "dist"
if not exist "installer-dist" mkdir "installer-dist"

echo Создание простого лаунчера...
copy "START_MODERN_LAUNCHER.bat" "dist\ReduxionLauncher.exe.bat" >nul
echo @echo off > "dist\LAUNCHER.bat"
echo title Reduxion Launcher >> "dist\LAUNCHER.bat"
echo echo Запуск Reduxion Launcher... >> "dist\LAUNCHER.bat"
echo cd /d "%%~dp0" >> "dist\LAUNCHER.bat"
echo npx electron . >> "dist\LAUNCHER.bat"
echo pause >> "dist\LAUNCHER.bat"

echo.
echo Создание простого установщика...
if not exist "installer-dist\ReduxionLauncherSetup.exe.bat" (
    echo @echo off > "installer-dist\SETUP.bat"
    echo title Установка Reduxion Launcher >> "installer-dist\SETUP.bat"
    echo echo Запуск установщика... >> "installer-dist\SETUP.bat"
    echo cd /d "%%~dp0" >> "installer-dist\SETUP.bat"
    echo npx electron . --installer >> "installer-dist\SETUP.bat"
    echo pause >> "installer-dist\SETUP.bat"
)

echo.
echo Шаг 6: Создание ярлыков...
echo Создание ярлыка для лаунчера...
echo [InternetShortcut] > "dist\Reduxion Launcher.url"
echo URL=file:///%~dp0LAUNCHER.bat >> "dist\Reduxion Launcher.url"
echo IconIndex=0 >> "dist\Reduxion Launcher.url"

echo.
echo Шаг 7: Проверка результатов...
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
echo   СОЗДАНИЕ ЗАВЕРШЕНО!
echo ========================================
echo.
echo Готовые файлы:
echo.
echo ЛАУНЧЕР:
echo - dist\LAUNCHER.bat (основной запуск)
echo - dist\Reduxion Launcher.url (ярлык)
echo.
echo УСТАНОВЩИК:
echo - installer-dist\SETUP.bat (запуск установщика)
echo.
echo Для распространения:
echo 1. Скопируйте папку "dist" - это портативный лаунчер
echo 2. Скопируйте папку "installer-dist" - это установщик
echo 3. Запускайте .bat файлы для старта приложений
echo.
pause