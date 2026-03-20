import React, { useState, useRef, DragEvent } from 'react';
import { Upload, File, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import { parseDocument, validateFile, formatFileSize, getTextPreview } from '../lib/docParser';

type UploadStatus = 'idle' | 'parsing' | 'success' | 'error';

interface FileUploadProps {
  onFileParsed: (text: string, file: File) => void;
}

export default function FileUpload({ onFileParsed }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string>('');
  const [parsedText, setParsedText] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError('');
    setParsedText('');

    // 验证文件
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || '文件验证失败');
      setStatus('error');
      return;
    }

    setSelectedFile(file);
    setStatus('parsing');

    try {
      // 解析文档
      const text = await parseDocument(file);
      setParsedText(text);
      setStatus('success');
      onFileParsed(text, file);
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setStatus('idle');
    setError('');
    setParsedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'parsing':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'parsing':
        return '解析中...';
      case 'success':
        return '解析完成';
      case 'error':
        return '解析失败';
      default:
        return '';
    }
  };

  return (
    <div className="w-full">
      {/* 文件上传区域 */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.doc,.pdf"
          onChange={handleInputChange}
          className="hidden"
          id="file-upload"
        />

        {status === 'idle' && (
          <>
            <Upload className="mx-auto mb-4 text-gray-400 w-12 h-12" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <p className="text-gray-600 mb-2">
                <span className="text-primary font-medium">点击上传</span> 或拖拽文件到此处
              </p>
              <p className="text-sm text-gray-500">支持 .docx、.doc 和 .pdf 格式，最大 10MB</p>
            </label>
          </>
        )}

        {selectedFile && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div className="flex items-center space-x-3">
              <File className="w-10 h-10 text-gray-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <span className="text-sm text-gray-600">{getStatusText()}</span>
              <button
                onClick={handleRemoveFile}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* 文本预览 */}
      {parsedText && status === 'success' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="font-medium text-green-900 mb-2">文本预览（前200字）</h4>
          <p className="text-green-800 text-sm leading-relaxed">
            {getTextPreview(parsedText, 200)}
          </p>
          <p className="text-xs text-green-600 mt-2">
            共解析出 {parsedText.length} 字符
          </p>
        </div>
      )}
    </div>
  );
}