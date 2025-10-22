@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo Тест Electron:
echo.

echo 1. Проверка Node.js:
node --version
echo.

echo 2. Проверка npm:
npm --version
echo.

echo 3. Проверка наличия Electron:
if exist "node_modules\electron" (
    echo ✅ Electron установлен
    npx electron --version
) else (
    echo ❌ Electron не установлен
    echo Установка...
    npm install electron --save-dev
)

echo.
echo 4. Список файлов установщика:
dir installer*.* /b

echo.
echo 5. Попытка запуска:
npx electron installer-main.js

pause
