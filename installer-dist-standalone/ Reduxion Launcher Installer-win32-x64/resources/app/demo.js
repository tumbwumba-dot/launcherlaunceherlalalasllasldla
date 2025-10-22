// Демонстрационный скрипт для Reduxion Launcher

const ReduxManager = require('./redux-manager');
const { ReduxionAPI, ReduxCache } = require('./api-client');
const fs = require('fs-extra');
const path = require('path');

class LauncherDemo {
    constructor() {
        this.reduxManager = null;
        this.api = new ReduxionAPI('http://localhost:3000');
        this.cache = new ReduxCache();
    }

    // Демонстрация основных функций лаунчера
    async runDemo() {
        console.log('🎬 Демонстрация Reduxion Launcher');
        console.log('=================================\n');

        // Инициализация
        await this.initialize();

        // Демонстрация различных сценариев
        await this.demoGTADetection();
        await this.demoReduxCatalog();
        await this.demoReduxInstallation();
        await this.demoGameLaunching();
        await this.demoSettings();

        console.log('\n🎉 Демонстрация завершена!');
        console.log('==============================');
        console.log('🚀 Для запуска лаунчера используйте: npm start');
        console.log('🌐 Для запуска веб-сервера используйте: node start-dev-server.js');
        console.log('🔧 Для запуска всего проекта: node start-all.js');
    }

    // Инициализация компонентов
    async initialize() {
        console.log('🔧 Инициализация компонентов...');

        // Создаем менеджер редуксов с тестовыми настройками
        this.reduxManager = new ReduxManager({
            gtaPath: 'C:\\Program Files\\Rockstar Games\\Grand Theft Auto V',
            gameExe: 'GTA5.exe',
            reduxionUrl: 'http://localhost:3000',
            autoInstall: true
        });

        console.log('✅ Компоненты инициализированы\n');
    }

    // Демонстрация обнаружения GTA 5
    async demoGTADetection() {
        console.log('🔍 Демонстрация обнаружения GTA 5');
        console.log('----------------------------------');

        try {
            // Тестируем различные пути
            const possiblePaths = [
                'C:\\Program Files\\Rockstar Games\\Grand Theft Auto V',
                'C:\\Program Files (x86)\\Rockstar Games\\Grand Theft Auto V',
                'C:\\Program Files\\Epic Games\\GTAV'
            ];

            console.log('📁 Проверяем возможные пути к игре:');
            for (const testPath of possiblePaths) {
                const exists = await fs.pathExists(path.join(testPath, 'GTA5.exe'));
                console.log(`   ${exists ? '✅' : '❌'} ${testPath}`);
            }

            // Тестируем валидацию пути
            const testPath = possiblePaths[0];
            const isValid = await this.reduxManager.validateGTAPath(testPath);
            console.log(`\n🔍 Валидация пути "${testPath}": ${isValid ? '✅ Корректен' : '❌ Некорректен'}`);

        } catch (error) {
            console.log(`❌ Ошибка: ${error.message}`);
        }

        console.log('');
    }

    // Демонстрация работы с каталогом редуксов
    async demoReduxCatalog() {
        console.log('📦 Демонстрация каталога редуксов');
        console.log('---------------------------------');

        try {
            // Получение списка редуксов
            console.log('📋 Получение списка редуксов...');
            const reduxList = await this.api.getReduxList({ limit: 3 });

            console.log(`✅ Получено ${reduxList.length} редуксов:`);
            reduxList.forEach((redux, index) => {
                console.log(`   ${index + 1}. ${redux.title} v${redux.version}`);
                console.log(`      📝 ${redux.description.substring(0, 60)}...`);
                console.log(`      📊 ${redux.downloadCount} скачиваний, ⭐ ${redux.rating}`);
                console.log('');
            });

            // Демонстрация получения конкретного редукса
            if (reduxList.length > 0) {
                const firstRedux = reduxList[0];
                console.log(`🔍 Получение детальной информации о "${firstRedux.title}"...`);

                try {
                    const reduxInfo = await this.api.getReduxInfo(firstRedux.id);
                    console.log('✅ Детальная информация:');
                    console.log(`   📝 Описание: ${reduxInfo.description}`);
                    console.log(`   👤 Автор: ${reduxInfo.author}`);
                    console.log(`   📂 Размер: ${reduxInfo.fileSize}`);
                    console.log(`   🏷️ Теги: ${reduxInfo.tags.join(', ')}`);
                } catch (error) {
                    console.log(`❌ Ошибка получения детальной информации: ${error.message}`);
                }
            }

        } catch (error) {
            console.log(`❌ Ошибка работы с каталогом: ${error.message}`);
        }

        console.log('');
    }

