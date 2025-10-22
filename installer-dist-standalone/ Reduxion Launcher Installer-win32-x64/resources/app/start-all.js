// Скрипт для запуска всего проекта Reduxion (веб-сервер + лаунчер)

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class ProjectManager {
    constructor() {
        this.webServerProcess = null;
        this.launcherProcess = null;
        this.isWindows = process.platform === 'win32';
    }

    // Запуск веб-сервера
    async startWebServer() {
        console.log('🚀 Запуск веб-сервера...');

        return new Promise((resolve, reject) => {
            // Проверяем наличие веб-приложения в родительской папке
            const webAppPath = path.join(__dirname, '..', 'index.html');
            const hasWebApp = fs.existsSync(webAppPath);

            if (hasWebApp) {
                console.log('✅ Найдено веб-приложение, запускаем локальный сервер...');

                // В реальном проекте здесь можно запустить сервер для веб-приложения
                // Для демонстрации используем простой HTTP сервер
                const serverPath = path.join(__dirname, 'start-dev-server.js');

                this.webServerProcess = spawn('node', [serverPath], {
                    stdio: 'inherit',
                    shell: true,
                    cwd: __dirname
                });

                this.webServerProcess.on('error', (error) => {
                    console.error('❌ Ошибка запуска веб-сервера:', error.message);
                    reject(error);
                });

                // Ждем немного чтобы сервер успел запуститься
                setTimeout(() => {
                    console.log('✅ Веб-сервер запущен на http://localhost:3000');
                    resolve();
                }, 2000);

            } else {
                console.log('⚠️ Веб-приложение не найдено, пропускаем запуск сервера');
                console.log('💡 Для полного функционала скопируйте веб-приложение в корневую папку');
                resolve();
            }
        });
    }

    // Запуск лаунчер приложения
    async startLauncher() {
        console.log('🚀 Запуск Reduxion Launcher...');

        return new Promise((resolve, reject) => {
            // Проверяем наличие зависимостей
            const nodeModulesPath = path.join(__dirname, 'node_modules');
            if (!fs.existsSync(nodeModulesPath)) {
                console.log('📦 Установка зависимостей...');
                exec('npm install', { cwd: __dirname }, (error) => {
                    if (error) {
                        console.error('❌ Ошибка установки зависимостей:', error.message);
                        reject(error);
                        return;
                    }

                    console.log('✅ Зависимости установлены');
                    this.launchLauncherApp();
                });
            } else {
                this.launchLauncherApp();
            }

            function launchLauncherApp() {
                this.launcherProcess = spawn('npm', ['start'], {
                    stdio: 'inherit',
                    shell: true,
                    cwd: __dirname
                });

                this.launcherProcess.on('error', (error) => {
                    console.error('❌ Ошибка запуска лаунчера:', error.message);
                    reject(error);
                });

                setTimeout(() => {
                    console.log('✅ Reduxion Launcher запущен');
                    resolve();
                }, 3000);
            }
        });
    }

    // Запуск тестов
    async runTests() {
        console.log('🧪 Запуск тестирования...');

        try {
            const { LauncherTester } = require('./test-launcher');
            const tester = new LauncherTester();
            await tester.initialize();
            await tester.runAllTests();
        } catch (error) {
            console.error('❌ Ошибка при тестировании:', error.message);
        }
    }

    // Остановка всех процессов
    async stopAll() {
        console.log('🛑 Остановка всех процессов...');

        if (this.webServerProcess) {
            console.log('🛑 Остановка веб-сервера...');
            if (this.isWindows) {
                spawn('taskkill', ['/pid', this.webServerProcess.pid, '/f'], { stdio: 'inherit' });
            } else {
                this.webServerProcess.kill('SIGTERM');
            }
        }

        if (this.launcherProcess) {
            console.log('🛑 Остановка лаунчера...');
            if (this.isWindows) {
                spawn('taskkill', ['/pid', this.launcherProcess.pid, '/f'], { stdio: 'inherit' });
            } else {
                this.launcherProcess.kill('SIGTERM');
            }
        }

        console.log('✅ Все процессы остановлены');
    }

    // Проверка готовности системы
    async checkSystem() {
        console.log('🔍 Проверка системных требований...');

        const checks = [
            { name: 'Node.js', check: () => process.version.startsWith('v') },
            { name: 'npm', check: () => require('child_process').execSync('npm --version', { encoding: 'utf8' }) },
            { name: 'Git', check: () => {
                try {
                    require('child_process').execSync('git --version', { encoding: 'utf8' });
                    return true;
                } catch {
                    return false;
                }
            }}
        ];

        let allPassed = true;

        checks.forEach(check => {
            try {
                const result = check.check();
                if (result) {
                    console.log(`✅ ${check.name}: установлен`);
                } else {
                    console.log(`❌ ${check.name}: не установлен`);
                    allPassed = false;
                }
            } catch (error) {
                console.log(`❌ ${check.name}: ошибка проверки - ${error.message}`);
                allPassed = false;
            }
        });

        return allPassed;
    }

    // Основной метод запуска
    async start() {
        console.log('🎯 Reduxion Project Manager');
        console.log('==========================\n');

        // Проверяем системные требования
        const systemReady = await this.checkSystem();
        if (!systemReady) {
            console.log('\n❌ Системные требования не выполнены!');
            console.log('Установите необходимые компоненты и попробуйте снова.');
            return;
        }

        try {
            // Запускаем веб-сервер
            await this.startWebServer();

            // Запускаем лаунчер
            await this.startLauncher();

            console.log('\n🎉 Проект Reduxion успешно запущен!');
            console.log('==============================');
            console.log('🌐 Веб-сервер: http://localhost:3000');
            console.log('🚀 Лаунчер: запущен в отдельном окне');
            console.log('📖 Документация: откройте README.md');
            console.log('\n💡 Для остановки нажмите Ctrl+C');

        } catch (error) {
            console.error('\n❌ Ошибка запуска проекта:', error.message);
            await this.stopAll();
        }
    }

    // Обработка завершения работы
    setupExitHandlers() {
        const exitHandler = async (signal) => {
            console.log(`\n\n🛑 Получен сигнал ${signal}, завершение работы...`);
            await this.stopAll();
            process.exit(0);
        };

        process.on('SIGINT', exitHandler);
        process.on('SIGTERM', exitHandler);
        process.on('SIGBREAK', exitHandler);

        // Обработка закрытия через Ctrl+C
        if (this.isWindows) {
            require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            }).on('SIGINT', exitHandler);
        }
    }
}

// Запуск если файл запущен напрямую
if (require.main === module) {
    const manager = new ProjectManager();
    manager.setupExitHandlers();
    manager.start().catch(error => {
        console.error('Критическая ошибка:', error);
        process.exit(1);
    });
}

module.exports = ProjectManager;