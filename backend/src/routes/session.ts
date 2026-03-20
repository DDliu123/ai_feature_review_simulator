import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import {
  createSessionHandler,
  streamSessionHandler,
  listSessionsHandler,
  getSessionDetailHandler,
  chatWithRoleHandler,
  generateReportHandler,
} from '../controllers/session.controller';

export default async function sessionRoutes(server: FastifyInstance) {
  // 所有会话操作均需鉴权
  server.addHook('preHandler', authMiddleware);

  // 创建新会话
  server.post('/', createSessionHandler);

  // 获取会话列表
  server.get('/', listSessionsHandler);

  // 获取会话详情
  server.get('/:id', getSessionDetailHandler);

  // 辩驳对话
  server.post('/:id/threads/:roleKey/chat', chatWithRoleHandler);

  // 生成评审报告
  server.get('/:id/report', generateReportHandler);

  // SSE 流式端点
  server.get('/:id/stream', streamSessionHandler);
}
