# OpenBlackZip

一款基于 7zip 的现代化压缩软件，拥有精美的深色主题界面。

![OpenBlackZip](https://github.com/dm1366631/openblackzip)

## 功能特性

- 📁 **文件上传** - 支持拖拽上传和批量选择
- 📦 **压缩功能** - 支持 ZIP、7z、TAR 格式，可设置压缩级别和密码保护
- 📤 **解压功能** - 支持 ZIP、7z、TAR、RAR 等多种格式
- 🗂️ **文件管理** - 文件列表展示、下载、删除
- 📊 **进度显示** - 实时显示操作进度
- 🎨 **精美界面** - 深色主题配合霓虹紫/青色渐变

## 技术栈

- **前端**: React 18 + TypeScript + TailwindCSS 3 + Vite
- **状态管理**: Zustand
- **后端**: Express.js + TypeScript
- **压缩引擎**: 7zip-bin
- **桌面应用**: Electron

## 快速开始

### Web 版本

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建生产版本
pnpm run build
```

### Electron 桌面版本

```bash
# 开发模式
pnpm run electron:dev

# 构建 EXE (Windows)
build.bat

# 构建 AppImage (Linux)
build.sh
```

## 构建可执行文件

### Windows EXE

在 Windows 系统上运行：

```bash
# 方法一：使用批处理脚本
build.bat

# 方法二：手动构建
pnpm run build
pnpm run electron:compile
pnpm run dist -- --win portable --x64 --publish never
```

构建完成后，`release` 目录中会生成 `OpenBlackZip Portable.exe`。

### Linux AppImage

```bash
pnpm run build
pnpm run electron:compile
pnpm run dist -- --linux AppImage --x64 --publish never
```

## 项目结构

```
├── src/                    # 前端源码
│   ├── components/         # UI组件
│   ├── pages/              # 页面
│   ├── store/              # 状态管理
│   ├── utils/              # 工具函数
│   └── types/              # 类型定义
├── api/                    # 后端API
│   ├── controllers/        # 控制器
│   ├── routes/             # 路由
│   └── utils/              # 7zip工具
├── electron/               # Electron主进程
│   ├── main.ts             # 主进程入口
│   └── preload.ts          # 预加载脚本
├── dist/                   # 前端构建产物
├── dist-electron/          # Electron构建产物
└── release/                # 最终可执行文件
```

## 许可证

MIT License
```
