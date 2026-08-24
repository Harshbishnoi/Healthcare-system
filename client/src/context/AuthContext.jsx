import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('docpulse_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('docpulse_token'));
  const [loading, setLoading] = useState(true);

  // Initialize auth check on mount
  useEffect(() => {
    const verifyCurrentUser = async () => {
      const storedToken = localStorage.getItem('docpulse_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();
        if (response.success && response.data?.user) {
          const userData = {
            ...response.data.user,
            profile: response.data.profile,
            availability: response.data.availability,
          };
          setUser(userData);
          localStorage.setItem('docpulse_user', JSON.stringify(userData));
        }
      } catch (err) {
        console.warn('[AuthContext] Session expired or invalid:', err.message);
        localStorage.removeItem('docpulse_token');
        localStorage.removeItem('docpulse_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyCurrentUser();
  }, []);

  const handleAuthSuccess = (authData) => {
    const { user: u, profile, doctorProfile, token: t } = authData;
    const combinedUser = {
      ...u,
      profile: profile || doctorProfile,
    };

    setUser(combinedUser);
    setToken(t);
    localStorage.setItem('docpulse_token', t);
    localStorage.setItem('docpulse_user', JSON.stringify(combinedUser));
    return combinedUser;
  };

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    if (response.success && response.data) {
      return handleAuthSuccess(response.data);
    }
    throw new Error(response.message || 'Login failed');
  };

  const registerPatient = async (data) => {
    const response = await authService.registerPatient(data);
    if (response.success && response.data) {
      return handleAuthSuccess(response.data);
    }
    throw new Error(response.message || 'Patient registration failed');
  };

  const registerDoctor = async (data) => {
    const response = await authService.registerDoctor(data);
    if (response.success && response.data) {
      return handleAuthSuccess(response.data);
    }
    throw new Error(response.message || 'Doctor registration failed');
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  };

  const updateUserData = (updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('docpulse_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        isDoctor: user?.role === 'doctor',
        isPatient: user?.role === 'patient',
        login,
        registerPatient,
        registerDoctor,
        logout,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
