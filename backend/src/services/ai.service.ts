import OpenAI from 'openai';
import { SUMMARIZE_PROMPT } from '../lib/roles';
import { getDefaultAIConfig, getUserAIConfig } from '../lib/aiConfig';

interface AIConfig {
  baseURL: string;
  apiKey: string;
}

const clientCache = new Map<string, OpenAI>();
const MODEL_NAME = process.env.KIMI_MODEL || 'moonshot-v1-8k';

function resolveAIConfig(userId?: string): AIConfig {
  const config = userId ? getUserAIConfig(userId) : getDefaultAIConfig();
  return {
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  };
}

function getOpenAIClient(userId?: string): OpenAI {
  const config = resolveAIConfig(userId);
  if (!config.apiKey) {
    throw new Error('API key is not configured');
  }

  const cacheKey = `${config.baseURL}::${config.apiKey}`;
  let client = clientCache.get(cacheKey);
  if (!client) {
    client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    clientCache.set(cacheKey, client);
  }

  return client;
}

export async function callKimiAPI(
  model: string,
  messages: Array<{ role: string; content: string }>,
  max_tokens: number = 8000,
  temperature: number = 0.7,
  stream: boolean = false,
  userId?: string
): Promise<any> {
  try {
    const openai = getOpenAIClient(userId);
    return await openai.chat.completions.create({
      model,
      messages: messages as any,
      max_tokens,
      temperature,
      stream,
    });
  } catch (error) {
    console.error('Kimi API call failed:', error);
    throw error;
  }
}

export async function generateReviewForRole(
  systemPrompt: string,
  documentText: string,
  userId?: string
): Promise<string[]> {
  try {
    const openai = getOpenAIClient(userId);
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `以下是产品需求文档内容：\n\n---\n${documentText}\n---\n\n请基于你的角色提出关键质疑点。`,
        },
      ],
      temperature: 0.3,
    });

    const responseText = completion.choices[0].message.content || '';
    return responseText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-'));
  } catch (error) {
    console.error('Kimi role review failed:', error);
    throw new Error('Failed to generate review from AI model');
  }
}

export async function summarizeRisks(
  allQuestions: { role: string; questions: string[] }[],
  userId?: string
): Promise<string> {
  const formattedQuestions = allQuestions
    .map((item) => `角色：${item.role}\n问题：\n${item.questions.join('\n')}`)
    .join('\n\n---\n\n');

  try {
    const openai = getOpenAIClient(userId);
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: SUMMARIZE_PROMPT },
        {
          role: 'user',
          content: `以下是所有评审角色提出的问题：\n\n---\n${formattedQuestions}\n---\n\n请总结核心风险。`,
        },
      ],
      temperature: 0.3,
    });

    return completion.choices[0].message.content || '';
  } catch (error) {
    console.error('Kimi summarization failed:', error);
    throw new Error('Failed to summarize risks from AI model');
  }
}

export async function generateChatResponse(
  systemPrompt: string,
  documentText: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  userId?: string
): Promise<{ content: string; status: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content:
        `以下是产品需求文档内容：\n\n---\n${documentText}\n---\n\n` +
        '请与用户进行辩驳式澄清。若完全通过，请在结尾加入 [STATUS: APPROVED]；' +
        '若部分通过，请加入 [STATUS: PARTIAL]；否则加入 [STATUS: CHALLENGING]。',
    },
    ...history,
  ];

  try {
    const openai = getOpenAIClient(userId);
    const completion = await openai.chat.completions.create({
      model: MODEL_NAME,
      messages,
      temperature: 0.3,
    });

    const responseText = completion.choices[0].message.content || '';
    let status = 'CHALLENGING';
    if (responseText.includes('[STATUS: APPROVED]')) status = 'APPROVED';
    else if (responseText.includes('[STATUS: PARTIAL]')) status = 'PARTIAL';

    const cleanContent = responseText.replace(/\[STATUS: .*\]/g, '').trim();
    return { content: cleanContent, status };
  } catch (error) {
    console.error('Kimi chat failed:', error);
    throw new Error('Failed to generate chat response from AI model');
  }
}
