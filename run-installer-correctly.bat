@echo off
chcp 65001 > nul
title Правильный запуск установщика Reduxion Launcher

echo ========================================
echo    Правильный запуск установщика
echo ========================================
echo.

echo Поиск рабочей версии установщика...
echo.

REM Проверка папки Ready-to-Upload (с полным набором файлов)
if exist "Ready-to-Upload\ReduxionLauncherSetup-FINAL.exe" (
    if exist "Ready-to-Upload\icudtl.dat" (
        echo ✅ Найдена рабочая версия в папке Ready-to-Upload
        echo.
        echo Запуск установщика из правильной папки...
        echo ========================================
        echo.
        cd /d "%~dp0Ready-to-Upload"
        echo Текущая директория: %CD%
        echo.
        echo Проверка наличия всех необходимых файлов:
        dir /b | findstr /C:"ReduxionLauncherSetup-FINAL.exe" /C:"icudtl.dat" /C:"d3dcompiler_47.dll" /C:"ffmpeg.dll" /C:"libEGL.dll" /C:"libGLESv2.dll" /C:"vk_swiftshader.dll" /C:"vulkan-1.dll" >nul
        if errorlevel 1 (
            echo ❌ Отсутствуют необходимые файлы!
            pause
            exit /b 1
        )
        echo ✅ Все необходимые файлы найдены
        echo.
        echo 🚀 Запуск установщика...
        start ReduxionLauncherSetup-FINAL.exe
        echo.
        echo Установщик запущен успешно!
        goto :success
    )
)

REM Проверка корневой папки (если есть все файлы)
if exist "ReduxionLauncherSetup-FINAL.exe" (
    if exist "icudtl.dat" (
        echo ✅ Найдена рабочая версия в корневой папке
        echo.
        echo Запуск установщика...
        start ReduxionLauncherSetup-FINAL.exe
        echo.
        echo Установщик запущен успешно!
        goto :success
    )
)

REM Поиск любых EXE файлов установщика
echo 🔍 Поиск всех доступных установщиков...
for %%f in (*Setup*.exe) do (
    echo Найден: %%f
)

echo.
echo ❌ Не найдено рабочей версии установщика с полным набором файлов!
echo.
echo Для правильной работы установщику нужны следующие файлы в одной папке:
echo - ReduxionLauncherSetup-*.exe (основной файл)
echo - icudtl.dat (ICU данные - обязательно!)
echo - d3dcompiler_47.dll
echo - ffmpeg.dll
echo - libEGL.dll
echo - libGLESv2.dll
echo - vk_swiftshader.dll
echo - vulkan-1.dll
echo.
echo Рекомендация: Используйте файлы из папки Ready-to-Upload
echo.

pause
exit /b 1

:success
echo.
echo ========================================
echo   Установщик запущен успешно!
echo ========================================
echo.
pause