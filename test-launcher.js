// Тестовый файл для проверки функциональности лаунчер приложения

const ReduxManager = require('./redux-manager');
const { ReduxionAPI, ReduxCache } = require('./api-client');

class LauncherTester {
    constructor() {
        this.reduxManager = null;
        this.api = new ReduxionAPI();
        this.cache = new ReduxCache();
    }

    // Тестирование обнаружения GTA 5
    async testGTADetection() {
        console.log('🔍 Тестирование обнаружения GTA 5...');

        try {
            // Тестируем без настроек (автоматическое обнаружение)
            const testPath = await this.reduxManager.detectGTAPath();

            if (testPath) {
                console.log('✅ Папка с GTA 5 найдена:', testPath);
                return true;
            } else {
                console.log('❌ Папка с GTA 5 не найдена автоматически');
                return false;
            }
        } catch (error) {
            console.error('❌ Ошибка при обнаружении GTA 5:', error.message);
            return false;
        }
    }

    // Тестирование валидации пути к игре
    async testPathValidation(gamePath) {
        console.log('🔍 Тестирование валидации пути к игре...');

        try {
            const isValid = await this.reduxManager.validateGTAPath(gamePath);

            if (isValid) {
                console.log('✅ Путь к игре корректен');
                return true;
            } else {
                console.log('❌ Путь к игре некорректен');
                return false;
            }
        } catch (error) {
            console.error('❌ Ошибка валидации пути:', error.message);
            return false;
        }
    }

    // Тестирование получения списка редуксов
    async testReduxList() {
        console.log('🔍 Тестирование получения списка редуксов...');

        try {
            const reduxList = await this.api.getReduxList({ limit: 5 });

            if (reduxList && reduxList.length > 0) {
                console.log(`✅ Получен список редуксов: ${reduxList.length} элементов`);
                reduxList.forEach((redux, index) => {
                    console.log(`  ${index + 1}. ${redux.title} (${redux.category})`);
                });
                return true;
            } else {
                console.log('❌ Список редуксов пуст или не получен');
                return false;
            }
        } catch (error) {
            console.error('❌ Ошибка получения списка редуксов:', error.message);
            return false;
        }
    }

    // Тестирование подключения к API
    async testAPIConnection() {
        console.log('🔍 Тестирование подключения к API...');

        try {
            const isConnected = await this.api.checkConnection();

            if (isConnected) {
                console.log('✅ Подключение к API установлено');
                return true;
            } else {
                console.log('❌ Не удалось подключиться к API');
                return false;
            }
        } catch (error) {
            console.error('❌ Ошибка подключения к API:', error.message);
            return false;
        }
    }

    // Тестирование кэша
    async testCache() {
        console.log('🔍 Тестирование системы кэша...');

        try {
            const testData = { test: 'data', timestamp: Date.now() };

            // Сохраняем данные в кэш
            await this.cache.set('test-key', testData);

            // Получаем данные из кэша
            const cachedData = await this.cache.get('test-key');

            if (cachedData && cachedData.test === 'data') {
                console.log('✅ Кэш работает корректно');
                return true;
            } else {
                console.log('❌ Ошибка работы кэша');
                return false;
            }
        } catch (error) {
            console.error('❌ Ошибка тестирования кэша:', error.message);
            return false;
        }
    }

    // Тестирование получения установленных редуксов
    async testInstalledReduxes() {
        console.log('🔍 Тестирование получения установленных редуксов...');

        try {
            const installed = await this.reduxManager.getInstalledReduxes();

            console.log(`✅ Найдено установленных редуксов: ${installed.length}`);
            installed.forEach((redux, index) => {
                console.log(`  ${index + 1}. ${redux.name} v${redux.version} - ${redux.enabled ? 'Включен' : 'Отключен'}`);
            });

            return true;
        } catch (error) {
            console.error('❌ Ошибка получения установленных редуксов:', error.message);
            return false;
        }
    }

    // Основной тест
    async runAllTests() {
        console.log('🚀 Запуск тестирования Reduxion Launcher...\n');

        const tests = [
            { name: 'Подключение к API', test: () => this.testAPIConnection() },
            { name: 'Кэш система', test: () => this.testCache() },
            { name: 'Список редуксов', test: () => this.testReduxList() },
        ];

        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            try {
                const result = await test.test();
                if (result) {
                    passed++;
                    console.log(`✅ ${test.name} - ПРОЙДЕН\n`);
                } else {
                    failed++;
                    console.log(`❌ ${test.name} - НЕ ПРОЙДЕН\n`);
                }
            } catch (error) {
                failed++;
                console.log(`❌ ${test.name} - ОШИБКА: ${error.message}\n`);
            }
        }

        console.log('📊 Результаты тестирования:');
        console.log(`✅ Пройдено: ${passed}`);
        console.log(`❌ Не пройдено: ${failed}`);
        console.log(`📈 Успешность: ${Math.round((passed / (passed + failed)) * 100)}%\n`);

        if (failed === 0) {
            console.log('🎉 Все тесты пройдены успешно!');
        } else {
            console.log('⚠️ Некоторые тесты не пройдены. Проверьте настройки приложения.');
        }
    }

    // Инициализация тестера
    async initialize() {
        // Создаем менеджер редуксов с тестовыми настройками
        this.reduxManager = new ReduxManager({
            gtaPath: 'C:\\Program Files\\Rockstar Games\\Grand Theft Auto V',
            gameExe: 'GTA5.exe',
            reduxionUrl: 'http://localhost:3000',
            autoInstall: true
        });

        console.log('✅ Тестер инициализирован\n');
    }
}

// Запуск тестирования если файл запущен напрямую
if (require.main === module) {
    const tester = new LauncherTester();

    tester.initialize().then(() => {
        return tester.runAllTests();
    }).catch(error => {
        console.error('❌ Критическая ошибка при тестировании:', error);
    });
}

module.exports = LauncherTester;