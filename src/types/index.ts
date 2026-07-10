export interface FileItem {
  name: string;
  size: number;
  type: 'file' | 'folder';
  extension: string;
  createdAt: Date;
  selected: boolean;
}

export interface UploadResponse {
  success: boolean;
  filename: string;
  size: number;
  path: string;
}

export interface CompressOptions {
  files: string[];
  format: 'zip' | '7z' | 'tar' | 'gz';
  password?: string;
  level?: number;
}

export interface CompressResponse {
  success: boolean;
  outputPath: string;
  outputFilename: string;
  originalSize: number;
  compressedSize: number;
}

export interface ExtractOptions {
  filename: string;
  password?: string;
}

export interface ExtractResponse {
  success: boolean;
  files: string[];
}

export interface FilesResponse {
  files: FileItem[];
}

export interface ProgressState {
  isActive: boolean;
  progress: number;
  message: string;
  type: 'compress' | 'extract' | 'upload';
}

export interface AppState {
  files: FileItem[];
  selectedFiles: string[];
  progress: ProgressState;
  error: string | null;
  addFiles: (newFiles: FileItem[]) => void;
  removeFile: (filename: string) => void;
  toggleSelectFile: (filename: string) => void;
  selectAllFiles: () => void;
  clearSelectedFiles: () => void;
  setProgress: (progress: ProgressState) => void;
  clearProgress: () => void;
  setError: (error: string | null) => void;
  refreshFiles: (files: FileItem[]) => void;
}