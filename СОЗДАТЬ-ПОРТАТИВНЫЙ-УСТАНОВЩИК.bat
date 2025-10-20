@echo off
chcp 65001 > nul
title Быстрая сборка облегченного установщика

cls
echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  Быстрая сборка установщика (без node_modules)    ║
echo ╚════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/3] Упаковка лаунчера в архив...

REM Проверяем наличие лаунчера
if not exist "launcher-dist\Reduxion Launcher-win32-x64" (
    echo ❌ Сначала соберите лаунчер с помощью build-single-installer.bat
    pause
    exit /b 1
)

REM Создаем финальную папку
if exist "READY-TO-DISTRIBUTE" rd /s /q "READY-TO-DISTRIBUTE"
mkdir "READY-TO-DISTRIBUTE"

REM Используем 7-Zip для архивации лаунчера
if exist "node_modules\7zip-bin\win\x64\7za.exe" (
    echo Архивируем лаунчер...
    node_modules\7zip-bin\win\x64\7za.exe a -t7z "READY-TO-DISTRIBUTE\launcher.7z" "launcher-dist\Reduxion Launcher-win32-x64\*" -mx=5 > nul
    echo ✅ Лаунчер заархивирован
) else (
    echo ❌ 7-Zip не найден
    pause
    exit /b 1
)
echo.

echo [2/3] Создание портативного установщика...

REM Копируем только необходимые файлы установщика
copy "installer-main.js" "READY-TO-DISTRIBUTE\main.js" > nul
copy "installer.html" "READY-TO-DISTRIBUTE\" > nul
copy "installer-majestic.css" "READY-TO-DISTRIBUTE\" > nul
if exist "assets\icon.ico" copy "assets\icon.ico" "READY-TO-DISTRIBUTE\" > nul

REM Создаем минимальный package.json
echo {"name":"reduxion-installer","version":"1.0.0","main":"main.js","dependencies":{"fs-extra":"^11.1.1","extract-zip":"^2.0.1"}}> "READY-TO-DISTRIBUTE\package.json"

REM Создаем простой загрузчик установщика
echo @echo off> "READY-TO-DISTRIBUTE\Запустить установщик.bat"
echo cd /d "%%~dp0">> "READY-TO-DISTRIBUTE\Запустить установщик.bat"
echo if not exist "node_modules" (>> "READY-TO-DISTRIBUTE\Запустить установщик.bat"
echo     echo Установка зависимостей...>> "READY-TO-DISTRIBUTE\Запустить установщик.bat"
echo     call npm install --production>> "READY-TO-DISTRIBUTE\Запустить установщик.bat"
echo )>> "READY-TO-DISTRIBUTE\Запустить установщик.bat"
echo npx electron main.js>> "READY-TO-DISTRIBUTE\Запустить установщик.bat"

echo ✅ Портативный установщик создан
echo.

echo [3/3] Создание архива для распространения...
node_modules\7zip-bin\win\x64\7za.exe a -tzip "ReduxionInstaller-Portable.zip" "READY-TO-DISTRIBUTE\*" -mx=9 > nul
echo ✅ Архив создан
echo.

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║  ✅ ГОТОВО!                                       ║
echo ╚════════════════════════════════════════════════════╝
echo.
echo 📦 Готовый файл для распространения:
echo    ReduxionInstaller-Portable.zip
echo.
echo 📝 Инструкция для пользователя:
echo    1. Распаковать архив
echo    2. Запустить "Запустить установщик.bat"
echo    3. При первом запуске установятся зависимости
echo.
pause
