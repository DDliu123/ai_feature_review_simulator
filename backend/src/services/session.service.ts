import prisma from '../db';
import { ROLES, Role } from '../lib/roles';
import { generateChatResponse } from './ai.service';

export async function chatWithRole(
  userId: string,
  sessionId: string,
  roleKey: string,
  userMessage: string
) {
  console.log(`[chatWithRole] Starting chat for session ${sessionId}, role ${roleKey}`);
  
  // 1. 验证会话的所有权
  const session = await prisma.reviewSession.findFirst({
    where: { id: sessionId, document: { userId } },
    include: { document: true },
  });

  if (!session) {
    console.error(`[chatWithRole] Session not found or unauthorized: session ${sessionId}, user ${userId}`);
    throw new Error('Session not found or unauthorized');
  }

  // 2. 获取线程
  const thread = await prisma.roleThread.findFirst({
    where: { sessionId, roleKey },
  });

  if (!thread) {
    console.error(`[chatWithRole] Thread not found: session ${sessionId}, role ${roleKey}`);
    throw new Error('Thread not found');
  }
  if (thread.status === 'APPROVED') {
    console.warn(`[chatWithRole] Thread already approved: session ${sessionId}, role ${roleKey}`);
    throw new Error('Thread already approved');
  }

  const role = ROLES.find(r => r.key === roleKey);
  if (!role) {
    console.error(`[chatWithRole] Role not found: ${roleKey}`);
    throw new Error('Role not found');
  }

  // 3. 构建历史
  const messages = JSON.parse(thread.messages);
  const initialQuestions = messages.questions || [];
  const chatHistory: any[] = messages.chat || [];
  
  // 如果是第一次对话，把初始评审意见作为第一条助手消息加入上下文（但不一定要存入数据库的 chat 记录，避免冗余）
  const historyForAI = [...chatHistory];
  if (chatHistory.length === 0 && initialQuestions.length > 0) {
    historyForAI.unshift({ 
      role: 'assistant', 
      content: `这是我初步阅读 PRD 后提出的评审意见：\n${initialQuestions.map((q: string) => `- ${q}`).join('\n')}` 
    });
  }

  // 4. 添加用户消息
  historyForAI.push({ role: 'user', content: userMessage });
  chatHistory.push({ role: 'user', content: userMessage });

  console.log(`[chatWithRole] Calling AI for response...`);

  // 5. 调用 AI 获取回复
  const { content: aiResponse, status: newStatus } = await generateChatResponse(
    role.systemPrompt,
    session.document.parsedText || '',
    historyForAI,
    userId
  );

  console.log(`[chatWithRole] AI response received, status: ${newStatus}`);

  // 6. 添加 AI 消息并更新数据库
  chatHistory.push({ role: 'assistant', content: aiResponse });

  await prisma.roleThread.update({
    where: { id: thread.id },
    data: {
      messages: JSON.stringify({ ...messages, chat: chatHistory }),
      status: newStatus,
      roundCount: { increment: 1 },
    },
  });

  return { content: aiResponse, status: newStatus };
}


export async function createReviewSession(
  userId: string,
  documentId: string,
  selectedRoleKeys: string[]
) {
  // 1. 验证文档属于当前用户
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!document) {
    throw new Error('Document not found or unauthorized');
  }

  const selectedRoles = ROLES.filter(r => selectedRoleKeys.includes(r.key));

  // 2. 创建 ReviewSession
  const session = await prisma.reviewSession.create({
    data: {
      documentId,
      rolesSelected: JSON.stringify(selectedRoles.map(r => r.key)),
      overallStatus: 'IN_PROGRESS',
    },
  });

  // 3. 为每个角色创建 RoleThread
  await prisma.roleThread.createMany({
    data: selectedRoles.map(role => ({
      sessionId: session.id,
      roleKey: role.key,
      status: 'CHALLENGING', // 初始状态
      messages: JSON.stringify({ questions: [], chat: [] }), // 初始为空
    })),
  });

  return { sessionId: session.id };
}

export async function getSessionsForUser(userId: string) {
  const sessions = await prisma.reviewSession.findMany({
    where: {
      document: {
        userId: userId,
      },
    },
    include: {
      document: {
        select: { filename: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return sessions.map((s: any) => ({
    ...s,
    rolesSelected: JSON.parse(s.rolesSelected as string),
  }));
}

export async function getSessionDetails(userId: string, sessionId: string) {
  const session = await prisma.reviewSession.findFirst({
    where: {
      id: sessionId,
      document: {
        userId: userId,
      },
    },
    include: {
      document: true,
      roleThreads: true,
    },
  });

  if (!session) return null;

  return {
    ...session,
    rolesSelected: JSON.parse(session.rolesSelected as string),
    threads: session.roleThreads.map((t: any) => ({
      ...t,
      messages: JSON.parse(t.messages as string),
    })),
  };
}
