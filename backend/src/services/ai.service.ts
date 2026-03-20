import OpenAI from 'openai';
import { SUMMARIZE_PROMPT } from '../lib/roles';

let openaiInstance: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiInstance) {
    if (!process.env.KIMI_API_KEY) {
      throw new Error('KIMI_API_KEY is not configured in environment variables');
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.KIMI_API_KEY,
      baseURL: 'https://api.moonshot.cn/v1',
    });
  }
  return openaiInstance;
}

/**
 * 直接调用 Kimi API（用于代理前端请求）
 */
export async function callKimiAPI(
  model: string,
  messages: Array<{ role: string; content: string }>,
  max_tokens: number = 8000,
  temperature: number = 0.7,
  stream: boolean = false
): Promise<any> {
  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens,
      temperature,
      stream,
    });

    return completion;
  } catch (error: any) {
    console.error('Kimi API call failed:', error);
    throw error;
  }
}

const MODEL_NAME = 'moonshot-v1-8k';

/**
 * 调用 Kimi API 为单个角色生成评审问题
 */
export async function generateReviewForRole(systemPrompt: string, documentText: string): Promise<string[]> {
  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `这是产品需求文档的内容：\n\n---\n${documentText}\n---\n\n请根据你的角色定位，提出问题。`,
        },
      ],
      temperature: 0.3,
    });

    const responseText = completion.choices[0].message.content || '';

    // 将返回的文本按行分割，并过滤掉空行
    return responseText.split('\n').filter(line => line.trim().startsWith('-'));

  } catch (error) {
    console.error('Kimi API call failed:', error);
    throw new Error('Failed to generate review from AI model');
  }
}

/**
 * 调用 Kimi API 总结所有角色的问题
 */
export async function summarizeRisks(allQuestions: { role: string; questions: string[] }[]): Promise<string> {
  const formattedQuestions = allQuestions
    .map(q => `角色：${q.role}\n问题：\n${q.questions.join('\n')}`)
    .join('\n\n---\n\n');

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: SUMMARIZE_PROMPT },
        {
          role: 'user',
          content: `这是所有角色提出的问题列表：\n\n---\n${formattedQuestions}\n---\n\n请进行总结分析。`,
        },
      ],
      temperature: 0.3,
    });

    return completion.choices[0].message.content || '';

  } catch (error) {
    console.error('Kimi API summarization failed:', error);
    throw new Error('Failed to summarize risks from AI model');
  }
}

/**
 * 调用 Kimi API 进行辩驳对话
 */
export async function generateChatResponse(
  systemPrompt: string, 
  documentText: string, 
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ content: string; status: string }> {
  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `这是产品需求文档的内容：\n\n---\n${documentText}\n---\n\n请基于此文档和你之前的评审意见，与用户进行辩驳。如果你认为用户的解释合理且解决了你提出的风险点，请在回复最后包含 [STATUS: APPROVED]；如果部分解决但仍有疑虑，包含 [STATUS: PARTIAL]；如果仍然存在重大风险，包含 [STATUS: CHALLENGING]。`,
    },
    ...history,
  ];

  try {
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages,
      temperature: 0.3,
    });

    const responseText = completion.choices[0].message.content || '';

    // 提取状态
    let status = 'CHALLENGING';
    if (responseText.includes('[STATUS: APPROVED]')) status = 'APPROVED';
    else if (responseText.includes('[STATUS: PARTIAL]')) status = 'PARTIAL';

    // 清理回复文本中的状态标记
    const cleanContent = responseText.replace(/\[STATUS: .*\]/g, '').trim();

    return { content: cleanContent, status };

  } catch (error) {
    console.error('Kimi API chat failed:', error);
    throw new Error('Failed to generate chat response from AI model');
  }
}
