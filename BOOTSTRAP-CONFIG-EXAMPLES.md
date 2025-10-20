# 🔧 Примеры конфигурации Bootstrap

## Базовая конфигурация

### bootstrap-installer-main.js

```javascript
const CONFIG = {
  serverUrl: 'https://your-domain.example.com/reduxion/launcher/',
  launcherFileName: 'Reduxion-Launcher-Setup.exe',
  appName: 'Reduxion Launcher',
  version: '1.0.0'
};
```

---

## Сценарий 1: GitHub Releases

Если вы храните файлы на GitHub Releases:

```javascript
const CONFIG = {
  serverUrl: 'https://github.com/your-username/reduxion/releases/download/v1.0.0/',
  launcherFileName: 'Reduxion-Launcher-Setup.exe',
  appName: 'Reduxion Launcher',
  version: '1.0.0'
};
```

**Пример полного URL:**
```
https://github.com/username/reduxion/releases/download/v1.0.0/Reduxion-Launcher-Setup.exe
```

---

## Сценарий 2: Свой сервер (Apache/Nginx)

Если у вас свой веб-сервер:

```javascript
const CONFIG = {
  serverUrl: 'https://reduxion.example.com/downloads/',
  launcherFileName: 'Reduxion-Launcher-Setup.exe',
  appName: 'Reduxion Launcher',
  version: '1.0.0'
};
```

**Структура на сервере:**
```
/var/www/html/downloads/
  └── Reduxion-Launcher-Setup.exe
```

**Nginx конфигурация:**
```nginx
location /downloads/ {
    alias /var/www/html/downloads/;
    autoindex off;
    
    # CORS headers (если нужно)
    add_header Access-Control-Allow-Origin *;
    
    # Правильный MIME type
    types {
        application/x-msdownload exe;
    }
}
```

---

## Сценарий 3: CDN (CloudFlare, AWS CloudFront)

Если используете CDN:

```javascript
const CONFIG = {
  serverUrl: 'https://cdn.reduxion.com/launcher/v1/',
  launcherFileName: 'Reduxion-Launcher-Setup.exe',
  appName: 'Reduxion Launcher',
  version: '1.0.0'
};
```

**Преимущества CDN:**
- ⚡ Быстрая загрузка
- 🌍 Глобальное распределение
- 💪 Высокая надежность

---

## Сценарий 4: Облачное хранилище (Dropbox, Google Drive)

### Google Drive

1. Загрузите файл на Google Drive
2. Сделайте файл доступным по ссылке
3. Получите прямую ссылку:

```javascript
const CONFIG = {
  serverUrl: 'https://drive.google.com/uc?export=download&id=',
  launcherFileName: 'FILE_ID_HERE',  // ID файла из ссылки
  appName: 'Reduxion Launcher',
  version: '1.0.0'
};
```

### Dropbox

```javascript
const CONFIG = {
  serverUrl: 'https://dl.dropboxusercontent.com/s/YOUR_UNIQUE_ID/',
  launcherFileName: 'Reduxion-Launcher-Setup.exe',
  appName: 'Reduxion Launcher',
  version: '1.0.0'
};
```

**Примечание:** Замените `www.dropbox.com` на `dl.dropboxusercontent.com`

---

## Сценарий 5: Версионирование

Если хотите поддерживать несколько версий:

```javascript
const CONFIG = {
  serverUrl: 'https://your-domain.com/reduxion/launcher/',
  launcherFileName: 'Reduxion-Launcher-Setup-v1.0.0.exe',  // С версией в имени
  appName: 'Reduxion Launcher',
  version: '1.0.0'
};
```

**Структура на сервере:**
```
/reduxion/launcher/
  ├── Reduxion-Launcher-Setup-v1.0.0.exe
  ├── Reduxion-Launcher-Setup-v1.1.0.exe
  └── Reduxion-Launcher-Setup-v2.0.0.exe
```

---

## Сценарий 6: Динамическое определение последней версии

Добавьте файл `latest.json` на сервер:

**latest.json:**
```json
{
  "version": "1.0.0",
  "fileName": "Reduxion-Launcher-Setup-v1.0.0.exe",
  "fileSize": 524288000,
  "releaseDate": "2025-01-20",
  "changelog": "Новые функции и исправления"
}
```

**Модифицируйте bootstrap-installer-main.js:**
```javascript
const CONFIG = {
  serverUrl: 'https://your-domain.com/reduxion/launcher/',
  latestJsonUrl: 'https://your-domain.com/reduxion/launcher/latest.json',
  appName: 'Reduxion Launcher',
  version: '1.0.0'
};

// Добавьте функцию для получения latest.json
async function getLatestVersion() {
  try {
    const response = await fetch(CONFIG.latestJsonUrl);
    const data = await response.json();
    return data.fileName;
  } catch (error) {
    console.error('Не удалось получить информацию о последней версии:', error);
    return 'Reduxion-Launcher-Setup.exe'; // fallback
  }
}
```

