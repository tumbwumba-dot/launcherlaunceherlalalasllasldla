// Скрипт для запуска тестового сервера веб-приложения для тестирования лаунчера

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Включаем CORS для всех запросов
app.use(cors());
app.use(express.json());

// Тестовые данные редуксов
const mockReduxes = [
    {
        id: 'super-redux-pro',
        title: 'Super Redux Pro',
        description: 'Продвинутый редукс для Majestic с улучшенной графикой и новыми возможностями',
        version: '2.1.0',
        category: 'gameplay',
        author: 'ReduxMaster',
        fileSize: '15.2 MB',
        downloadCount: 1247,
        rating: 4.8,
        uploadDate: '2025-01-15T10:30:00Z',
        tags: ['графика', 'геймплей', 'стабильный'],
        requirements: {
            gameVersion: '1.0.0',
            os: 'Windows 10/11',
            ram: '8 GB',
            diskSpace: '500 MB'
        },
        features: [
            'Улучшенная графика и освещение',
            'Новые игровые механики',
            'Оптимизация производительности',
            'Поддержка модов и плагинов',
            'Автоматическое обновление'
        ],
        screenshots: [
            '/screenshots/redux1-1.jpg',
            '/screenshots/redux1-2.jpg',
            '/screenshots/redux1-3.jpg'
        ]
    },
    {
        id: 'graphics-enhancement',
        title: 'Graphics Enhancement Mod',
        description: 'Улучшение графики и освещения в игре',
        version: '1.5.2',
        category: 'graphics',
        author: 'GraphicsGuru',
        fileSize: '8.7 MB',
        downloadCount: 892,
        rating: 4.6,
        uploadDate: '2025-01-10T14:20:00Z',
        tags: ['графика', 'освещение', 'текстуры'],
        requirements: {
            gameVersion: '1.0.0',
            os: 'Windows 10/11',
            ram: '4 GB',
            diskSpace: '200 MB'
        },
        features: [
            'Улучшенные текстуры',
            'Реалистичное освещение',
            'HD тени',
            'Анти-алиасинг'
        ],
        screenshots: [
            '/screenshots/redux2-1.jpg',
            '/screenshots/redux2-2.jpg'
        ]
    },
    {
        id: 'performance-boost',
        title: 'Performance Boost Redux',
        description: 'Оптимизация производительности и стабильности игры',
        version: '1.2.1',
        category: 'performance',
        author: 'PerfMaster',
        fileSize: '3.4 MB',
        downloadCount: 2156,
        rating: 4.9,
        uploadDate: '2025-01-12T09:15:00Z',
        tags: ['производительность', 'оптимизация', 'стабильность'],
        requirements: {
            gameVersion: '1.0.0',
            os: 'Windows 10/11',
            ram: '4 GB',
            diskSpace: '50 MB'
        },
        features: [
            'Увеличение FPS',
            'Оптимизация памяти',
            'Уменьшение лагов',
            'Стабильная работа'
        ],
        screenshots: [
            '/screenshots/redux3-1.jpg'
        ]
    }
];

