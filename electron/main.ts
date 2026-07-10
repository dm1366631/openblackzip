import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import net from 'net';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let apiPort = 3001;

function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
    server.once('listening', () => {
      const port = (server.address() as any).port;
      server.close();
      resolve(port);
    });
    server.listen(startPort, '127.0.0.1');
  });
}

// 7zip 可执行文件路径
function get7zipPath(): string {
  const platform = process.platform;
  const arch = process.arch;
  
  // 在打包后的应用中，7zip-bin 在 resources 目录
  const resourcesPath = process.resourcesPath || path.join(__dirname, '..');
  const sevenZipBinPath = path.join(resourcesPath, '7zip-bin', platform, arch);
  
  if (platform === 'win32') {
    return path.join(sevenZipBinPath, '7z.exe');
  } else if (platform === 'darwin') {
    return path.join(sevenZipBinPath, '7z');
  } else {
    return path.join(sevenZipBinPath, '7z');
  }
}

// 7zip 操作封装
const SevenZip = {
  async compress(files: string[], output: string, options: { format?: string; level?: number; password?: string } = {}): Promise<void> {
    const sevenZipPath = get7zipPath();
    const args = ['a', '-t' + (options.format || '7z'), output];
    
    if (options.level) {
      args.push(`-mx${options.level}`);
    }
    
    if (options.password) {
      args.push('-p' + options.password);
      args.push('-mhe=on');
    }
    
    args.push(...files);
    
    return new Promise((resolve, reject) => {
      const proc = spawn(sevenZipPath, args);
      let stderr = '';
      
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`7zip compression failed: ${stderr}`));
        }
      });
      
      proc.on('error', (err) => {
        reject(err);
      });
    });
  },
  
  async extract(file: string, outputDir: string, options: { password?: string } = {}): Promise<void> {
    const sevenZipPath = get7zipPath();
    const args = ['x', file, `-o${outputDir}`, '-y'];
    
    if (options.password) {
      args.push('-p' + options.password);
    }
    
    return new Promise((resolve, reject) => {
      const proc = spawn(sevenZipPath, args);
      let stderr = '';
      
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`7zip extraction failed: ${stderr}`));
        }
      });
      
      proc.on('error', (err) => {
        reject(err);
      });
    });
  }
};

let mainWindow: BrowserWindow | null = null;
let server: express.Application | null = null;
let serverInstance: any = null;

