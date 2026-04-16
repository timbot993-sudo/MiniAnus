const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();

// Настройки: разрешаем принимать большие файлы (картинки/видео)
app.use(cors());
app.use(express.json({ limit: '100mb' }));

app.post('/save', (req, res) => {
    const projectsData = req.body;
    
    // Путь к файлу projects.json
    const filePath = path.join(__dirname, 'projects.json');

    // Записываем данные в файл
    fs.writeFile(filePath, JSON.stringify(projectsData, null, 2), (err) => {
        if (err) {
            console.error('Ошибка при записи файла:', err);
            return res.status(500).send('Ошибка сервера при сохранении');
        }
        console.log('--- Файл projects.json успешно обновлен! ---');
        res.send('Данные успешно сохранены на ноут');
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Сервер записи запущен!`);
    console.log(`🚀 Адрес: http://localhost:${PORT}`);
    console.log(`📁 Файл для записи: ${path.join(__dirname, 'projects.json')}`);
    console.log(`⚠️  Не закрывай это окно консоли, пока работаешь в админке.`);
});