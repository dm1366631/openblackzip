import type { UploadResponse, CompressOptions, CompressResponse, ExtractOptions, ExtractResponse, FilesResponse, FileItem } from '@/types';

const API_BASE = '/api';

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('上传失败');
  }
  
  return response.json();
};

export const uploadFiles = async (files: File[]): Promise<UploadResponse[]> => {
  const promises = files.map(file => uploadFile(file));
  return Promise.all(promises);
};

export const compressFiles = async (options: CompressOptions): Promise<CompressResponse> => {
  const response = await fetch(`${API_BASE}/compress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });
  
  if (!response.ok) {
    throw new Error('压缩失败');
  }
  
  return response.json();
};

export const extractFile = async (options: ExtractOptions): Promise<ExtractResponse> => {
  const response = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });
  
  if (!response.ok) {
    throw new Error('解压失败');
  }
  
  return response.json();
};

export const getFiles = async (): Promise<FilesResponse> => {
  const response = await fetch(`${API_BASE}/files`);
  
  if (!response.ok) {
    throw new Error('获取文件列表失败');
  }
  
  return response.json();
};

export const deleteFile = async (filename: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_BASE}/files/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('删除文件失败');
  }
  
  return response.json();
};

export const downloadFile = async (filename: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/download/${encodeURIComponent(filename)}`);
  
  if (!response.ok) {
    throw new Error('下载失败');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const getFileIcon = (extension: string): string => {
  const icons: Record<string, string> = {
    'zip': 'archive',
    '7z': 'archive',
    'tar': 'archive',
    'gz': 'archive',
    'rar': 'archive',
    'pdf': 'file-text',
    'doc': 'file-text',
    'docx': 'file-text',
    'txt': 'file-text',
    'md': 'file-text',
    'csv': 'file-spreadsheet',
    'xlsx': 'file-spreadsheet',
    'xls': 'file-spreadsheet',
    'ppt': 'file-presentation',
    'pptx': 'file-presentation',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'webp': 'image',
    'svg': 'image',
    'mp4': 'video',
    'avi': 'video',
    'mov': 'video',
    'mp3': 'music',
    'wav': 'music',
    'flac': 'music',
    'exe': 'file-exe',
    'dll': 'file-exe',
    'js': 'file-code',
    'ts': 'file-code',
    'html': 'file-code',
    'css': 'file-code',
    'json': 'file-code',
    'xml': 'file-code',
  };
  
  return icons[extension] || 'file';
};

export const createFileItemFromResponse = (data: Omit<FileItem, 'selected'>): FileItem => {
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    selected: false,
  };
};