import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, api } from '../contexts/AuthContext';
import { ROLES } from '../lib/roles';

interface Document {
  id: string;
  filename: string;
  status: 'PENDING' | 'REVIEWING' | 'PASSED' | 'FAILED';
  createdAt: string;
  parsedTextPreview: string;
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // 模态框状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploading(true);
    setError('');
    
    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.message || '上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const openReviewModal = (docId: string) => {
    setSelectedDocId(docId);
    setIsModalOpen(true);
  };

  const handleRoleToggle = (roleKey: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleKey) ? prev.filter(r => r !== roleKey) : [...prev, roleKey]
    );
  };

  const handleConfirmReview = async () => {
    if (!selectedDocId || selectedRoles.length === 0) return;

    setIsCreatingSession(true);
    try {
      const res = await api.post('/sessions', {
        documentId: selectedDocId,
        selectedRoles,
      });
      const { sessionId } = res.data;
      navigate(`/review/${sessionId}`);
    } catch (err) {
      console.error('Failed to create session', err);
      setError('创建评审会话失败');
    } finally {
      setIsCreatingSession(false);
      setIsModalOpen(false);
      setSelectedRoles([]);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-xl font-bold text-gray-900">AI 评审模拟器</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={logout}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                退出登录
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 上传区域 */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
              isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:border-indigo-400'
            }`}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input
              id="fileInput"
              type="file"
              className="hidden"
              accept=".docx,.doc,.pdf"
              onChange={onFileChange}
            />
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-4 flex text-sm text-gray-600">
                <span className="relative font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500">
                  点击上传文件
                </span>
                <p className="pl-1">或拖拽文件到这里</p>
              </div>
              <p className="mt-1 text-xs text-gray-500">支持 .docx, .doc, .pdf，最大 20MB</p>
            </div>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white bg-opacity-80">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                  <p className="mt-2 text-sm font-medium text-gray-700">正在解析并上传...</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 文档列表 */}
          <div className="mt-12">
            <h2 className="text-lg font-bold text-gray-900">我的文档</h2>
            <div className="mt-4 overflow-hidden rounded-lg bg-white shadow">
              <ul className="divide-y divide-gray-200">
                {documents.length === 0 ? (
                  <li className="px-6 py-12 text-center text-gray-500">暂无文档</li>
                ) : (
                  documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900">{doc.filename}</span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            doc.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            doc.status === 'REVIEWING' ? 'bg-blue-100 text-blue-800' :
                            doc.status === 'PASSED' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                          <span>{new Date(doc.createdAt).toLocaleString()}</span>
                          <span className="truncate max-w-xs">{doc.parsedTextPreview}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => openReviewModal(doc.id)}
                        className="ml-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        开始评审
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </main>
      </div>

      {/* 角色选择模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium leading-6 text-gray-900">选择评审角色</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {ROLES.map(role => (
                <div
                  key={role.key}
                  onClick={() => handleRoleToggle(role.key)}
                  className={`cursor-pointer rounded-lg border p-4 transition-all ${
                    selectedRoles.includes(role.key)
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{role.name}</p>
                  <p className="text-sm text-gray-500">{role.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                disabled={selectedRoles.length === 0 || isCreatingSession}
                onClick={handleConfirmReview}
                className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {isCreatingSession ? '创建中...' : '确认并开始'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPage;
