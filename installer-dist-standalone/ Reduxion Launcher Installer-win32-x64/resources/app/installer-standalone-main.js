const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const os = require('os');
const { exec } = require('child_process');
const AdmZip = require('adm-zip');

let installerWindow;
let installationCancelled = false;

// Создание окна установщика
function createInstallerWindow() {
  installerWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    minimizable: false,
    maximizable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#0A0A0F',
    show: false
  });

  installerWindow.loadFile('installer-standalone.html');

  installerWindow.once('ready-to-show', () => {
    installerWindow.show();
  });

  installerWindow.on('closed', () => {
    installerWindow = null;
  });
}

// IPC обработчики
ipcMain.on('installer-ready', async () => {
  console.log('Установщик готов к работе');
  
  // Автоматически начинаем установку через 1 секунду
  setTimeout(() => {
    startInstallation();
  }, 1000);
});

ipcMain.on('cancel-installation', async () => {
  installationCancelled = true;
  
  // Обновляем интерфейс
  updateProgress('ОТМЕНА УСТАНОВКИ', 0, 5);
  await sleep(500);
  
  // Удаляем созданные файлы
  try {
    const installPath = path.join(os.homedir(), 'Reduxion Launcher');
    
    if (fs.existsSync(installPath)) {
      updateProgress('УДАЛЕНИЕ ФАЙЛОВ', 0, 5);
      await sleep(800);
      
      // Рекурсивно удаляем папку установки
      fs.rmSync(installPath, { recursive: true, force: true });
    }
    
    // Удаляем ярлык с рабочего стола
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const shortcutPath = path.join(desktopPath, 'Reduxion Launcher.lnk');
    
    if (fs.existsSync(shortcutPath)) {
      fs.unlinkSync(shortcutPath);
    }
    
    updateProgress('ОЧИСТКА ЗАВЕРШЕНА', 0, 5);
    await sleep(500);
    
  } catch (error) {
    console.error('Ошибка при очистке:', error);
  }
  
  // Сообщаем об отмене
  if (installerWindow) {
    installerWindow.webContents.send('installation-cancelled');
  }
});

ipcMain.on('close-installer', () => {
  app.quit();
});

ipcMain.on('launch-app', () => {
  // Запускаем установленный лаунчер
  const installPath = path.join(os.homedir(), 'Reduxion Launcher');
  const launcherExe = path.join(installPath, 'ReduxionLauncher.exe');
  
  if (fs.existsSync(launcherExe)) {
    console.log('Запуск лаунчера:', launcherExe);
    
    // Запускаем лаунчер
    const launcherProcess = exec(`"${launcherExe}"`, (error) => {
      if (error) {
        console.error('Ошибка запуска:', error);
        app.quit();
      }
    });
    
    // Ждем пока процесс лаунчера запустится
    launcherProcess.on('spawn', () => {
      console.log('Лаунчер запущен, закрываем установщик через 2 секунды...');
      // Даем время лаунчеру полностью загрузиться, затем закрываем установщик
      setTimeout(() => {
        app.quit();
      }, 2000);
    });
    
    // Если произошла ошибка при запуске
    launcherProcess.on('error', (error) => {
      console.error('Ошибка при запуске процесса:', error);
      dialog.showErrorBox('Ошибка', 'Не удалось запустить лаунчер');
      app.quit();
    });
  } else {
    console.error('Лаунчер не найден:', launcherExe);
    dialog.showErrorBox('Ошибка', 'Не удалось найти установленный лаунчер');
    app.quit();
  }
});

