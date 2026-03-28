import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface RoleResult {
  role: string;
  status: 'pending' | 'generating' | 'completed' | 'error' | 'CHALLENGING' | 'PARTIAL' | 'APPROVED';
  questions: string[];
  error?: string;
  chat?: { role: 'user' | 'assistant', content: string }[];
}

export interface ReviewState {
  [key: string]: RoleResult;
}

export function useSSEReview(sessionId: string) {
  const { accessToken } = useAuth();
  const [reviewState, setReviewState] = useState<ReviewState>({});
  const [summary, setSummary] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    if (!sessionId) return;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = accessToken
        ? `/api/sessions/${sessionId}/stream?token=${accessToken}`
        : `/api/sessions/${sessionId}/stream`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        console.log('SSE connection opened.');
        retryCountRef.current = 0; // 连接成功后重置重试次数
      };

      es.addEventListener('role_start', (e) => {
        const data = JSON.parse(e.data);
        setReviewState(prev => ({ ...prev, [data.role]: { role: data.role, status: 'generating', questions: [] } }));
      });

      es.addEventListener('role_done', (e) => {
        const data = JSON.parse(e.data);
        setReviewState(prev => ({ ...prev, [data.role]: { ...prev[data.role], status: 'completed', questions: data.questions } }));
      });

      es.addEventListener('session_done', (e) => {
        const data = JSON.parse(e.data);
        setSummary(data.summary);
        setIsComplete(true);
        es.close();
      });

      es.addEventListener('error', (e: any) => {
        const data = e.data ? JSON.parse(e.data) : { message: '未知错误' };
        if (data.role) {
          setReviewState(prev => ({ ...prev, [data.role]: { ...prev[data.role], status: 'error', error: data.message } }));
        } else {
          console.error('SSE error:', data.message);
        }
      });

      es.onerror = (err) => {
        console.error('EventSource failed:', err);
        es.close();
        // 尝试重连，指数退避
        if (retryCountRef.current < 3) {
          retryCountRef.current++;
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          console.log(`Reconnecting in ${delay}ms...`);
          setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [sessionId, accessToken]);

  return { reviewState, summary, isComplete };
}
