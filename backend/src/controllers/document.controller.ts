import { FastifyRequest, FastifyReply } from 'fastify';
import {
  processAndSaveDocument,
  getUserDocuments,
  getDocumentById,
  softDeleteDocument,
} from '../services/document.service';
import { extractText } from '../services/docParser.service';

const ALLOWED_MIMETYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export async function uploadDocumentHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) return reply.code(401).send({ message: '未授权' });

  const data = await request.file();
  if (!data) {
    return reply.code(400).send({ message: '未选择文件' });
  }

  // 1. 校验文件类型和大小
  if (!ALLOWED_MIMETYPES.includes(data.mimetype)) {
    return reply.code(400).send({ message: '只支持 .docx, .doc 和 .pdf 文件' });
  }

  const buffer = await data.toBuffer();
  if (buffer.length > MAX_FILE_SIZE) {
    return reply.code(400).send({ message: '文件大小不能超过 20MB' });
  }

  // 2. 处理并保存文件
  try {
    const result = await processAndSaveDocument(
      request.user.userId,
      data.filename,
      buffer,
      data.mimetype
    );
    return reply.code(201).send(result);
  } catch (error) {
    request.log.error(error, 'Error in uploadDocumentHandler');
    return reply.code(500).send({ message: '文档上传失败' });
  }
}

export async function listDocumentsHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) return reply.code(401).send({ message: '未授权' });

  try {
    const documents = await getUserDocuments(request.user.userId);
    return reply.code(200).send(documents);
  } catch (error) {
    request.log.error(error, 'Error in listDocumentsHandler');
    return reply.code(500).send({ message: '获取文档列表失败' });
  }
}

export async function getDocumentDetailHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  if (!request.user) return reply.code(401).send({ message: '未授权' });

  const { id } = request.params;
  try {
    const document = await getDocumentById(request.user.userId, id);
    if (!document) {
      return reply.code(404).send({ message: '文档不存在或无权访问' });
    }
    return reply.code(200).send(document);
  } catch (error) {
    request.log.error(error, 'Error in getDocumentDetailHandler');
    return reply.code(500).send({ message: '获取文档详情失败' });
  }
}

export async function deleteDocumentHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  if (!request.user) return reply.code(401).send({ message: '未授权' });

  const { id } = request.params;
  try {
    await softDeleteDocument(request.user.userId, id);
    return reply.code(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Document not found or unauthorized') {
      return reply.code(404).send({ message: '文档不存在或无权访问' });
    }
    request.log.error(error, 'Error in deleteDocumentHandler');
    return reply.code(500).send({ message: '删除文档失败' });
  }
}
