@echo off
chcp 65001 > nul
title Создание установщика Reduxion Launcher

:menu
cls
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║                                               ║
echo ║     Создание установщика для пользователей   ║
echo ║            Reduxion Launcher v1.0             ║
echo ║                                               ║
echo ╚═══════════════════════════════════════════════╝
echo.
echo Выберите метод создания установщика:
echo.
echo ┌─────────────────────────────────────────────┐
echo │                                             │
echo │  1. Electron Builder (рекомендуется)       │
echo │     • Профессиональный NSIS установщик     │
echo │     • Размер: ~150 MB                       │
echo │     • Требует: Node.js                      │
echo │     • Время: 3-5 минут                      │
echo │                                             │
echo │  2. SFX архив (альтернатива)               │
echo │     • Самораспаковывающийся архив          │
echo │     • Размер: ~50 MB                        │
echo │     • Требует: WinRAR или 7-Zip            │
echo │     • Время: 1-2 минуты                     │
echo │                                             │
echo │  3. Проверить существующий установщик      │
echo │                                             │
echo │  4. Открыть папку Ready-to-Upload          │
echo │                                             │
echo │  0. Выход                                   │
echo │                                             │
echo └─────────────────────────────────────────────┘
echo.
set /p choice="Ваш выбор (1-4, 0): "

if "%choice%"=="1" goto electron_builder
if "%choice%"=="2" goto sfx_archive
if "%choice%"=="3" goto check_installer
if "%choice%"=="4" goto open_folder
if "%choice%"=="0" exit
goto menu

:electron_builder
cls
echo.
echo ═══════════════════════════════════════════════
echo   Запуск Electron Builder
echo ═══════════════════════════════════════════════
echo.
call СОБРАТЬ-УСТАНОВЩИК.bat
goto menu

:sfx_archive
cls
echo.
echo ═══════════════════════════════════════════════
echo   Создание SFX установщика
echo ═══════════════════════════════════════════════
echo.
call СОЗДАТЬ-SFX-УСТАНОВЩИК.bat
goto menu

:check_installer
cls
echo.
echo ═══════════════════════════════════════════════
echo   Проверка установщиков
echo ═══════════════════════════════════════════════
echo.

cd /d "%~dp0Ready-to-Upload"

if not exist "*.exe" (
    echo ❌ Установщики не найдены в папке Ready-to-Upload
    echo.
    echo Сначала создайте установщик (опция 1 или 2)
) else (
    echo ✅ Найдены установщики:
    echo.
    dir /b *.exe
    echo.
    echo Размеры:
    echo.
    for %%f in (*.exe) do (
        echo   %%~nxf - %%~zf байт
    )
)

echo.
pause
goto menu

:open_folder
explorer "Ready-to-Upload"
goto menu
