async function syncAll() {
    // 1. Сохраняем локально в браузере (чтобы не пропало сразу)
    localStorage.setItem(storageKey, JSON.stringify(projects));
    
    // 2. Отправляем в облако Netlify (чтобы видели все)
    try {
        const response = await fetch('/.netlify/functions/save-projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projects)
        });
        
        if (response.ok) {
            alert("✅ Успешно опубликовано в облако! Сайт обновится через минуту.");
        } else {
            console.error("Ошибка сохранения на сервере");
        }
    } catch (err) {
        // Если не на Netlify, пробуем сохранить на ноуте (для тестов)
        try {
            await fetch('http://localhost:3000/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projects)
            });
            console.log("Сохранено локально на ноуте");
        } catch (localErr) {
            console.warn("Ни облако, ни локальный сервер недоступны.");
        }
    }
}