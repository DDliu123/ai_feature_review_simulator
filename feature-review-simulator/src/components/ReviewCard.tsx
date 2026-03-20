import React, { useState, useRef, useEffect } from 'react';
import { ROLES } from '../lib/roles';
import { api } from '../contexts/AuthContext';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ReviewCardProps {
  sessionId: string;
  result: {
    role: string;
    status: 'pending' | 'generating' | 'completed' | 'error' | 'CHALLENGING' | 'PARTIAL' | 'APPROVED';
    questions: string[];
    error?: string;
    chat?: ChatMessage[];
  };
  onUpdate?: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ sessionId, result, onUpdate }) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const roleInfo = ROLES.find(r => r.key === result.role);
  const status = result.status;
  
  // 统一状态显示
  const getStatusLabel = () => {
    switch (status) {
      case 'CHALLENGING':
      case 'generating':
        return { text: '质疑中', color: 'bg-orange-100 text-orange-800', border: 'border-orange-200' };
      case 'PARTIAL':
        return { text: '部分认可', color: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-200' };
      case 'APPROVED':
      case 'completed':
        return { text: '已通过', color: 'bg-green-100 text-green-800', border: 'border-green-500' };
      default:
        return { text: '待启动', color: 'bg-gray-100 text-gray-800', border: 'border-gray-200' };
    }
  };

  const statusInfo = getStatusLabel();

  // 自动滚动到最新消息
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result.chat, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || inputText.length > 500) return;

    const message = inputText.trim();
    setInputText('');
    setIsSending(true);
    setIsTyping(true);

    try {
      // 调用后端辩驳接口
      await api.post(`/sessions/${sessionId}/threads/${result.role}/chat`, { message });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to send message', err);
      alert('发送失败，请重试');
    } finally {
      setIsSending(false);
      setIsTyping(false);
    }
  };

  if (!result || status === 'pending') {
    return (
      <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-4">
        <div className="h-4 w-1/3 rounded bg-gray-200"></div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-gray-200"></div>
          <div className="h-3 w-5/6 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  const isApproved = status === 'APPROVED';

  return (
    <div className={`flex flex-col h-[500px] transform-gpu animate-[fadeIn_0.5s_ease-in-out] rounded-lg border bg-white shadow-sm transition-all duration-300 ${statusInfo.border}`}>
      {/* 头部：角色名 + 状态 */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{roleInfo?.emoji}</span>
          <h3 className="font-bold text-gray-900">{roleInfo?.name}</h3>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
      </div>

      {/* 内容区：初始问题 + 对话历史 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 初始评审问题 */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider">初始评审意见</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
            {result.questions.map((q: string, i: number) => (
              <li key={i}>{q.replace(/^- /, '')}</li>
            ))}
          </ul>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-3">辩驳记录</p>
          <div className="space-y-4">
            {result.chat?.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    {msg.role === 'user' ? '👤' : roleInfo?.emoji}
                  </div>
                  <div className={`rounded-lg px-3 py-2 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-800 border border-gray-200'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            
            {/* 打字动画 */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                    {roleInfo?.emoji}
                  </div>
                  <div className="bg-gray-100 rounded-lg px-4 py-3 flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部输入区 */}
      <div className="border-t p-4 bg-gray-50 rounded-b-lg">
        {isApproved ? (
          <div className="flex items-center justify-center gap-2 py-2 text-green-600 font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            该角色已通过审核
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="space-y-2">
            <div className="relative">
              <textarea
                rows={2}
                disabled={isSending || status === 'pending'}
                className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100 resize-none"
                placeholder="输入你的辩驳意见..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <div className={`absolute bottom-2 right-2 text-[10px] ${inputText.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                {inputText.length}/500
              </div>
            </div>
            <div className="flex justify-between items-center">
              {inputText.length > 500 && (
                <span className="text-xs text-red-500 font-medium">超出字数限制！</span>
              ) || <span />}
              <button
                type="submit"
                disabled={isSending || !inputText.trim() || inputText.length > 500 || status === 'pending'}
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {isSending ? '发送中...' : '发送'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
