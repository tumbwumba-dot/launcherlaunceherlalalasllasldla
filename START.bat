@echo off
chcp 65001 > nul
title Reduxion Launcher - Главное меню

:menu
cls
echo.
echo ========================================
echo    REDUXION LAUNCHER v1.0.0
echo ========================================
echo.
echo Выберите действие:
echo.
echo  [1] Запустить лаунчер
echo  [2] Запустить установщик
echo  [3] Создать портативную версию
echo  [4] Собрать exe файлы (полная сборка)
echo  [5] Тестирование базовой функциональности
echo  [6] Показать информацию о проекте
echo  [7] Выйти
echo.
set /p choice="Ваш выбор (1-7): "

if "%choice%"=="1" goto run_launcher
if "%choice%"=="2" goto run_installer
if "%choice%"=="3" goto create_portable
if "%choice%"=="4" goto build_all
if "%choice%"=="5" goto test_basic
if "%choice%"=="6" goto show_info
if "%choice%"=="7" goto exit

echo Неверный выбор! Попробуйте снова.
timeout /t 2 >nul
goto menu

:run_launcher
echo.
echo Запуск лаунчера...
call run-launcher.bat
goto menu

:run_installer
echo.
echo Запуск установщика...
call run-installer.bat
goto menu

:create_portable
echo.
echo Создание портативной версии...
call create-portable.bat
goto menu

:build_all
echo.
echo Полная сборка проекта...
call build-all.bat
goto menu

:test_basic
echo.
echo Тестирование базовой функциональности...
call test-basic.bat
goto menu

:show_info
cls
echo.
echo ========================================
echo    ИНФОРМАЦИЯ О ПРОЕКТЕ
echo ========================================
echo.
echo Название: Reduxion Launcher
echo Версия: 1.0.0
echo Описание: Автоматический лаунчер для редуксов Majestic
echo.
echo Особенности:
echo - Современный дизайн в стиле сайта
echo - Автоматическая установка редуксов
echo - Умное обнаружение GTA 5
echo - Гибкие настройки лаунчера
echo - Полнофункциональный установщик
echo.
echo Структура файлов:
echo - modern-launcher.html (основной интерфейс)
echo - installer.html (интерфейс установщика)
echo - *.css (стили дизайна)
echo - main.js (основная логика)
echo - installer-main.js (логика установщика)
echo.
echo Скрипты запуска:
echo - START.bat (это меню)
echo - run-launcher.bat (запуск лаунчера)
echo - run-installer.bat (запуск установщика)
echo - create-portable.bat (портативная версия)
echo - build-*.bat (сборка exe)
echo.
echo Файлы документации:
echo - README.md (основная инструкция)
echo - INSTALLER_README.md (инструкция по установщику)
echo - MODERN_LAUNCHER_README.md (описание лаунчера)
echo.
pause
goto menu

:exit
echo.
echo До свидания!
timeout /t 2 >nul
exit