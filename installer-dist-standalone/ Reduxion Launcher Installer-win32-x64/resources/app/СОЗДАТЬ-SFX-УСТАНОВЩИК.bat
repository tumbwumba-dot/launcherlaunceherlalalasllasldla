@echo off
chcp 65001 > nul
title Упаковка в самораспаковывающийся архив

cls
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   Альтернативная сборка SFX установщика      ║
echo ╚═══════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo [1/4] Подготовка файлов...
echo ────────────────────────────────────────────────

REM Создаем временную папку
if exist "temp-sfx" rmdir /s /q "temp-sfx"
mkdir "temp-sfx"

REM Копируем необходимые файлы
echo Копирование файлов лаунчера...
xcopy /E /I /Y "modern-launcher.html" "temp-sfx\"
xcopy /E /I /Y "modern-styles.css" "temp-sfx\"
xcopy /E /I /Y "main.js" "temp-sfx\"
xcopy /E /I /Y "package.json" "temp-sfx\"
xcopy /E /I /Y "assets" "temp-sfx\assets\"

REM Создаем установочный скрипт
echo @echo off > "temp-sfx\install.bat"
echo title Установка Reduxion Launcher >> "temp-sfx\install.bat"
echo. >> "temp-sfx\install.bat"
echo echo Установка Reduxion Launcher... >> "temp-sfx\install.bat"
echo. >> "temp-sfx\install.bat"
echo set "INSTALL_DIR=%%LOCALAPPDATA%%\ReduxionLauncher" >> "temp-sfx\install.bat"
echo if not exist "%%INSTALL_DIR%%" mkdir "%%INSTALL_DIR%%" >> "temp-sfx\install.bat"
echo xcopy /E /I /Y * "%%INSTALL_DIR%%\" >> "temp-sfx\install.bat"
echo. >> "temp-sfx\install.bat"
echo echo Создание ярлыка... >> "temp-sfx\install.bat"
echo powershell "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%%USERPROFILE%%\Desktop\Reduxion Launcher.lnk'); $s.TargetPath = '%%INSTALL_DIR%%\START_MODERN_LAUNCHER.bat'; $s.WorkingDirectory = '%%INSTALL_DIR%%'; $s.Save()" >> "temp-sfx\install.bat"
echo. >> "temp-sfx\install.bat"
echo echo Установка завершена! >> "temp-sfx\install.bat"
echo pause >> "temp-sfx\install.bat"

echo ✅ Файлы подготовлены

echo.
echo [2/4] Проверка WinRAR/7-Zip...
echo ────────────────────────────────────────────────

set "FOUND_PACKER="

REM Проверяем WinRAR
if exist "C:\Program Files\WinRAR\WinRAR.exe" (
    set "PACKER=C:\Program Files\WinRAR\WinRAR.exe"
    set "FOUND_PACKER=WinRAR"
    goto :pack
)

if exist "C:\Program Files (x86)\WinRAR\WinRAR.exe" (
    set "PACKER=C:\Program Files (x86)\WinRAR\WinRAR.exe"
    set "FOUND_PACKER=WinRAR"
    goto :pack
)

REM Проверяем 7-Zip
if exist "C:\Program Files\7-Zip\7z.exe" (
    set "PACKER=C:\Program Files\7-Zip\7z.exe"
    set "FOUND_PACKER=7-Zip"
    goto :pack_7z
)

if exist "C:\Program Files (x86)\7-Zip\7z.exe" (
    set "PACKER=C:\Program Files (x86)\7-Zip\7z.exe"
    set "FOUND_PACKER=7-Zip"
    goto :pack_7z
)

echo ❌ WinRAR или 7-Zip не найдены!
echo.
echo Установите один из архиваторов:
echo - WinRAR: https://www.win-rar.com/
echo - 7-Zip: https://www.7-zip.org/
echo.
pause
exit /b 1

:pack
echo ✅ Найден: %FOUND_PACKER%

echo.
echo [3/4] Создание SFX архива с WinRAR...
echo ────────────────────────────────────────────────

"%PACKER%" a -ep1 -r -sfx -z"sfx-config.txt" "Ready-to-Upload\ReduxionLauncher-Setup.exe" "temp-sfx\*"

if errorlevel 1 (
    echo ❌ Ошибка создания SFX
    pause
    exit /b 1
)

goto :done

:pack_7z
echo ✅ Найден: %FOUND_PACKER%

echo.
echo [3/4] Создание SFX архива с 7-Zip...
echo ────────────────────────────────────────────────

REM Сначала создаем архив
"%PACKER%" a -tzip "temp-archive.zip" ".\temp-sfx\*"

REM Затем конвертируем в SFX
copy /b "C:\Program Files\7-Zip\7z.sfx" + "sfx-config.txt" + "temp-archive.zip" "Ready-to-Upload\ReduxionLauncher-Setup.exe"

del "temp-archive.zip"

:done

echo.
echo [4/4] Очистка...
echo ────────────────────────────────────────────────

rmdir /s /q "temp-sfx"

echo ✅ Очистка завершена

echo.
echo ════════════════════════════════════════════════
echo   Установщик готов!
echo ════════════════════════════════════════════════
echo.

if exist "Ready-to-Upload\ReduxionLauncher-Setup.exe" (
    for %%f in ("Ready-to-Upload\ReduxionLauncher-Setup.exe") do (
        echo Файл: %%~nxf
        echo Размер: %%~zf байт
    )
    echo.
    echo Установщик находится в: Ready-to-Upload\
    explorer "Ready-to-Upload"
) else (
    echo ❌ Файл не создан!
)

pause
