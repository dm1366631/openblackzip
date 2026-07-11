import { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { extract as sevenZipExtract } from '../utils/sevenZip';
import { getUploadsDir, getOutputDir, validateFilePath } from '../utils/paths';

export const extractFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename, password } = req.body;
    
    if (!filename) {
      res.status(400).json({
        success: false,
        error: 'No filename provided',
      });
      return;
    }
    
    const uploadsDir = getUploadsDir();
    const inputPath = validateFilePath(filename, uploadsDir);
    
    if (!inputPath) {
      res.status(403).json({
        success: false,
        error: 'Invalid file path',
      });
      return;
    }
    
    if (!fs.existsSync(inputPath)) {
      res.status(404).json({
        success: false,
        error: 'File does not exist',
      });
      return;
    }
    
    const extractDir = path.join(getOutputDir(), `extracted-${Date.now()}`);
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    const extractedFiles = await sevenZipExtract({
      inputPath,
      outputPath: extractDir,
      password,
    });
    
    const fileList = extractedFiles.map(name => {
      const fp = path.join(extractDir, name);
      if (!fs.existsSync(fp)) return null;
      const stats = fs.statSync(fp);
      const ext = path.extname(name).toLowerCase().slice(1);
      return {
        name: name,
        size: stats.size,
        type: 'file' as const,
        extension: ext,
        createdAt: stats.birthtime.toISOString(),
      };
    }).filter(Boolean);
    
    res.status(200).json({
      success: true,
      files: fileList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Extraction failed',
    });
  }
};