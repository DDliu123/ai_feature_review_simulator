import { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ApiKeyInputProps {
  value: string;
  onChange: (value: string) => void;
  onTest: (key: string) => Promise<boolean>;
  error?: string;
  disabled?: boolean;
}

export default function ApiKeyInput({ value, onChange, onTest, error, disabled }: ApiKeyInputProps) {
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTest = async () => {
    if (!value.trim()) return;

    setIsTesting(true);
    setTestResult('idle');

    try {
      const isValid = await onTest(value);
      setTestResult(isValid ? 'success' : 'error');
    } catch (error) {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Kimi API Key
      </label>
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Key className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showKey ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="输入您的 Kimi API Key"
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            disabled={disabled}
          >
            {showKey ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </button>
        </div>
        <button
          onClick={handleTest}
          disabled={!value.trim() || isTesting || disabled}
          className="px-4 py-2 bg-secondary hover:bg-secondary-dark disabled:bg-gray-300 text-white text-sm font-medium rounded-md transition-colors flex items-center space-x-2"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>测试中</span>
            </>
          ) : testResult === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>已验证</span>
            </>
          ) : testResult === 'error' ? (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>验证失败</span>
            </>
          ) : (
            <span>验证</span>
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-gray-500">
        您的 API Key 仅用于本次会话，不会被保存到服务器
      </p>
    </div>
  );
}