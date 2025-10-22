const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

console.log('Создание архива launcher.zip...');

// Создаем новый архив
const zip = new AdmZip();

// Файлы, которые нужно включить в архив
const filesToInclude = [
    'modern-launcher.html',
    'package.json',
    'main.js'
    // НЕ включаем node_modules - они будут установлены через npm install
];

// Добавляем файлы в архив
filesToInclude.forEach(item => {
    const itemPath = path.join(__dirname, item);
    
    if (fs.existsSync(itemPath)) {
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
            console.log(`Добавление папки: ${item}`);
            zip.addLocalFolder(itemPath, item);
        } else {
            console.log(`Добавление файла: ${item}`);
            zip.addLocalFile(itemPath);
        }
    } else {
        console.log(`Пропущен (не найден): ${item}`);
    }
});

// Создаем bat-файл для установки и запуска
const installBatContent = `@echo off
echo Installing dependencies...
call npm install
echo.
echo Starting Reduxion Launcher...
npx electron main.js
pause
`;

zip.addFile('install-and-run.bat', Buffer.from(installBatContent, 'utf8'));
console.log('Добавлен: install-and-run.bat');

// Создаем простой bat для запуска после установки
const startBatContent = `@echo off
cd /d "%~dp0"
npx electron main.js
`;

zip.addFile('start-launcher.bat', Buffer.from(startBatContent, 'utf8'));
console.log('Добавлен: start-launcher.bat');

// Сохраняем архив
const outputPath = path.join(__dirname, 'launcher.zip');
zip.writeZip(outputPath);

console.log(`\nАрхив создан: ${outputPath}`);
console.log(`Размер: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
console.log('\nТеперь загрузи этот архив на GitHub Releases:');
console.log('1. Перейди на https://github.com/tumbwumba-dot/launcherlaunceherlalalasllasldla/releases');
console.log('2. Нажми "Create a new release"');
console.log('3. Tag version: v1.0.0');
console.log('4. Загрузи launcher.zip');
console.log('5. Опубликуй релиз');
