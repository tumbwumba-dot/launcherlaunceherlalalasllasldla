const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class ReduxionAPI {
    constructor(baseUrl = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 30000,
            headers: {
                'User-Agent': 'Reduxion-Launcher/1.0.0'
            }
        });
    }

    // Получение списка доступных редуксов
    async getReduxList(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.category) params.append('category', filters.category);
            if (filters.search) params.append('search', filters.search);
            if (filters.limit) params.append('limit', filters.limit);
            if (filters.offset) params.append('offset', filters.offset);

            const response = await this.client.get(`/api/reduxes?${params}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка получения списка редуксов:', error);
            throw new Error('Не удалось загрузить каталог редуксов');
        }
    }

    // Получение информации о конкретном редуксе
    async getReduxInfo(reduxId) {
        try {
            const response = await this.client.get(`/api/reduxes/${reduxId}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка получения информации о редуксе:', error);
            throw new Error('Не удалось загрузить информацию о редуксе');
        }
    }

    // Получение ссылки для скачивания редукса
    async getReduxDownloadUrl(reduxId) {
        try {
            const response = await this.client.get(`/api/reduxes/${reduxId}/download`);
            return response.data;
        } catch (error) {
            console.error('Ошибка получения ссылки для скачивания:', error);
            throw new Error('Не удалось получить ссылку для скачивания');
        }
    }

    // Скачивание редукса
    async downloadRedux(reduxId, downloadPath) {
        try {
            const downloadInfo = await this.getReduxDownloadUrl(reduxId);

            if (!downloadInfo.downloadUrl) {
                throw new Error('Ссылка для скачивания не найдена');
            }

            // Определяем имя файла
            const fileName = `redux-${reduxId}-${Date.now()}.zip`;
            const filePath = path.join(downloadPath, fileName);

            // Скачиваем файл
            const response = await axios({
                method: 'GET',
                url: downloadInfo.downloadUrl,
                responseType: 'stream',
                timeout: 60000
            });

            // Создаем папку если её нет
            await fs.ensureDir(downloadPath);

            // Сохраняем файл
            const writer = require('fs').createWriteStream(filePath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve({
                    success: true,
                    filePath: filePath,
                    fileName: fileName,
                    fileSize: downloadInfo.fileSize
                }));
                writer.on('error', reject);
            });

        } catch (error) {
            console.error('Ошибка скачивания редукса:', error);
            throw error;
        }
    }

    // Отправка статистики использования
    async sendUsageStats(stats) {
        try {
            await this.client.post('/api/stats', stats);
        } catch (error) {
            // Не критичная ошибка, просто логируем
            console.warn('Ошибка отправки статистики:', error);
        }
    }

    // Проверка обновлений лаунчера
    async checkForUpdates() {
        try {
            const response = await this.client.get('/api/updates/latest');
            return response.data;
        } catch (error) {
            console.warn('Ошибка проверки обновлений:', error);
            return null;
        }
    }

    // Отправка отчета об ошибке
    async sendErrorReport(errorData) {
        try {
            await this.client.post('/api/errors', errorData);
        } catch (error) {
            console.warn('Ошибка отправки отчета об ошибке:', error);
        }
    }

    // Получение новостей и обновлений
    async getNews() {
        try {
            const response = await this.client.get('/api/news');
            return response.data;
        } catch (error) {
            console.warn('Ошибка получения новостей:', error);
            return [];
        }
    }

    // Проверка доступности API
    async checkConnection() {
        try {
            await this.client.get('/api/health');
            return true;
        } catch (error) {
            return false;
        }
    }

    // Получение категорий редуксов
    async getCategories() {
        try {
            const response = await this.client.get('/api/categories');
            return response.data;
        } catch (error) {
            console.warn('Ошибка получения категорий:', error);
            return this.getDefaultCategories();
        }
    }

    // Категории по умолчанию
    getDefaultCategories() {
        return [
            { id: 'gameplay', name: 'Геймплей', icon: 'fas fa-gamepad' },
            { id: 'graphics', name: 'Графика', icon: 'fas fa-palette' },
            { id: 'interface', name: 'Интерфейс', icon: 'fas fa-desktop' },
            { id: 'performance', name: 'Производительность', icon: 'fas fa-tachometer-alt' },
            { id: 'cheats', name: 'Чит-моды', icon: 'fas fa-star' },
            { id: 'utilities', name: 'Утилиты', icon: 'fas fa-tools' },
            { id: 'skins', name: 'Скины', icon: 'fas fa-user-circle' },
            { id: 'other', name: 'Другое', icon: 'fas fa-box' }
        ];
    }
}

// Класс для работы с локальным кэшем
class ReduxCache {
    constructor() {
        this.cachePath = path.join(require('os').tmpdir(), 'reduxion-cache');
        this.cacheTime = 24 * 60 * 60 * 1000; // 24 часа
    }

    // Получение данных из кэша
    async get(key) {
        try {
            const cacheFile = path.join(this.cachePath, `${key}.json`);
            if (!(await fs.pathExists(cacheFile))) {
                return null;
            }

            const cached = await fs.readJson(cacheFile);
            const now = Date.now();

            if (now - cached.timestamp > this.cacheTime) {
                await fs.remove(cacheFile);
                return null;
            }

            return cached.data;
        } catch (error) {
            return null;
        }
    }

    // Сохранение данных в кэш
    async set(key, data) {
        try {
            await fs.ensureDir(this.cachePath);

            const cacheData = {
                data: data,
                timestamp: Date.now()
            };

            const cacheFile = path.join(this.cachePath, `${key}.json`);
            await fs.writeJson(cacheFile, cacheData, { spaces: 2 });
        } catch (error) {
            console.warn('Ошибка сохранения в кэш:', error);
        }
    }

    // Очистка кэша
    async clear() {
        try {
            await fs.remove(this.cachePath);
        } catch (error) {
            console.warn('Ошибка очистки кэша:', error);
        }
    }
}

// Класс для работы с загрузками
class DownloadManager {
    constructor() {
        this.downloads = new Map();
        this.downloadPath = path.join(require('os').homedir(), 'Downloads', 'Reduxion');
    }

    // Создание задачи скачивания
    async createDownload(reduxId, url, fileName) {
        const downloadId = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const downloadInfo = {
            id: downloadId,
            reduxId: reduxId,
            url: url,
            fileName: fileName,
            filePath: path.join(this.downloadPath, fileName),
            status: 'pending',
            progress: 0,
            startTime: new Date(),
            endTime: null,
            error: null
        };

        this.downloads.set(downloadId, downloadInfo);

        // Создаем папку для загрузок
        await fs.ensureDir(this.downloadPath);

        return downloadId;
    }

    // Получение информации о загрузке
    getDownload(downloadId) {
        return this.downloads.get(downloadId);
    }

    // Получение всех активных загрузок
    getActiveDownloads() {
        return Array.from(this.downloads.values()).filter(d => d.status === 'downloading');
    }

    // Обновление прогресса загрузки
    updateProgress(downloadId, progress) {
        const download = this.downloads.get(downloadId);
        if (download) {
            download.progress = progress;
        }
    }

    // Завершение загрузки
    completeDownload(downloadId, success = true, error = null) {
        const download = this.downloads.get(downloadId);
        if (download) {
            download.status = success ? 'completed' : 'failed';
            download.endTime = new Date();
            download.error = error;
        }
    }

    // Удаление информации о загрузке
    removeDownload(downloadId) {
        this.downloads.delete(downloadId);
    }
}

module.exports = {
    ReduxionAPI,
    ReduxCache,
    DownloadManager
};