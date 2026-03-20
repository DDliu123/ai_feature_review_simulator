import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VerifyPage: React.FC = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const { verify, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // 只取最后一位
    setCode(newCode);

    // 自动聚焦下一格
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fullCode = code.join('');
    
    if (fullCode.length < 6) {
      setError('请输入完整的验证码');
      return;
    }

    setIsLoading(true);
    try {
      await verify(email, fullCode);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || '验证失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      // 后端逻辑中注册会发送验证码，直接复用注册逻辑
      await register(email, ''); // 密码由于是重发，后端逻辑可能需要调整或直接提供重发接口，此处简化处理
      setTimer(60);
      setError('验证码已重发');
    } catch (err: any) {
      setError('重发失败，请重试');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">验证码</h2>
          <p className="mt-2 text-sm text-gray-600">验证码已发送至 {email}</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className={`rounded-md p-4 text-sm ${error.includes('重发') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {error}
            </div>
          )}
          
          <div className="flex justify-between gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                required
                className="h-12 w-12 rounded-lg border border-gray-300 text-center text-xl font-bold shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
              />
            ))}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
            >
              {isLoading ? '验证中...' : '提交验证'}
            </button>
          </div>
          
          <div className="text-center text-sm">
            <button
              type="button"
              disabled={timer > 0}
              onClick={handleResend}
              className={`font-medium ${timer > 0 ? 'text-gray-400' : 'text-indigo-600 hover:text-indigo-500'}`}
            >
              {timer > 0 ? `${timer} 秒后可重新发送` : '重新发送验证码'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyPage;
