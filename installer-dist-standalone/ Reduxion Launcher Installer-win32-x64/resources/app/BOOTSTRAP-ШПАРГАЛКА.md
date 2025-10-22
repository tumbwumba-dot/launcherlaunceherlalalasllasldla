# 📝 Bootstrap Установщик - Шпаргалка

## ⚡ Быстрые команды

### Тестирование
```batch
ТЕСТ-BOOTSTRAP.bat
```

### Сборка
```batch
СОЗДАТЬ-NSIS-ВЕБ-УСТАНОВЩИК.bat
```

### NPM команды
```batch
npm run start-bootstrap     # Тест
npm run build-bootstrap     # Сборка
```

---

## 📁 Важные файлы

| Файл | Для чего |
|------|----------|
| `bootstrap-installer-main.js` | Логика, настройка URL |
| `bootstrap-installer.html` | Интерфейс, дизайн |
| `electron-builder-bootstrap.yml` | Конфигурация сборки |
| `BOOTSTRAP-ГОТОВО.md` | Полная инструкция |

---

## 🔧 Быстрая настройка

### 1. Изменить URL сервера
Файл: `bootstrap-installer-main.js`
```javascript
serverUrl: 'https://ВАШ-ДОМЕН.com/путь/'
```

### 2. Изменить цвет
Файл: `bootstrap-installer.html`
```css
--accent-color: #E91E63;  /* Ваш цвет */
```

### 3. Изменить логотип
Файл: `bootstrap-installer.html`
```html
<h1 class="logo">Ваш Бренд</h1>
```

---

## 📦 Результаты сборки

```
bootstrap-dist/
  └── Reduxion-Bootstrap-Setup-1.0.0.exe
```

---

## 🚀 Полный цикл

```batch
# 1. Настроить URL в bootstrap-installer-main.js
# 2. Собрать полный установщик
СОЗДАТЬ-УСТАНОВЩИК-ДЛЯ-ПОЛЬЗОВАТЕЛЕЙ.bat

# 3. Собрать bootstrap
СОЗДАТЬ-NSIS-ВЕБ-УСТАНОВЩИК.bat

# 4. Загрузить полный установщик на сервер
# 5. Раздать bootstrap пользователям
```

---

## 📚 Документация

- `BOOTSTRAP-QUICK-START.md` - Быстрый старт
- `BOOTSTRAP-README.md` - Полное руководство
- `BOOTSTRAP-ARCHITECTURE.md` - Архитектура
- `BOOTSTRAP-CONFIG-EXAMPLES.md` - Примеры
- `BOOTSTRAP-ГОТОВО.md` - Итоги

---

## 🎯 Ключевые преимущества

✅ Красивый Majestic интерфейс  
✅ Детальный прогресс (МБ, %)  
✅ Автоматический запуск  
✅ Полная кастомизация  

---

**Версия: 1.0.0 | Reduxion Team**
