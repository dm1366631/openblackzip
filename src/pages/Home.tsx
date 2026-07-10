import { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import Header from '@/components/Header';
import UploadZone from '@/components/UploadZone';
import CompressPanel from '@/components/CompressPanel';
import ExtractPanel from '@/components/ExtractPanel';
import FileList from '@/components/FileList';
import ProgressBar from '@/components/ProgressBar';
import { useStore } from '@/store/store';
import { getFiles } from '@/utils/api';
import { createFileItemFromResponse } from '@/utils/api';

export default function Home() {
  const { files, refreshFiles, error, setError } = useStore();
  
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const result = await getFiles();
        const fileItems = result.files.map(createFileItemFromResponse);
        refreshFiles(fileItems);
      } catch (err) {
        console.error('Failed to load files:', err);
      }
    };
    
    loadFiles();
  }, [refreshFiles]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-[var(--color-error)] flex-shrink-0" />
            <span className="text-sm text-[var(--color-error)] flex-1">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="p-1 rounded-lg hover:bg-[var(--color-error)]/20 transition-colors"
            >
              <X className="w-4 h-4 text-[var(--color-error)]" />
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <UploadZone />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CompressPanel />
              <ExtractPanel />
            </div>
            
            <div className="relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-neon-purple)]/5 via-transparent to-[var(--color-neon-cyan)]/5" />
              <FileList />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gradient-card border-gradient rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">功能特性</h3>
              <div className="space-y-4">
                {[
                  { icon: '🗜️', title: '高效压缩', desc: '支持多种格式，压缩率高' },
                  { icon: '🔓', title: '密码保护', desc: '支持加密压缩和解密' },
                  { icon: '📤', title: '批量操作', desc: '支持多文件同时处理' },
                  { icon: '💾', title: '安全存储', desc: '本地文件系统存储' },
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-bg-hover)]/50"
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{feature.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-card border-gradient rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">支持格式</h3>
              <div className="grid grid-cols-2 gap-2">
                {['ZIP', '7z', 'TAR', 'GZ', 'RAR'].map((format) => (
                  <span 
                    key={format}
                    className="px-3 py-2 text-sm rounded-lg bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] text-center"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-[var(--color-neon-purple)]/20 to-[var(--color-neon-cyan)]/20 rounded-2xl p-6 border border-[var(--color-border)]">
              <h3 className="text-lg font-semibold text-white mb-2">关于 OpenBlackZip</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                基于 7zip 核心引擎开发的现代化压缩工具，提供精美界面和完整功能。
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            OpenBlackZip - 基于 7zip 的现代化压缩工具
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            开源项目 · 免费使用
          </p>
        </div>
      </footer>
      
      <ProgressBar />
    </div>
  );
}