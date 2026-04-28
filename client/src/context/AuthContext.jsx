import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../services/authService';
import { onSessionExpired } from '../services/api';
import { useAlert } from './AlertContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlert();

  // Fetch the full user profile from the server and store in state.
  // Called on mount (token exists) and after profile updates.
  const refreshUser = useCallback(async () => {
    try {
      const res = await getMe();
      setUser(res.data.data.user);
    } catch {
      // Invalid / expired token — clear it
      localStorage.removeItem('token');
      setUser(null);
    }
  }, []);

  // On first load, restore session if a token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  /**
   * Call after a successful login / register response.
   * Stores the JWT and fetches the full user profile so
   * all fields (weight, height, goal, age …) are available in context.
   */
  const loginUser = async (token) => {
    localStorage.setItem('token', token);
    await refreshUser();
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Listen for session expiry from API interceptor
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      logoutUser();
      showAlert('error', 'Session expired, please login again');
    });

    return unsubscribe;
  }, [showAlert]);

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
