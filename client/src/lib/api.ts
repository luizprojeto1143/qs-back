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
    // Ignore 401 for login endpoint to allow "Invalid credentials" message
    if (response.status === 401 && !response.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Dispatch event instead of hard reload to allow React to handle it
        window.dispatchEvent(new Event('auth:logout'));
        window.location.href = '/login'; // Fallback
        throw new Error('Sessão expirada');
    }

    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        console.error('Failed to parse JSON response:', text);
        throw new Error('Invalid JSON response from server');
    }

    if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`);
    }

    return { data, status: response.status };
};

// Use explicit env var or fallback
const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;
console.log('API BASE_URL:', BASE_URL); // Debugging

const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 30000) => { // Increased timeout
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
        // Retry on 5xx server errors, but not 500 (Internal Server Error) as it might be logic error
        // Retry on 502, 503, 504 (Gateway/Service Unavailable)
        if ([502, 503, 504].includes(response.status) && retries > 0) {
            throw new Error(`Server Error ${response.status}`);
        }
        return response;
    } catch (error) {
        if (retries > 0 && error instanceof Error && (error.name === 'AbortError' || error.message.includes('Server Error'))) {
            // console.warn(`Retrying request to ${url}... (${retries} attempts left)`);
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

    post: async (endpoint: string, body: unknown, customHeaders: Record<string, string> = {}) => {
        const headers = getHeaders() as Record<string, string>;

        const isFormData = body instanceof FormData;
        if (isFormData) {
            delete headers['Content-Type'];
        }

        const response = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { ...headers, ...customHeaders },
            body: isFormData ? body : JSON.stringify(body),
        });
        return handleResponse(response);
    },

    put: async (endpoint: string, body: unknown, customHeaders: Record<string, string> = {}) => {
        const headers = getHeaders() as Record<string, string>;

        const isFormData = body instanceof FormData;
        if (isFormData) {
            delete headers['Content-Type'];
        }

        const response = await fetchWithRetry(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { ...headers, ...customHeaders },
            body: isFormData ? body : JSON.stringify(body),
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
