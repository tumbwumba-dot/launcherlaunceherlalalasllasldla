// Менеджер загрузок для редуксов
const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class DownloadManager {
    constructor() {
        this.downloads = new Map(); // Map<id, downloadInfo>
        this.downloadQueue = [];
        this.activeDownloads = 0;
        this.maxConcurrent = 3;
    }

    // Добавить загрузку в очередь
    addDownload(redux, downloadUrl, gtaPath, mainWindow) {
        const downloadId = `${redux.id}-${Date.now()}`;
        
        const downloadInfo = {
            id: downloadId,
            reduxId: redux.id,
            name: redux.name,
            url: downloadUrl,
            gtaPath: gtaPath,
            status: 'pending', // pending, downloading, completed, error, installing
            progress: 0,
            downloaded: 0,
            total: 0,
            speed: 0,
            error: null,
            filePath: null,
            mainWindow: mainWindow
        };

        this.downloads.set(downloadId, downloadInfo);
        this.downloadQueue.push(downloadId);
        
        // Отправляем обновление в UI
        mainWindow.webContents.send('download-added', {
            id: downloadId,
            reduxId: redux.id,
            name: redux.name,
            status: 'pending'
        });

        this.processQueue();
        return downloadId;
    }

    // Обработка очереди загрузок
    processQueue() {
        while (this.activeDownloads < this.maxConcurrent && this.downloadQueue.length > 0) {
            const downloadId = this.downloadQueue.shift();
            const downloadInfo = this.downloads.get(downloadId);
            
            if (downloadInfo) {
                this.startDownload(downloadInfo);
            }
        }
    }

    // Начать загрузку
    async startDownload(downloadInfo) {
        this.activeDownloads++;
        downloadInfo.status = 'downloading';
        
        const tempDir = path.join(process.env.TEMP || '/tmp', 'reduxion-downloads');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Автоматически определяем расширение из URL
        const urlPath = new URL(downloadInfo.url).pathname;
        const ext = path.extname(urlPath) || '.zip';
        const fileName = `${downloadInfo.reduxId}${ext}`;
        const filePath = path.join(tempDir, fileName);
        downloadInfo.filePath = filePath;
        downloadInfo.archiveType = ext.toLowerCase();

        // Отправляем обновление статуса
        downloadInfo.mainWindow.webContents.send('download-status-update', {
            id: downloadInfo.id,
            status: 'downloading',
            progress: 0
        });

        try {
            await this.downloadFile(downloadInfo);
            
            // После успешной загрузки - устанавливаем
            downloadInfo.status = 'installing';
            downloadInfo.mainWindow.webContents.send('download-status-update', {
                id: downloadInfo.id,
                status: 'installing',
                progress: 100
            });

            await this.installRedux(downloadInfo);
            
            downloadInfo.status = 'completed';
            downloadInfo.mainWindow.webContents.send('download-completed', {
                id: downloadInfo.id,
                reduxId: downloadInfo.reduxId,
                name: downloadInfo.name
            });

            // Удаляем временный файл
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

        } catch (error) {
            downloadInfo.status = 'error';
            downloadInfo.error = error.message;
            
            downloadInfo.mainWindow.webContents.send('download-error', {
                id: downloadInfo.id,
                reduxId: downloadInfo.reduxId,
                error: error.message
            });
        } finally {
            this.activeDownloads--;
            this.processQueue();
        }
    }

    // Загрузка файла
    downloadFile(downloadInfo) {
        return new Promise((resolve, reject) => {
            const protocol = downloadInfo.url.startsWith('https') ? https : http;
            const file = fs.createWriteStream(downloadInfo.filePath);
            
            const startTime = Date.now();
            let lastUpdate = Date.now();

            protocol.get(downloadInfo.url, (response) => {
                if (response.statusCode === 302 || response.statusCode === 301) {
                    // Редирект
                    file.close();
                    fs.unlinkSync(downloadInfo.filePath);
                    downloadInfo.url = response.headers.location;
                    return this.downloadFile(downloadInfo).then(resolve).catch(reject);
                }

                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlinkSync(downloadInfo.filePath);
                    return reject(new Error(`HTTP ${response.statusCode}`));
                }

                downloadInfo.total = parseInt(response.headers['content-length'], 10);

                response.on('data', (chunk) => {
                    downloadInfo.downloaded += chunk.length;
                    
                    // Обновляем UI каждые 500ms
                    const now = Date.now();
                    if (now - lastUpdate > 500) {
                        const elapsed = (now - startTime) / 1000;
                        downloadInfo.speed = downloadInfo.downloaded / elapsed;
                        downloadInfo.progress = Math.round((downloadInfo.downloaded / downloadInfo.total) * 100);
                        
                        downloadInfo.mainWindow.webContents.send('download-progress', {
                            id: downloadInfo.id,
                            progress: downloadInfo.progress,
                            downloaded: downloadInfo.downloaded,
                            total: downloadInfo.total,
                            speed: downloadInfo.speed
                        });
                        
                        lastUpdate = now;
                    }
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve();
                });

            }).on('error', (err) => {
                file.close();
                if (fs.existsSync(downloadInfo.filePath)) {
                    fs.unlinkSync(downloadInfo.filePath);
                }
                reject(err);
            });

            file.on('error', (err) => {
                file.close();
                if (fs.existsSync(downloadInfo.filePath)) {
                    fs.unlinkSync(downloadInfo.filePath);
                }
                reject(err);
            });
        });
    }

    // Установка редукса в GTA
    async installRedux(downloadInfo) {
        // Создаем папку для редуксов, если её нет
        const reduxDir = path.join(downloadInfo.gtaPath, 'reduxion_mods', downloadInfo.reduxId);
        
        if (!fs.existsSync(reduxDir)) {
            fs.mkdirSync(reduxDir, { recursive: true });
        }

        // Распаковываем архив в зависимости от формата
        await this.extractArchive(downloadInfo.filePath, reduxDir, downloadInfo.archiveType);

        // Проверяем структуру и копируем файлы в нужные места
        await this.applyReduxFiles(downloadInfo.reduxId, reduxDir, downloadInfo.gtaPath);
    }

    // Распаковка архива (поддержка .zip, .rar, .7z)
    async extractArchive(archivePath, targetDir, archiveType) {
        if (archiveType === '.zip') {
            // Используем adm-zip для .zip
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(archivePath);
            zip.extractAllTo(targetDir, true);
        } else if (archiveType === '.rar') {
            // Используем node-unrar-js для .rar
            const unrar = require('node-unrar-js');
            const buf = Uint8Array.from(fs.readFileSync(archivePath)).buffer;
            const extractor = unrar.createExtractorFromData({ data: buf });
            const list = extractor.getFileList();
            const extracted = extractor.extractAll();
            
            if (extracted[1].state === 'SUCCESS') {
                for (const file of extracted[1].files) {
                    if (file.extract[1].state === 'SUCCESS') {
                        const filePath = path.join(targetDir, file.fileHeader.name);
                        const fileDir = path.dirname(filePath);
                        
                        if (!fs.existsSync(fileDir)) {
                            fs.mkdirSync(fileDir, { recursive: true });
                        }
                        
                        fs.writeFileSync(filePath, file.extract[1].data);
                    }
                }
            }
        } else if (archiveType === '.7z') {
            // Используем node-7z для .7z
            const Seven = require('node-7z');
            const sevenBin = require('7zip-bin');
            
            const stream = Seven.extractFull(archivePath, targetDir, {
                $bin: sevenBin.path7za
            });
            
            return new Promise((resolve, reject) => {
                stream.on('end', () => resolve());
                stream.on('error', (err) => reject(err));
            });
        } else {
            // По умолчанию пробуем как .zip
            const AdmZip = require('adm-zip');
            const zip = new AdmZip(archivePath);
            zip.extractAllTo(targetDir, true);
        }
    }

    // Применение файлов редукса
    async applyReduxFiles(reduxId, reduxDir, gtaPath) {
        // Ищем файлы для замены
        const installMap = path.join(reduxDir, 'install.json');
        
        if (fs.existsSync(installMap)) {
            // Если есть карта установки - используем её
            const map = JSON.parse(fs.readFileSync(installMap, 'utf8'));
            
            for (const [source, target] of Object.entries(map.files)) {
                const sourcePath = path.join(reduxDir, source);
                const targetPath = path.join(gtaPath, target);
                
                // Создаем бэкап оригинального файла
                if (fs.existsSync(targetPath)) {
                    const backupPath = `${targetPath}.reduxion_backup`;
                    if (!fs.existsSync(backupPath)) {
                        fs.copyFileSync(targetPath, backupPath);
                    }
                }
                
                // Копируем файл редукса
                const targetDir = path.dirname(targetPath);
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
                fs.copyFileSync(sourcePath, targetPath);
            }
        } else {
            // Автоматическое определение структуры
            this.autoInstallRedux(reduxDir, gtaPath);
        }
    }

    // Автоматическая установка
    autoInstallRedux(reduxDir, gtaPath) {
        // Ищем common.rpf, x64, update и другие папки GTA
        const commonDirs = ['common.rpf', 'x64', 'update', 'mods'];
        
        const findAndCopy = (sourceDir, targetBase) => {
            const items = fs.readdirSync(sourceDir, { withFileTypes: true });
            
            for (const item of items) {
                const sourcePath = path.join(sourceDir, item.name);
                
                if (item.isDirectory()) {
                    // Если это одна из папок GTA - копируем содержимое
                    if (commonDirs.includes(item.name)) {
                        const targetPath = path.join(targetBase, item.name);
                        this.copyDirRecursive(sourcePath, targetPath, targetBase);
                    } else {
                        findAndCopy(sourcePath, targetBase);
                    }
                } else {
                    // Файлы в корне редукса копируем в корень GTA
                    const ext = path.extname(item.name).toLowerCase();
                    if (['.asi', '.dll', '.ini'].includes(ext)) {
                        const targetPath = path.join(targetBase, item.name);
                        
                        // Бэкап
                        if (fs.existsSync(targetPath)) {
                            const backupPath = `${targetPath}.reduxion_backup`;
                            if (!fs.existsSync(backupPath)) {
                                fs.copyFileSync(targetPath, backupPath);
                            }
                        }
                        
                        fs.copyFileSync(sourcePath, targetPath);
                    }
                }
            }
        };

        findAndCopy(reduxDir, gtaPath);
    }

    // Рекурсивное копирование
    copyDirRecursive(source, target, gtaPath) {
        if (!fs.existsSync(target)) {
            fs.mkdirSync(target, { recursive: true });
        }

        const items = fs.readdirSync(source, { withFileTypes: true });

        for (const item of items) {
            const sourcePath = path.join(source, item.name);
            const targetPath = path.join(target, item.name);

            if (item.isDirectory()) {
                this.copyDirRecursive(sourcePath, targetPath, gtaPath);
            } else {
                // Бэкап оригинального файла
                if (fs.existsSync(targetPath)) {
                    const backupPath = `${targetPath}.reduxion_backup`;
                    if (!fs.existsSync(backupPath)) {
                        fs.copyFileSync(targetPath, backupPath);
                    }
                }
                
                fs.copyFileSync(sourcePath, targetPath);
            }
        }
    }

    // Удаление редукса
    async uninstallRedux(reduxId, gtaPath) {
        const reduxDir = path.join(gtaPath, 'reduxion_mods', reduxId);
        
        if (!fs.existsSync(reduxDir)) {
            throw new Error('Redux not installed');
        }

        // Восстанавливаем бэкапы
        const restoreBackups = (dir) => {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const item of items) {
                const itemPath = path.join(dir, item.name);
                
                if (item.isDirectory()) {
                    restoreBackups(itemPath);
                } else if (item.name.endsWith('.reduxion_backup')) {
                    const originalPath = itemPath.replace('.reduxion_backup', '');
                    if (fs.existsSync(originalPath)) {
                        fs.unlinkSync(originalPath);
                    }
                    fs.renameSync(itemPath, originalPath);
                }
            }
        };

        restoreBackups(gtaPath);

        // Удаляем папку редукса
        fs.rmSync(reduxDir, { recursive: true, force: true });
    }

    // Отмена загрузки
    cancelDownload(downloadId) {
        const downloadInfo = this.downloads.get(downloadId);
        if (downloadInfo) {
            downloadInfo.status = 'cancelled';
            // Удаляем из очереди
            const index = this.downloadQueue.indexOf(downloadId);
            if (index > -1) {
                this.downloadQueue.splice(index, 1);
            }
            
            // Удаляем временный файл
            if (downloadInfo.filePath && fs.existsSync(downloadInfo.filePath)) {
                fs.unlinkSync(downloadInfo.filePath);
            }
            
            this.downloads.delete(downloadId);
        }
    }

    // Получить все загрузки
    getAllDownloads() {
        return Array.from(this.downloads.values()).map(d => ({
            id: d.id,
            reduxId: d.reduxId,
            name: d.name,
            status: d.status,
            progress: d.progress,
            downloaded: d.downloaded,
            total: d.total,
            speed: d.speed,
            error: d.error
        }));
    }
}

module.exports = DownloadManager;
