import { useState, useCallback } from 'react';
import { Upload, File } from 'lucide-react';
import { uploadFiles } from '@/utils/api';
import { useStore } from '@/store/store';
import { createFileItemFromResponse } from '@/utils/api';

export default function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const { addFiles, setProgress, setError } = useStore();
  
  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    setProgress({
      isActive: true,
      progress: 0,
      message: `正在上传 ${files.length} 个文件...`,
      type: 'upload',
    });
    
    try {
      const results = await uploadFiles(Array.from(files));
      const fileItems = results.map(res => createFileItemFromResponse({
        name: res.filename,
        size: res.size,
        type: 'file',
        extension: res.filename.split('-').slice(2).join('-').split('.').pop()?.toLowerCase() || '',
        createdAt: new Date(),
      }));
      
      addFiles(fileItems);
      setProgress({
        isActive: true,
        progress: 100,
        message: '上传完成',
        type: 'upload',
      });
      
      setTimeout(() => {
        setProgress({
          isActive: false,
          progress: 0,
          message: '',
          type: 'upload',
        });
      }, 1500);
      
      setError(null);
    } catch (err) {
      setError('上传失败，请重试');
      setProgress({
        isActive: false,
        progress: 0,
        message: '',
        type: 'upload',
      });
    }
  }, [addFiles, setProgress, setError]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  }, [handleFileSelect]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      handleFileSelect(files);
    };
    input.click();
  }, [handleFileSelect]);
  
  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer group ${
        isDragging 
          ? 'border-[var(--color-neon-purple)] bg-[var(--color-neon-purple)]/10 glow-purple' 
          : 'border-[var(--color-border)] hover:border-[var(--color-neon-cyan)] hover:bg-[var(--color-bg-hover)]'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-neon-purple)]/5 to-[var(--color-neon-cyan)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          isDragging 
            ? 'bg-[var(--color-neon-purple)]/20' 
            : 'bg-[var(--color-bg-hover)] group-hover:bg-[var(--color-border)]'
        }`}>
          {isDragging ? (
            <File className="w-8 h-8 text-[var(--color-neon-purple)] animate-bounce" />
          ) : (
            <Upload className="w-8 h-8 text-[var(--color-text-secondary)] group-hover:text-[var(--color-neon-cyan)] transition-colors" />
          )}
        </div>
        
        <h3 className="text-lg font-medium text-white mb-2">
          {isDragging ? '释放文件以上传' : '拖拽文件到此处'}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          或点击选择文件 · 支持多文件上传
        </p>
        
        <div className="mt-4 flex justify-center gap-2 flex-wrap">
          {['zip', '7z', 'tar', 'gz', 'rar'].map((format) => (
            <span 
              key={format}
              className="px-2 py-1 text-xs rounded-md bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
            >
              .{format}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}