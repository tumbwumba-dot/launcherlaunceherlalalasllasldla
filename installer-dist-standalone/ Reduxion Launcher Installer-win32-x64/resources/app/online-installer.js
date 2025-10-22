const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

class OnlineInstaller {
  constructor() {
    this.downloadProgress = 0;
  }

  /**
   * Скачивает файл с сервера с отображением прогресса
   * @param {string} url - URL файла для скачивания
   * @param {string} destPath - Путь для сохранения
   * @param {Function} onProgress - Callback для обновления прогресса (current, total, percentage)
   */
  async downloadFile(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      const request = protocol.get(url, (response) => {
        // Проверяем редирект
        if (response.statusCode === 301 || response.statusCode === 302) {
          return this.downloadFile(response.headers.location, destPath, onProgress)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          reject(new Error(`Ошибка загрузки: ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;

        // Создаем поток записи
        const fileStream = fs.createWriteStream(destPath);

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const percentage = ((downloadedSize / totalSize) * 100).toFixed(2);
          
          if (onProgress) {
            onProgress(downloadedSize, totalSize, parseFloat(percentage));
          }
        });

        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve(destPath);
        });

        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      });

      request.on('error', (err) => {
        reject(err);
      });

      request.setTimeout(30000, () => {
        request.abort();
        reject(new Error('Timeout: загрузка прервана'));
      });
    });
  }

  /**
   * Распаковывает ZIP архив
   * @param {string} zipPath - Путь к ZIP файлу
   * @param {string} extractPath - Путь для распаковки
   */
  async extractZip(zipPath, extractPath) {
    const extract = require('extract-zip');
    
    try {
      await extract(zipPath, { dir: path.resolve(extractPath) });
      return true;
    } catch (error) {
      throw new Error(`Ошибка распаковки: ${error.message}`);
    }
  }

  /**
   * Форматирует размер в человеко-читаемый формат
   * @param {number} bytes - Размер в байтах
   */
  formatSize(bytes) {
    const units = ['Б', 'КБ', 'МБ', 'ГБ'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Основной метод установки с онлайн-загрузкой
   * @param {string} downloadUrl - URL для скачивания лаунчера
   * @param {string} installPath - Путь установки
   * @param {Function} onProgress - Callback для обновления прогресса
   */
  async installFromWeb(downloadUrl, installPath, onProgress) {
    const tempDir = path.join(require('os').tmpdir(), 'reduxion-installer');
    const zipPath = path.join(tempDir, 'launcher.zip');

    try {
      // Создаем временную папку
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Шаг 1: Скачивание
      if (onProgress) {
        onProgress({
          stage: 'downloading',
          statusText: 'ЗАГРУЗКА ЛАУНЧЕРА...',
          percentage: 0
        });
      }

      await this.downloadFile(downloadUrl, zipPath, (current, total, percentage) => {
        if (onProgress) {
          onProgress({
            stage: 'downloading',
            statusText: `ЗАГРУЗКА: ${this.formatSize(current)} / ${this.formatSize(total)}`,
            percentage: percentage * 0.7, // 70% прогресса на загрузку
            details: `${percentage.toFixed(1)}%`
          });
        }
      });

      // Шаг 2: Распаковка
      if (onProgress) {
        onProgress({
          stage: 'extracting',
          statusText: 'РАСПАКОВКА ФАЙЛОВ...',
          percentage: 75
        });
      }

      // Создаем папку установки
      if (!fs.existsSync(installPath)) {
        fs.mkdirSync(installPath, { recursive: true });
      }

      await this.extractZip(zipPath, installPath);

      // Шаг 3: Завершение
      if (onProgress) {
        onProgress({
          stage: 'completing',
          statusText: 'ЗАВЕРШЕНИЕ УСТАНОВКИ...',
          percentage: 95
        });
      }

      // Очистка временных файлов
      try {
        fs.unlinkSync(zipPath);
        fs.rmdirSync(tempDir);
      } catch (e) {
        // Игнорируем ошибки очистки
      }

      if (onProgress) {
        onProgress({
          stage: 'completed',
          statusText: 'УСТАНОВКА ЗАВЕРШЕНА!',
          percentage: 100
        });
      }

      return {
        success: true,
        installPath: installPath
      };

    } catch (error) {
      // Очистка при ошибке
      try {
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      } catch (e) {}

      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = OnlineInstaller;
