const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const http = require('http');
const { app } = require('electron');

/**
 * Модуль для скачивания файлов лаунчера
 */
class LauncherDownloader {
    constructor() {
        this.downloadProgress = 0;
        this.isDownloading = false;
    }

    /**
     * Скачивание файла с сервера
     * @param {string} url - URL для скачивания
     * @param {string} destination - путь для сохранения файла
     * @param {object} options - дополнительные опции
     */
    async downloadFile(url, destination, options = {}) {
        const {
            onProgress = null,
            timeout = 30000,
            retries = 3
        } = options;

        this.isDownloading = true;
        this.downloadProgress = 0;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`Попытка скачивания ${attempt}/${retries}: ${url}`);

                await this._downloadWithProgress(url, destination, onProgress, timeout);

                this.isDownloading = false;
                this.downloadProgress = 100;
                return { success: true, path: destination };

            } catch (error) {
                console.error(`Ошибка скачивания (попытка ${attempt}):`, error.message);

                if (attempt === retries) {
                    this.isDownloading = false;
                    return {
                        success: false,
                        error: `Не удалось скачать файл после ${retries} попыток: ${error.message}`
                    };
                }

                // Ждем перед следующей попыткой
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    /**
     * Внутренний метод скачивания с прогрессом
     */
    async _downloadWithProgress(url, destination, onProgress, timeout) {
        return new Promise((resolve, reject) => {
            // Определяем протокол
            const protocol = url.startsWith('https:') ? https : http;

            // Создаем запрос
            const request = protocol.request(url, (response) => {
                // Проверяем статус ответа
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    // Перенаправление
                    return this._downloadWithProgress(response.headers.location, destination, onProgress, timeout)
                        .then(resolve)
                        .catch(reject);
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
                    return;
                }

                // Получаем размер файла
                const totalSize = parseInt(response.headers['content-length'], 10);
                let downloadedSize = 0;

                // Создаем папку назначения если её нет
                const destinationDir = path.dirname(destination);
                fs.ensureDirSync(destinationDir);

                // Создаем поток для записи файла
                const fileStream = fs.createWriteStream(destination);

                // Обработчик данных
                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    this.downloadProgress = totalSize ? Math.round((downloadedSize / totalSize) * 100) : 0;

                    if (onProgress) {
                        onProgress(this.downloadProgress, downloadedSize, totalSize);
                    }
                });

                // Обработчик завершения
                response.on('end', () => {
                    fileStream.close();
                    resolve();
                });

                // Обработчик ошибок
                response.on('error', (error) => {
                    fileStream.close();
                    fs.unlink(destination, () => {}); // Удаляем частично скачанный файл
                    reject(error);
                });

                fileStream.on('error', (error) => {
                    fs.unlink(destination, () => {}); // Удаляем частично скачанный файл
                    reject(error);
                });

                // Подключаем поток
                response.pipe(fileStream);
            });

            // Обработчик ошибок запроса
            request.on('error', (error) => {
                reject(error);
            });

            // Устанавливаем таймаут
            request.setTimeout(timeout, () => {
                request.destroy();
                reject(new Error(`Таймаут скачивания (${timeout}ms)`));
            });

            request.end();
        });
    }

    /**
     * Получение информации о лаунчере с сервера
     */
    async getLauncherInfo(serverUrl = 'http://localhost:3000') {
        try {
            const infoUrl = `${serverUrl}/api/launcher/info`;

            return new Promise((resolve, reject) => {
                const protocol = serverUrl.startsWith('https:') ? https : http;

                const request = protocol.request(infoUrl, (response) => {
                    let data = '';

                    response.on('data', (chunk) => {
                        data += chunk;
                    });

                    response.on('end', () => {
                        try {
                            const info = JSON.parse(data);
                            resolve(info);
                        } catch (parseError) {
                            reject(new Error('Неверный формат ответа сервера'));
                        }
                    });
                });

                request.on('error', (error) => {
                    reject(error);
                });

                request.setTimeout(10000, () => {
                    request.destroy();
                    reject(new Error('Таймаут получения информации о лаунчере'));
                });

                request.end();
            });

        } catch (error) {
            console.error('Ошибка получения информации о лаунчере:', error);
            return null;
        }
    }

    /**
     * Скачивание лаунчера с сервера
     */
    async downloadLauncher(serverUrl = 'http://localhost:3000', downloadPath = null) {
        try {
            // Получаем информацию о лаунчере
            const launcherInfo = await this.getLauncherInfo(serverUrl);

            if (!launcherInfo) {
                throw new Error('Не удалось получить информацию о лаунчере с сервера');
            }

            if (!launcherInfo.downloadUrl) {
                throw new Error('URL для скачивания лаунчера не найден');
            }

            // Определяем путь для сохранения
            if (!downloadPath) {
                const tempDir = app.getPath('temp');
                const fileName = `ReduxionLauncher-${launcherInfo.version || 'latest'}.exe`;
                downloadPath = path.join(tempDir, fileName);
            }

            // Скачиваем файл
            console.log(`Скачивание лаунчера из: ${launcherInfo.downloadUrl}`);
            console.log(`Сохранение в: ${downloadPath}`);

            const result = await this.downloadFile(
                launcherInfo.downloadUrl,
                downloadPath,
                {
                    onProgress: (progress, downloaded, total) => {
                        console.log(`Прогресс скачивания: ${progress}% (${this.formatBytes(downloaded)}/${this.formatBytes(total)})`);
                    }
                }
            );

            if (result.success) {
                console.log(`Лаунчер успешно скачан: ${result.path}`);
                return {
                    success: true,
                    path: result.path,
                    info: launcherInfo
                };
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Ошибка скачивания лаунчера:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Форматирование размера файла
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Проверка целостности скачанного файла
     */
    async verifyFile(filePath, expectedSize = null) {
        try {
            const stats = await fs.stat(filePath);

            if (!stats.isFile()) {
                return { valid: false, error: 'Путь не является файлом' };
            }

            if (expectedSize && stats.size !== expectedSize) {
                return {
                    valid: false,
                    error: `Неверный размер файла: ожидалось ${expectedSize}, получено ${stats.size}`
                };
            }

            return {
                valid: true,
                size: stats.size,
                path: filePath
            };

        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

module.exports = LauncherDownloader;