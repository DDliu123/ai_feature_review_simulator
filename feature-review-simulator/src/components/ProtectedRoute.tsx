import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">加载中...</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
