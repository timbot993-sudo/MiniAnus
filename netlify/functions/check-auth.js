const crypto = require('crypto');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { password } = JSON.parse(event.body);
        
        if (!password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Password required' })
            };
        }

        // Хешируем введенный пароль
        const passwordHash = crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');

        // Сравниваем с хешем из переменных окружения
        const correctHash = process.env.ADMIN_PASSWORD_HASH;

        if (!correctHash) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Admin password not configured on server' })
            };
        }

        const isValid = passwordHash === correctHash;

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: isValid,
                message: isValid ? 'Access granted' : 'Invalid password'
            })
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: error.message })
        };
    }
};