---

## Сценарий 7: Локальный сервер для разработки

Для тестирования без интернета:

```javascript
const CONFIG = {
  serverUrl: 'http://localhost:8000/',
  launcherFileName: 'Reduxion-Launcher-Setup.exe',
  appName: 'Reduxion Launcher',
  version: '1.0.0'
};
```

**Запуск локального сервера:**
```batch
cd Ready-to-Upload
python -m http.server 8000
```

или

```batch
npx http-server -p 8000
```

---

## Кастомизация интерфейса

### Изменение текстов

Отредактируйте `bootstrap-installer.html`:

```html
<!-- Логотип -->
<h1 class="logo">Ваш Бренд</h1>

<!-- Заголовок -->
<h2 class="connection-title">СКАЧИВАНИЕ УСТАНОВЩИКА</h2>

<!-- Статус -->
<p class="status-text loading" id="status-text">ПОДГОТОВКА...</p>
```

### Изменение цветов

Измените CSS переменные:

```html
<style>
    :root {
        --primary-bg: #0A0A0F;        /* Фон */
        --accent-color: #E91E63;      /* Основной цвет */
        --accent-dark: #C2185B;       /* Темный акцент */
        --text-primary: #FFFFFF;      /* Основной текст */
        --text-secondary: #B8B8D0;    /* Вторичный текст */
    }
</style>
```

**Примеры цветовых схем:**

**Синяя:**
```css
--accent-color: #2196F3;
--accent-dark: #1976D2;
```

**Зеленая:**
```css
--accent-color: #4CAF50;
--accent-dark: #388E3C;
```

**Фиолетовая:**
```css
--accent-color: #9C27B0;
--accent-dark: #7B1FA2;
```

---

## Безопасность

### HTTPS обязателен

```javascript
const CONFIG = {
  serverUrl: 'https://your-domain.com/',  // ✅ Безопасно
  // serverUrl: 'http://your-domain.com/', // ❌ Небезопасно
};
```

### Проверка целостности (SHA256)

Добавьте проверку хеша (опционально):

```javascript
const CONFIG = {
  serverUrl: 'https://your-domain.com/reduxion/',
  launcherFileName: 'Reduxion-Launcher-Setup.exe',
  expectedSHA256: 'abc123def456...',  // SHA256 хеш файла
};

// Добавьте функцию проверки после загрузки
const crypto = require('crypto');
const fs = require('fs');

function verifySHA256(filePath, expectedHash) {
  const hash = crypto.createHash('sha256');
  const fileBuffer = fs.readFileSync(filePath);
  hash.update(fileBuffer);
  const calculatedHash = hash.digest('hex');
  return calculatedHash === expectedHash;
}
```

---

## Обработка ошибок

### Добавление retry механизма

```javascript
async function downloadWithRetry(url, dest, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await downloadFile(url, dest);
      return; // Успех
    } catch (error) {
      lastError = error;
      console.log(`Попытка ${i + 1} не удалась, повтор...`);
      
      // Показываем пользователю
      mainWindow.webContents.send('update-progress', {
        statusText: `ПОВТОРНАЯ ПОПЫТКА ${i + 1}/${maxRetries}...`,
        details: 'Проблемы с соединением'
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Ждем 2 сек
    }
  }
  
  throw lastError; // Все попытки провалились
}
```

### Fallback на локальный файл

```javascript
try {
  // Пробуем скачать с сервера
  await downloadFile(onlineUrl, installerPath);
} catch (error) {
  // Fallback на локальный файл
  const localPath = path.join(__dirname, 'Ready-to-Upload', CONFIG.launcherFileName);
  
  if (await fs.pathExists(localPath)) {
    console.log('Используем локальный файл');
    await fs.copy(localPath, installerPath);
  } else {
    throw new Error('Не удалось найти установщик');
  }
}
```

---

## Логирование

Добавьте детальное логирование для отладки:

```javascript
const log = (message) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  
  // Опционально: сохранение в файл
  fs.appendFileSync(
    path.join(os.tmpdir(), 'bootstrap-installer.log'),
    `[${timestamp}] ${message}\n`
  );
};

// Использование
log('Начало загрузки установщика');
log(`URL: ${downloadUrl}`);
log(`Размер: ${totalSize} байт`);
```

---

**Выберите подходящий сценарий и настройте под свои нужды!**
