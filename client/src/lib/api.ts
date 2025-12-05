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
        // Handle unauthorized (e.g., redirect to login)
        // window.location.href = '/login';
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API Error');
    }

    return { data, status: response.status };
};

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
    get: async (endpoint: string) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    post: async (endpoint: string, body: any, customHeaders: any = {}) => {
        const headers = getHeaders();

        // If body is FormData, remove Content-Type to let browser set it with boundary
        if (body instanceof FormData) {
            delete (headers as any)['Content-Type'];
        }

        const response = await fetch(`${BASE_URL}${endpoint}`, {
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

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { ...headers, ...customHeaders },
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
        return handleResponse(response);
    },

    delete: async (endpoint: string) => {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return handleResponse(response);
    }
};
