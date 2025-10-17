import axios from 'axios';

/**
 * Axios instance configured for the FastAPI backend.
 * Adjust the baseURL once the backend endpoint is known.
 */
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
