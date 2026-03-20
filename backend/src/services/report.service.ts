import PDFDocument from 'pdfkit';
import { ROLES } from '../lib/roles';

export async function generatePDFReport(session: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // --- 封面 ---
    doc.fontSize(28).text('AI 评审报告', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(16).text(`产品名称: AI 评审模拟器`, { align: 'left' });
    doc.text(`文档名称: ${session.document.filename}`);
    doc.text(`评审时间: ${new Date().toLocaleString()}`);
    doc.moveDown(2);
    doc.fontSize(14).text('状态: 评审已通过', { color: 'green' });
    
    doc.addPage();

    // --- 第一章：PRD 摘要 ---
    doc.fontSize(18).text('第一章：PRD 摘要');
    doc.moveDown();
    const summaryText = session.document.parsedText?.substring(0, 500) || '无摘要';
    doc.fontSize(12).text(summaryText, { align: 'justify' });
    
    doc.addPage();

    // --- 第二章：各角色评审意见 ---
    doc.fontSize(18).text('第二章：各角色评审意见');
    doc.moveDown();

    session.threads.forEach((thread: any) => {
      const role = ROLES.find(r => r.key === thread.roleKey);
      doc.fontSize(14).fillColor('blue').text(`角色: ${role?.name || thread.roleKey}`);
      doc.fillColor('black').fontSize(12).moveDown(0.5);
      
      doc.text('初始质疑:');
      const questions = thread.messages.questions || [];
      questions.forEach((q: string) => doc.text(`  ${q}`));
      doc.moveDown();

      doc.text('辩驳记录:');
      const chat = thread.messages.chat || [];
      if (chat.length === 0) {
        doc.text('  无对话记录');
      } else {
        chat.forEach((msg: any) => {
          const sender = msg.role === 'user' ? '用户' : (role?.name || 'AI');
          doc.text(`  [${sender}]: ${msg.content}`);
        });
      }
      doc.moveDown(2);
    });

    doc.addPage();

    // --- 第三章：核心风险汇总 ---
    doc.fontSize(18).text('第三章：核心风险汇总');
    doc.moveDown();
    doc.fontSize(12).text(session.reportUrl || '无汇总报告'); // 注意：后端 session.reportUrl 目前存的是 summary 文字

    doc.addPage();

    // --- 第四章：评审结论 ---
    doc.fontSize(18).text('第四章：评审结论');
    doc.moveDown();
    doc.fontSize(12).text(`结论: 通过`);
    doc.text(`通过时间: ${new Date(session.updatedAt).toLocaleString()}`);
    const totalRounds = session.threads.reduce((acc: number, t: any) => acc + (t.roundCount || 0), 0);
    doc.text(`总对话轮次: ${totalRounds}`);

    doc.end();
  });
}
