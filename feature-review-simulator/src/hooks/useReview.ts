import { useState, useCallback } from 'react';
import { Role, RoleThread, Question, RoleStatus } from '../types';
import { runReview, summarizeRisks } from '../lib/kimiApi';

type ReviewPhase = 'idle' | 'reviewing' | 'done' | 'error';

interface ReviewState {
  phase: ReviewPhase;
  threads: RoleThread[];
  summary: string;
  error: string | null;
}

interface UseReviewReturn {
  state: ReviewState;
  startReview: (apiKey: string, roles: Role[], docText: string) => Promise<void>;
  resetReview: () => void;
}

/**
 * 评审状态管理 Hook
 */
export function useReview(): UseReviewReturn {
  const [state, setState] = useState<ReviewState>({
    phase: 'idle',
    threads: [],
    summary: '',
    error: null
  });

  /**
   * 开始评审流程
   */
  const startReview = useCallback(async (
    apiKey: string,
    roles: Role[],
    docText: string
  ) => {
    try {
      // 初始化状态
      setState({
        phase: 'reviewing',
        threads: roles.map(role => ({
          role,
          status: 'generating',
          questions: [],
          messages: [],
          roundCount: 0
        })),
        summary: '',
        error: null
      });

      // 运行评审
      const { results, errors } = await runReview(
        apiKey,
        roles,
        docText,
        (role, result) => {
          // 实时更新每个角色的状态
          setState(prev => ({
            ...prev,
            threads: prev.threads.map(thread => {
              if (thread.role === role) {
                // 解析结果中的问题
                const questions = parseQuestionsFromResult(result);
                return {
                  ...thread,
                  status: errors[role] ? 'error' : 'challenging',
                  questions,
                  roundCount: 1
                };
              }
              return thread;
            })
          }));
        }
      );

      // 生成风险总结
      const hasSuccessfulResults = Object.values(results).some(r => r.length > 0);
      if (hasSuccessfulResults) {
        const summary = await summarizeRisks(apiKey, results);
        setState(prev => ({
          ...prev,
          summary,
          phase: 'done'
        }));
      } else {
        // 全部失败
        const errorMsg = Object.values(errors).join('; ');
        setState(prev => ({
          ...prev,
          error: `评审失败: ${errorMsg}`,
          phase: 'error'
        }));
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '评审过程中发生错误',
        phase: 'error'
      }));
    }
  }, []);

  /**
   * 重置评审状态
   */
  const resetReview = useCallback(() => {
    setState({
      phase: 'idle',
      threads: [],
      summary: '',
      error: null
    });
  }, []);

  return {
    state,
    startReview,
    resetReview
  };
}

/**
 * 从 AI 结果中解析问题列表
 */
function parseQuestionsFromResult(result: string): Question[] {
  // 提取以 "- " 开头的行
  const lines = result.split('\n').filter(line => line.trim().startsWith('- '));

  return lines.map((line, index) => ({
    id: `q-${Date.now()}-${index}`,
    text: line.trim().substring(2).trim(), // 移除 "- "
    timestamp: Date.now()
  }));
}

/**
 * 更新线程状态
 */
export function updateThreadStatus(
  threads: RoleThread[],
  role: Role,
  status: RoleStatus,
  questions?: Question[]
): RoleThread[] {
  return threads.map(thread => {
    if (thread.role === role) {
      return {
        ...thread,
        status,
        questions: questions || thread.questions,
        roundCount: status === 'challenging' ? thread.roundCount + 1 : thread.roundCount
      };
    }
    return thread;
  });
}

/**
 * 获取线程状态统计
 */
export function getThreadStats(threads: RoleThread[]) {
  const total = threads.length;
  const approved = threads.filter(t => t.status === 'approved').length;
  const challenging = threads.filter(t => t.status === 'challenging').length;
  const partial = threads.filter(t => t.status === 'partial').length;
  const generating = threads.filter(t => t.status === 'generating').length;
  const error = threads.filter(t => t.status === 'error').length;

  return {
    total,
    approved,
    challenging,
    partial,
    generating,
    error,
    progress: total > 0 ? Math.round(((approved + partial + challenging + error) / total) * 100) : 0
  };
}