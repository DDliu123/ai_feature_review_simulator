import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { verifyToken } from '../utils/jwt';

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export function authMiddleware(req: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) {
  console.log(`[authMiddleware] Incoming request: ${req.method} ${req.url}`);
  let token: string | undefined;

  // 1. 尝试从 Authorization Header 获取
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. 如果 Header 中没有，尝试从 Query Parameter 获取 (用于 SSE)
  if (!token && (req.query as any).token) {
    token = (req.query as any).token;
  }

  if (!token) {
    return reply.code(401).send({ message: '未提供认证令牌' });
  }

  const decoded = verifyToken<JwtPayload>(token);

  if (!decoded) {
    return reply.code(401).send({ message: '无效或已过期的令牌' });
  }

  req.user = { userId: decoded.userId };
  done();
}
