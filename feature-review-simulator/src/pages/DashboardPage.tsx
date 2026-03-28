import React, { useCallback, useEffect, useState } from 'react';
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

interface AIConfig {
  baseURL: string;
  apiKey: string;
}

const FALLBACK_AI_BASE_URL = 'https://api.moonshot.cn/v1';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [isReviewRoleModalOpen, setIsReviewRoleModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isLoadingApiConfig, setIsLoadingApiConfig] = useState(false);
  const [isSavingApiConfig, setIsSavingApiConfig] = useState(false);
  const [apiConfig, setApiConfig] = useState<AIConfig>({
    baseURL: FALLBACK_AI_BASE_URL,
    apiKey: '',
  });
  const [apiConfigDraft, setApiConfigDraft] = useState<AIConfig>({
    baseURL: FALLBACK_AI_BASE_URL,
    apiKey: '',
  });

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    }
  }, []);

  const fetchAIConfig = useCallback(async () => {
    setIsLoadingApiConfig(true);
    try {
      const res = await api.get('/users/ai-config');
      const config = {
        baseURL: res.data?.baseURL || FALLBACK_AI_BASE_URL,
        apiKey: res.data?.apiKey || '',
      };
      setApiConfig(config);
      setApiConfigDraft(config);
    } catch (err) {
      console.error('Failed to fetch AI config', err);
      const fallback = { baseURL: FALLBACK_AI_BASE_URL, apiKey: '' };
      setApiConfig(fallback);
      setApiConfigDraft(fallback);
    } finally {
      setIsLoadingApiConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchAIConfig();
  }, [fetchDocuments, fetchAIConfig]);

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
      setError(err.response?.data?.message || '上传失败，请重试。');
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
    setIsReviewRoleModalOpen(true);
  };

  const handleRoleToggle = (roleKey: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleKey) ? prev.filter((role) => role !== roleKey) : [...prev, roleKey]
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
      setError('创建评审会话失败。');
    } finally {
      setIsCreatingSession(false);
      setIsReviewRoleModalOpen(false);
      setSelectedRoles([]);
    }
  };

  const handleDeleteDocument = async (doc: Document) => {
    const firstConfirm = window.confirm(`确认删除文档“${doc.filename}”吗？此操作不可恢复。`);
    if (!firstConfirm) return;

    const secondConfirm = window.confirm('请再次确认：删除后将彻底清理文档及其关联评审记录。');
    if (!secondConfirm) return;

    setDeletingDocId(doc.id);
    setError('');
    try {
      await api.delete(`/documents/${doc.id}`);
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
    } catch (err: any) {
      setError(err.response?.data?.message || '删除失败，请稍后重试。');
    } finally {
      setDeletingDocId(null);
    }
  };

  const openApiModal = () => {
    setApiConfigDraft(apiConfig);
    setIsApiModalOpen(true);
  };

  const handleSaveApiConfig = async () => {
    setIsSavingApiConfig(true);
    setError('');

    try {
      const res = await api.put('/users/ai-config', {
        baseURL: apiConfigDraft.baseURL.trim(),
        apiKey: apiConfigDraft.apiKey.trim(),
      });

      const savedConfig = {
        baseURL: res.data?.baseURL || apiConfigDraft.baseURL,
        apiKey: res.data?.apiKey || apiConfigDraft.apiKey,
      };
      setApiConfig(savedConfig);
      setApiConfigDraft(savedConfig);
      setIsApiModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || '保存 API 配置失败，请重试。');
    } finally {
      setIsSavingApiConfig(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-xl font-bold text-gray-900">AI 评审模拟器</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={openApiModal}
                className="text-sm font-medium text-gray-700 underline-offset-2 hover:text-indigo-600 hover:underline"
              >
                API设置
              </button>
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
                <span className="relative font-medium text-indigo-600 hover:text-indigo-500">点击上传文件</span>
                <p className="pl-1">或拖拽文件到这里</p>
              </div>
              <p className="mt-1 text-xs text-gray-500">支持 .docx, .doc, .pdf，最大 20MB</p>
            </div>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white bg-opacity-80">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                  <p className="mt-2 text-sm font-medium text-gray-700">正在解析并上传...</p>
                </div>
              </div>
            )}
          </div>

          {error && <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

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
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              doc.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : doc.status === 'REVIEWING'
                                  ? 'bg-blue-100 text-blue-800'
                                  : doc.status === 'PASSED'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                          <span>{new Date(doc.createdAt).toLocaleString()}</span>
                          <span className="max-w-xs truncate">{doc.parsedTextPreview}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <button
                          onClick={() => openReviewModal(doc.id)}
                          disabled={deletingDocId === doc.id}
                          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
                        >
                          开始评审
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          disabled={deletingDocId !== null}
                          className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingDocId === doc.id ? '删除中...' : '删除'}
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </main>
      </div>

      {isReviewRoleModalOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium leading-6 text-gray-900">选择评审角色</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {ROLES.map((role) => (
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
                onClick={() => setIsReviewRoleModalOpen(false)}
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

      {isApiModalOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-xl rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium leading-6 text-gray-900">API设置</h3>
            <p className="mt-1 text-sm text-gray-500">
              默认读取当前 Moonshot 配置。你可修改为自定义 API URL 和 API KEY，保存后后端会自动按你的配置调用模型。
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">API URL</label>
                <input
                  type="text"
                  value={apiConfigDraft.baseURL}
                  onChange={(event) =>
                    setApiConfigDraft((prev) => ({ ...prev, baseURL: event.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="https://api.moonshot.cn/v1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">API KEY</label>
                <input
                  type="password"
                  value={apiConfigDraft.apiKey}
                  onChange={(event) =>
                    setApiConfigDraft((prev) => ({ ...prev, apiKey: event.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="请输入 API KEY"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() =>
                  setApiConfigDraft({
                    baseURL: FALLBACK_AI_BASE_URL,
                    apiKey: apiConfig.apiKey,
                  })
                }
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                重置为Moonshot URL
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsApiModalOpen(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiConfig}
                  disabled={isSavingApiConfig || isLoadingApiConfig}
                  className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                  {isSavingApiConfig ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPage;
