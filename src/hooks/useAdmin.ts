import { useState, useEffect } from 'react';

const ADMIN_CODE = 'BK42djnlor0é@!';
const ADMIN_STORAGE_KEY = 'gctv-admin';

export const useAdmin = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    setIsAdmin(stored === 'true');
  }, []);

  const login = (code: string): boolean => {
    if (code === ADMIN_CODE) {
      setIsAdmin(true);
      sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
  };

  return { isAdmin, login, logout };
};
