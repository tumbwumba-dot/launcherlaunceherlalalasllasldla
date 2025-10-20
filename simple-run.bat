@echo off
echo Переход в папку Ready-to-Upload...
cd /d "%~dp0Ready-to-Upload"
echo Текущая директория: %CD%
echo.
echo Проверка наличия EXE файла...
if exist "ReduxionLauncherSetup-FINAL.exe" (
    echo EXE файл найден, запуск...
    "ReduxionLauncherSetup-FINAL.exe"
) else (
    echo EXE файл НЕ НАЙДЕН!
    pause
)