@echo off
echo Переход в папку Ready-to-Upload...
cd /d "%~dp0Ready-to-Upload"
echo Текущая директория: %CD%
echo.
echo Запуск установщика...
echo.
echo Нажмите любую клавишу после закрытия установщика...
ReduxionLauncherSetup-FINAL.exe
pause