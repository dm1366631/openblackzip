declare global {
  interface Window {
    electronAPI?: {
      selectFiles: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      selectFolder: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      saveFile: (defaultName: string) => Promise<{ canceled: boolean; filePath: string }>;
      getAppPath: () => Promise<{ uploads: string; output: string; userData: string }>;
      getApiPort: () => Promise<number>;
      openExternal: (url: string) => Promise<void>;
      onFilesSelected: (callback: (paths: string[]) => void) => void;
      onFolderSelected: (callback: (path: string) => void) => void;
    };
  }
}

export {};