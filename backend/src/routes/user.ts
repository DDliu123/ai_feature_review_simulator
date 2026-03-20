import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import prisma from '../db';

export default async function userRoutes(server: FastifyInstance) {
  server.get(
    '/me',
    {
      preHandler: [authMiddleware],
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({ message: '未授权' });
      }

      const user = await prisma.user.findUnique({
        where: { id: request.user.userId },
        select: { id: true, email: true, isVerified: true, createdAt: true },
      });

      if (!user) {
        return reply.code(404).send({ message: '用户不存在' });
      }

      return reply.code(200).send(user);
    }
  );
}
