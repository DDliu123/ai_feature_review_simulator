import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSSEReview, ReviewState } from '../hooks/useSSEReview';
import { api } from '../contexts/AuthContext';
import ReviewCard from '../components/ReviewCard';

const ReviewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 用于手动刷新会话数据的触发器
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleUpdate = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await api.get(`/sessions/${sessionId}/report`);
      const { reportUrl } = res.data;
      // 自动下载
      const link = document.createElement('a');
      link.href = reportUrl;
      link.setAttribute('download', `评审报告_${sessionData?.document?.filename}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate report', err);
      alert('生成报告失败，请重试');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const fetchSession = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get(`/sessions/${sessionId}`);
      setSessionData(res.data);
    } catch (err) {
      console.error('Failed to fetch session', err);
      setError('无法加载评审会话，请检查网络或刷新重试');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession, refreshTrigger]);

  const { reviewState, summary, isComplete } = useSSEReview(
    sessionData && sessionData.overallStatus === 'IN_PROGRESS' ? sessionId! : ''
  );

  // 合并实时状态和后端持久化状态
  const getFinalState = (): ReviewState => {
    if (!sessionData || !sessionData.threads) return {};
    
    const state: ReviewState = {};
    
    // 首先填充后端已有的数据
    sessionData.threads.forEach((thread: any) => {
      state[thread.roleKey] = {
        role: thread.roleKey,
        status: thread.status,
        questions: thread.messages.questions || [],
        chat: thread.messages.chat || [],
      };
    });

    // 如果正在进行中，用实时数据覆盖（如果实时数据更新）
    if (sessionData.overallStatus === 'IN_PROGRESS') {
      Object.keys(reviewState).forEach(key => {
        state[key] = {
          ...state[key],
          ...reviewState[key],
        };
      });
    }

    return state;
  };

  const finalState = getFinalState();
  const finalSummary = sessionData?.reportUrl || summary;
  
  // 检查是否所有角色都已通过
  const allApproved = sessionData?.threads && sessionData.threads.length > 0 && 
    sessionData.threads.every((t: any) => t.status === 'APPROVED');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">正在加载评审会话...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center p-6 bg-white rounded-xl shadow-lg border border-red-100 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-3xl">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900">出错了</h2>
          <p className="text-gray-600">{error}</p>
          <div className="flex gap-4 mt-2">
            <Link to="/dashboard" className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">返回首页</Link>
            <button onClick={() => fetchSession()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">刷新重试</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 全局通过庆祝动画/横幅 */}
      {allApproved && (
        <div className="sticky top-0 z-50 animate-[slideDown_0.5s_ease-out] bg-green-600 px-4 py-3 text-white shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <p className="font-bold">所有评审官已通过，你的需求方案通过评审！</p>
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="rounded-md bg-white px-4 py-1.5 text-sm font-bold text-green-700 hover:bg-green-50 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
            >
              {isGeneratingReport ? '报告生成中...' : '生成评审报告'}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl p-8">
        <header className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500 transition-colors">
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回首页
          </Link>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">评审详情报告</h1>
              <p className="mt-1 text-gray-500">文档: <span className="font-medium text-gray-700">{sessionData?.document?.filename}</span></p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                sessionData?.overallStatus === 'ALL_PASSED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {sessionData?.overallStatus === 'ALL_PASSED' ? '评审已完成' : '评审进行中'}
              </span>
            </div>
          </div>
        </header>

        {/* 角色卡片网格 */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {sessionData?.rolesSelected.map((roleKey: string) => (
            <ReviewCard 
              key={roleKey} 
              sessionId={sessionId!} 
              result={finalState[roleKey] || { role: roleKey, status: 'pending', questions: [] }} 
              onUpdate={handleUpdate}
            />
          ))}
        </div>

        {/* 底部汇总报告 */}
        {(finalSummary || isComplete) && (
          <div className="mt-12 transform-gpu animate-[fadeIn_0.5s_ease-in-out] rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-indigo-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">核心风险汇总</h2>
            </div>
            <div 
              className="prose prose-indigo max-w-none text-gray-700 leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: finalSummary?.replace(/\n/g, '<br />') || '正在生成汇总报告...' }} 
            />
            
            {allApproved && (
              <div className="mt-8 flex justify-center border-t pt-8">
                <button
                  className="rounded-lg bg-indigo-600 px-8 py-3 text-lg font-bold text-white shadow-md hover:bg-indigo-700 transition-all hover:scale-105"
                >
                  进入下一轮迭代
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;
