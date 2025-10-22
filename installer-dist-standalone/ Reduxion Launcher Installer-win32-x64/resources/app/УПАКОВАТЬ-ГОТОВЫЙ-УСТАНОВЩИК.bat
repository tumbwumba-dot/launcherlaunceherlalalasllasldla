@echo off
chcp 65001 > nul
title Простое решение - ZIP архив установщика

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  Создание готового установщика для сайта          ║
echo ╚════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM Проверяем наличие собранного установщика
if not exist "ReduxionLauncherSetup-win32-x64\ReduxionSetup.exe" (
    echo ❌ Установщик не найден!
    echo    Запустите сначала: build-single-installer.bat
    pause
    exit /b 1
)

echo [1/2] Создание ZIP архива...

if exist "node_modules\7zip-bin\win\x64\7za.exe" (
    node_modules\7zip-bin\win\x64\7za.exe a -tzip "ReduxionInstaller-FINAL.zip" "ReduxionLauncherSetup-win32-x64\*" -mx=9
    echo ✅ Архив создан
) else (
    echo ❌ 7-Zip не найден
    pause
    exit /b 1
)

echo.
echo [2/2] Готово!
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  ✅ УСТАНОВЩИК ГОТОВ К ПУБЛИКАЦИИ!               ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo 📦 Файл для сайта:
echo    ReduxionInstaller-FINAL.zip
echo.
echo 📝 Инструкция для пользователя:
echo    1. Скачать архив
echo    2. Распаковать в любую папку
echo    3. Запустить ReduxionSetup.exe
echo.
echo 💡 Или используйте WinRAR/7-Zip:
echo    Правый клик на папку ReduxionLauncherSetup-win32-x64
echo    → Добавить в архив → ✓ Создать SFX-архив
echo    → Получите один .exe файл!
echo.
pause
