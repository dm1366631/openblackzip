import { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');

export interface FileItem {
  name: string;
  size: number;
  type: 'file' | 'folder';
  extension: string;
  createdAt: Date;
}

export const getFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      res.status(200).json({
        files: [],
      });
      return;
    }
    
    const files = fs.readdirSync(uploadsDir);
    
    const fileItems: FileItem[] = files.map(file => {
      const filePath = path.join(uploadsDir, file);
      const stat = fs.statSync(filePath);
      const ext = path.extname(file).slice(1).toLowerCase();
      
      return {
        name: file,
        size: stat.size,
        type: stat.isDirectory() ? 'folder' : 'file',
        extension: ext,
        createdAt: stat.birthtime,
      };
    });
    
    res.status(200).json({
      files: fileItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get files',
    });
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      res.status(400).json({
        success: false,
        error: 'No filename provided',
      });
      return;
    }
    
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: 'File not found',
      });
      return;
    }
    
    fs.unlinkSync(filePath);
    
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Delete failed',
    });
  }
};

export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      res.status(400).json({
        success: false,
        error: 'No filename provided',
      });
      return;
    }
    
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        error: 'File not found',
      });
      return;
    }
    
    res.download(filePath, filename);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Download failed',
    });
  }
};