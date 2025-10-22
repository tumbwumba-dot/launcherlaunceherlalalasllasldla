const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { exec } = require('child_process');
const LauncherDownloader = require('./downloader');

// Глобальная переменная для окна установщика
let installerWindow;
// Глобальная переменная для загрузчика
let downloader;

// Создание окна установщика
function createInstallerWindow() {
  installerWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    resizable: false,
    minimizable: false,
    maximizable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Установка Reduxion Launcher',
    show: false
  });

  // Проверяем права администратора при старте
  installerWindow.webContents.once('did-finish-load', () => {
    checkAdminRights();
  });

  // Загружаем HTML файл установщика (Majestic дизайн)
  installerWindow.loadFile('installer-majestic.html');

  // Показываем окно только после полной загрузки
  installerWindow.once('ready-to-show', () => {
    installerWindow.show();
  });

  // Обработчик закрытия окна
  installerWindow.on('closed', () => {
    installerWindow = null;
  });
}

// IPC обработчики для установщика

let installationData = {}; // Сохраняем данные установки

// Обработчик начала установки
ipcMain.on('start-installation', async (event, options) => {
  console.log('Начало установки с опциями:', options);
  installationData = options; // Сохраняем опции для использования позже
  await performInstallation(options);
});

// Функция создания ярлыка на рабочем столе
async function createDesktopShortcut(launcherPath) {
  try {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const shortcutPath = path.join(desktopPath, 'Reduxion Launcher.lnk');
    
    // Для Windows используем PowerShell для создания ярлыка
    const psCommand = `
      $WshShell = New-Object -ComObject WScript.Shell;
      $Shortcut = $WshShell.CreateShortcut('${shortcutPath}');
      $Shortcut.TargetPath = '${launcherPath}';
      $Shortcut.WorkingDirectory = '${path.dirname(launcherPath)}';
      $Shortcut.Description = 'Reduxion Launcher';
      $Shortcut.Save()
    `;
    
    return new Promise((resolve, reject) => {
      exec(`powershell.exe -Command "${psCommand}"`, (error) => {
        if (error) {
          console.error('Ошибка создания ярлыка на рабочем столе:', error);
          reject(error);
        } else {
          console.log('Ярлык на рабочем столе создан');
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при создании ярлыка:', error);
  }
}

// Функция создания ярлыка в меню Пуск
async function createStartMenuShortcut(launcherPath) {
  try {
    const startMenuPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    const reduxionFolder = path.join(startMenuPath, 'Reduxion Launcher');
    
    // Создаем папку если её нет
    await fs.ensureDir(reduxionFolder);
    
    const shortcutPath = path.join(reduxionFolder, 'Reduxion Launcher.lnk');
    
    const psCommand = `
      $WshShell = New-Object -ComObject WScript.Shell;
      $Shortcut = $WshShell.CreateShortcut('${shortcutPath}');
      $Shortcut.TargetPath = '${launcherPath}';
      $Shortcut.WorkingDirectory = '${path.dirname(launcherPath)}';
      $Shortcut.Description = 'Reduxion Launcher';
      $Shortcut.Save()
    `;
    
    return new Promise((resolve, reject) => {
      exec(`powershell.exe -Command "${psCommand}"`, (error) => {
        if (error) {
          console.error('Ошибка создания ярлыка в меню Пуск:', error);
          reject(error);
        } else {
          console.log('Ярлык в меню Пуск создан');
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при создании ярлыка в меню Пуск:', error);
  }
}

// Функция выполнения установки
async function performInstallation(options) {
  const { path: installPath, desktopShortcut, startMenuShortcut, autorun } = options;
  
  try {
    // Шаг 1: Создание папок
    if (installerWindow) {
      installerWindow.webContents.send('update-progress', {
        statusText: 'СОЗДАНИЕ ПАПОК...',
        percentage: 10
      });
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await fs.ensureDir(installPath);
    
    // Шаг 2: Копирование файлов лаунчера
    if (installerWindow) {
      installerWindow.webContents.send('update-progress', {
        statusText: 'УСТАНОВКА ЛАУНЧЕРА...',
        percentage: 30
      });
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Проверяем, есть ли собранный .exe лаунчера в папке установщика
    const launcherDistPath = path.join(__dirname, '..', 'launcher-dist', 'Reduxion Launcher-win32-x64');
    const launcherExeName = 'Reduxion Launcher.exe';
    const sourceLauncherExe = path.join(launcherDistPath, launcherExeName);
    const destLauncherExe = path.join(installPath, launcherExeName);
    
    if (await fs.pathExists(sourceLauncherExe)) {
      // Копируем собранный .exe
      if (installerWindow) {
        installerWindow.webContents.send('update-progress', {
          statusText: 'КОПИРОВАНИЕ ЛАУНЧЕРА...',
          percentage: 50
        });
      }
      
      // Копируем весь распакованный лаунчер
      await fs.copy(launcherDistPath, installPath);
      
      // Путь к главному .exe файлу лаунчера
      installationData.launcherPath = path.join(installPath, 'Reduxion Launcher.exe');
      
    } else {
      // Если собранного .exe нет, копируем исходники и создаем .bat
      if (installerWindow) {
        installerWindow.webContents.send('update-progress', {
          statusText: 'КОПИРОВАНИЕ ФАЙЛОВ...',
          percentage: 40
        });
      }
      
      const excludeDirs = ['node_modules', 'installer-dist', 'installer-dist-final', 'launcher-dist', 'temp-installer', 'test-dist', 'SFX-Installer', 'Ready-to-Upload', 'build', 'dist'];
      const excludeFiles = ['installer.html', 'installer-main.js', 'installer-majestic.html', 'installer-majestic.css', 'installer-styles.css'];
      
      const copyRecursive = async (src, dest) => {
        try {
          const stats = await fs.stat(src);
          
          if (stats.isDirectory()) {
            const dirName = path.basename(src);
            if (excludeDirs.includes(dirName)) return;
            
            await fs.ensureDir(dest);
            const files = await fs.readdir(src);
            
            for (const file of files) {
              await copyRecursive(path.join(src, file), path.join(dest, file));
            }
          } else {
            const fileName = path.basename(src);
            if (!excludeFiles.includes(fileName) && !fileName.startsWith('ЗАПУСТИТЬ') && !fileName.includes('installer') && !fileName.endsWith('.bat')) {
              await fs.copy(src, dest);
            }
          }
        } catch (error) {
          console.log(`Пропуск файла: ${src}`, error.message);
        }
      };
      
      await copyRecursive(__dirname, installPath);
      
      // Создаем bat файл для запуска
      const launcherBatPath = path.join(installPath, 'Запустить Reduxion Launcher.bat');
      const batContent = `@echo off
cd /d "%~dp0"
if exist "node_modules\\electron" (
    npx electron main.js
) else (
    echo Устанавливаем Electron...
    call npm install electron --save-dev
    npx electron main.js
)`;
      await fs.writeFile(launcherBatPath, batContent);
      installationData.launcherPath = launcherBatPath;
    }
    
    // Шаг 3: Создание ярлыков
    if (installerWindow) {
      installerWindow.webContents.send('update-progress', {
        statusText: 'СОЗДАНИЕ ЯРЛЫКОВ...',
        percentage: 80
      });
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (desktopShortcut) {
      await createDesktopShortcut(installationData.launcherPath);
    }
    
    if (startMenuShortcut) {
      await createStartMenuShortcut(installationData.launcherPath);
    }
    
    // Шаг 4: Завершение
    if (installerWindow) {
      installerWindow.webContents.send('update-progress', {
        statusText: 'ЗАВЕРШЕНИЕ УСТАНОВКИ...',
        percentage: 100
      });
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Сохраняем информацию об установке
    const installInfo = {
      installPath,
      version: '1.0.0',
      installDate: new Date().toISOString(),
      desktopShortcut,
      startMenuShortcut,
      autorun
    };
    
    await fs.writeJson(path.join(installPath, 'install-info.json'), installInfo, { spaces: 2 });
    
    // Установка завершена
    if (installerWindow) {
      installerWindow.webContents.send('installation-complete');
    }
    
  } catch (error) {
    console.error('Ошибка установки:', error);
    if (installerWindow) {
      dialog.showErrorBox('Ошибка установки', `Произошла ошибка: ${error.message}`);
    }
  }
}

// Обработчик завершения установки
ipcMain.on('finish-installation', (event, options) => {
  const { launchAfter } = options;
  
  if (launchAfter && installationData.launcherPath) {
    console.log('Запуск лаунчера:', installationData.launcherPath);
    
    // Запускаем лаунчер
    const launcherExe = installationData.launcherPath.replace('.bat', '.exe');
    
    // Проверяем, есть ли .exe файл
    if (require('fs').existsSync(launcherExe)) {
      // Запускаем настоящий .exe
      require('child_process').spawn(launcherExe, [], {
        detached: true,
        stdio: 'ignore'
      }).unref();
    } else if (installationData.launcherPath.endsWith('.bat')) {
      // Если только .bat
      exec(`start "" "${installationData.launcherPath}"`, (error) => {
        if (error) {
          console.error('Ошибка запуска лаунчера:', error);
        }
      });
    } else {
      // Пробуем через shell
      shell.openPath(installationData.launcherPath).catch(err => {
        console.error('Ошибка открытия лаунчера:', err);
      });
    }
  }
  
  // Закрываем установщик через 500мс чтобы лаунчер успел запуститься
  setTimeout(() => {
    app.quit();
  }, 500);
});

// Обработчик отмены установки
ipcMain.on('cancel-installation', () => {
  dialog.showMessageBox(installerWindow, {
    type: 'question',
    title: 'Отмена установки',
    message: 'Вы действительно хотите отменить установку?',
    buttons: ['Да, отменить', 'Нет, продолжить'],
    defaultId: 1
  }).then(result => {
    if (result.response === 0) {
      app.quit();
    }
  });
});

ipcMain.handle('select-install-folder', async () => {
  const defaultPath = path.join(os.homedir(), 'Reduxion Launcher');
  
  const result = await dialog.showOpenDialog(installerWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Выберите папку для установки',
    defaultPath: defaultPath,
    buttonLabel: 'Выбрать папку'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Проверка прав администратора
async function checkAdminRights() {
  try {
    const testPath = 'C:\\Program Files\\test-redoxion-rights';
    require('fs').mkdirSync(testPath);
    require('fs').rmdirSync(testPath);

    // Если успешно создали папку в Program Files, значит есть права админа
    if (installerWindow) {
      installerWindow.webContents.send('admin-rights-status', { hasAdmin: true });
    }
  } catch (error) {
    // Нет прав администратора
    if (installerWindow) {
      installerWindow.webContents.send('admin-rights-status', {
        hasAdmin: false,
        suggestedPath: require('os').homedir() + '\\Reduxion Launcher'
      });
    }
  }
}

// IPC обработчик для скачивания лаунчера
ipcMain.handle('download-launcher', async (event, serverUrl) => {
  try {
    if (!downloader) {
      downloader = new LauncherDownloader();
    }

    const downloadResult = await downloader.downloadLauncher(serverUrl);

    if (downloadResult.success) {
      return {
        success: true,
        launcherPath: downloadResult.path,
        launcherInfo: downloadResult.info
      };
    } else {
      return {
        success: false,
        error: downloadResult.error
      };
    }
  } catch (error) {
    console.error('Ошибка скачивания лаунчера:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('run-installation', async (event, options) => {
  try {
    const { installPath, createDesktopShortcut, createStartMenuShortcut, serverUrl } = options;

    // Проверяем доступность пути установки
    try {
      await require('fs').access(installPath);
    } catch (error) {
      // Путь недоступен, пробуем создать
      try {
        await require('fs').mkdir(installPath, { recursive: true });
      } catch (createError) {
        const os = require('os');
        const userPath = path.join(os.homedir(), 'Reduxion Launcher');
        const desktopPath = path.join(os.homedir(), 'Desktop', 'Reduxion Launcher');
        const docsPath = path.join(os.homedir(), 'Documents', 'Reduxion Launcher');

        throw new Error(
          `Нет доступа к папке: ${installPath}\n\n` +
          `Рекомендуемые пути установки:\n` +
          `• Папка пользователя: ${userPath}\n` +
          `• Рабочий стол: ${desktopPath}\n` +
          `• Документы: ${docsPath}\n\n` +
          `Выберите доступную папку или запустите установщик от имени администратора.`
        );
      }
    }

    // Процесс установки с возможным скачиванием лаунчера
    let progress = 0;
    let launcherPath = null;
    let launcherInfo = null;

    // Шаг 1: Создание папок
    progress = 5;
    installerWindow.webContents.send('install-progress', {
      percent: Math.round(progress),
      title: 'Создание папок...',
      subtitle: 'Подготовка структуры приложения'
    });
    await new Promise(resolve => setTimeout(resolve, 800));

    await fs.ensureDir(installPath);
    const launcherDir = path.join(installPath, 'ReduxionLauncher');

    // Шаг 2: Скачивание лаунчера (если указан сервер)
    if (serverUrl && serverUrl.trim()) {
      progress = 10;
      installerWindow.webContents.send('install-progress', {
        percent: Math.round(progress),
        title: 'Подключение к серверу...',
        subtitle: 'Получение информации о лаунчере'
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      progress = 15;
      installerWindow.webContents.send('install-progress', {
        percent: Math.round(progress),
        title: 'Скачивание лаунчера...',
        subtitle: 'Получение актуальной версии с сервера'
      });

      const downloadResult = await downloader.downloadLauncher(serverUrl);
      if (downloadResult.success) {
        launcherPath = downloadResult.path;
        launcherInfo = downloadResult.info;

        progress = 50;
        installerWindow.webContents.send('install-progress', {
          percent: Math.round(progress),
          title: 'Лаунчер скачан...',
          subtitle: `Версия ${launcherInfo.version || 'latest'} получена`
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw new Error(`Не удалось скачать лаунчер: ${downloadResult.error}`);
      }
    } else {
      progress = 50;
      installerWindow.webContents.send('install-progress', {
        percent: Math.round(progress),
        title: 'Использование локального лаунчера...',
        subtitle: 'Копирование файлов приложения'
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Шаг 3: Копирование файлов
    progress = 60;
    installerWindow.webContents.send('install-progress', {
      percent: Math.round(progress),
      title: 'Копирование файлов...',
      subtitle: 'Перенос файлов приложения'
    });
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Копируем файлы лаунчера
    if (launcherPath) {
      // Копируем скачанный лаунчер
      await fs.copy(launcherPath, path.join(launcherDir, 'launcher.exe'));
    } else {
      // Копируем текущие файлы (для локальной установки)
      await fs.copy(__dirname, launcherDir, {
        filter: (src, dest) => {
          const excludePatterns = [
            'dist',
            'build',
            'node_modules',
            '*.log',
            'installer.*'
          ];
          return !excludePatterns.some(pattern => src.includes(pattern));
        }
      });
    }

    // Шаг 4: Установка зависимостей
    progress = 80;
    installerWindow.webContents.send('install-progress', {
      percent: Math.round(progress),
      title: 'Установка зависимостей...',
      subtitle: 'Настройка компонентов'
    });
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Шаг 5: Создание ярлыков
    progress = 90;
    installerWindow.webContents.send('install-progress', {
      percent: Math.round(progress),
      title: 'Создание ярлыков...',
      subtitle: 'Настройка интеграции с системой'
    });
    await new Promise(resolve => setTimeout(resolve, 800));

    if (createDesktopShortcut) {
      await createDesktopShortcut(launcherDir);
    }

    if (createStartMenuShortcut) {
      await createStartMenuShortcut(launcherDir);
    }

    // Шаг 6: Завершение
    progress = 100;
    installerWindow.webContents.send('install-progress', {
      percent: 100,
      title: 'Установка завершена!',
      subtitle: 'Reduxion Launcher готов к использованию'
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Сохраняем информацию об установке
    const installInfo = {
      installPath: launcherDir,
      version: launcherInfo ? launcherInfo.version : app.getVersion(),
      installDate: new Date().toISOString(),
      createDesktopShortcut,
      createStartMenuShortcut,
      downloadedFrom: serverUrl || 'local'
    };

    await fs.writeJson(path.join(launcherDir, 'install-info.json'), installInfo);

    return { success: true };

  } catch (error) {
    console.error('Ошибка установки:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('finish-installation', async (event, options) => {
  const { launchApp, showReadme } = options;

  if (launchApp) {
    // Здесь можно запустить установленный лаунчер
    console.log('Пользователь выбрал запуск приложения');
  }

  if (showReadme) {
    // Здесь можно показать инструкцию
    console.log('Пользователь выбрал показ инструкции');
  }

  return { success: true };
});

ipcMain.handle('exit-installer', async () => {
  app.quit();
});

// Инициализация приложения установщика
app.whenReady().then(() => {
  // Инициализируем загрузчик
  downloader = new LauncherDownloader();

  createInstallerWindow();

  // Обработчик активации приложения (для macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createInstallerWindow();
    }
  });
});

// Обработчик закрытия всех окон
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Обработчик перед выходом из приложения
app.on('before-quit', () => {
  if (installerWindow) {
    installerWindow.removeAllListeners('closed');
  }
});

// Обработчик ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  if (installerWindow) {
    dialog.showErrorBox('Ошибка приложения', 'Произошла необработанная ошибка. Приложение будет закрыто.');
  }
  app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанный промис:', reason, promise);
});