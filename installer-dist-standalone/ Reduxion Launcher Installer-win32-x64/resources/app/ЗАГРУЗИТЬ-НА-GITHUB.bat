@echo off
chcp 65001 > nul
title Инструкция по загрузке на GitHub

echo.
echo ============================================================
echo   Инструкция: Загрузка установщика на GitHub Releases
echo ============================================================
echo.
echo ВАРИАНТ 1: Через веб-интерфейс GitHub (ПРОЩЕ):
echo.
echo   1. Откройте браузер и перейдите:
echo      https://github.com/tumbwumba-dot/launcherlaunceherlalalasllasldla/releases/new
echo.
echo   2. Заполните:
echo      - Tag version: v1.0.0
echo      - Release title: Reduxion Launcher v1.0.0
echo      - Description: (любое описание)
echo.
echo   3. Нажмите "Attach binaries" и загрузите файл:
echo      installer-dist\Reduxion Launcher Setup *.exe
echo      или
echo      Ready-to-Upload\Reduxion Launcher Setup *.exe
echo.
echo   4. Переименуйте загруженный файл в:
echo      Reduxion-Launcher-Setup.exe
echo.
echo   5. Нажмите "Publish release"
echo.
echo   ✅ Готово! Файл будет доступен по адресу:
echo   https://github.com/tumbwumba-dot/launcherlaunceherlalalasllasldla/releases/download/v1.0.0/Reduxion-Launcher-Setup.exe
echo.
echo ============================================================
echo.
echo ВАРИАНТ 2: Через GitHub CLI (если установлен):
echo.
echo   gh release create v1.0.0 ^
echo     --title "Reduxion Launcher v1.0.0" ^
echo     --notes "Первый релиз Reduxion Launcher" ^
echo     "installer-dist\Reduxion Launcher Setup *.exe#Reduxion-Launcher-Setup.exe"
echo.
echo ============================================================
echo.
echo После загрузки запустите: СОЗДАТЬ-NSIS-ВЕБ-УСТАНОВЩИК.bat
echo.
pause
