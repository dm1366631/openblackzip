import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import path from 'path';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import net from 'net';
import { spawn } from 'child_process';

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

function validateFilePath(filename: string, baseDir: string): string | null {
  const basename = path.basename(filename);
  const resolvedPath = path.resolve(baseDir, basename);
  const normalizedBase = path.resolve(baseDir) + path.sep;
  if (resolvedPath.startsWith(normalizedBase)) {
    return resolvedPath;
  }
  return null;
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
      
      proc.stdout.on('data', () => {});
      
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
      
      proc.stdout.on('data', () => {});
      
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
  
  app.use(cors({
    origin: ['http://localhost:5173', 'file://'],
    methods: ['GET', 'POST', 'DELETE'],
    credentials: false
  }));
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
  
  // 上传文件 - 返回前端期望的 {success, filename, size, path}
  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    res.json({
      success: true,
      filename: req.file.filename,
      size: req.file.size,
      path: req.file.path
    });
  });
  
  // 获取文件列表 - 返回前端期望的 {files: [...]}
  app.get('/api/files', (req, res) => {
    try {
      const files = fs.readdirSync(uploadsDir);
      const fileList = files.map(filename => {
        const filePath = path.join(uploadsDir, filename);
        const stats = fs.statSync(filePath);
        const originalName = filename.split('-').slice(2).join('-') || filename;
        const ext = path.extname(originalName).toLowerCase().slice(1);
        return {
          name: filename,
          size: stats.size,
          type: 'file' as const,
          extension: ext,
          createdAt: stats.birthtime.toISOString(),
        };
      });
      res.json({ files: fileList });
    } catch (error) {
      res.status(500).json({ files: [] });
    }
  });
  
  // 压缩文件 - 接收 files: string[]，返回 {success, outputPath, outputFilename, originalSize, compressedSize}
  app.post('/api/compress', async (req, res) => {
    try {
      const { files, format, level, password, outputName } = req.body;
      
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, error: 'No files selected' });
      }
      
      const filePaths: string[] = [];
      for (const f of files) {
        const validatedPath = validateFilePath(f, uploadsDir);
        if (!validatedPath) {
          return res.status(403).json({ success: false, error: 'Invalid file path' });
        }
        if (!fs.existsSync(validatedPath)) {
          return res.status(404).json({ success: false, error: 'File not found: ' + f });
        }
        filePaths.push(validatedPath);
      }
      
      const sanitizedOutputName = outputName ? path.basename(outputName) : `archive_${Date.now()}.${format}`;
      const outputPath = path.join(outputDir, sanitizedOutputName);
      
      let originalSize = 0;
      filePaths.forEach((fp: string) => {
        if (fs.existsSync(fp)) {
          originalSize += fs.statSync(fp).size;
        }
      });
      
      await SevenZip.compress(filePaths, outputPath, {
        format,
        level,
        password
      });
      
      const stats = fs.statSync(outputPath);
      res.json({
        success: true,
        outputPath: outputPath,
        outputFilename: path.basename(outputPath),
        originalSize: originalSize,
        compressedSize: stats.size
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 解压文件 - 接收 {filename, password}，返回 {success, files: FileItem[]}
  app.post('/api/extract', async (req, res) => {
    try {
      const { filename, password } = req.body;
      
      if (!filename) {
        return res.status(400).json({ success: false, error: 'No file selected' });
      }
      
      const filePath = validateFilePath(filename, uploadsDir);
      if (!filePath) {
        return res.status(403).json({ success: false, error: 'Invalid file path' });
      }
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }
      
      const tempExtractPath = path.join(outputDir, 'extracted_' + Date.now());
      await SevenZip.extract(filePath, tempExtractPath, { password });
      
      const extractedFileNames: string[] = [];
      if (fs.existsSync(tempExtractPath)) {
        const items = fs.readdirSync(tempExtractPath);
        for (const item of items) {
          const srcPath = path.join(tempExtractPath, item);
          const destName = Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + item;
          const destPath = path.join(uploadsDir, destName);
          
          fs.renameSync(srcPath, destPath);
          extractedFileNames.push(destName);
        }
        try { fs.rmdirSync(tempExtractPath); } catch (e) { /* ignore */ }
      }
      
      const fileList = extractedFileNames.map(name => {
        const fp = path.join(uploadsDir, name);
        const stats = fs.statSync(fp);
        const originalName = name.split('-').slice(2).join('-') || name;
        const ext = path.extname(originalName).toLowerCase().slice(1);
        return {
          name: name,
          size: stats.size,
          type: 'file' as const,
          extension: ext,
          createdAt: stats.birthtime.toISOString(),
        };
      });
      
      res.json({
        success: true,
        files: fileList
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // 删除文件
  app.delete('/api/files/:filename', (req, res) => {
    try {
      const filePath = validateFilePath(req.params.filename, uploadsDir);
      if (!filePath) {
        return res.status(403).json({ success: false, error: 'Invalid file path' });
      }
      
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
  
  // 下载文件 - 先从 uploads 找，再从 output 找
  app.get('/api/download/:filename', (req, res) => {
    try {
      const filename = req.params.filename;
      let filePath = validateFilePath(filename, uploadsDir);
      
      if (!filePath) {
        return res.status(403).json({ success: false, error: 'Invalid file path' });
      }
      
      if (!fs.existsSync(filePath)) {
        filePath = validateFilePath(filename, outputDir);
        if (!filePath) {
          return res.status(403).json({ success: false, error: 'Invalid file path' });
        }
      }
      
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
      sandbox: false,
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
  if (process.platform !== 'darwin') {
    if (serverInstance) {
      serverInstance.close();
    }
    app.quit();
  }
});

app.on('activate', async () => {
  if (mainWindow === null) {
    if (!serverInstance) {
      apiPort = await findAvailablePort(3001);
      server = createServer();
      serverInstance = server.listen(apiPort, '127.0.0.1', () => {
        console.log('API server running on port', apiPort);
      });
    }
    createWindow();
  }
});