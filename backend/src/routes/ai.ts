import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { callKimiAPI } from '../services/ai.service';
import { verifyToken } from '../utils/jwt';

interface JwtPayload {
  userId: string;
}

function resolveUserIdFromRequest(request: FastifyRequest): string | undefined {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return undefined;

  const token = authHeader.slice('Bearer '.length);
  const decoded = verifyToken<JwtPayload>(token);
  return decoded?.userId;
}

export default async function aiRoutes(server: FastifyInstance) {
  server.post(
    '/chat/completions',
    async (
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
        const userId = resolveUserIdFromRequest(request);
        const result = await callKimiAPI(model, messages, max_tokens, temperature, stream, userId);
        return reply.code(200).send(result);
      } catch (error: any) {
        console.error('Kimi API proxy error:', error);

        if (error.status === 401) {
          return reply.code(401).send({
            error: {
              message: 'API Key invalid',
              type: 'invalid_authentication_error',
            },
          });
        }
        if (error.status === 429) {
          return reply.code(429).send({
            error: {
              message: 'Rate limit exceeded',
              type: 'rate_limit_error',
            },
          });
        }

        return reply.code(500).send({
          error: {
            message: 'AI service unavailable',
            type: 'service_unavailable',
          },
        });
      }
    }
  );
}
