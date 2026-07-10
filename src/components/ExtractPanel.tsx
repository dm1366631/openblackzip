import { useState } from 'react';
import { Archive, Lock, Unlock } from 'lucide-react';
import { useStore } from '@/store/store';
import { extractFile, getFiles } from '@/utils/api';
import { createFileItemFromResponse } from '@/utils/api';

export default function ExtractPanel() {
  const [password, setPassword] = useState('');
  
  const { selectedFiles, files, setProgress, setError, refreshFiles, clearSelectedFiles } = useStore();
  
  const selectedArchive = files.find(f => 
    selectedFiles.includes(f.name) && 
    ['zip', '7z', 'tar', 'gz', 'rar'].includes(f.extension)
  );
  
  const handleExtract = async () => {
    if (!selectedArchive) {
      setError('请选择一个压缩文件');
      return;
    }
    
    setProgress({
      isActive: true,
      progress: 0,
      message: '正在准备解压...',
      type: 'extract',
    });
    
    try {
      await extractFile({
        filename: selectedArchive.name,
        password: password || undefined,
      });
      
      setProgress({
        isActive: true,
        progress: 50,
        message: '正在解压文件...',
        type: 'extract',
      });
      
      setTimeout(async () => {
        const result = await getFiles();
        const fileItems = result.files.map(createFileItemFromResponse);
        refreshFiles(fileItems);
        
        setProgress({
          isActive: true,
          progress: 100,
          message: '解压完成',
          type: 'extract',
        });
        
        clearSelectedFiles();
        setPassword('');
        
        setTimeout(() => {
          setProgress({
            isActive: false,
            progress: 0,
            message: '',
            type: 'extract',
          });
        }, 1500);
      }, 1000);
      
      setError(null);
    } catch (err) {
      setError('解压失败，请检查密码是否正确');
      setProgress({
        isActive: false,
        progress: 0,
        message: '',
        type: 'extract',
      });
    }
  };
  
  return (
    <div className="bg-gradient-card border-gradient rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-neon-cyan)]/20 flex items-center justify-center">
          <Archive className="w-5 h-5 text-[var(--color-neon-cyan)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">解压文件</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {selectedArchive 
              ? `已选择: ${selectedArchive.name}`
              : '请选择压缩文件进行解压'}
          </p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            解压密码
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
              {password ? (
                <Lock className="w-4 h-4 text-[var(--color-neon-green)]" />
              ) : (
                <Unlock className="w-4 h-4 text-[var(--color-text-muted)]" />
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入解压密码（如果有）"
              className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-xl text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-neon-cyan)] transition-colors"
            />
          </div>
        </div>
        
        <button
          onClick={handleExtract}
          disabled={!selectedArchive}
          className={`w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
            selectedArchive
              ? 'bg-gradient-to-r from-[var(--color-neon-cyan)] to-[var(--color-neon-purple)] text-white hover:opacity-90 glow-cyan'
              : 'bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] cursor-not-allowed'
          }`}
        >
          <Archive className="w-5 h-5" />
          开始解压
        </button>
      </div>
      
      <div className="mt-4 p-3 rounded-xl bg-[var(--color-bg-hover)]/50">
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          支持格式: ZIP, 7z, TAR, GZ, RAR
        </p>
      </div>
    </div>
  );
}