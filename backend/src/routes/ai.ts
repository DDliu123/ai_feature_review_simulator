import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { callKimiAPI } from '../services/ai.service';

/**
 * Kimi API 代理路由
 * 前端通过此路由调用 Kimi API，避免暴露 API Key
 */
export default async function aiRoutes(server: FastifyInstance) {
  // 代理聊天完成请求
  server.post('/chat/completions', async (
    request: FastifyRequest<{
      Body: {
        model: string;
        messages: Array<{ role: string; content: string }>;
        max_tokens?: number;
        temperature?: number;
        stream?: boolean;
      };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { model, messages, max_tokens = 8000, temperature = 0.7, stream = false } = request.body;

      // 调用 Kimi API
      const result = await callKimiAPI(model, messages, max_tokens, temperature, stream);

      return reply.code(200).send(result);
    } catch (error: any) {
      console.error('Kimi API proxy error:', error);

      // 根据错误类型返回相应的HTTP状态码
      if (error.status === 401) {
        return reply.code(401).send({
          error: {
            message: 'API Key 无效',
            type: 'invalid_authentication_error'
          }
        });
      } else if (error.status === 429) {
        return reply.code(429).send({
          error: {
            message: '请求过于频繁，请稍后重试',
            type: 'rate_limit_error'
          }
        });
      }

      return reply.code(500).send({
        error: {
          message: 'AI 服务暂时不可用',
          type: 'service_unavailable'
        }
      });
    }
  });
}