# 🚀 Система сборки Reduxion Launcher

Полная система для создания EXE файлов лаунчера и установщика с автоматическим скачиванием.

## 📦 Компоненты системы сборки

### 1. Лаунчер (основное приложение)
- **build-launcher.bat** - сборка основного лаунчера в EXE
- **build-installer.bat** - сборка установщика лаунчера
- **build-complete.bat** - полная сборка всех компонентов

### 2. Установщик (автономный)
- Скачивает актуальную версию лаунчера с сервера
- Автоматическая установка и настройка
- Создание ярлыков и интеграция с системой

### 3. Модули поддержки
- **downloader.js** - модуль для скачивания файлов с сервера
- **assets/** - ресурсы и иконки приложения

## 🛠️ Использование

### Быстрая сборка

#### Сборка только лаунчера:
```bash
# Запустите скрипт сборки
build-launcher.bat
```

#### Сборка только установщика:
```bash
# Сборка автономного установщика
build-installer.bat
```

#### Полная сборка всех компонентов:
```bash
# Сборка лаунчера + установщика + портативных версий
build-complete.bat
```

### Сборка через npm:
```bash
# Сборка лаунчера
npm run build-win

# Сборка установщика
npx electron-builder --config package-installer.json --win --publish=never
```

## 📁 Структура выходных файлов

После сборки создаются следующие папки:

### dist/ (Лаунчер)
```
dist/
├── ReduxionLauncher-Setup-1.0.0.exe    # Установщик лаунчера
├── ReduxionLauncher-Portable-1.0.0.exe # Портативная версия
└── [другие файлы сборки]
```

### installer-dist/ (Установщик)
```
installer-dist/
├── ReduxionLauncherSetup-Setup-1.0.0.exe # Установщик лаунчера
└── [другие файлы сборки]
```

## ⚙️ Настройка сборки

### Конфигурация лаунчера (package.json)
```json
{
  "build": {
    "win": {
      "target": [
        { "target": "nsis", "arch": ["x64", "ia32"] },
        { "target": "portable", "arch": ["x64", "ia32"] }
      ],
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

### Конфигурация установщика (package-installer.json)
```json
{
  "build": {
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "installerIcon": "assets/icon.ico",
      "createDesktopShortcut": false,
      "createStartMenuShortcut": false
    }
  }
}
```

## 🌐 Автоматическое скачивание лаунчера

Установщик поддерживает автоматическое скачивание лаунчера с сервера:

### Настройка сервера:
1. Разместите JSON файл с информацией о лаунчере: `/api/launcher/info`
2. Укажите URL для скачивания exe файла: `downloadUrl`

Пример ответа сервера:
```json
{
  "version": "1.0.0",
  "downloadUrl": "https://example.com/ReduxionLauncher-1.0.0.exe",
  "releaseDate": "2024-01-20",
  "changelog": "Багфиксы и улучшения"
}
```

### Использование в интерфейсе установщика:
```javascript
// Скачивание лаунчера с сервера
const result = await ipcRenderer.invoke('download-launcher', 'https://your-server.com');

// Запуск установки с скачиванием
const installResult = await ipcRenderer.invoke('run-installation', {
  installPath: 'C:\\Program Files\\Reduxion Launcher',
  createDesktopShortcut: true,
  createStartMenuShortcut: true,
  serverUrl: 'https://your-server.com'
});
```

## 🔧 Разработка и отладка

### Режим разработки:
```bash
# Запуск лаунчера в режиме разработки
npm start

# Запуск установщика в режиме разработки
npm run start-installer
```

### Тестирование:
```bash
# Тестирование установщика
npm run test-installer

# Тестирование лаунчера
npm run test
```

### Логи и отладка:
- Логи сохраняются в папке данных приложения
- Используйте DevTools (F12) для отладки интерфейса
- Проверьте консоль для диагностики ошибок

## 🚨 Распространение

### Для конечных пользователей:
1. **Лаунчер**: Используйте файлы из папки `dist/`
2. **Установщик**: Используйте файлы из папки `installer-dist/`

### Рекомендации:
- Тестируйте на разных версиях Windows
- Убедитесь что антивирус не блокирует exe файлы
- Проверьте работу на компьютерах без прав администратора

## 📋 Требования

### Системные требования:
- Windows 10/11 (64-bit)
- Node.js 16+
- 500 MB свободного места
- Интернет-соединение (для скачивания лаунчера)

### Зависимости:
```bash
npm install -g electron electron-builder
npm install --save-dev electron-packager
```

## 🔍 Диагностика проблем

### Часто встречающиеся ошибки:

#### "Файл не найден":
- Проверьте наличие всех необходимых файлов
- Убедитесь что пути указаны корректно

#### "Ошибка сборки":
- Очистите папки `dist/`, `build/`, `installer-dist/`
- Переустановите зависимости: `npm install`

#### "Ошибка скачивания лаунчера":
- Проверьте доступность сервера
- Убедитесь что URL скачивания корректен
- Проверьте настройки firewall/антивируса

### Логи ошибок:
- Основные логи: консоль приложения
- Логи сборки: в соответствующих папках
- Логи установщика: в папке данных приложения

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в консоли
2. Убедитесь что все файлы на месте
3. Попробуйте пересобрать проект
4. Проверьте настройки антивируса

---

*Создано командой Reduxion Team*