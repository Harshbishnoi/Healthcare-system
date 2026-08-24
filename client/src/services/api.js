import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('docpulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Extract data payload and handle 401 unauthenticated redirects
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    const details = error.response?.data?.details || null;

    if (status === 401) {
      // Clear token if expired/invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && !currentPath.startsWith('/register')) {
        localStorage.removeItem('docpulse_token');
        localStorage.removeItem('docpulse_user');
      }
    }

    const enhancedError = new Error(message);
    enhancedError.statusCode = status || 500;
    enhancedError.details = details;
    enhancedError.original = error;

    return Promise.reject(enhancedError);
  }
);

export default api;
