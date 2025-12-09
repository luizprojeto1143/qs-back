const getHeaders = () => {
    const token = localStorage.getItem('token');
    const companyId = localStorage.getItem('selectedCompanyId');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (companyId) {
        headers['x-company-id'] = companyId;
    }

    return headers;
};

const handleResponse = async (response: Response) => {
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Sessão expirada');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`);
    }

    return { data, status: response.status };
};

const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, backoff = 1000) => {
    try {
        const response = await fetchWithTimeout(url, options);
        // Retry on 5xx server errors
        if (response.status >= 500 && retries > 0) {
            throw new Error(`Server Error ${response.status}`);
        }
        return response;
    } catch (error: any) {
        if (retries > 0) {
            console.warn(`Retrying request to ${url}... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw error;
    }
};

export const api = {
    get: async (endpoint: string) => {
        const response = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    post: async (endpoint: string, body: any, customHeaders: any = {}) => {
        const headers = getHeaders();

        if (body instanceof FormData) {
            delete (headers as any)['Content-Type'];
        }

        const response = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { ...headers, ...customHeaders },
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
        return handleResponse(response);
    },

    put: async (endpoint: string, body: any, customHeaders: any = {}) => {
        const headers = getHeaders();

        if (body instanceof FormData) {
            delete (headers as any)['Content-Type'];
        }

        const response = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { ...headers, ...customHeaders },
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
        return handleResponse(response);
    },

    delete: async (endpoint: string) => {
        const response = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(response);
    }
};
