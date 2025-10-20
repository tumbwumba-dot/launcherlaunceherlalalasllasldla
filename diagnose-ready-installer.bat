@echo off
chcp 65001 > nul
title Диагностика установщика

echo ========================================
echo   Диагностика установщика
echo ========================================
echo.

cd /d "%~dp0Ready-to-Upload"

echo Текущая папка: %CD%
echo.

echo Содержимое папки:
echo ----------------------------------------
dir /b
echo ----------------------------------------
echo.

echo Размер установщика:
for %%f in (ReduxionLauncherSetup-FINAL.exe) do echo %%~zf байт
echo.

echo Попытка запуска с логированием...
echo.

ReduxionLauncherSetup-FINAL.exe /S /D=%USERPROFILE%\Desktop\ReduxionTest > installer.log 2>&1

echo.
echo Код возврата: %ERRORLEVEL%
echo.

if exist installer.log (
    echo Содержимое лога:
    type installer.log
)

echo.
echo Проверка процессов:
tasklist | findstr /I "Reduxion"
echo.

pause
