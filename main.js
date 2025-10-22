const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const ps = require('ps-node');
const https = require('https');
const { exec } = require('child_process');
const DownloadManager = require('./download-manager');

// Глобальная переменная для главного окна
let mainWindow;
let downloadManager;

// Текущая версия лаунчера
const CURRENT_VERSION = '1.0.0';

// Путь к настройкам приложения
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

// Настройки по умолчанию
const defaultSettings = {
  gtaPath: '',
  gameExe: 'GTA5.exe',
  reduxionUrl: 'http://localhost:3000',
  autoInstall: true,
  createDesktopShortcut: false,
  language: 'ru'
};

let appSettings = { ...defaultSettings };

// Загрузка настроек из файла
function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const savedSettings = fs.readJsonSync(settingsPath);
      appSettings = { ...defaultSettings, ...savedSettings };
    }
  } catch (error) {
    console.error('Ошибка загрузки настроек:', error);
  }
}

// Сохранение настроек в файл
function saveSettings() {
  try {
    fs.ensureDirSync(path.dirname(settingsPath));
    fs.writeJsonSync(settingsPath, appSettings, { spaces: 2 });
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error);
  }
}

// Создание главного окна
function createMainWindow() {
   try {
     // Определяем, какой файл загружать - лаунчер или установщик
     const isInstaller = process.argv.includes('--installer');

     console.log('Запуск приложения:', isInstaller ? 'установщик' : 'лаунчер');

     // Создаем окно браузера
     mainWindow = new BrowserWindow({
       width: isInstaller ? 1000 : 1400,
       height: isInstaller ? 700 : 900,
       center: true,
       webPreferences: {
         nodeIntegration: true,
         contextIsolation: false,
         enableRemoteModule: true,
         webSecurity: false
       },
       icon: path.join(__dirname, 'assets', 'icon.png'),
       title: isInstaller ? 'Установка Reduxion Launcher' : 'Majestic Launcher',
       show: false,
       resizable: false,
       minimizable: true,
       maximizable: false,
       frame: false // Без рамки - кастомный тайтл бар
     });

     // Загружаем соответствующий HTML файл
     const targetFile = isInstaller ? 'installer.html' : 'modern-launcher.html';
     const filePath = path.join(__dirname, targetFile);

     console.log('Загрузка файла:', filePath);
     console.log('Файл существует:', require('fs').existsSync(filePath));

     mainWindow.loadFile(targetFile);

     // Показываем окно только после полной загрузки
     mainWindow.once('ready-to-show', () => {
       mainWindow.show();
       console.log('Окно отображено');
     });

     // Обработчик ошибок загрузки
     mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
       console.error('Ошибка загрузки страницы:', errorCode, errorDescription);
     });

     // Обработчик завершения загрузки
     mainWindow.webContents.on('did-finish-load', () => {
       console.log('Страница загружена успешно');
     });

     // Обработчик закрытия окна
     mainWindow.on('closed', () => {
       console.log('Окно закрыто');
       mainWindow = null;
     });

     // Обработчик ошибок приложения
     mainWindow.webContents.on('crashed', (event) => {
       console.error('Приложение crashed:', event);
     });

     console.log('Окно создано успешно');

   } catch (error) {
     console.error('Ошибка создания окна:', error);
   }
 }

// Создание меню приложения
function createMenu() {
  // Отключаем меню полностью
  Menu.setApplicationMenu(null);
}

