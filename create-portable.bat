@echo off
chcp 65001 > nul
title Создание портативной версии Reduxion Launcher

echo.
echo ========================================
echo   Создание портативной версии
echo ========================================
echo.

echo Шаг 1: Проверка файлов...
if not exist "modern-launcher.html" (
    echo Ошибка: Файл modern-launcher.html не найден!
    pause
    exit /b 1
)

echo.
echo Шаг 2: Создание портативной папки...
set "PORTABLE_DIR=Reduxion Launcher Portable"
if exist "%PORTABLE_DIR%" (
    echo Удаление старой версии...
    rmdir /s /q "%PORTABLE_DIR%"
)

mkdir "%PORTABLE_DIR%"

echo.
echo Шаг 3: Копирование файлов...
xcopy /e /i /h /y "*" "%PORTABLE_DIR%" >nul

echo.
echo Шаг 4: Создание ярлыка запуска...
echo @echo off > "%PORTABLE_DIR%\START_PORTABLE.bat"
echo chcp 65001 ^> nul >> "%PORTABLE_DIR%\START_PORTABLE.bat"
echo title Reduxion Launcher Portable >> "%PORTABLE_DIR%\START_PORTABLE.bat"
echo cd /d "%%~dp0" >> "%PORTABLE_DIR%\START_PORTABLE.bat"
echo echo Запуск портативной версии... >> "%PORTABLE_DIR%\START_PORTABLE.bat"
echo call npm install >> "%PORTABLE_DIR%\START_PORTABLE.bat"
echo npx electron . >> "%PORTABLE_DIR%\START_PORTABLE.bat"
echo pause >> "%PORTABLE_DIR%\START_PORTABLE.bat"

echo.
echo Шаг 5: Создание установщика в портативной версии...
echo @echo off > "%PORTABLE_DIR%\INSTALLER_PORTABLE.bat"
echo chcp 65001 ^> nul >> "%PORTABLE_DIR%\INSTALLER_PORTABLE.bat"
echo title Установщик Reduxion Launcher Portable >> "%PORTABLE_DIR%\INSTALLER_PORTABLE.bat"
echo cd /d "%%~dp0" >> "%PORTABLE_DIR%\INSTALLER_PORTABLE.bat"
echo echo Запуск портативного установщика... >> "%PORTABLE_DIR%\INSTALLER_PORTABLE.bat"
echo call npm install >> "%PORTABLE_DIR%\INSTALLER_PORTABLE.bat"
echo npx electron . --installer >> "%PORTABLE_DIR%\INSTALLER_PORTABLE.bat"
echo pause >> "%PORTABLE_DIR%\INSTALLER_PORTABLE.bat"

echo.
echo Шаг 6: Создание файла информации...
echo Reduxion Launcher Portable > "%PORTABLE_DIR%\README.txt"
echo Версия: 1.0.0 >> "%PORTABLE_DIR%\README.txt"
echo. >> "%PORTABLE_DIR%\README.txt"
echo Для запуска лаунчера: >> "%PORTABLE_DIR%\README.txt"
echo - Запустите START_PORTABLE.bat >> "%PORTABLE_DIR%\README.txt"
echo. >> "%PORTABLE_DIR%\README.txt"
echo Для запуска установщика: >> "%PORTABLE_DIR%\README.txt"
echo - Запустите INSTALLER_PORTABLE.bat >> "%PORTABLE_DIR%\README.txt"
echo. >> "%PORTABLE_DIR%\README.txt"
echo Портативная версия не требует установки в систему. >> "%PORTABLE_DIR%\README.txt"

echo.
echo ========================================
echo   Портативная версия создана!
echo ========================================
echo.
echo Папка: %PORTABLE_DIR%
echo.
echo Файлы для запуска:
echo - START_PORTABLE.bat (лаунчер)
echo - INSTALLER_PORTABLE.bat (установщик)
echo.
echo Теперь вы можете:
echo 1. Скопировать папку "%PORTABLE_DIR%" на любой носитель
echo 2. Запускать лаунчер без установки в систему
echo 3. Распространять портативную версию
echo.
pause