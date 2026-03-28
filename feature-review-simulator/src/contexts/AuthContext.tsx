import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (_email: string, _password: string) => Promise<void>;
  register: (_email: string, _password: string) => Promise<void>;
  verify: (_email: string, _code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const LOCAL_USER: User = {
  id: 'local-demo-user',
  email: '本地访客',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(LOCAL_USER);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/users/me');
        if (res.data?.id && res.data?.email) {
          setUser({ id: res.data.id, email: res.data.email });
        } else {
          setUser(LOCAL_USER);
        }
      } catch {
        setUser(LOCAL_USER);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const noopAsync = async () => {};

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: null,
        isLoading,
        login: noopAsync,
        register: noopAsync,
        verify: noopAsync,
        logout: noopAsync,
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
