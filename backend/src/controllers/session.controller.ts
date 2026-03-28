import { FastifyRequest, FastifyReply } from 'fastify';
import { createReviewSession, getSessionsForUser, getSessionDetails, chatWithRole } from '../services/session.service';
import { generatePDFReport } from '../services/report.service';
import { uploadToR2, getDownloadUrl } from '../lib/storage';

export async function generateReportHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  if (!request.user) return reply.code(401).send({ message: '未授权' });

  const { id: sessionId } = request.params;
  try {
    const session = await getSessionDetails(request.user.userId, sessionId);
    if (!session) {
      return reply.code(404).send({ message: '会话不存在或无权访问' });
    }

    // 检查是否已通过
    const allApproved = session.threads.length > 0 && 
      session.threads.every((t: any) => t.status === 'APPROVED');
    
    if (!allApproved) {
      return reply.code(400).send({ message: '所有评审官通过后才能生成报告' });
    }

    // 检查是否已生成 PDF 报告链接 (这里假设已生成的 PDF 的 URL 包含 .pdf)
    if (session.reportUrl && session.reportUrl.includes('.pdf')) {
      const downloadUrl = await getDownloadUrl(session.reportUrl);
      return reply.code(200).send({ reportUrl: downloadUrl });
    }

    // 生成 PDF
    const pdfBuffer = await generatePDFReport(session);
    
    // 上传到 R2
    const key = `reports/${request.user.userId}/${sessionId}/report.pdf`;
    await uploadToR2(key, pdfBuffer, 'application/pdf');

    // 更新数据库
    await prisma.reviewSession.update({
      where: { id: sessionId },
      data: { reportUrl: key },
    });

    const downloadUrl = await getDownloadUrl(key);
    return reply.code(200).send({ reportUrl: downloadUrl });
  } catch (error) {
    request.log.error(error, `Error generating report for session ${sessionId}`);
    return reply.code(500).send({ message: '生成报告失败' });
  }
}

export async function chatWithRoleHandler(
  request: FastifyRequest<{ Params: { id: string; roleKey: string }; Body: { message: string } }>,
  reply: FastifyReply
) {
  if (!request.user) return reply.code(401).send({ message: '未授权' });

  const { id: sessionId, roleKey } = request.params;
  const { message } = request.body;

  try {
    const result = await chatWithRole(request.user.userId, sessionId, roleKey, message);
    return reply.code(200).send(result);
  } catch (error) {
    request.log.error(error, `Error in chatWithRoleHandler for session ${sessionId}, role ${roleKey}`);
    return reply.code(500).send({ message: '对话处理失败' });
  }
}
import { generateReviewForRole, summarizeRisks } from '../services/ai.service';
import prisma from '../db';
import { ROLES } from '../lib/roles';

export async function createSessionHandler(
  request: FastifyRequest<{ Body: { documentId: string; selectedRoles: string[] } }>,
  reply: FastifyReply
) {
  if (!request.user) return reply.code(401).send({ message: '未授权' });

  const { documentId, selectedRoles } = request.body;
  try {
    const result = await createReviewSession(request.user.userId, documentId, selectedRoles);
    return reply.code(201).send(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('unauthorized')) {
      return reply.code(403).send({ message: error.message });
    }
    request.log.error(error, 'Error creating session');
    return reply.code(500).send({ message: '创建评审会话失败' });
  }
}

export async function streamSessionHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  if (!request.user) return reply.code(401).send({ message: '未授权' });

  const sessionId = request.params.id;

  // 设置 SSE 响应头
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Connection', 'keep-alive');

  const sendEvent = (event: string, data: any) => {
    reply.raw.write(`event: ${event}\n`);
    reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // 监听连接关闭
  request.raw.on('close', () => {
    console.log(`SSE connection closed for session ${sessionId}`);
    reply.raw.end();
  });

  try {
    const session = await getSessionDetails(request.user.userId, sessionId);
    if (!session || !session.document.parsedText) {
      sendEvent('error', { message: '会话不存在或文档未解析' });
      return reply.raw.end();
    }

    const documentText = session.document.parsedText;
    const rolesToReview = ROLES.filter(r => session.rolesSelected.includes(r.key));
    const allGeneratedQuestions: { role: string; questions: string[] }[] = [];

    const reviewPromises = rolesToReview.map(async (role) => {
      try {
        sendEvent('role_start', { role: role.key, status: 'generating' });
        const questions = await generateReviewForRole(
          role.systemPrompt,
          documentText,
          request.user.userId
        );
        allGeneratedQuestions.push({ role: role.name, questions });

        // 持久化结果
        await prisma.roleThread.updateMany({
          where: { sessionId, roleKey: role.key },
          data: {
            messages: JSON.stringify({ questions, chat: [] }),
            status: 'CHALLENGING', // 初始状态为质疑中
          },
        });

        sendEvent('role_done', { role: role.key, questions, status: 'CHALLENGING' });
      } catch (err) {
        console.error(`Error processing role ${role.key}:`, err);
        sendEvent('error', { role: role.key, message: `角色 ${role.name} 处理失败` });
      }
    });

    await Promise.all(reviewPromises);

    // 所有角色完成后进行总结
    if (allGeneratedQuestions.length > 0) {
      const summary = await summarizeRisks(allGeneratedQuestions, request.user.userId);
      await prisma.reviewSession.update({
        where: { id: sessionId },
        data: { overallStatus: 'IN_PROGRESS', reportUrl: summary }, // 初始状态仍为进行中
      });
      sendEvent('session_done', { summary });
    }

  } catch (error) {
    request.log.error(error, `Error in streamSessionHandler for session ${sessionId}`);
    sendEvent('error', { message: '处理评审流失败' });
  } finally {
    reply.raw.end();
  }
}

export async function listSessionsHandler(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) return reply.code(401).send({ message: '未授权' });
  try {
    const sessions = await getSessionsForUser(request.user.userId);
    return reply.code(200).send(sessions);
  } catch (error) {
    request.log.error(error, 'Error listing sessions');
    return reply.code(500).send({ message: '获取会话列表失败' });
  }
}

export async function getSessionDetailHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  if (!request.user) return reply.code(401).send({ message: '未授权' });
  try {
    const session = await getSessionDetails(request.user.userId, request.params.id);
    if (!session) {
      return reply.code(404).send({ message: '会话不存在或无权访问' });
    }
    return reply.code(200).send(session);
  } catch (error) {
    request.log.error(error, 'Error getting session detail');
    return reply.code(500).send({ message: '获取会话详情失败' });
  }
}
