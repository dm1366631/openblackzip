import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  saveFile: (defaultName: string) => ipcRenderer.invoke('save-file', defaultName),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  onFilesSelected: (callback: (paths: string[]) => void) => {
    ipcRenderer.on('files-selected', (_event, paths) => callback(paths));
  },
  onFolderSelected: (callback: (path: string) => void) => {
    ipcRenderer.on('folder-selected', (_event, path) => callback(path));
  }
});