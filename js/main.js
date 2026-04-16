// 1. ЗАГРУЗКА: Сначала смотрим в projects.json, если пусто - в память браузера
let projects = [];

const grid = document.querySelector('.grid');
const modal = document.getElementById('universalModal');
const resizableModal = document.getElementById('resizableModal');

// Загружаем проекты из projects.json
async function loadProjects() {
    try {
        const response = await fetch('./projects.json');
        if (response.ok) {
            projects = await response.json();
        } else {
            // Если projects.json не найден, загружаем из localStorage
            projects = JSON.parse(localStorage.getItem('my_projects')) || [];
        }
    } catch {
        // Если ошибка (оффлайн), используем localStorage
        projects = JSON.parse(localStorage.getItem('my_projects')) || [];
    }
    initGallery();
}

// Загружаем при загрузке страницы
loadProjects();

// 2. ФУНКЦИЯ ОТРИСОВКИ
function initGallery() {
    grid.innerHTML = '';
    
    if (projects.length === 0) {
        grid.innerHTML = '<p style="color: gray;">Тут пока пусто. Загрузи что-нибудь из админки!</p>';
    }

    projects.forEach((proj, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        
        const media = proj.type === 'video' 
            ? `<video src="${proj.link}#t=0.1" muted loop playsinline style="width:100%; height:200px; object-fit:cover;"></video>`
            : `<img src="${proj.link}" loading="lazy" style="width:100%; height:200px; object-fit:cover;">`;

        card.innerHTML = `
            ${media}
            <div style="padding: 10px;">
                <h4 style="margin:0; font-size: 16px;">${proj.name}</h4>
                <button onclick="deleteProject(${index})" style="background:none; border:none; color:red; cursor:pointer; font-size:12px; padding:0; margin-top:5px;">Удалить</button>
            </div>
        `;

        if (proj.type === 'video') {
            const v = card.querySelector('video');
            card.onmouseenter = () => v.play();
            card.onmouseleave = () => { v.pause(); v.currentTime = 0; };
        }

        // Клик по карточке открывает модалку (но не если нажат Удалить)
        card.onclick = (e) => {
            if(e.target.tagName !== 'BUTTON') openModal(proj);
        };
        grid.appendChild(card);
    });
}

// 3. ФУНКЦИЯ УДАЛЕНИЯ (чтобы можно было чистить список)
window.deleteProject = function(index) {
    if(confirm("Удалить эту работу?")) {
        projects.splice(index, 1);
        
        // Сохраняем в оба места
        localStorage.setItem('my_projects', JSON.stringify(projects));
        
        // Синхронизируем с projects.json через сервер
        fetch('/.netlify/functions/save-projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projects)
        }).catch(() => {
            console.warn('Не удалось синхронизировать с сервером');
        });
        
        initGallery();
    }
};

// 4. ЛОГИКА МОДАЛКИ (Ресайз)
function openModal(proj) {
    const container = document.getElementById('modalMediaContainer');
    container.innerHTML = '';
    document.getElementById('modalTitle').textContent = proj.name;
    document.getElementById('modalDesc').textContent = proj.desc || '';

    if (proj.type === 'video') {
        const v = document.createElement('video');
        v.src = proj.link; v.controls = true; v.autoplay = true;
        v.style.width = "100%"; v.style.height = "100%";
        container.appendChild(v);
    } else {
        const img = document.createElement('img');
        img.src = proj.link;
        img.style.width = "100%"; img.style.height = "100%"; img.style.objectFit = "contain";
        container.appendChild(img);
    }

    modal.style.display = 'block';
    
    // Фиксируем позицию окна по центру при открытии
    resizableModal.style.width = "600px";
    resizableModal.style.height = "400px";
    resizableModal.style.left = "50%";
    resizableModal.style.top = "50%";
    resizableModal.style.transform = "translate(-50%, -50%)";
}

// Закрытие
document.querySelector('.close-modal').onclick = () => modal.style.display = 'none';

// 5. РЕСАЙЗ (Тянем за край)
const resizer = document.querySelector('.modal-resizer-fancy');
resizer.addEventListener('mousedown', (e) => {
    e.preventDefault();
    // При начале ресайза убираем transform, чтобы окно не "прыгало"
    const rect = resizableModal.getBoundingClientRect();
    resizableModal.style.transform = "none";
    resizableModal.style.left = rect.left + "px";
    resizableModal.style.top = rect.top + "px";
    
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
});

function resize(e) {
    const rect = resizableModal.getBoundingClientRect();
    const width = e.clientX - rect.left;
    const height = e.clientY - rect.top;

    if (width > 300) resizableModal.style.width = width + 'px';
    if (height > 200) resizableModal.style.height = height + 'px';
}

function stopResize() {
    window.removeEventListener('mousemove', resize);
}

window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

// ЗАПУСК
initGallery();
// Находим форму и поля
const uploadForm = document.getElementById('uploadForm');

uploadForm.onsubmit = (e) => {
    e.preventDefault();

    const file = document.getElementById('vFile').files[0];
    const title = document.getElementById('vTitle').value;
    const desc = document.getElementById('vDesc').value;

    if (!file) return;

    // Читаем файл (превращаем в строку, чтобы сохранить в браузере)
    const reader = new FileReader();
    reader.onload = function(event) {
        const newProject = {
            name: title,
            desc: desc,
            type: file.type.includes('video') ? 'video' : 'image',
            link: event.target.result // Это временный URL файла
        };

        // 1. Берем то, что уже есть в памяти
        let projects = JSON.parse(localStorage.getItem('my_projects')) || [];
        
        // 2. Добавляем новую работу в начало списка
        projects.unshift(newProject);
        
        // 3. Сохраняем обновленный список обратно в память
        localStorage.setItem('my_projects', JSON.stringify(projects));

        alert('Работа успешно добавлена!');
        
        // 4. Переходим на главную, чтобы увидеть результат
        window.location.href = 'index.html'; 
    };

    reader.readAsDataURL(file);
};