// 配置上传目录
const uploadsDir = path.join(app.getPath('userData'), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置输出目录
const outputDir = path.join(app.getPath('userData'), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 创建 Express 服务器
function createServer(): express.Application {
  const app = express();
  
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  // 配置 multer
  const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });
  const upload = multer({ storage });
  
  // 上传文件
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const fileInfo = {
      name: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      path: req.file.path,
      extension: path.extname(req.file.originalname).toLowerCase().slice(1)
    };
    
    res.json({ success: true, data: fileInfo });
  });
  
  // 获取文件列表
  app.get('/api/files', (req, res) => {
    try {
      const files = fs.readdirSync(uploadsDir);
      const fileList = files.map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        const originalName = filename.split('-').slice(2).join('-') || filename;
        return {
          name: filename,
          originalName: originalName,
          size: stats.size,
          type: getFileType(path.extname(originalName).toLowerCase().slice(1)),
          path: filePath,
          extension: path.extname(originalName).toLowerCase().slice(1),
          createdAt: stats.birthtime.toISOString(),
          modifiedAt: stats.mtime.toISOString()
        };
      });
      res.json({ success: true, data: fileList });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get files' });
    }
  });
  
  // 压缩文件
  app.post('/api/compress', async (req, res) => {
    try {
      const { files, format, level, password, outputName } = req.body;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, error: 'No files selected' });
      }
      
      const filePaths = files.map((f: { name: string }) => path.join(uploadsDir, f.name));
      const outputPath = path.join(outputDir, outputName || `archive.${format}`);
      
      await SevenZip.compress(filePaths, outputPath, {
        format,
        level,
        password
      });
      
      const stats = fs.statSync(outputPath);
      res.json({
        success: true,
        data: {
          name: path.basename(outputPath),
          path: outputPath,
          size: stats.size
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 解压文件
  app.post('/api/extract', async (req, res) => {
    try {
      const { file, password, outputDir: customOutputDir } = req.body;
      
      if (!file) {
        return res.status(400).json({ success: false, error: 'No file selected' });
      }
      
      const filePath = path.join(uploadsDir, file.name);
      const extractPath = customOutputDir || path.join(outputDir, 'extracted');
      
      await SevenZip.extract(filePath, extractPath, { password });
      
      res.json({
        success: true,
        data: {
          path: extractPath,
          files: fs.readdirSync(extractPath)
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 删除文件
  app.delete('/api/files/:filename', (req, res) => {
    try {
      const filePath = path.join(uploadsDir, req.params.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: 'File not found' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete file' });
    }
  });
  
  // 下载文件
  app.get('/api/download/:filename', (req, res) => {
    try {
      const filePath = path.join(uploadsDir, req.params.filename);
      if (fs.existsSync(filePath)) {
        res.download(filePath);
      } else {
        res.status(404).json({ success: false, error: 'File not found' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to download file' });
    }
  });
  
  // 下载压缩/解压结果
  app.get('/api/download-result/:filename', (req, res) => {
    try {
      const filePath = path.join(outputDir, req.params.filename);
      if (fs.existsSync(filePath)) {
        res.download(filePath);
      } else {
        res.status(404).json({ success: false, error: 'File not found' });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to download file' });
    }
  });
  
  return app;
}

function getFileType(extension: string): string {
  const typeMap: Record<string, string> = {
    'zip': 'archive',
    '7z': 'archive',
    'rar': 'archive',
    'tar': 'archive',
    'gz': 'archive',
    'pdf': 'file-pdf',
    'doc': 'file-text',
    'docx': 'file-text',
    'txt': 'file-text',
    'xls': 'file-spreadsheet',
    'xlsx': 'file-spreadsheet',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'mp4': 'video',
    'mp3': 'music',
    'exe': 'file-exe',
  };
  return typeMap[extension] || 'file';
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'OpenBlackZip',
    icon: path.join(__dirname, '../public/favicon.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#0a0a0f',
    show: false
  });
  
  // 创建菜单
  const menuTemplate: any[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '打开文件',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openFile', 'multiSelections']
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow!.webContents.send('files-selected', result.filePaths);
            }
          }
        },
        {
          label: '打开文件夹',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openDirectory']
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow!.webContents.send('folder-selected', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 OpenBlackZip',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于 OpenBlackZip',
              message: 'OpenBlackZip - Modern 7zip-based compression tool',
              detail: '基于 7zip 的现代化压缩软件，支持多种格式压缩和解压。\n版本: 1.0.0'
            });
          }
        },
        {
          label: 'GitHub',
          click: () => shell.openExternal('https://github.com/dm1366631/openblackzip')
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  
  // 开发模式加载本地服务器，生产模式加载构建文件
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  
  mainWindow.once('ready-to-show', () => {
    mainWindow!.show();
  });
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections']
  });
  return result;
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  });
  return result;
});

ipcMain.handle('save-file', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName,
    filters: [
      { name: 'Archive', extensions: ['zip', '7z', 'tar'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('get-app-path', () => {
  return {
    uploads: uploadsDir,
    output: outputDir,
    userData: app.getPath('userData')
  };
});

ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('get-api-port', () => {
  return apiPort;
});

app.whenReady().then(async () => {
  // 查找可用端口
  apiPort = await findAvailablePort(3001);
  
  // 启动 Express 服务器
  server = createServer();
  serverInstance = server.listen(apiPort, '127.0.0.1', () => {
    console.log('API server running on port', apiPort);
  });
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (serverInstance) {
    serverInstance.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});