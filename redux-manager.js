const fs = require('fs-extra');
const path = require('path');
const { dialog } = require('electron');

class ReduxManager {
    constructor(settings) {
        this.settings = settings;
        this.installedReduxes = [];
    }

    // Обнаружение папки GTA 5
    async detectGTAPath() {
        const possiblePaths = [
            'C:\\Program Files\\Rockstar Games\\Grand Theft Auto V',
            'C:\\Program Files (x86)\\Rockstar Games\\Grand Theft Auto V',
            'C:\\Program Files\\Epic Games\\GTAV',
            'C:\\Games\\Grand Theft Auto V',
            'D:\\Games\\Grand Theft Auto V',
            'E:\\Games\\Grand Theft Auto V',
            'F:\\Games\\Grand Theft Auto V'
        ];

        // Проверяем возможные пути
        for (const testPath of possiblePaths) {
            const exePath = path.join(testPath, 'GTA5.exe');
            if (await fs.pathExists(exePath)) {
                return testPath;
            }
        }

        return null;
    }

    // Проверка корректности пути к GTA 5
    async validateGTAPath(gamePath) {
        if (!gamePath) return false;

        const exePath = path.join(gamePath, 'GTA5.exe');
        const exists = await fs.pathExists(exePath);

        if (exists) {
            // Проверяем дополнительные файлы игры
            const requiredFiles = [
                path.join(gamePath, 'GTA5.exe'),
                path.join(gamePath, 'update'),
                path.join(gamePath, 'x64')
            ];

            for (const file of requiredFiles) {
                if (!(await fs.pathExists(file))) {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    // Получение списка установленных редуксов
    async getInstalledReduxes() {
        if (!this.settings.gtaPath) {
            return [];
        }

        try {
            const reduxFolder = path.join(this.settings.gtaPath, 'reduxes');
            if (!(await fs.pathExists(reduxFolder))) {
                return [];
            }

            const items = await fs.readdir(reduxFolder, { withFileTypes: true });
            const folders = items.filter(item => item.isDirectory());

            const installedReduxes = [];

            for (const folder of folders) {
                const reduxPath = path.join(reduxFolder, folder.name);
                const info = await this.getReduxInfo(reduxPath, folder.name);

                if (info) {
                    installedReduxes.push(info);
                }
            }

            this.installedReduxes = installedReduxes;
            return installedReduxes;

        } catch (error) {
            console.error('Ошибка получения списка редуксов:', error);
            return [];
        }
    }

    // Получение информации о редуксе
    async getReduxInfo(reduxPath, folderName) {
        try {
            const infoFile = path.join(reduxPath, 'redux-info.json');

            if (await fs.pathExists(infoFile)) {
                const info = await fs.readJson(infoFile);
                return {
                    id: info.id || folderName,
                    name: info.name || folderName,
                    version: info.version || '1.0.0',
                    description: info.description || 'Описание отсутствует',
                    author: info.author || 'Неизвестен',
                    installDate: info.installDate || new Date().toISOString(),
                    path: reduxPath,
                    enabled: await this.isReduxEnabled(reduxPath)
                };
            } else {
                // Если нет info файла, создаем базовую информацию
                return {
                    id: folderName,
                    name: folderName,
                    version: '1.0.0',
                    description: 'Информация о редуксе отсутствует',
                    author: 'Неизвестен',
                    installDate: new Date().toISOString(),
                    path: reduxPath,
                    enabled: await this.isReduxEnabled(reduxPath)
                };
            }
        } catch (error) {
            console.error(`Ошибка получения информации о редуксе ${folderName}:`, error);
            return null;
        }
    }

    // Проверка включен ли редукс
    async isReduxEnabled(reduxPath) {
        try {
            // Проверяем наличие файлов редукса в корне игры
            const gamePath = this.settings.gtaPath;
            const reduxFiles = await fs.readdir(reduxPath);

            let enabledFiles = 0;
            let totalFiles = 0;

            for (const file of reduxFiles) {
                if (file.endsWith('.asi') || file.endsWith('.dll')) {
                    totalFiles++;
                    const gameFile = path.join(gamePath, file);
                    if (await fs.pathExists(gameFile)) {
                        enabledFiles++;
                    }
                }
            }

            return totalFiles > 0 && enabledFiles === totalFiles;

        } catch (error) {
            return false;
        }
    }

    // Установка редукса
    async installRedux(reduxData, archivePath) {
        if (!this.settings.gtaPath) {
            throw new Error('Папка с GTA 5 не указана');
        }

        try {
            const extract = require('extract-zip');

            // Создаем папку для редуксов если её нет
            const reduxFolder = path.join(this.settings.gtaPath, 'reduxes');
            await fs.ensureDir(reduxFolder);

            // Создаем уникальную папку для редукса
            const reduxId = reduxData.id || `redux-${Date.now()}`;
            const reduxPath = path.join(reduxFolder, reduxId);
            await fs.ensureDir(reduxPath);

            // Распаковываем архив
            await extract(archivePath, { dir: reduxPath });

            // Создаем файл информации о редуксе
            const reduxInfo = {
                id: reduxId,
                name: reduxData.title,
                version: reduxData.version,
                description: reduxData.description,
                author: reduxData.author || 'Неизвестен',
                category: reduxData.category,
                installDate: new Date().toISOString(),
                downloadUrl: reduxData.downloadUrl,
                fileSize: reduxData.fileSize
            };

            await fs.writeJson(path.join(reduxPath, 'redux-info.json'), reduxInfo, { spaces: 2 });

            // Если включена автопстановка, активируем редукс
            if (this.settings.autoInstall) {
                await this.enableRedux(reduxPath);
            }

            return {
                success: true,
                reduxId: reduxId,
                path: reduxPath
            };

        } catch (error) {
            console.error('Ошибка установки редукса:', error);
            throw error;
        }
    }

    // Включение редукса
    async enableRedux(reduxPath) {
        if (!this.settings.gtaPath) {
            throw new Error('Папка с GTA 5 не указана');
        }

        try {
            const files = await fs.readdir(reduxPath);
            const gamePath = this.settings.gtaPath;

            for (const file of files) {
                if (file.endsWith('.asi') || file.endsWith('.dll')) {
                    const sourcePath = path.join(reduxPath, file);
                    const destPath = path.join(gamePath, file);

                    // Создаем резервную копию если файл существует
                    if (await fs.pathExists(destPath)) {
                        const backupPath = path.join(gamePath, `${file}.backup`);
                        await fs.copy(destPath, backupPath);
                    }

                    // Копируем файл редукса
                    await fs.copy(sourcePath, destPath);
                }
            }

            return true;

        } catch (error) {
            console.error('Ошибка включения редукса:', error);
            throw error;
        }
    }

    // Отключение редукса
    async disableRedux(reduxPath) {
        if (!this.settings.gtaPath) {
            throw new Error('Папка с GTA 5 не указана');
        }

        try {
            const files = await fs.readdir(reduxPath);
            const gamePath = this.settings.gtaPath;

            for (const file of files) {
                if (file.endsWith('.asi') || file.endsWith('.dll')) {
                    const gameFile = path.join(gamePath, file);
                    const backupFile = path.join(gamePath, `${file}.backup`);

                    // Восстанавливаем из резервной копии если она существует
                    if (await fs.pathExists(backupFile)) {
                        await fs.copy(backupFile, gameFile);
                    } else {
                        // Удаляем файл если резервной копии нет
                        await fs.remove(gameFile);
                    }
                }
            }

            return true;

        } catch (error) {
            console.error('Ошибка отключения редукса:', error);
            throw error;
        }
    }

    // Удаление редукса
    async removeRedux(reduxPath) {
        try {
            // Сначала отключаем редукс
            await this.disableRedux(reduxPath);

            // Удаляем папку с редуксом
            await fs.remove(reduxPath);

            return true;

        } catch (error) {
            console.error('Ошибка удаления редукса:', error);
            throw error;
        }
    }

    // Получение информации о файлах игры
    async getGameInfo() {
        if (!this.settings.gtaPath) {
            return null;
        }

        try {
            const gamePath = this.settings.gtaPath;
            const exePath = path.join(gamePath, 'GTA5.exe');

            if (!(await fs.pathExists(exePath))) {
                return null;
            }

            const stats = await fs.stat(exePath);

            return {
                path: gamePath,
                exePath: exePath,
                size: stats.size,
                modified: stats.mtime,
                version: await this.getGameVersion(exePath)
            };

        } catch (error) {
            console.error('Ошибка получения информации об игре:', error);
            return null;
        }
    }

    // Получение версии игры (простая эвристика)
    async getGameVersion(exePath) {
        try {
            // В реальном проекте здесь можно использовать специальные библиотеки
            // для извлечения версии из PE заголовка
            return '1.0.0.0'; // Заглушка
        } catch (error) {
            return 'Неизвестна';
        }
    }

    // Создание ярлыка на рабочем столе
    async createDesktopShortcut() {
        try {
            const { app } = require('electron');
            const fs = require('fs');
            const path = require('path');
            const os = require('os');

            const desktopPath = path.join(os.homedir(), 'Desktop');
            const shortcutPath = path.join(desktopPath, 'Reduxion Launcher.lnk');

            // Создаем VBS скрипт для создания ярлыка в Windows
            const vbsScript = `
Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "${shortcutPath}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "${app.getPath('exe')}"
oLink.Arguments = ""
oLink.Description = "Reduxion Launcher"
oLink.IconLocation = "${app.getPath('exe')}, 0"
oLink.WorkingDirectory = "${app.getAppPath()}"
oLink.Save
            `;

            const scriptPath = path.join(os.tmpdir(), 'create-shortcut.vbs');
            await fs.writeFile(scriptPath, vbsScript);

            const { exec } = require('child_process');
            await new Promise((resolve, reject) => {
                exec(`cscript "${scriptPath}"`, (error) => {
                    fs.unlink(scriptPath);
                    if (error) reject(error);
                    else resolve();
                });
            });

            return true;

        } catch (error) {
            console.error('Ошибка создания ярлыка:', error);
            throw error;
        }
    }

    // Получение статистики редуксов
    async getReduxStats() {
        const installed = await this.getInstalledReduxes();

        return {
            total: installed.length,
            enabled: installed.filter(r => r.enabled).length,
            disabled: installed.filter(r => !r.enabled).length,
            totalSize: installed.reduce((total, redux) => total + (redux.size || 0), 0)
        };
    }
}

module.exports = ReduxManager;