import { Archive, Github, Settings } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center glow-purple">
                <Archive className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--color-neon-green)] rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gradient glow-text">OpenBlackZip</h1>
              <p className="text-xs text-[var(--color-text-muted)]">基于7zip的现代化压缩工具</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-all duration-300 group">
              <Settings className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-neon-cyan)] transition-colors" />
            </button>
            <a 
              href="https://github.com/guitar987/openblackzip" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-hover)] hover:bg-[var(--color-border)] transition-all duration-300 group"
            >
              <Github className="w-4 h-4 text-[var(--color-text-secondary)] group-hover:text-[var(--color-neon-purple)] transition-colors" />
              <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-white transition-colors">GitHub</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}