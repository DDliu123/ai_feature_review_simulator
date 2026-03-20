import mammoth from 'mammoth';
// import pdfParse from 'pdf-parse';

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function parsePdf(buffer: Buffer): Promise<string> {
  // const data = await pdfParse(buffer);
  // return data.text;
  return 'PDF 文本解析功能暂不可用';
}

export async function extractText(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    return await parsePdf(buffer);
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    return await parseDocx(buffer);
  }
  throw new Error('Unsupported file type for text extraction');
}