// API endpoints

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Получение списка редуксов
app.get('/api/reduxes', (req, res) => {
    const { category, search, limit = 20, offset = 0 } = req.query;

    let filteredReduxes = [...mockReduxes];

    // Фильтрация по категории
    if (category && category !== 'all') {
        filteredReduxes = filteredReduxes.filter(redux => redux.category === category);
    }

    // Поиск по тексту
    if (search) {
        const searchLower = search.toLowerCase();
        filteredReduxes = filteredReduxes.filter(redux =>
            redux.title.toLowerCase().includes(searchLower) ||
            redux.description.toLowerCase().includes(searchLower) ||
            redux.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
    }

    // Пагинация
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedReduxes = filteredReduxes.slice(startIndex, endIndex);

    res.json({
        redux: paginatedReduxes,
        total: filteredReduxes.length,
        limit: parseInt(limit),
        offset: startIndex,
        hasMore: endIndex < filteredReduxes.length
    });
});

// Получение информации о конкретном редуксе
app.get('/api/reduxes/:id', (req, res) => {
    const { id } = req.params;
    const redux = mockReduxes.find(r => r.id === id);

    if (!redux) {
        return res.status(404).json({ error: 'Редукс не найден' });
    }

    res.json(redux);
});

// Получение ссылки для скачивания
app.get('/api/reduxes/:id/download', (req, res) => {
    const { id } = req.params;
    const redux = mockReduxes.find(r => r.id === id);

    if (!redux) {
        return res.status(404).json({ error: 'Редукс не найден' });
    }

    // В реальном приложении здесь будет генерация временной ссылки
    res.json({
        downloadUrl: `https://example.com/download/${id}`,
        fileName: `${redux.title.replace(/[^a-zA-Z0-9]/g, '_')}_v${redux.version}.zip`,
        fileSize: redux.fileSize,
        expiresAt: new Date(Date.now() + 3600000).toISOString() // Срок действия 1 час
    });
});

// Получение категорий
app.get('/api/categories', (req, res) => {
    const categories = [
        { id: 'gameplay', name: 'Геймплей', icon: 'fas fa-gamepad' },
        { id: 'graphics', name: 'Графика', icon: 'fas fa-palette' },
        { id: 'interface', name: 'Интерфейс', icon: 'fas fa-desktop' },
        { id: 'performance', name: 'Производительность', icon: 'fas fa-tachometer-alt' },
        { id: 'cheats', name: 'Чит-моды', icon: 'fas fa-star' },
        { id: 'utilities', name: 'Утилиты', icon: 'fas fa-tools' },
        { id: 'skins', name: 'Скины', icon: 'fas fa-user-circle' },
        { id: 'other', name: 'Другое', icon: 'fas fa-box' }
    ];

    res.json(categories);
});

// Получение новостей
app.get('/api/news', (req, res) => {
    const news = [
        {
            id: '1',
            title: 'Обновление Reduxion Launcher v1.0',
            content: 'Выпущена новая версия лаунчера с улучшенной поддержкой редуксов и новым интерфейсом.',
            date: '2025-01-15T12:00:00Z',
            important: true
        },
        {
            id: '2',
            title: 'Новые редуксы в каталоге',
            content: 'Добавлено 15 новых редуксов для Majestic. Рекомендуем ознакомиться!',
            date: '2025-01-14T16:30:00Z',
            important: false
        }
    ];

    res.json(news);
});

// Получение статистики
app.get('/api/stats', (req, res) => {
    res.json({
        totalReduxes: mockReduxes.length,
        totalDownloads: mockReduxes.reduce((sum, redux) => sum + redux.downloadCount, 0),
        activeUsers: 1247,
        uptime: '99.9%'
    });
});

// Проверка обновлений
app.get('/api/updates/latest', (req, res) => {
    res.json({
        version: '1.0.1',
        downloadUrl: 'https://example.com/download/reduxion-launcher-1.0.1.exe',
        releaseDate: '2025-01-16T10:00:00Z',
        changelog: [
            'Исправлены ошибки в интерфейсе',
            'Улучшена стабильность',
            'Добавлена поддержка новых форматов редуксов'
        ]
    });
});

// Отправка статистики использования
app.post('/api/stats', (req, res) => {
    console.log('Получена статистика использования:', req.body);
    res.json({ success: true });
});

// Отправка отчета об ошибке
app.post('/api/errors', (req, res) => {
    console.log('Получен отчет об ошибке:', req.body);
    res.json({ success: true, errorId: 'err_' + Date.now() });
});

// Статика для изображений
app.use('/screenshots', express.static(path.join(__dirname, 'mock-screenshots')));

// Запуск сервера
app.listen(PORT, () => {
    console.log('🚀 Тестовый сервер Reduxion запущен!');
    console.log(`📡 API сервер: http://localhost:${PORT}`);
    console.log(`🌐 Доступные endpoints:`);
    console.log(`   GET  /api/health              - проверка состояния`);
    console.log(`   GET  /api/reduxes             - список редуксов`);
    console.log(`   GET  /api/reduxes/:id         - информация о редуксе`);
    console.log(`   GET  /api/reduxes/:id/download - ссылка для скачивания`);
    console.log(`   GET  /api/categories          - категории редуксов`);
    console.log(`   GET  /api/news                - новости`);
    console.log(`   GET  /api/updates/latest      - проверка обновлений`);
    console.log(`   POST /api/stats               - отправка статистики`);
    console.log(`   POST /api/errors              - отчет об ошибке`);
    console.log('');
    console.log('🔧 Для тестирования лаунчера:');
    console.log(`   1. Запустите лаунчер: npm start`);
    console.log(`   2. В настройках укажите URL: http://localhost:${PORT}`);
    console.log(`   3. Перейдите в раздел "Редуксы" для просмотра каталога`);
    console.log('');
    console.log('⚠️  Сервер автоматически остановится при нажатии Ctrl+C');
});

// Обработка завершения работы
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка сервера...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Остановка сервера...');
    process.exit(0);
});