// Обнаружение пути к GTA 5
async function detectGTAPath() {
  const possiblePaths = [
    'C:\\Program Files\\Rockstar Games\\Grand Theft Auto V',
    'C:\\Program Files (x86)\\Rockstar Games\\Grand Theft Auto V',
    'C:\\Program Files\\Epic Games\\GTAV',
    'C:\\Games\\Grand Theft Auto V',
    'D:\\Games\\Grand Theft Auto V',
    'E:\\Games\\Grand Theft Auto V'
  ];

  let foundPath = null;

  // Проверяем возможные пути
  for (const testPath of possiblePaths) {
    const exePath = path.join(testPath, 'GTA5.exe');
    if (fs.existsSync(exePath)) {
      foundPath = testPath;
      break;
    }
  }

  // Если не нашли в стандартных путях, показываем диалог выбора папки
  if (!foundPath) {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Выберите папку с GTA 5',
      message: 'Укажите папку, в которой установлен Grand Theft Auto V'
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0];
      const exePath = path.join(selectedPath, 'GTA5.exe');

      if (fs.existsSync(exePath)) {
        foundPath = selectedPath;
      } else {
        if (mainWindow) {
          mainWindow.webContents.send('ui-message', {
            title: 'Неверная папка',
            message: 'В выбранной папке не найден файл GTA5.exe',
            buttons: ['OK']
          });
        }
        return;
      }
    }
  }

  if (foundPath) {
    appSettings.gtaPath = foundPath;
    saveSettings();

    if (mainWindow) {
      mainWindow.webContents.send('ui-message', {
        title: 'Папка найдена',
        message: `Папка с GTA 5 обнаружена:\n${foundPath}`,
        buttons: ['OK']
      });
    }

    if (mainWindow) {
      mainWindow.webContents.send('gta-path-detected', foundPath);
    }
  }
}

// Обработчики управления окном
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// Проверка первого запуска
ipcMain.on('check-first-run', (event) => {
  const isFirstRun = !appSettings.gtaPath || appSettings.gtaPath === '';
  event.reply('first-run-status', isFirstRun);
});

// Выбор пути к GTA
ipcMain.on('browse-gta-path', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Выберите папку с GTA 5',
    defaultPath: 'C:\\Program Files'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    
    // Проверяем, что это действительно папка с GTA 5
    const gtaExePath = path.join(selectedPath, 'GTA5.exe');
    if (fs.existsSync(gtaExePath)) {
      event.reply('gta-path-selected', selectedPath);
    } else {
      if (mainWindow) {
        mainWindow.webContents.send('ui-message', {
          title: 'Ошибка',
          message: 'В выбранной папке не найден файл GTA5.exe',
          buttons: ['OK']
        });
      }
    }
  }
});

// Сохранение настроек после первого запуска
ipcMain.on('save-setup', (event, setupData) => {
  appSettings.gtaPath = setupData.gtaPath;
  appSettings.language = setupData.language;
  appSettings.autoInstall = setupData.autoInstall;
  appSettings.createDesktopShortcut = setupData.desktopShortcut;
  
  saveSettings();
  
  console.log('Настройки сохранены:', appSettings);
});

// IPC обработчики для связи с renderer процессом
ipcMain.handle('get-settings', () => appSettings);
ipcMain.handle('save-settings', (event, newSettings) => {
  appSettings = { ...appSettings, ...newSettings };
  saveSettings();
  return appSettings;
});

