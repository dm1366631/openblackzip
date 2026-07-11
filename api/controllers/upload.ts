import { type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getUploadsDir } from '../utils/paths';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadsDir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      filename: req.file.filename,
      size: req.file.size,
      path: req.file.path,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Upload failed',
    });
  }
};