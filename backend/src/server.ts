import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import documentRoutes from './routes/document';
import sessionRoutes from './routes/session';
import aiRoutes from './routes/ai';
import rateLimit from '@fastify/rate-limit';


const server = Fastify({
  logger: true,
});

server.register(cors, {
  origin: true, // 允许所有来源，或配置为前端地址
  credentials: true,
});

server.register(multipart);

server.register(rateLimit, {
  max: 100, // 默认每个 IP 每小时最多 100 次请求
  timeWindow: '1 hour',
});

server.register(authRoutes, { prefix: '/api/auth' });
server.register(userRoutes, { prefix: '/api/users' });
server.register(documentRoutes, { prefix: '/api/documents' });
server.register(sessionRoutes, { prefix: '/api/sessions' });
server.register(aiRoutes, { prefix: '/api' });

server.get('/health', async (request, reply) => {
  return { ok: true };
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    server.log.info(`Server listening on http://localhost:3001`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
