import fetch from 'node-fetch';

async function main() {
    const API_URL = 'http://localhost:3001/api';

    // 1. Login
    console.log('Logging in...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'master@qs.com', password: '123456' })
    });

    if (!loginRes.ok) {
        console.error('Login failed:', await loginRes.text());
        return;
    }

    const loginData: any = await loginRes.json();
    const token = loginData.token;
    console.log('Login successful, token obtained.');

    // 2. Fetch Companies
    console.log('Fetching companies...');
    const companiesRes = await fetch(`${API_URL}/companies`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!companiesRes.ok) {
        console.error('Fetch companies failed:', await companiesRes.text());
        return;
    }

    const companies = await companiesRes.json();
    console.log('Companies fetched:', companies);
}

main().catch(console.error);
