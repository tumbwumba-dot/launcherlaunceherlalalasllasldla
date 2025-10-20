@echo off
chcp 65001 > nul
title Создание красивого Electron веб-установщика с Majestic дизайном

cd /d "%~dp0"

echo.
echo ================================================================
echo   Reduxion: сборка красивого веб-установщика (Electron + HTML)
echo ================================================================
echo.
echo Этот установщик:
echo  ✓ Использует ваш Majestic дизайн (installer-majestic.html/css)
echo  ✓ Скачивает лаунчер с сервера во время установки
echo  ✓ Весит немного (~50-80 МБ из-за Electron runtime)
echo  ✓ Полностью кастомизируемый интерфейс
echo.

REM Проверка наличия node_modules
if not exist node_modules (
  echo [1/4] Устанавливаю зависимости...
  call npm install || goto :error
)

REM Проверяем, что installer-majestic.html использует правильный main
echo [2/4] Проверяю конфигурацию...

REM Обновляем package.json для установщика (временно)
copy /Y package.json package-backup.json > nul

echo { > package.json
echo   "name": "reduxion-web-installer", >> package.json
echo   "version": "1.0.0", >> package.json
echo   "description": "Reduxion Launcher Web Installer", >> package.json
echo   "main": "installer-main.js", >> package.json
echo   "author": "Reduxion Team", >> package.json
echo   "license": "MIT", >> package.json
echo   "dependencies": {} >> package.json
echo } >> package.json

echo.
echo [3/4] Собираю красивый установщик...
echo.

REM Отключаем подписывание и собираем
set CSC_IDENTITY_AUTO_DISCOVERY=false
set WIN_CSC_LINK=
set CSC_LINK=
call npx electron-builder --config electron-builder-web-installer.yml --win nsis || goto :error

REM Восстанавливаем оригинальный package.json
if exist package-backup.json (
  copy /Y package-backup.json package.json > nul
  del package-backup.json
)

echo.
echo [4/4] Готово!
echo.
echo ================================================================
echo  Ваш красивый установщик готов!
echo ================================================================
echo.
echo Файл: FINAL-INSTALLER\Reduxion Web Installer-v1.0.0.exe
echo.
echo Как это работает:
echo  1) Пользователь запускает .exe
echo  2) Открывается ваш Majestic дизайн (installer-majestic.html)
echo  3) Установщик скачивает лаунчер с сервера (URL в installer-main.js)
echo  4) Показывается прогресс с анимацией
echo  5) Лаунчер устанавливается и запускается
echo.
echo Настройка URL сервера:
echo  Откройте installer-main.js и измените адрес сервера
echo  для скачивания лаунчера (переменная downloadUrl).
echo.
pause
exit /b 0

:error
echo.
echo Ошибка сборки. Проверьте вывод выше.
pause
exit /b 1