// Основная функция установки
async function startInstallation() {
  try {
    // Проверяем, не была ли отменена установка
    if (installationCancelled) return;
    
    // Определяем путь установки
    const installPath = path.join(os.homedir(), 'Reduxion Launcher');
    
    updateProgress('СОЗДАНИЕ ПАПКИ УСТАНОВКИ', 0, 5);
    await sleep(500);
    
    if (installationCancelled) return;
    
    // Создаем папку для установки
    if (!fs.existsSync(installPath)) {
      fs.mkdirSync(installPath, { recursive: true });
    }
    
    updateProgress('ПОДКЛЮЧЕНИЕ К СЕРВЕРУ', 1, 5);
    await sleep(800);
    
    if (installationCancelled) return;
    
    // Скачиваем файлы лаунчера
    updateProgress('ЗАГРУЗКА ФАЙЛОВ ЛАУНЧЕРА', 2, 5);
    
    // URL к архиву с лаунчером (замени на свой URL)
    // Можно использовать GitHub Releases, Dropbox, Google Drive или свой сервер
    const downloadUrl = 'https://github.com/tumbwumba-dot/launcherlaunceherlalalasllasldla/releases/download/v1.0.0/launcher.zip';
    
    try {
      const zipPath = await downloadLauncher(downloadUrl, installPath);
      
      if (installationCancelled) {
        // Удаляем скачанный файл
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        return;
      }
      
      updateProgress('РАСПАКОВКА ФАЙЛОВ', 3, 5);
      await sleep(500);
      
      // Распаковываем архив
      await extractZip(zipPath, installPath);
      
      // Удаляем архив после распаковки
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }
      
      // Проверяем что exe распаковался
      const launcherExe = path.join(installPath, 'ReduxionLauncher.exe');
      if (!fs.existsSync(launcherExe)) {
        throw new Error('Файл ReduxionLauncher.exe не найден после распаковки');
      }
      
      console.log('Лаунчер успешно установлен:', launcherExe);
      
    } catch (error) {
      console.error('Ошибка при скачивании/распаковке:', error);
      throw new Error(`Не удалось скачать файлы лаунчера: ${error.message}`);
    }
    
    if (installationCancelled) return;
    
    updateProgress('СОЗДАНИЕ ЯРЛЫКОВ', 4, 5, 'Рабочий стол и меню Пуск');
    await sleep(800);
    
    if (installationCancelled) return;
    
    // Создаем ярлык на рабочем столе
    await createDesktopShortcut(installPath);
    
    if (installationCancelled) return;
    
    // Создаем ярлык в меню Пуск
    await createStartMenuShortcut(installPath);
    
    if (installationCancelled) return;
    
    updateProgress('УСТАНОВКА ЗАВЕРШЕНА', 5, 5);
    
    // Сигнализируем об успешной установке
    if (installerWindow && !installationCancelled) {
      installerWindow.webContents.send('installation-complete');
    }
    
  } catch (error) {
    if (installationCancelled) return;
    
    console.error('Ошибка установки:', error);
    dialog.showErrorBox('Ошибка установки', `Произошла ошибка: ${error.message}`);
    app.quit();
  }
}

// Функция скачивания файлов
async function downloadLauncher(url, destination) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const request = protocol.get(url, (response) => {
      // Обработка редиректов (для GitHub Releases)
      if (response.statusCode === 302 || response.statusCode === 301) {
        downloadLauncher(response.headers.location, destination)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      const filePath = path.join(destination, 'launcher.zip');
      const fileStream = fs.createWriteStream(filePath);
      
      response.on('data', (chunk) => {
        if (installationCancelled) {
          request.destroy();
          fileStream.close();
          fs.unlinkSync(filePath);
          reject(new Error('Установка отменена'));
          return;
        }
        
        downloadedSize += chunk.length;
        const percent = Math.round((downloadedSize / totalSize) * 100);
        const downloadedMB = (downloadedSize / 1024 / 1024).toFixed(1);
        const totalMB = (totalSize / 1024 / 1024).toFixed(1);
        updateProgress('ЗАГРУЗКА ФАЙЛОВ ЛАУНЧЕРА', 2, 5, `${downloadedMB} MB / ${totalMB} MB (${percent}%)`);
      });
      
      response.pipe(fileStream);
      
      fileStream.on('finish', () => {
        fileStream.close();
        console.log('Скачивание завершено:', filePath);
        resolve(filePath);
      });
      
      fileStream.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    });
    
    request.on('error', (err) => {
      reject(err);
    });
    
    request.setTimeout(60000, () => {
      request.destroy();
      reject(new Error('Превышено время ожидания'));
    });
  });
}

