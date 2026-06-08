import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

/**
 * Centered Axios instance configured with baseline URL and cross-origin cookies (HttpOnly refresh).
 */
export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});
