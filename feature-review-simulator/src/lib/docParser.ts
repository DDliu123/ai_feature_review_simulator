import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// 设置 PDF.js worker 路径
// 使用 CDN 版本的 worker，或者可以下载到本地
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * 解析文档文件
 * @param file - 要解析的文件
 * @returns 解析后的文本内容（前4000字符）
 */
export async function parseDocument(file: File): Promise<string> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  let text = '';

  try {
    switch (fileExtension) {
      case 'docx':
      case 'doc':
        text = await parseWordDocument(file);
        break;
      case 'pdf':
        text = await parsePDFDocument(file);
        break;
      default:
        throw new Error(`不支持的文件类型：.${fileExtension}`);
    }

    // 截取前4000字符，防止超出token限制
    const maxLength = 4000;
    if (text.length > maxLength) {
      text = text.slice(0, maxLength) + `[文档已截取，共 ${text.length} 字符]`;
    }

    return text;
  } catch (error) {
    throw new Error(`文档解析失败：${(error as Error).message}`);
  }
}

/**
 * 解析Word文档
 */
async function parseWordDocument(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    if (!result.value || result.value.trim().length === 0) {
      throw new Error('文档内容为空');
    }

    // 清理文本：移除多余空行和空格
    return result.value
      .replace(/\r\n/g, '\n')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  } catch (error) {
    throw new Error(`Word文档解析失败：${(error as Error).message}`);
  }
}

/**
 * 解析PDF文档
 */
async function parsePDFDocument(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const numPages = pdf.numPages;
    const pageTexts: string[] = [];

    // 遍历每一页提取文本
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // 提取文本内容
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      pageTexts.push(pageText);

      // 释放页面资源
      page.cleanup();
    }

    const fullText = pageTexts.join('\n\n');

    if (!fullText || fullText.trim().length === 0) {
      throw new Error('PDF文档内容为空或无法提取文本');
    }

    return fullText.trim();
  } catch (error) {
    throw new Error(`PDF文档解析失败：${(error as Error).message}`);
  }
}

/**
 * 验证文件
 * @param file - 要验证的文件
 * @returns 验证结果
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // 检查文件类型
  const allowedExtensions = ['docx', 'doc', 'pdf'];
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: '请上传 .docx、.doc 或 .pdf 格式的文件'
    };
  }

  // 检查文件大小（最大10MB）
  const maxSizeMB = 10;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `文件大小不能超过 ${maxSizeMB}MB`
    };
  }

  // 检查文件是否为空
  if (file.size === 0) {
    return {
      valid: false,
      error: '文件内容为空'
    };
  }

  return { valid: true };
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取文件预览文本（前200字）
 */
export function getTextPreview(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength) + '...';
}