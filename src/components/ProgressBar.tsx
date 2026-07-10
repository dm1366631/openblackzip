import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store/store';

export default function ProgressBar() {
  const { progress, clearProgress } = useStore();
  
  if (!progress.isActive) return null;
  
  const getProgressColor = () => {
    switch (progress.type) {
      case 'compress':
        return 'bg-[var(--color-neon-purple)]';
      case 'extract':
        return 'bg-[var(--color-neon-cyan)]';
      case 'upload':
        return 'bg-[var(--color-neon-green)]';
      default:
        return 'bg-gradient-primary';
    }
  };
  
  const getIcon = () => {
    if (progress.progress >= 100) {
      return <CheckCircle2 className="w-5 h-5 text-[var(--color-neon-green)]" />;
    }
    return <Loader2 className="w-5 h-5 text-[var(--color-neon-purple)] animate-spin" />;
  };
  
  const getTitle = () => {
    switch (progress.type) {
      case 'compress':
        return '压缩中';
      case 'extract':
        return '解压中';
      case 'upload':
        return '上传中';
      default:
        return '处理中';
    }
  };
  
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-gradient-card border-gradient rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h3 className="text-sm font-medium text-white">{getTitle()}</h3>
              <p className="text-xs text-[var(--color-text-muted)]">{progress.message}</p>
            </div>
          </div>
          <button 
            onClick={clearProgress}
            className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <X className="w-4 h-4 text-[var(--color-text-muted)] hover:text-white" />
          </button>
        </div>
        
        <div className="relative h-2 bg-[var(--color-bg-hover)] rounded-full overflow-hidden">
          <div 
            className={`absolute inset-y-0 left-0 ${getProgressColor()} rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${progress.progress}%` }}
          />
          <div 
            className="absolute inset-y-0 left-0 bg-white/20 rounded-full animate-pulse"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        
        <div className="mt-2 text-right">
          <span className="text-sm font-mono text-gradient">{progress.progress}%</span>
        </div>
      </div>
    </div>
  );
}