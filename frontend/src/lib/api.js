import axios from 'axios';

const _base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE_URL = _base.endsWith('/api') ? _base : _base.replace(/\/?$/, '') + '/api';
/** Backend origin for full URLs (e.g. Google OAuth redirect) */
export const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '') || 'http://localhost:5000';

let onAuthFailure = () => {};

export function setAuthFailureCallback(callback) {
  onAuthFailure = callback || (() => {});
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      onAuthFailure();
    }
    return Promise.reject(err);
  }
);

