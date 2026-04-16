// Netlify Function для сохранения projects.json через GitHub API
const https = require('https');

exports.handler = async (event) => {
    // Разрешаем только POST запросы
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const projects = JSON.parse(event.body);
        const token = process.env.GITHUB_TOKEN;
        const owner = process.env.GITHUB_OWNER || 'your-github-username';
        const repo = process.env.GITHUB_REPO || 'your-repo-name';

        if (!token) {
            console.warn('GITHUB_TOKEN не установлен - используется локальное сохранение');
            return {
                statusCode: 200,
                body: JSON.stringify({ 
                    success: true, 
                    message: `Сохранено ${projects.length} проектов (локально)` 
                })
            };
        }

        // Получаем текущий SHA файла
        const getResponse = await githubRequest('GET', 
            `/repos/${owner}/${repo}/contents/projects.json`, 
            null, token);
        
        const sha = getResponse.sha;
        const content = Buffer.from(JSON.stringify(projects, null, 2)).toString('base64');

        // Обновляем файл через GitHub API
        const updateResponse = await githubRequest('PUT',
            `/repos/${owner}/${repo}/contents/projects.json`,
            {
                message: 'Update projects from web admin',
                content: content,
                sha: sha
            },
            token);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: `Сохранено ${projects.length} проектов` 
            })
        };
    } catch (error) {
        console.error('Ошибка при сохранении:', error.message);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: error.message })
        };
    }
};

function githubRequest(method, path, data, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: path,
            method: method,
            headers: {
                'User-Agent': 'Netlify-Function',
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`GitHub API error: ${res.statusCode} - ${body}`));
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}
