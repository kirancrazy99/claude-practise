import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);

  const register = useCallback(async (email, password) => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    const { accessToken: token } = await res.json();
    setAccessToken(token);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    setAccessToken(null);
  }, []);

  const refreshToken = useCallback(async () => {
    const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!res.ok) { setAccessToken(null); return; }
    const { accessToken: token } = await res.json();
    setAccessToken(token);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, register, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