// Функция распаковки архива
async function extractZip(zipPath, destination) {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();
      
      let extractedCount = 0;
      const totalFiles = zipEntries.length;
      
      // Распаковываем все файлы
      zipEntries.forEach((entry) => {
        if (installationCancelled) {
          reject(new Error('Установка отменена'));
          return;
        }
        
        const entryPath = path.join(destination, entry.entryName);
        
        if (entry.isDirectory) {
          if (!fs.existsSync(entryPath)) {
            fs.mkdirSync(entryPath, { recursive: true });
          }
        } else {
          const entryDir = path.dirname(entryPath);
          if (!fs.existsSync(entryDir)) {
            fs.mkdirSync(entryDir, { recursive: true });
          }
          fs.writeFileSync(entryPath, entry.getData());
        }
        
        extractedCount++;
        const percent = Math.round((extractedCount / totalFiles) * 100);
        updateProgress('РАСПАКОВКА ФАЙЛОВ', 3, 5, `${extractedCount} из ${totalFiles} файлов (${percent}%)`);
      });
      
      console.log('Распаковка завершена');
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Создание ярлыка на рабочем столе
async function createDesktopShortcut(installPath) {
  try {
    const desktopPath = path.join(process.env.USERPROFILE, 'Desktop');
    const shortcutPath = path.join(desktopPath, 'Reduxion Launcher.lnk');
    
    console.log('Создание ярлыка на рабочем столе:', shortcutPath);
    console.log('Путь к exe:', path.join(installPath, 'ReduxionLauncher.exe'));
    
    // Ищем исполняемый файл лаунчера
    let launcherExe = path.join(installPath, 'ReduxionLauncher.exe');
    
    // Если не найден, ищем другие возможные имена
    if (!fs.existsSync(launcherExe)) {
      const possibleNames = ['modern-launcher.exe', 'launcher.exe', 'Reduxion.exe'];
      for (const name of possibleNames) {
        const testPath = path.join(installPath, name);
        if (fs.existsSync(testPath)) {
          launcherExe = testPath;
          break;
        }
      }
    }
    
    // Если исполняемый файл не найден, создаем bat-файл для запуска
    if (!fs.existsSync(launcherExe)) {
      console.log('Exe файл не найден, создаем bat-файл');
      const batPath = path.join(installPath, 'start-launcher.bat');
      const batContent = `@echo off\ncd /d "%~dp0"\nnpx electron modern-launcher.html`;
      fs.writeFileSync(batPath, batContent);
      launcherExe = batPath;
    }
    
    // Создаем VBS скрипт для создания ярлыка
    const vbsScript = `
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "${shortcutPath.replace(/\\/g, '\\\\')}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "${launcherExe.replace(/\\/g, '\\\\')}"
oLink.WorkingDirectory = "${installPath.replace(/\\/g, '\\\\')}"
oLink.Description = "Reduxion Launcher"
oLink.Save
`;
    
    const vbsPath = path.join(installPath, 'create-shortcut-desktop.vbs');
    fs.writeFileSync(vbsPath, vbsScript);
    
    return new Promise((resolve, reject) => {
      exec(`cscript //nologo "${vbsPath}"`, (error, stdout, stderr) => {
        // Удаляем временный vbs файл
        try { fs.unlinkSync(vbsPath); } catch(e) {}
        
        if (error) {
          console.error('Ошибка создания ярлыка на рабочем столе:', error);
          console.error('stderr:', stderr);
          // Не критичная ошибка, продолжаем
          resolve();
        } else {
          console.log('Ярлык на рабочем столе создан успешно:', shortcutPath);
          console.log('stdout:', stdout);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при создании ярлыка на рабочем столе:', error);
    // Не критичная ошибка
  }
}

// Создание ярлыка в меню Пуск
async function createStartMenuShortcut(installPath) {
  try {
    const startMenuPath = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    const shortcutPath = path.join(startMenuPath, 'Reduxion Launcher.lnk');
    
    console.log('Создание ярлыка в меню Пуск:', shortcutPath);
    console.log('Путь к exe:', path.join(installPath, 'ReduxionLauncher.exe'));
    
    // Ищем исполняемый файл лаунчера
    let launcherExe = path.join(installPath, 'ReduxionLauncher.exe');
    
    // Если не найден, ищем другие возможные имена
    if (!fs.existsSync(launcherExe)) {
      const possibleNames = ['modern-launcher.exe', 'launcher.exe', 'Reduxion.exe'];
      for (const name of possibleNames) {
        const testPath = path.join(installPath, name);
        if (fs.existsSync(testPath)) {
          launcherExe = testPath;
          break;
        }
      }
    }
    
    // Если исполняемый файл не найден, используем bat-файл
    if (!fs.existsSync(launcherExe)) {
      launcherExe = path.join(installPath, 'start-launcher.bat');
    }
    
    // Создаем VBS скрипт для создания ярлыка
    const vbsScript = `
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "${shortcutPath.replace(/\\/g, '\\\\')}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "${launcherExe.replace(/\\/g, '\\\\')}"
oLink.WorkingDirectory = "${installPath.replace(/\\/g, '\\\\')}"
oLink.Description = "Reduxion Launcher"
oLink.Save
`;
    
    const vbsPath = path.join(installPath, 'create-shortcut-startmenu.vbs');
    fs.writeFileSync(vbsPath, vbsScript);
    
    return new Promise((resolve, reject) => {
      exec(`cscript //nologo "${vbsPath}"`, (error, stdout, stderr) => {
        // Удаляем временный vbs файл
        try { fs.unlinkSync(vbsPath); } catch(e) {}
        
        if (error) {
          console.error('Ошибка создания ярлыка в меню Пуск:', error);
          console.error('stderr:', stderr);
          // Не критичная ошибка, продолжаем
          resolve();
        } else {
          console.log('Ярлык в меню Пуск создан успешно:', shortcutPath);
          console.log('stdout:', stdout);
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при создании ярлыка в меню Пуск:', error);
    // Не критичная ошибка
  }
}

// Обновление прогресса
function updateProgress(statusText, current, total, details = null) {
  if (installerWindow && !installationCancelled) {
    installerWindow.webContents.send('update-progress', {
      statusText,
      current,
      total,
      details: details || `${current} из ${total}`
    });
  }
}

// Вспомогательная функция задержки
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Инициализация приложения
app.whenReady().then(() => {
  createInstallerWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

// Обработчик ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  if (installerWindow) {
    dialog.showErrorBox('Критическая ошибка', `Произошла ошибка: ${error.message}`);
  }
  app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанный промис:', reason);
});
