import { 
  File, 
  FileArchive, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image, 
  Video, 
  Music, 
  FileCode, 
  FileX, 
  Folder,
  Download,
  Trash2,
  Check
} from 'lucide-react';
import { useStore } from '@/store/store';
import { formatFileSize, downloadFile, deleteFile, getFiles } from '@/utils/api';
import { createFileItemFromResponse } from '@/utils/api';

const iconMap: Record<string, typeof File> = {
  'archive': FileArchive,
  'file-text': FileText,
  'file-spreadsheet': FileSpreadsheet,
  'file-presentation': Presentation,
  'image': Image,
  'video': Video,
  'music': Music,
  'file-code': FileCode,
  'file-exe': FileX,
  'folder': Folder,
};

const getFileIcon = (extension: string, type: string) => {
  if (type === 'folder') return Folder;
  
  const icons: Record<string, typeof File> = {
    'zip': FileArchive,
    '7z': FileArchive,
    'tar': FileArchive,
    'gz': FileArchive,
    'rar': FileArchive,
    'pdf': FileText,
    'doc': FileText,
    'docx': FileText,
    'txt': FileText,
    'md': FileText,
    'csv': FileSpreadsheet,
    'xlsx': FileSpreadsheet,
    'xls': FileSpreadsheet,
    'ppt': Presentation,
    'pptx': Presentation,
    'jpg': Image,
    'jpeg': Image,
    'png': Image,
    'gif': Image,
    'webp': Image,
    'svg': Image,
    'mp4': Video,
    'avi': Video,
    'mov': Video,
    'mp3': Music,
    'wav': Music,
    'flac': Music,
    'exe': FileX,
    'dll': FileX,
    'js': FileCode,
    'ts': FileCode,
    'html': FileCode,
    'css': FileCode,
    'json': FileCode,
    'xml': FileCode,
  };
  
  return icons[extension] || File;
};

const getIconColor = (extension: string) => {
  const colors: Record<string, string> = {
    'zip': 'text-[var(--color-neon-orange)]',
    '7z': 'text-[var(--color-neon-orange)]',
    'tar': 'text-[var(--color-neon-orange)]',
    'gz': 'text-[var(--color-neon-orange)]',
    'rar': 'text-[var(--color-neon-orange)]',
    'pdf': 'text-[var(--color-error)]',
    'doc': 'text-[var(--color-neon-cyan)]',
    'docx': 'text-[var(--color-neon-cyan)]',
    'txt': 'text-[var(--color-text-secondary)]',
    'md': 'text-[var(--color-text-secondary)]',
    'csv': 'text-[var(--color-neon-green)]',
    'xlsx': 'text-[var(--color-neon-green)]',
    'xls': 'text-[var(--color-neon-green)]',
    'ppt': 'text-[var(--color-neon-pink)]',
    'pptx': 'text-[var(--color-neon-pink)]',
    'jpg': 'text-[var(--color-neon-purple)]',
    'jpeg': 'text-[var(--color-neon-purple)]',
    'png': 'text-[var(--color-neon-purple)]',
    'gif': 'text-[var(--color-neon-purple)]',
    'webp': 'text-[var(--color-neon-purple)]',
    'svg': 'text-[var(--color-neon-purple)]',
    'mp4': 'text-[var(--color-neon-pink)]',
    'avi': 'text-[var(--color-neon-pink)]',
    'mov': 'text-[var(--color-neon-pink)]',
    'mp3': 'text-[var(--color-neon-green)]',
    'wav': 'text-[var(--color-neon-green)]',
    'flac': 'text-[var(--color-neon-green)]',
    'exe': 'text-[var(--color-warning)]',
    'dll': 'text-[var(--color-warning)]',
    'js': 'text-[var(--color-neon-yellow)]',
    'ts': 'text-[var(--color-neon-cyan)]',
    'html': 'text-[var(--color-neon-orange)]',
    'css': 'text-[var(--color-neon-purple)]',
    'json': 'text-[var(--color-text-secondary)]',
    'xml': 'text-[var(--color-text-secondary)]',
  };
  
  return colors[extension] || 'text-[var(--color-text-secondary)]';
};

export default function FileList() {
  const { files, selectedFiles, toggleSelectFile, selectAllFiles, removeFile, refreshFiles, setError } = useStore();
  
  const handleDownload = async (filename: string) => {
    try {
      await downloadFile(filename);
    } catch (err) {
      setError('下载失败');
    }
  };
  
  const handleDelete = async (filename: string) => {
    try {
      await deleteFile(filename);
      removeFile(filename);
      const result = await getFiles();
      const fileItems = result.files.map(createFileItemFromResponse);
      refreshFiles(fileItems);
    } catch (err) {
      setError('删除失败');
    }
  };
  
  const isAllSelected = files.length > 0 && selectedFiles.length === files.length;
  
  return (
    <div className="bg-gradient-card border-gradient rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">文件列表</h2>
        <div className="flex items-center gap-2">
          {files.length > 0 && (
            <button
              onClick={selectAllFiles}
              className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors"
            >
              {isAllSelected ? '取消全选' : '全选'}
            </button>
          )}
          <span className="text-sm text-[var(--color-text-muted)]">
            {files.length} 个文件
          </span>
        </div>
      </div>
      
      {files.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-hover)] flex items-center justify-center">
            <Folder className="w-8 h-8 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-[var(--color-text-muted)]">暂无文件</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">上传文件开始使用</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {files.map((file, index) => {
            const IconComponent = getFileIcon(file.extension, file.type);
            const iconColor = getIconColor(file.extension);
            
            return (
              <div
                key={file.name}
                className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
                  file.selected 
                    ? 'bg-[var(--color-neon-purple)]/10 border border-[var(--color-neon-purple)]/50' 
                    : 'bg-[var(--color-bg-hover)] hover:bg-[var(--color-border)] border border-transparent'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <button
                  onClick={() => toggleSelectFile(file.name)}
                  className="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200"
                  style={{
                    borderColor: file.selected ? 'var(--color-neon-purple)' : 'var(--color-border)',
                    backgroundColor: file.selected ? 'var(--color-neon-purple)' : 'transparent',
                  }}
                >
                  {file.selected && <Check className="w-3 h-3 text-white" />}
                </button>
                
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-[var(--color-bg-secondary)] flex items-center justify-center ${iconColor}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatFileSize(file.size)} · {file.createdAt.toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleDownload(file.name)}
                    className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                    title="下载"
                  >
                    <Download className="w-4 h-4 text-[var(--color-text-secondary)] hover:text-[var(--color-neon-green)]" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.name)}
                    className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4 text-[var(--color-text-secondary)] hover:text-[var(--color-error)]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}