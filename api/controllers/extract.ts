import { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { extract as sevenZipExtract } from '../utils/sevenZip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');

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
    
    const inputPath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(inputPath)) {
      res.status(400).json({
        success: false,
        error: 'File does not exist',
      });
      return;
    }
    
    const extractDir = path.join(uploadsDir, `extracted-${Date.now()}`);
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    const extractedFiles = await sevenZipExtract({
      inputPath,
      outputPath: extractDir,
      password,
    });
    
    res.status(200).json({
      success: true,
      files: extractedFiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Extraction failed',
    });
  }
};