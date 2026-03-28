import prisma from '../db';
import { uploadToR2, getDownloadUrl, deleteFromR2 } from '../lib/storage';
import { extractText } from './docParser.service';

export async function processAndSaveDocument(
  userId: string,
  filename: string,
  buffer: Buffer,
  mimetype: string
) {
  // 1. 提取文本
  let parsedText = '';
  try {
    parsedText = await extractText(buffer, mimetype);
  } catch (err) {
    console.error('Failed to extract text:', err);
  }

  // 截取前 4000 字符
  const textToSave = parsedText.substring(0, 4000);

  // 2. 创建记录以获取 ID (用于生成存储路径)
  const document = await prisma.document.create({
    data: {
      userId,
      filename,
      fileUrl: '', // 稍后更新
      parsedText: textToSave,
      status: 'PENDING',
    },
  });

  // 3. 上传原始文件到 R2
  // 路径格式：{userId}/{documentId}/{filename}
  const key = `${userId}/${document.id}/${filename}`;
  try {
    await uploadToR2(key, buffer, mimetype);
  } catch (err) {
    console.error('R2 upload failed, skipping storage step:', err);
    // 如果 R2 失败，我们仅在控制台报错，但不阻断流程，
    // 因为解析出的文本已经在数据库中了，评审功能仍可基于文本进行。
  }

  // 4. 更新记录的 fileUrl 为 R2 key
  const updatedDoc = await prisma.document.update({
    where: { id: document.id },
    data: { fileUrl: key },
  });

  return {
    documentId: updatedDoc.id,
    filename: updatedDoc.filename,
    parsedTextPreview: textToSave,
  };
}

export async function getUserDocuments(userId: string) {
  const documents = await prisma.document.findMany({
    where: {
      userId,
      deletedAt: null, // 软删除过滤
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      filename: true,
      status: true,
      createdAt: true,
      parsedText: true,
    },
  });

  return documents.map((doc: any) => ({
    ...doc,
    parsedTextPreview: doc.parsedText?.substring(0, 100) || '',
    parsedText: undefined, // 不在列表中返回完整文本
  }));
}

export async function getDocumentById(userId: string, docId: string) {
  const document = await prisma.document.findFirst({
    where: {
      id: docId,
      userId, // 确保是当前用户的文档
      deletedAt: null,
    },
  });

  if (!document) return null;

  // 生成预签名下载链接
  const downloadUrl = await getDownloadUrl(document.fileUrl);

  return {
    ...document,
    downloadUrl,
  };
}

export async function permanentlyDeleteDocument(userId: string, docId: string) {
  const document = await prisma.document.findFirst({
    where: { id: docId, userId },
    include: {
      reviewSessions: {
        select: {
          id: true,
          reportUrl: true,
        },
      },
    },
  });

  if (!document) throw new Error('Document not found or unauthorized');

  const sessionIds = document.reviewSessions.map((session) => session.id);
  const reportKeys = document.reviewSessions
    .map((session) => session.reportUrl)
    .filter((reportUrl): reportUrl is string => Boolean(reportUrl && reportUrl.includes('.pdf')));

  await prisma.$transaction(async (transaction) => {
    if (sessionIds.length > 0) {
      await transaction.roleThread.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });
      await transaction.reviewSession.deleteMany({
        where: { id: { in: sessionIds } },
      });
    }

    await transaction.document.delete({
      where: { id: docId },
    });
  });

  const storageKeys = Array.from(new Set([document.fileUrl, ...reportKeys].filter(Boolean)));
  await Promise.all(
    storageKeys.map(async (key) => {
      try {
        await deleteFromR2(key);
      } catch (error) {
        console.error(`Failed to delete object from R2: ${key}`, error);
      }
    })
  );
}
