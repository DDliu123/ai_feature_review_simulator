import { FastifyInstance, FastifyRequest } from 'fastify';
import prisma from '../db';
import { authMiddleware } from '../middleware/auth';
import { getUserAIConfig, setUserAIConfig, validateAIConfig } from '../lib/aiConfig';

export default async function userRoutes(server: FastifyInstance) {
  server.get(
    '/me',
    {
      preHandler: [authMiddleware],
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        select: { id: true, email: true, isVerified: true, createdAt: true },
      });

      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      return reply.code(200).send(user);
    }
  );

  server.get(
    '/ai-config',
    {
      preHandler: [authMiddleware],
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }

      const config = getUserAIConfig(request.user.userId);
      return reply.code(200).send(config);
    }
  );

  server.put(
    '/ai-config',
    {
      preHandler: [authMiddleware],
    },
    async (
      request: FastifyRequest<{ Body: { baseURL?: string; apiKey?: string } }>,
      reply
    ) => {
      if (!request.user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }

      const payload = {
        baseURL: request.body?.baseURL || '',
        apiKey: request.body?.apiKey || '',
      };

      const validationError = validateAIConfig(payload);
      if (validationError) {
        return reply.code(400).send({ message: validationError });
      }

      setUserAIConfig(request.user.userId, payload);
      return reply.code(200).send(getUserAIConfig(request.user.userId));
    }
  );
}
