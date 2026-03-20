import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth';
import {
  uploadDocumentHandler,
  listDocumentsHandler,
  getDocumentDetailHandler,
  deleteDocumentHandler,
} from '../controllers/document.controller';

export default async function documentRoutes(server: FastifyInstance) {
  // 所有文档操作均需鉴权
  server.addHook('preHandler', authMiddleware);

  // 上传文档 (需支持 multipart)
  server.post('/upload', uploadDocumentHandler);

  // 获取文档列表
  server.get('/', listDocumentsHandler);

  // 获取文档详情
  server.get('/:id', getDocumentDetailHandler);

  // 删除文档 (软删除)
  server.delete('/:id', deleteDocumentHandler);
}
