import axios from 'axios';

// In dev, Vite proxies /api → http://localhost:5000 (vite.config.js).
// In production, set VITE_API_URL to your Render backend, e.g. https://your-api.onrender.com/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  },
  withCredentials: true,
});

// Event listeners for session expiry
const sessionExpiredListeners = new Set();

/**
 * Subscribe to session expiry events.
 * Called when a 401 is received from the server.
 */
export const onSessionExpired = (callback) => {
  sessionExpiredListeners.add(callback);
  return () => sessionExpiredListeners.delete(callback);
};

/**
 * Emit session expiry event to all listeners.
 */
const emitSessionExpired = () => {
  sessionExpiredListeners.forEach((callback) => callback());
};

// Attach JWT token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (expired or invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and emit event for listeners to handle logout
      localStorage.removeItem('token');
      emitSessionExpired();
      
      // Redirect to login after a small delay to allow UI updates
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
    return Promise.reject(error);
  }
);

export default api;
