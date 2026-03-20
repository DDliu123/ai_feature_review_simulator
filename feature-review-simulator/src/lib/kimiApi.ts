import { Role } from '../types';

/**
 * Kimi API 基础配置
 */
const KIMI_API_BASE = '/api';
const MODEL_NAME = 'moonshot-v1-8k';
const MAX_TOKENS = 8000;

/**
 * 调用 Kimi API
 * @param apiKey API 密钥
 * @param systemPrompt 系统提示
 * @param userContent 用户内容
 * @returns AI 回复内容
 */
export async function callKimi(
  apiKey: string,
  systemPrompt: string,
  userContent: string
): Promise<string> {
  try {
    const response = await fetch(`${KIMI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('API Key 无效');
      } else if (response.status === 429) {
        throw new Error('请求过于频繁，请稍后重试');
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from Kimi API');
    }

    return data.choices[0].message.content.trim();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error or API unavailable');
  }
}

/**
 * 运行评审流程
 * @param apiKey API 密钥
 * @param selectedRoles 选中的角色
 * @param docText 文档内容
 * @param onRoleResult 每个角色完成时的回调
 * @returns 所有结果和错误
 */
export async function runReview(
  apiKey: string,
  selectedRoles: Role[],
  docText: string,
  onRoleResult: (role: Role, result: string) => void
): Promise<{ results: Record<Role, string>; errors: Record<Role, string> }> {
  const results: Record<Role, string> = {} as Record<Role, string>;
  const errors: Record<Role, string> = {} as Record<Role, string>;

  // 创建所有角色的请求
  const rolePromises = selectedRoles.map(async (role) => {
    try {
      const systemPrompt = `你是${role === 'user' ? '挑剔用户' : role === 'dev' ? '保守工程师' : role === 'boss' ? 'ROI老板' : '合规律师'}，请基于PRD文档提出5个尖锐的质疑。`;
      const userPrompt = `这是产品需求文档的内容：\n\n---\n${docText}\n---\n\n请根据你的角色定位，提出问题。`;

      const result = await callKimi(apiKey, systemPrompt, userPrompt);
      results[role] = result;

      // 立即调用回调，不等待其他角色
      onRoleResult(role, result);

      return { role, result, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors[role] = errorMessage;

      // 即使是错误也要调用回调
      onRoleResult(role, `Error: ${errorMessage}`);

      return { role, result: '', error: errorMessage };
    }
  });

  // 等待所有请求完成
  await Promise.all(rolePromises);

  return { results, errors };
}

/**
 * 总结风险
 * @param apiKey API 密钥
 * @param allResults 所有角色的结果
 * @returns 核心共性风险总结
 */
export async function summarizeRisks(
  apiKey: string,
  allResults: Record<Role, string>
): Promise<string> {
  try {
    const formattedResults = Object.entries(allResults)
      .map(([role, result]) => `角色：${role}\n意见：\n${result}`)
      .join('\n\n---\n\n');
    const summaryPrompt = `这是所有角色提出的质疑列表：\n\n---\n${formattedResults}\n---\n\n请总结出 3-5 个最核心的风险点。`;
    const systemPrompt = '你是一个经验丰富的产品经理，擅长从多角色反馈中提炼核心风险。请直接、有力地总结关键问题。';

    const result = await callKimi(apiKey, systemPrompt, summaryPrompt);

    // 确保格式正确：每条以"- "开头，20字以内
    const lines = result.split('\n').filter(line => line.trim());
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        return trimmed.slice(0, 22); // 限制20字以内（包括"- "）
      } else if (trimmed) {
        return `- ${trimmed.slice(0, 20)}`; // 添加"- "并限制长度
      }
      return '';
    }).filter(line => line);

    return formattedLines.join('\n');
  } catch (error) {
    console.error('Failed to summarize risks:', error);
    return `- 无法生成风险总结: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * 测试 API 连接
 */
export async function testKimiConnection(apiKey: string): Promise<boolean> {
  try {
    await callKimi(apiKey, 'You are a helpful assistant', 'Hello');
    return true;
  } catch (error) {
    return false;
  }
}