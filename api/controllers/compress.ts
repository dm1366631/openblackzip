import { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { compress as sevenZipCompress } from '../utils/sevenZip';
import { getUploadsDir, getOutputDir, validateFilePath } from '../utils/paths';

export const compressFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { files, format, password, level } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No files provided',
      });
      return;
    }
    
    if (!format) {
      res.status(400).json({
        success: false,
        error: 'No format provided',
      });
      return;
    }
    
    const uploadsDir = getUploadsDir();
    const filePaths: string[] = [];
    
    for (const filename of files) {
      const validatedPath = validateFilePath(filename, uploadsDir);
      if (!validatedPath) {
        res.status(403).json({
          success: false,
          error: 'Invalid file path',
        });
        return;
      }
      if (!fs.existsSync(validatedPath)) {
        res.status(404).json({
          success: false,
          error: 'File not found: ' + filename,
        });
        return;
      }
      filePaths.push(validatedPath);
    }
    
    const outputFilename = `archive-${Date.now()}.${format}`;
    const outputPath = path.join(getOutputDir(), outputFilename);
    
    await sevenZipCompress({
      files: filePaths,
      format: format as 'zip' | '7z' | 'tar' | 'gz',
      password,
      level: level || 5,
      outputPath,
    });
    
    const originalSize = filePaths.reduce((total, filePath) => {
      const stat = fs.statSync(filePath);
      return total + stat.size;
    }, 0);
    
    const compressedSize = fs.statSync(outputPath).size;
    
    res.status(200).json({
      success: true,
      outputPath,
      outputFilename,
      originalSize,
      compressedSize,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Compression failed',
    });
  }
};