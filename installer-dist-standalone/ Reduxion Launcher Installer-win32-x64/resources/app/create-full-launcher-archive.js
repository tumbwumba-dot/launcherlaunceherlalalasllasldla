const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

console.log('Создание архива с готовым лаунчером...');

// Создаем новый архив
const zip = new AdmZip();

// Путь к собранному exe
const launcherExePath = path.join(__dirname, 'launcher-dist', 'ReduxionLauncher.exe');

if (!fs.existsSync(launcherExePath)) {
    console.error('❌ Ошибка: ReduxionLauncher.exe не найден!');
    console.log('Сначала собери лаунчер командой:');
    console.log('npx electron-builder --config electron-builder-launcher.yml');
    process.exit(1);
}

// Добавляем exe в архив
console.log('Добавление файла: ReduxionLauncher.exe');
zip.addLocalFile(launcherExePath);

// Получаем размер exe
const exeSize = fs.statSync(launcherExePath).size;
console.log(`Размер exe: ${(exeSize / 1024 / 1024).toFixed(2)} MB`);

// Сохраняем архив
const outputPath = path.join(__dirname, 'launcher.zip');
zip.writeZip(outputPath);

const zipSize = fs.statSync(outputPath).size;
console.log(`\n✅ Архив создан: ${outputPath}`);
console.log(`📦 Размер архива: ${(zipSize / 1024 / 1024).toFixed(2)} MB`);
console.log('\n📋 Следующие шаги:');
console.log('1. Открой https://github.com/tumbwumba-dot/launcherlaunceherlalalasllasldla/releases/tag/v1.0.0');
console.log('2. Нажми "Edit release"');
console.log('3. Удали старый launcher.zip');
console.log('4. Загрузи новый launcher.zip');
console.log('5. Сохрани изменения');
