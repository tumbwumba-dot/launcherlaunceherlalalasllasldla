@echo off
chcp 65001 > nul
title Диагностика установщика Reduxion Launcher

echo ========================================
echo    Диагностика установщика
echo ========================================
echo.

echo [1/5] Проверка системной информации...
echo ОС: %OS%
echo Процессор: %PROCESSOR_ARCHITECTURE%
echo.

echo [2/5] Проверка EXE файла...
if exist "Ready-to-Upload\ReduxionLauncherSetup-FINAL.exe" (
    echo ✅ EXE файл найден
    dir "Ready-to-Upload\ReduxionLauncherSetup-FINAL.exe" | findstr /C:"ReduxionLauncherSetup-FINAL.exe"
    echo.

    echo [3/5] Проверка цифровой подписи...
    signtool verify /v "Ready-to-Upload\ReduxionLauncherSetup-FINAL.exe" >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Цифровая подпись не найдена или повреждена
    ) else (
        echo ✅ Цифровая подпись корректная
    )
    echo.

    echo [4/5] Проверка антивируса...
    echo Проверяем, не блокирует ли антивирус файл...
    powershell -command "Get-MpComputerStatus | Select-Object -ExpandProperty AntivirusEnabled" 2>nul
    if errorlevel 1 (
        echo ❌ Не удалось проверить антивирус
    ) else (
        echo ✅ Антивирус активен, проверяем файл...
        mpcmdrun -Scan -ScanType 3 -File "Ready-to-Upload\ReduxionLauncherSetup-FINAL.exe" >nul 2>&1
        if errorlevel 1 (
            echo ⚠️  Файл может быть подозрительным для антивируса
        ) else (
            echo ✅ Антивирус не блокирует файл
        )
    )
    echo.

    echo [5/5] Попытка запуска с диагностикой...
    cd /d "%~dp0Ready-to-Upload"
    echo Текущая директория: %CD%
    echo.

    echo Попытка запуска без параметров...
    echo Команда: ReduxionLauncherSetup-FINAL.exe
    (ReduxionLauncherSetup-FINAL.exe >nul 2>&1 && echo ✅ Запуск успешен) || (
        echo ❌ Запуск неудачен
        echo Код ошибки: %errorlevel%
        echo.

        echo Попытка запуска с отладкой...
        echo Команда: ReduxionLauncherSetup-FINAL.exe --debug
        ReduxionLauncherSetup-FINAL.exe --debug >debug-output.txt 2>&1
        if exist "debug-output.txt" (
            echo Содержимое debug-output.txt:
            type debug-output.txt
        )
    )

) else (
    echo ❌ EXE файл НЕ НАЙДЕН!
    echo Ожидалось найти: Ready-to-Upload\ReduxionLauncherSetup-FINAL.exe
    dir /b /s ReduxionLauncherSetup*.exe 2>nul || echo Нет файлов установщика
)

echo.
echo ========================================
echo Диагностика завершена
echo ========================================
echo.
pause