ipcMain.handle('detect-gta-path', detectGTAPath);
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Исполняемые файлы', extensions: ['exe'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('download-redux', async (event, reduxData) => {
  try {
    const axios = require('axios');
    const response = await axios.get(reduxData.downloadUrl, {
      responseType: 'arraybuffer'
    });

    const downloadsPath = path.join(os.homedir(), 'Downloads', 'Reduxion');
    await fs.ensureDir(downloadsPath);

    const fileName = `redux-${reduxData.id}-${Date.now()}.zip`;
    const filePath = path.join(downloadsPath, fileName);

    await fs.writeFile(filePath, response.data);

    return {
      success: true,
      filePath: filePath,
      fileName: fileName
    };
  } catch (error) {
    console.error('Ошибка скачивания редукса:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('install-redux', async (event, reduxData) => {
  try {
    if (!appSettings.gtaPath) {
      throw new Error('Папка с GTA 5 не указана в настройках');
    }

    const fs = require('fs-extra');
    const extract = require('extract-zip');

    // Путь к архиву редукса
    const archivePath = reduxData.filePath;

    if (!fs.existsSync(archivePath)) {
      throw new Error('Архив редукса не найден');
    }

    // Создаем временную папку для распаковки
    const tempDir = path.join(os.tmpdir(), 'reduxion-temp-' + Date.now());
    await fs.ensureDir(tempDir);

    try {
      // Распаковываем архив
      await extract(archivePath, { dir: tempDir });

      // Копируем файлы в папку с игрой
      await fs.copy(tempDir, appSettings.gtaPath);

      // Очищаем временную папку
      await fs.remove(tempDir);

      return {
        success: true,
        message: `Редукс "${reduxData.title}" успешно установлен!`
      };

    } catch (extractError) {
      // Очищаем временную папку в случае ошибки
      await fs.remove(tempDir);
      throw extractError;
    }

  } catch (error) {
    console.error('Ошибка установки редукса:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('launch-game', async () => {
  try {
    if (!appSettings.gtaPath) {
      throw new Error('Папка с GTA 5 не указана в настройках');
    }

    const gameExePath = path.join(appSettings.gtaPath, appSettings.gameExe);

    if (!fs.existsSync(gameExePath)) {
      throw new Error('Файл GTA5.exe не найден в указанной папке');
    }

    // Запускаем игру
    const { exec } = require('child_process');
    exec(`"${gameExePath}"`, { cwd: appSettings.gtaPath }, (error, stdout, stderr) => {
      if (error) {
        console.error('Ошибка запуска игры:', error);
        if (mainWindow) {
          mainWindow.webContents.send('game-launch-error', error.message);
        }
      } else {
        if (mainWindow) {
          mainWindow.webContents.send('game-launched');
        }
      }
    });

    return { success: true };

  } catch (error) {
    console.error('Ошибка запуска игры:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('check-game-process', async () => {
   return new Promise((resolve) => {
     ps.lookup({
       command: 'GTA5.exe',
       psargs: 'ux'
     }, (err, resultList) => {
       if (err) {
         resolve({ running: false, error: err.message });
         return;
       }

       resolve({
         running: resultList.length > 0,
         processes: resultList.length
       });
     });
   });
 });

// Обработчик ручной проверки обновлений
ipcMain.on('check-updates-manual', async (event) => {
  try {
    const updateInfo = await checkForUpdates();
    
    if (mainWindow) {
      mainWindow.webContents.send('update-check-result', {
        hasUpdate: updateInfo.hasUpdate,
        version: updateInfo.hasUpdate ? updateInfo.version : CURRENT_VERSION
      });
    }
  } catch (error) {
    console.error('Ошибка проверки обновлений:', error);
    if (mainWindow) {
      mainWindow.webContents.send('update-check-result', {
        hasUpdate: false,
        error: error.message
      });
    }
  }
});

// ===== ОБРАБОТЧИКИ ДЛЯ УСТАНОВЩИКА =====
ipcMain.handle('select-install-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Выберите папку для установки',
    defaultPath: 'C:\\Program Files\\Reduxion Launcher',
    buttonLabel: 'Выбрать папку'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('run-installation', async (event, options) => {
  try {
    const { installPath, createDesktopShortcut, createStartMenuShortcut } = options;

    // Обновляем прогресс установки
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress > 90) progress = 90;

      if (mainWindow) {
        mainWindow.webContents.send('install-progress', {
          percent: Math.round(progress),
          title: getInstallStepTitle(progress),
          subtitle: getInstallStepSubtitle(progress)
        });
      }
    }, 500);

    // Шаг 1: Создание папок
    await new Promise(resolve => setTimeout(resolve, 1000));
    progress = 10;
    mainWindow.webContents.send('install-progress', {
      percent: Math.round(progress),
      title: 'Создание папок...',
      subtitle: 'Подготовка структуры приложения'
    });

    await fs.ensureDir(installPath);
    const launcherDir = path.join(installPath, 'ReduxionLauncher');

    // Шаг 2: Копирование файлов
    await new Promise(resolve => setTimeout(resolve, 1500));
    progress = 30;
    mainWindow.webContents.send('install-progress', {
      percent: Math.round(progress),
      title: 'Копирование файлов...',
      subtitle: 'Перенос файлов приложения'
    });

    // Копируем все необходимые файлы лаунчера
    await fs.copy(__dirname, launcherDir, {
      filter: (src, dest) => {
        // Исключаем ненужные файлы
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

    // Шаг 3: Установка зависимостей
    await new Promise(resolve => setTimeout(resolve, 2000));
    progress = 60;
    mainWindow.webContents.send('install-progress', {
      percent: Math.round(progress),
      title: 'Установка зависимостей...',
      subtitle: 'Настройка компонентов'
    });

    // Шаг 4: Создание ярлыков
    await new Promise(resolve => setTimeout(resolve, 1000));
    progress = 80;
    mainWindow.webContents.send('install-progress', {
      percent: Math.round(progress),
      title: 'Создание ярлыков...',
      subtitle: 'Настройка интеграции с системой'
    });

    if (createDesktopShortcut) {
      await createDesktopShortcut(launcherDir);
    }

    if (createStartMenuShortcut) {
      await createStartMenuShortcut(launcherDir);
    }

    // Шаг 5: Завершение
    progress = 100;
    clearInterval(progressInterval);
    mainWindow.webContents.send('install-progress', {
      percent: 100,
      title: 'Установка завершена!',
      subtitle: 'Reduxion Launcher готов к использованию'
    });

    // Сохраняем информацию об установке
    const installInfo = {
      installPath: launcherDir,
      version: app.getVersion(),
      installDate: new Date().toISOString(),
      createDesktopShortcut,
      createStartMenuShortcut
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
    // Здесь будет запуск установленного приложения
    console.log('Пользователь выбрал запуск приложения после установки');
  }

  if (showReadme) {
    // Здесь будет показ инструкции
    console.log('Пользователь выбрал показ инструкции');
  }

  return { success: true };
});

ipcMain.handle('exit-installer', async () => {
  app.quit();
});

// Вспомогательные функции для установки
function getInstallStepTitle(progress) {
  if (progress < 20) return 'Подготовка к установке...';
  if (progress < 40) return 'Создание папок...';
  if (progress < 70) return 'Копирование файлов...';
  if (progress < 90) return 'Настройка компонентов...';
  return 'Завершение установки...';
}

function getInstallStepSubtitle(progress) {
  if (progress < 20) return 'Инициализация процесса установки';
  if (progress < 40) return 'Подготовка структуры приложения';
  if (progress < 70) return 'Перенос файлов программы';
  if (progress < 90) return 'Настройка компонентов и зависимостей';
  return 'Финальные шаги установки';
}

async function createDesktopShortcut(installDir) {
  try {
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const shortcutPath = path.join(desktopPath, 'Reduxion Launcher.lnk');

    // Создаем ярлык на рабочем столе
    const WS = require('windows-shortcuts');
    const ws = new WS();

    await new Promise((resolve, reject) => {
      ws.create(shortcutPath, {
        target: path.join(installDir, 'START_MODERN_LAUNCHER.bat'),
        workingDir: installDir,
        icon: path.join(installDir, 'assets', 'icon.ico'),
        desc: 'Reduxion Launcher - Автоматический лаунчер для редуксов Majestic'
      }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

  } catch (error) {
    console.error('Ошибка создания ярлыка на рабочем столе:', error);
  }
}

async function createStartMenuShortcut(installDir) {
  try {
    const startMenuPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    const shortcutPath = path.join(startMenuPath, 'Reduxion Launcher.lnk');

    // Создаем ярлык в меню Пуск
    const WS = require('windows-shortcuts');
    const ws = new WS();

    await new Promise((resolve, reject) => {
      ws.create(shortcutPath, {
        target: path.join(installDir, 'START_MODERN_LAUNCHER.bat'),
        workingDir: installDir,
        icon: path.join(installDir, 'assets', 'icon.ico'),
        desc: 'Reduxion Launcher - Автоматический лаунчер для редуксов Majestic'
      }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

  } catch (error) {
    console.error('Ошибка создания ярлыка в меню Пуск:', error);
  }
}

// Проверка обновлений
async function checkForUpdates() {
  return new Promise((resolve) => {
    const versionUrl = 'https://raw.githubusercontent.com/tumbwumba-dot/launcherlaunceherlalalasllasldla/master/version.json';
    
    https.get(versionUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const versionInfo = JSON.parse(data);
          console.log('Текущая версия:', CURRENT_VERSION);
          console.log('Доступная версия:', versionInfo.version);
          
          if (versionInfo.version !== CURRENT_VERSION) {
            resolve({ hasUpdate: true, installerUrl: versionInfo.installerUrl, version: versionInfo.version });
          } else {
            resolve({ hasUpdate: false, version: CURRENT_VERSION });
          }
        } catch (error) {
          console.error('Ошибка парсинга версии:', error);
          resolve({ hasUpdate: false, version: CURRENT_VERSION });
        }
      });
    }).on('error', (error) => {
      console.error('Ошибка проверки обновлений:', error);
      resolve({ hasUpdate: false });
    });
  });
}

// Скачивание и запуск установщика
async function downloadAndRunInstaller(installerUrl) {
  const tempDir = path.join(os.tmpdir(), 'reduxion-update');
  const installerPath = path.join(tempDir, 'ReduxionLauncherInstaller.exe');
  
  // Создаем временную папку
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(installerPath);
    
    https.get(installerUrl, (response) => {
      // Обработка редиректов
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          
          file.on('finish', () => {
            file.close();
            console.log('Установщик скачан:', installerPath);
            
            // Запускаем установщик
            exec(`"${installerPath}"`, (error) => {
              if (error) {
                console.error('Ошибка запуска установщика:', error);
                reject(error);
              } else {
                resolve();
              }
            });
          });
        });
      } else {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log('Установщик скачан:', installerPath);
          
          // Запускаем установщик
          exec(`"${installerPath}"`, (error) => {
            if (error) {
              console.error('Ошибка запуска установщика:', error);
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }
    }).on('error', (error) => {
      fs.unlink(installerPath, () => {});
      reject(error);
    });
  });
}

// IPC обработчики для системы загрузок
ipcMain.handle('start-redux-download', async (event, redux, downloadUrl) => {
  if (!downloadManager) {
    downloadManager = new DownloadManager();
  }
  
  if (!appSettings.gtaPath) {
    throw new Error('GTA путь не настроен');
  }
  
  const downloadId = downloadManager.addDownload(redux, downloadUrl, appSettings.gtaPath, mainWindow);
  return { success: true, downloadId };
});

ipcMain.handle('cancel-download', async (event, downloadId) => {
  if (downloadManager) {
    downloadManager.cancelDownload(downloadId);
    return { success: true };
  }
  return { success: false };
});

ipcMain.handle('get-all-downloads', async () => {
  if (downloadManager) {
    return downloadManager.getAllDownloads();
  }
  return [];
});

ipcMain.handle('uninstall-redux', async (event, reduxId) => {
  if (!downloadManager) {
    downloadManager = new DownloadManager();
  }
  
  if (!appSettings.gtaPath) {
    throw new Error('GTA путь не настроен');
  }
  
  try {
    await downloadManager.uninstallRedux(reduxId, appSettings.gtaPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Инициализация приложения
app.whenReady().then(async () => {
   try {
     console.log('Инициализация приложения...');
     loadSettings();
     downloadManager = new DownloadManager();
     createMenu();
     createMainWindow();
     
     // Ждем загрузки окна
     mainWindow.webContents.on('did-finish-load', async () => {
       // Отправляем статус загрузки лаунчера
       mainWindow.webContents.send('loading-status', 'Загрузка...');
       
       // Имитируем загрузку лаунчера
       await new Promise(resolve => setTimeout(resolve, 1500));
       
       // Отправляем статус проверки обновлений
       mainWindow.webContents.send('loading-status', 'Проверка обновлений...');
       
       // Проверяем обновления
       console.log('Проверка обновлений...');
       const updateInfo = await checkForUpdates();
       
       // Даем время увидеть текст "Проверка обновлений..."
       await new Promise(resolve => setTimeout(resolve, 1500));
       
       if (updateInfo.hasUpdate) {
         console.log('Найдено обновление!');
         mainWindow.webContents.send('loading-status', 'Найдено обновление!');
         
         await new Promise(resolve => setTimeout(resolve, 1000));
         
         // Встроенное подтверждение обновления
         const confirmId = 'upd-' + Date.now();
         if (mainWindow) {
           mainWindow.webContents.send('ui-confirm', {
             id: confirmId,
             title: 'Доступно обновление',
             message: 'Найдена новая версия Reduxion Launcher!\nУстановить обновление сейчас?',
             confirmText: 'Установить',
             cancelText: 'Позже'
           });
         }

         const userConfirmed = await new Promise((resolve) => {
           function handler(event, payload) {
             if (payload.id === confirmId) {
               ipcMain.removeListener('ui-confirm-result', handler);
               resolve(!!payload.confirmed);
             }
           }
           ipcMain.on('ui-confirm-result', handler);
         });

         if (userConfirmed) {
           mainWindow.webContents.send('loading-status', 'Скачивание обновления...');
           console.log('Скачивание обновления...');
           try {
             await downloadAndRunInstaller(updateInfo.installerUrl);
             // Закрываем текущий лаунчер
             app.quit();
             return;
           } catch (error) {
             console.error('Ошибка при обновлении:', error);
             if (mainWindow) {
               mainWindow.webContents.send('ui-message', {
                 title: 'Ошибка обновления',
                 message: 'Не удалось скачать обновление: ' + error.message,
                 buttons: ['OK']
               });
             }
           }
         }
       }
       
       // Обновлений нет, загружаем основной интерфейс
       mainWindow.webContents.send('loading-status', 'Загрузка интерфейса...');
       await new Promise(resolve => setTimeout(resolve, 500));
       mainWindow.webContents.send('loading-complete');
     });
     
     console.log('Приложение инициализировано успешно');
   } catch (error) {
     console.error('Ошибка инициализации:', error);
     dialog.showErrorBox('Ошибка запуска', 'Не удалось запустить приложение: ' + error.message);
     app.quit();
   }

   // Обработчик активации приложения (для macOS)
   app.on('activate', () => {
     if (BrowserWindow.getAllWindows().length === 0) {
       createMainWindow();
     }
   });
 });

// Обработчик закрытия всех окон
app.on('window-all-closed', () => {
   console.log('Все окна закрыты');
   if (process.platform !== 'darwin') {
     app.quit();
   }
 });

// Обработчик перед выходом из приложения
app.on('before-quit', (event) => {
   console.log('Приложение завершает работу');
   if (mainWindow) {
     mainWindow.removeAllListeners('closed');
   }
 });

// Глобальный обработчик ошибок
process.on('uncaughtException', (error) => {
   console.error('Необработанная ошибка:', error);
   dialog.showErrorBox('Критическая ошибка',
     'Произошла необработанная ошибка:\n\n' + error.message +
     '\n\nСтек:\n' + error.stack +
     '\n\nПриложение будет закрыто.'
   );
   app.quit();
 });

 process.on('unhandledRejection', (reason, promise) => {
   console.error('Необработанный промис:', reason, promise);
   dialog.showErrorBox('Ошибка промиса',
     'Произошла ошибка промиса:\n\n' + reason +
     '\n\nПриложение будет закрыто.'
   );
   app.quit();
 });

// Обработчик ошибок создания окон
app.on('browser-window-created', (event, window) => {
   window.on('unresponsive', () => {
     console.error('Окно не отвечает');
     dialog.showErrorBox('Окно не отвечает',
       'Приложение перестало отвечать. Попробуйте перезапустить.');
   });
 });