import { useState } from 'react';
import { Archive, Lock, Unlock, ChevronDown } from 'lucide-react';
import { useStore } from '@/store/store';
import { compressFiles, downloadFile } from '@/utils/api';
import { formatFileSize } from '@/utils/api';

const formats = [
  { value: 'zip', label: 'ZIP', description: '兼容性好，适合分享' },
  { value: '7z', label: '7z', description: '压缩率最高' },
  { value: 'tar', label: 'TAR', description: 'Linux/Unix 常用' },
  { value: 'gz', label: 'GZ', description: 'Gzip 压缩' },
];

const levels = [
  { value: 1, label: '最快', description: '压缩速度优先' },
  { value: 5, label: '标准', description: '平衡速度和压缩率' },
  { value: 9, label: '最高', description: '压缩率优先' },
];

export default function CompressPanel() {
  const [format, setFormat] = useState('zip');
  const [password, setPassword] = useState('');
  const [level, setLevel] = useState(5);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { selectedFiles, files, setProgress, setError, clearSelectedFiles } = useStore();
  
  const selectedFileItems = files.filter(f => selectedFiles.includes(f.name));
  const totalSize = selectedFileItems.reduce((sum, f) => sum + f.size, 0);
  
  const handleCompress = async () => {
    if (selectedFiles.length === 0) {
      setError('请先选择要压缩的文件');
      return;
    }
    
    setProgress({
      isActive: true,
      progress: 0,
      message: '正在准备压缩...',
      type: 'compress',
    });
    
    try {
      const result = await compressFiles({
        files: selectedFiles,
        format: format as 'zip' | '7z' | 'tar' | 'gz',
        password: password || undefined,
        level,
      });
      
      setProgress({
        isActive: true,
        progress: 50,
        message: '正在压缩文件...',
        type: 'compress',
      });
      
      setTimeout(() => {
        setProgress({
          isActive: true,
          progress: 100,
          message: '压缩完成，准备下载...',
          type: 'compress',
        });
        
        setTimeout(() => {
          downloadFile(result.outputFilename);
          clearSelectedFiles();
          setProgress({
            isActive: false,
            progress: 0,
            message: '',
            type: 'compress',
          });
        }, 500);
      }, 1000);
      
      setError(null);
    } catch (err) {
      setError('压缩失败，请重试');
      setProgress({
        isActive: false,
        progress: 0,
        message: '',
        type: 'compress',
      });
    }
  };
  
  return (
    <div className="bg-gradient-card border-gradient rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-neon-purple)]/20 flex items-center justify-center">
            <Archive className="w-5 h-5 text-[var(--color-neon-purple)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">压缩文件</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              {selectedFiles.length > 0 
                ? `已选择 ${selectedFiles.length} 个文件 (${formatFileSize(totalSize)})`
                : '请选择文件进行压缩'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <ChevronDown 
            className={`w-5 h-5 text-[var(--color-text-secondary)] transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`} 
          />
        </button>
      </div>
      
      {isExpanded && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              压缩格式
            </label>
            <div className="grid grid-cols-2 gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`p-3 rounded-xl text-left transition-all duration-300 ${
                    format === f.value
                      ? 'bg-[var(--color-neon-purple)]/20 border border-[var(--color-neon-purple)]'
                      : 'bg-[var(--color-bg-hover)] border border-transparent hover:border-[var(--color-border)]'
                  }`}
                >
                  <div className={`font-medium ${format === f.value ? 'text-[var(--color-neon-purple)]' : 'text-white'}`}>
                    {f.label}
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)]">{f.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              压缩级别
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="9"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono text-[var(--color-neon-cyan)] w-12 text-right">
                Lv.{level}
              </span>
            </div>
            <div className="flex justify-between mt-2">
              {levels.map((l) => (
                <span 
                  key={l.value}
                  className={`text-xs ${level === l.value ? 'text-[var(--color-neon-purple)]' : 'text-[var(--color-text-muted)]'}`}
                >
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              密码保护
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
                placeholder="设置密码（可选）"
                className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-hover)] border border-[var(--color-border)] rounded-xl text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-neon-purple)] transition-colors"
              />
            </div>
          </div>
        </div>
      )}
      
      <button
        onClick={handleCompress}
        disabled={selectedFiles.length === 0}
        className={`w-full mt-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
          selectedFiles.length > 0
            ? 'bg-gradient-primary text-white hover:opacity-90 glow-purple'
            : 'bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] cursor-not-allowed'
        }`}
      >
        <Archive className="w-5 h-5" />
        开始压缩
      </button>
    </div>
  );
}