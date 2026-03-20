import mammoth from 'mammoth';

export interface ParsedDocument {
  text: string;
  wordCount: number;
}

export async function parseWordDocument(file: File): Promise<ParsedDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;

    // Limit to 3000 characters to prevent token overflow
    const truncatedText = text.slice(0, 3000);

    return {
      text: truncatedText,
      wordCount: truncatedText.split(/\s+/).length
    };
  } catch (error) {
    throw new Error('Failed to parse Word document: ' + (error as Error).message);
  }
}

export async function parsePDFDocument(): Promise<ParsedDocument> {
  try {
    // Note: pdfjs-dist requires additional setup for worker
    // This is a placeholder implementation
    const text = 'PDF parsing will be implemented here';

    return {
      text: text.slice(0, 3000),
      wordCount: text.split(/\s+/).length
    };
  } catch (error) {
    throw new Error('Failed to parse PDF document: ' + (error as Error).message);
  }
}

export async function parseDocument(file: File): Promise<ParsedDocument> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  switch (fileExtension) {
    case 'docx':
      return parseWordDocument(file);
    case 'pdf':
      return parsePDFDocument();
    default:
      throw new Error('Unsupported file type. Please upload .docx or .pdf files.');
  }
}

export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}