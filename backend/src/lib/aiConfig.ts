export interface UserAIConfig {
  baseURL: string;
  apiKey: string;
}

const DEFAULT_BASE_URL = process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1';
const DEFAULT_API_KEY = process.env.KIMI_API_KEY || '';

const userConfigStore = new Map<string, UserAIConfig>();

export function getDefaultAIConfig(): UserAIConfig {
  return {
    baseURL: DEFAULT_BASE_URL,
    apiKey: DEFAULT_API_KEY,
  };
}

export function getUserAIConfig(userId: string): UserAIConfig {
  return userConfigStore.get(userId) || getDefaultAIConfig();
}

export function setUserAIConfig(userId: string, config: UserAIConfig): void {
  userConfigStore.set(userId, {
    baseURL: normalizeBaseURL(config.baseURL),
    apiKey: config.apiKey.trim(),
  });
}

export function normalizeBaseURL(baseURL: string): string {
  const trimmed = baseURL.trim();
  if (!trimmed) return DEFAULT_BASE_URL;
  return trimmed.replace(/\/+$/, '');
}

export function validateAIConfig(config: UserAIConfig): string | null {
  if (!config.baseURL || !config.baseURL.trim()) return 'API URL is required';
  if (!config.apiKey || !config.apiKey.trim()) return 'API Key is required';

  try {
    const parsed = new URL(config.baseURL.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'API URL must start with http:// or https://';
    }
  } catch {
    return 'API URL is invalid';
  }

  return null;
}
