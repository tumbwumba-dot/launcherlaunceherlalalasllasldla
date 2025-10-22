@echo off
chcp 65001 > nul
title Тестирование Bootstrap Установщика

cd /d "%~dp0"

echo.
echo ================================================
echo   Запуск Bootstrap Установщика (DEV режим)
echo ================================================
echo.

REM Проверка наличия node_modules
if not exist node_modules (
  echo Устанавливаю зависимости...
  call npm install || goto :error
)

echo Копирую конфигурацию bootstrap...
copy /Y package-bootstrap.json package.json >nul

echo.
echo Запускаю bootstrap установщик...
echo (Окно откроется через несколько секунд)
echo.

call npx electron bootstrap-installer-main.js

echo.
echo Закрыто.
pause
exit /b 0

:error
echo.
echo Ошибка запуска.
pause
exit /b 1
