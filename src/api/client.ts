import axios from 'axios';

/**
 * Axios instance configured for the FastAPI backend.
 * Reads from Vite env variable and falls back to local default.
 */
const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ??
    '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
