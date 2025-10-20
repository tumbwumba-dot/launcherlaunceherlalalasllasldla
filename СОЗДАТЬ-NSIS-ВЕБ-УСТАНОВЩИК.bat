@echo off
chcp 65001 > nul
title Создание Bootstrap-Установщика на Electron (оригинальный интерфейс)

cd /d "%~dp0"

echo.
echo ==================================================================
echo   Reduxion: сборка Bootstrap-Установщика с оригинальным дизайном
echo ==================================================================
echo.
echo Это маленький .exe с интерфейсом Majestic, который скачает
echo полный установщик с сервера и запустит его.
echo.

REM Проверка наличия node_modules
if not exist node_modules (
  echo Устанавливаю зависимости...
  call npm install || goto :error
)

REM Копируем конфигурацию bootstrap
echo [1/4] Подготовка конфигурации bootstrap...
copy /Y package-bootstrap.json package.json >nul

REM Очищаем кеш electron-builder
echo [2/4] Очищаю кеш electron-builder...
if exist "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign" (
  rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache\winCodeSign"
)

REM Создаем папку для иконки если её нет
if not exist assets mkdir assets

echo.
echo [3/4] Собираю bootstrap-инсталлятор с Majestic дизайном...
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
set CSC_IDENTITY_AUTO_DISCOVERY=false
set WIN_CSC_LINK=
set CSC_LINK=

call npx electron-builder --win nsis --config electron-builder-bootstrap.yml || goto :error

echo.
echo [4/4] Готово! Bootstrap установщик создан.
echo.
echo ===================================================================
echo МЕСТОНАХОЖДЕНИЕ:
echo   bootstrap-dist\Reduxion-Bootstrap-Installer.exe
echo.
echo ЧТО ЭТО:
echo   - Портативный .exe (~100-150 МБ) с интерфейсом Majestic
echo   - СРАЗУ ЗАПУСКАЕТСЯ С КРАСИВЫМ ИНТЕРФЕЙСОМ (не NSIS!)
echo   - При запуске подключается к серверу и скачивает полный установщик
echo   - Отображает прогресс загрузки в красивом интерфейсе Majestic
echo   - После загрузки автоматически запускает полный установщик
echo.
echo НАСТРОЙКА СЕРВЕРА:
echo   Отредактируйте файл bootstrap-installer-main.js
echo   Измените строку serverUrl на ваш домен:
echo   serverUrl: 'https://your-domain.example.com/reduxion/launcher/'
echo.
echo ПУБЛИКАЦИЯ:
echo   1) Соберите полный установщик (СОЗДАТЬ-УСТАНОВЩИК-ДЛЯ-ПОЛЬЗОВАТЕЛЕЙ.bat)
echo   2) Загрузите файл установщика на ваш сервер
echo   3) Раздавайте пользователям bootstrap установщик
echo.
echo ===================================================================
echo.
pause
exit /b 0

:error
echo.
echo Ошибка сборки. Проверьте вывод выше.
pause
exit /b 1
