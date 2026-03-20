import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  verify: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Axios 实例
export const api = axios.create({
  baseURL: '/api', // 回退到相对路径，通过 Vite 代理
});

// 添加请求日志拦截器
api.interceptors.request.use((config) => {
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, (error) => {
  console.error('[API Request Error]', error);
  return Promise.reject(error);
});

// 添加响应日志拦截器
api.interceptors.response.use((response) => {
  console.log(`[API Response] ${response.status} ${response.config.url}`);
  return response;
}, (error) => {
  console.error('[API Response Error]', error.response?.status, error.config?.url, error.message);
  return Promise.reject(error);
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时尝试刷新 token 或获取用户信息
  useEffect(() => {
    const initAuth = async () => {
      try {
        const rfToken = localStorage.getItem('refreshToken');
        if (rfToken) {
          await refresh();
        }
      } catch (err) {
        console.error('Auth initialization failed', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  // Axios 拦截器：自动注入 Bearer Token
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    // 响应拦截器：处理 401 自动刷新
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newAccessToken = await refresh();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            logout();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken]);

  const refresh = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');

    const res = await axios.post('/api/auth/refresh', { refreshToken });
    const { accessToken: newAccessToken } = res.data;
    setAccessToken(newAccessToken);
    
    // 获取用户信息
    const userRes = await axios.get('/api/users/me', {
      headers: { Authorization: `Bearer ${newAccessToken}` }
    });
    setUser(userRes.data);
    
    return newAccessToken;
  };

  const register = async (email: string, password: string) => {
    await api.post('/auth/register', { email, password });
  };

  const verify = async (email: string, code: string) => {
    const res = await api.post('/auth/verify', { email, code });
    const { accessToken: at, refreshToken: rt } = res.data;
    setAccessToken(at);
    localStorage.setItem('refreshToken', rt);
    
    const userRes = await api.get('/users/me', {
      headers: { Authorization: `Bearer ${at}` }
    });
    setUser(userRes.data);
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken: at, refreshToken: rt } = res.data;
    setAccessToken(at);
    localStorage.setItem('refreshToken', rt);
    
    const userRes = await api.get('/users/me', {
      headers: { Authorization: `Bearer ${at}` }
    });
    setUser(userRes.data);
  };

  const logout = async () => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) {
      try {
        await api.post('/auth/logout', { refreshToken: rt });
      } catch (err) {
        console.error('Logout API failed', err);
      }
    }
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, verify, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
