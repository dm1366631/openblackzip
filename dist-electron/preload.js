import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    selectFiles: () => ipcRenderer.invoke('select-files'),
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    saveFile: (defaultName) => ipcRenderer.invoke('save-file', defaultName),
    getAppPath: () => ipcRenderer.invoke('get-app-path'),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    onFilesSelected: (callback) => {
        ipcRenderer.on('files-selected', (_event, paths) => callback(paths));
    },
    onFolderSelected: (callback) => {
        ipcRenderer.on('folder-selected', (_event, path) => callback(path));
    }
});
//# sourceMappingURL=preload.js.map