    // Демонстрация установки редукса
    async demoReduxInstallation() {
        console.log('📥 Демонстрация установки редукса');
        console.log('--------------------------------');

        try {
            // Показываем процесс установки без реального скачивания
            console.log('📋 Процесс установки редукса:');
            console.log('   1. 🔍 Поиск редукса в каталоге');
            console.log('   2. 📥 Скачивание архива');
            console.log('   3. 📦 Распаковка файлов');
            console.log('   4. 📂 Копирование в папку игры');
            console.log('   5. ✅ Активация редукса');

            // Демонстрация создания структуры файлов редукса
            const demoReduxPath = path.join(__dirname, 'demo-redux');
            await fs.ensureDir(demoReduxPath);

            // Создаем демо-файлы редукса
            const reduxFiles = [
                'SuperRedux.asi',
                'SuperRedux.ini',
                'scripts/SuperRedux.dll',
                'redux-info.json'
            ];

            console.log('\n📁 Создание демо-файлов редукса:');
            for (const file of reduxFiles) {
                const filePath = path.join(demoReduxPath, file);
                await fs.ensureDir(path.dirname(filePath));
                await fs.writeFile(filePath, `// Demo file: ${file}\n// Created: ${new Date().toISOString()}\n`);
                console.log(`   ✅ ${file}`);
            }

            // Создаем файл информации о редуксе
            const reduxInfo = {
                id: 'super-redux-demo',
                name: 'Super Redux Pro (Demo)',
                version: '2.1.0',
                description: 'Демонстрационная версия продвинутого редукса',
                author: 'Reduxion Team',
                installDate: new Date().toISOString(),
                category: 'gameplay',
                fileSize: '15.2 MB'
            };

            await fs.writeJson(path.join(demoReduxPath, 'redux-info.json'), reduxInfo, { spaces: 2 });
            console.log('   ✅ redux-info.json');

            console.log(`\n📂 Демо-редукс создан в: ${demoReduxPath}`);
            console.log('💡 В реальном сценарии файлы будут скопированы в папку с GTA 5');

        } catch (error) {
            console.log(`❌ Ошибка демонстрации установки: ${error.message}`);
        }

        console.log('');
    }

    // Демонстрация запуска игры
    async demoGameLaunching() {
        console.log('🎮 Демонстрация запуска игры');
        console.log('----------------------------');

        try {
            console.log('🚀 Процесс запуска игры:');
            console.log('   1. 🔍 Проверка наличия GTA5.exe');
            console.log('   2. 📋 Проверка активных редуксов');
            console.log('   3. ⚙️ Применение настроек');
            console.log('   4. 🎯 Запуск игры');

            // Проверка процесса игры (демонстрация)
            const { exec } = require('child_process');
            exec('tasklist /FI "IMAGENAME eq GTA5.exe" 2>nul', (error, stdout) => {
                if (stdout.includes('GTA5.exe')) {
                    console.log('✅ Обнаружен запущенный процесс GTA5.exe');
                } else {
                    console.log('❌ Процесс GTA5.exe не обнаружен (ожидаемо)');
                }
            });

            console.log('\n💡 В реальном сценарии лаунчер запустит игру с параметрами:');
            console.log('   GTA5.exe --reduxion-enabled');

        } catch (error) {
            console.log(`❌ Ошибка демонстрации запуска: ${error.message}`);
        }

        console.log('');
    }

    // Демонстрация настроек
    async demoSettings() {
        console.log('⚙️ Демонстрация настроек');
        console.log('------------------------');

        try {
            const demoSettings = {
                gtaPath: 'C:\\Program Files\\Rockstar Games\\Grand Theft Auto V',
                gameExe: 'GTA5.exe',
                reduxionUrl: 'http://localhost:3000',
                autoInstall: true,
                createDesktopShortcut: false,
                language: 'ru'
            };

            console.log('📋 Текущие настройки лаунчера:');
            Object.entries(demoSettings).forEach(([key, value]) => {
                console.log(`   ${key}: ${value}`);
            });

            // Демонстрация сохранения настроек
            const settingsPath = path.join(__dirname, 'demo-settings.json');
            await fs.writeJson(settingsPath, demoSettings, { spaces: 2 });

            console.log(`\n💾 Настройки сохранены в: ${settingsPath}`);

        } catch (error) {
            console.log(`❌ Ошибка демонстрации настроек: ${error.message}`);
        }

        console.log('');
    }

    // Показать итоговую информацию
    showSummary() {
        console.log('📊 Сводная информация');
        console.log('===================');
        console.log('📁 Структура проекта:');
        console.log('   reduxion-launcher/');
        console.log('   ├── main.js              # Основное приложение Electron');
        console.log('   ├── launcher.html        # Интерфейс лаунчера');
        console.log('   ├── redux-manager.js     # Управление редуксами');
        console.log('   ├── api-client.js        # Работа с API');
        console.log('   ├── package.json         # Конфигурация');
        console.log('   └── README.md            # Документация');
        console.log('');
        console.log('🚀 Команды для запуска:');
        console.log('   npm install              # Установка зависимостей');
        console.log('   npm start                # Запуск лаунчера');
        console.log('   node start-dev-server.js # Запуск тестового сервера');
        console.log('   node start-all.js        # Запуск всего проекта');
        console.log('   node demo.js             # Показать демо');
        console.log('');
        console.log('🔧 Особенности:');
        console.log('   ✅ Автоматическое обнаружение GTA 5');
        console.log('   ✅ Управление редуксами (скачивание, установка)');
        console.log('   ✅ Запуск игры с активными редуксами');
        console.log('   ✅ Гибкие настройки и конфигурация');
        console.log('   ✅ Интеграция с веб-каталогом');
        console.log('   ✅ Поддержка Windows 10/11');
    }
}

// Запуск демо если файл запущен напрямую
if (require.main === module) {
    const demo = new LauncherDemo();
    demo.runDemo().then(() => {
        demo.showSummary();
    }).catch(error => {
        console.error('❌ Ошибка при запуске демо:', error);
    });
}

module.exports = LauncherDemo;