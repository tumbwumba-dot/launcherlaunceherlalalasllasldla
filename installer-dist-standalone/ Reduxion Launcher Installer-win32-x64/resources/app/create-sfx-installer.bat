@echo off
chcp 65001 > nul
title Создание единого SFX установщика

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  Создание ОДНОГО .exe файла установщика           ║
echo ╚════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Проверяем наличие собранного установщика
if not exist "FINAL-INSTALLER\ReduxionLauncherSetup.exe" (
    echo ❌ Сначала запустите build-single-installer.bat
    echo    для создания установщика!
    pause
    exit /b 1
)

echo [1/3] Создание архива установщика...
echo.

REM Используем встроенный 7-Zip из node_modules
if exist "node_modules\7zip-bin\win\x64\7za.exe" (
    set SEVENZIP=node_modules\7zip-bin\win\x64\7za.exe
) else (
    echo ❌ 7-Zip не найден в node_modules
    echo    Установите зависимости: npm install
    pause
    exit /b 1
)

REM Создаем архив из папки FINAL-INSTALLER
"%SEVENZIP%" a -t7z "ReduxionSetup.7z" "FINAL-INSTALLER\*" -mx=9 -mmt=on > nul
if errorlevel 1 (
    echo ❌ Ошибка создания архива
    pause
    exit /b 1
)
echo ✅ Архив создан
echo.

echo [2/3] Создание конфигурации SFX...

REM Создаем конфигурационный файл для SFX
echo ;!@Install@!UTF-8!> sfx-config.txt
echo Title="Установка Reduxion Launcher">> sfx-config.txt
echo BeginPrompt="Вы хотите установить Reduxion Launcher?">> sfx-config.txt
echo RunProgram="ReduxionLauncherSetup.exe">> sfx-config.txt
echo ;!@InstallEnd@!>> sfx-config.txt

echo ✅ Конфигурация создана
echo.

echo [3/3] Создание самораспаковывающегося .exe...

REM Скачиваем SFX модуль если его нет
if not exist "7zSD.sfx" (
    echo Загрузка SFX модуля...
    powershell -Command "Invoke-WebRequest -Uri 'https://www.7-zip.org/a/7z2301-extra.7z' -OutFile '7z-extra.7z'" > nul 2>&1
    if exist "7z-extra.7z" (
        "%SEVENZIP%" x "7z-extra.7z" "7zSD.sfx" -y > nul
        del "7z-extra.7z"
    )
)

REM Если не получилось скачать, используем альтернативный метод
if not exist "7zSD.sfx" (
    echo ⚠ Не удалось загрузить SFX модуль
    echo.
    echo Используйте один из вариантов:
    echo.
    echo 1. Скачайте 7-Zip с сайта www.7-zip.org
    echo 2. Используйте папку FINAL-INSTALLER целиком
    echo 3. Создайте .zip архив из FINAL-INSTALLER
    echo.
    pause
    exit /b 1
)

REM Объединяем SFX модуль + конфигурацию + архив
copy /b "7zSD.sfx" + "sfx-config.txt" + "ReduxionSetup.7z" "ReduxionLauncherSetup-FINAL.exe" > nul

REM Очистка временных файлов
del "ReduxionSetup.7z" > nul 2>&1
del "sfx-config.txt" > nul 2>&1

echo ✅ SFX установщик создан
echo.

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  ✅ ГОТОВО!                                       ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo 📦 Единый установщик:
echo    ReduxionLauncherSetup-FINAL.exe
echo.
echo ✨ Этот файл можно распространять отдельно!
echo    Он содержит всё необходимое внутри.
echo.
pause
