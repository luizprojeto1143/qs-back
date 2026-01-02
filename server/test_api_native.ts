import http from 'http';

function request(options: http.RequestOptions, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function main() {
    // 1. Login
    console.log('Logging in...');
    const loginData = await request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/login',
        method: 'POST',
        // This will be done after I view the file content.
        // Placeholder for now.-Type': 'application/json' }
    }, { email: 'master@qs.com', password: '123456' });

    if (!loginData.token) {
        console.error('Login failed:', loginData);
        return;
    }

    const token = loginData.token;
    console.log('Login successful.');

    // 2. Fetch Companies
    console.log('Fetching companies...');
    const companies = await request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/companies',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('Companies fetched:', companies);
}

main().catch(console.error);
