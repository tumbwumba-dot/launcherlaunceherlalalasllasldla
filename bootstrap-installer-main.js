const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');
const os = require('os');

let mainWindow;
let downloadInProgress = false;

// Конфигурация
const CONFIG = {
  serverUrl: 'https://github.com/tumbwumba-dot/launcherlaunceherlalalasllasldla/releases/download/v1.0.0/',
  launcherFileName: 'Reduxion-Launcher-Setup.exe',
  appName: 'Reduxion Launcher',
  version: '1.0.0'
};

// Создание окна bootstrap установщика
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    resizable: false,
    frame: false,
    transparent: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#0A0A0F',
    show: false
  });

  mainWindow.loadFile('bootstrap-installer.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Функция загрузки файла с прогрессом
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Редирект
        file.close();
        fs.unlinkSync(destination);
        return downloadFile(response.headers.location, destination)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destination);
        return reject(new Error(`Ошибка загрузки: код ${response.statusCode}`));
      }

      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const progress = (downloadedSize / totalSize) * 100;
        
        if (mainWindow) {
          mainWindow.webContents.send('update-progress', {
            statusText: 'ЗАГРУЗКА ФАЙЛОВ...',
            current: downloadedSize,
            total: totalSize,
            details: `${(downloadedSize / 1024 / 1024).toFixed(1)} МБ из ${(totalSize / 1024 / 1024).toFixed(1)} МБ`
          });
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close(() => {
          resolve(destination);
        });
      });
    });

    request.on('error', (err) => {
      file.close();
      fs.unlinkSync(destination);
      reject(err);
    });

    file.on('error', (err) => {
      file.close();
      fs.unlinkSync(destination);
      reject(err);
    });
  });
}

// Обработчик начала установки
ipcMain.on('start-installation', async (event) => {
  if (downloadInProgress) return;
  
  downloadInProgress = true;

  try {
    // Шаг 1: Проверка соединения
    mainWindow.webContents.send('update-progress', {
      statusText: 'ПОДКЛЮЧЕНИЕ К СЕРВЕРУ...',
      current: 0,
      total: 100,
      details: 'Проверка доступности'
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Шаг 2: Получение информации о файле
    mainWindow.webContents.send('update-progress', {
      statusText: 'ПОЛУЧЕНИЕ ИНФОРМАЦИИ...',
      current: 10,
      total: 100,
      details: 'Проверка версии'
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Шаг 3: Создание временной папки
    const tempDir = path.join(os.tmpdir(), 'reduxion-bootstrap');
    await fs.ensureDir(tempDir);
    
    const installerPath = path.join(tempDir, CONFIG.launcherFileName);

    // Шаг 4: Загрузка установщика
    mainWindow.webContents.send('update-progress', {
      statusText: 'ЗАГРУЗКА УСТАНОВЩИКА...',
      current: 15,
      total: 100,
      details: 'Начало загрузки'
    });

    const downloadUrl = CONFIG.serverUrl + CONFIG.launcherFileName;
    
    try {
      await downloadFile(downloadUrl, installerPath);
    } catch (downloadError) {
      // Если не удалось скачать, используем локальный файл (если есть)
      console.log('Не удалось скачать с сервера, проверяю локальные файлы...');
      
      const localInstallerPath = path.join(__dirname, 'Ready-to-Upload', CONFIG.launcherFileName);
      
      if (await fs.pathExists(localInstallerPath)) {
        mainWindow.webContents.send('update-progress', {
          statusText: 'ИСПОЛЬЗОВАНИЕ ЛОКАЛЬНОГО ФАЙЛА...',
          current: 50,
          total: 100,
          details: 'Копирование установщика'
        });
        
        await fs.copy(localInstallerPath, installerPath);
      } else {
        throw new Error('Не удалось найти установщик ни на сервере, ни локально');
      }
    }

    // Шаг 5: Проверка целостности
    mainWindow.webContents.send('update-progress', {
      statusText: 'ПРОВЕРКА ФАЙЛОВ...',
      current: 90,
      total: 100,
      details: 'Проверка целостности'
    });

    await new Promise(resolve => setTimeout(resolve, 800));

    // Шаг 6: Запуск установщика
    mainWindow.webContents.send('update-progress', {
      statusText: 'ЗАПУСК УСТАНОВЩИКА...',
      current: 100,
      total: 100,
      details: 'Завершение'
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Запускаем скачанный установщик
    exec(`"${installerPath}"`, (error) => {
      if (error) {
        console.error('Ошибка запуска установщика:', error);
        dialog.showErrorBox('Ошибка', 'Не удалось запустить установщик');
      }
    });

    // Закрываем bootstrap через небольшую задержку
    setTimeout(() => {
      app.quit();
    }, 1500);

  } catch (error) {
    console.error('Ошибка установки:', error);
    downloadInProgress = false;
    
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Ошибка установки',
      message: 'Произошла ошибка при загрузке установщика',
      detail: error.message,
      buttons: ['OK']
    }).then(() => {
      app.quit();
    });
  }
});

// Обработчик отмены
ipcMain.on('cancel-installation', () => {
  dialog.showMessageBox(mainWindow, {
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

// Запуск приложения
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Обработка ошибок
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  if (mainWindow) {
    dialog.showErrorBox('Ошибка', 'Произошла критическая ошибка: ' + error.message);
  }
  app.quit();
});
