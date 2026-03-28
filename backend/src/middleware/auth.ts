import { FastifyReply, FastifyRequest } from 'fastify';
import prisma from '../db';
import { verifyToken } from '../utils/jwt';

interface JwtPayload {
  userId: string;
}

const DEMO_USER_ID = 'local-demo-user';
const DEMO_USER_EMAIL = 'local-user@example.com';

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  let token: string | undefined;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  if (!token && (req.query as any).token) {
    token = (req.query as any).token;
  }

  if (token) {
    const decoded = verifyToken<JwtPayload>(token);
    if (decoded?.userId) {
      req.user = { userId: decoded.userId };
      return;
    }
  }

  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: DEMO_USER_EMAIL,
      passwordHash: 'NO_LOGIN_MODE',
      isVerified: true,
    },
  });

  req.user = { userId: demoUser.id };
}
