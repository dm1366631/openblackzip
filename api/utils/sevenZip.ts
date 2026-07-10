import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import sevenZipBin from '7zip-bin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEVEN_ZIP_PATH = sevenZipBin.path7za;

export interface CompressOptions {
  files: string[];
  format: 'zip' | '7z' | 'tar' | 'gz';
  password?: string;
  level?: number;
  outputPath: string;
}

export interface ExtractOptions {
  inputPath: string;
  outputPath: string;
  password?: string;
}

export const compress = async (options: CompressOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    const args: string[] = ['a'];
    
    const formatMap: Record<string, string> = {
      zip: '-tzip',
      '7z': '-t7z',
      tar: '-ttar',
      gz: '-tgzip',
    };
    
    args.push(formatMap[options.format]);
    
    if (options.level) {
      args.push(`-mx${options.level}`);
    }
    
    if (options.password) {
      args.push(`-p${options.password}`);
    }
    
    args.push(options.outputPath);
    
    options.files.forEach(file => {
      args.push(file);
    });
    
    const process = spawn(SEVEN_ZIP_PATH, args, {
      cwd: path.join(__dirname, '../../'),
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(options.outputPath);
      } else {
        reject(new Error(`Compression failed with code ${code}`));
      }
    });
    
    process.on('error', (err) => {
      reject(err);
    });
  });
};

export const extract = async (options: ExtractOptions): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const args: string[] = ['x'];
    
    args.push(options.inputPath);
    args.push(`-o${options.outputPath}`);
    args.push('-y');
    
    if (options.password) {
      args.push(`-p${options.password}`);
    }
    
    const extractedFiles: string[] = [];
    
    const process = spawn(SEVEN_ZIP_PATH, args, {
      cwd: path.join(__dirname, '../../'),
    });
    
    process.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line.includes('Extracting')) {
          const match = line.match(/Extracting\s+(.+)/);
          if (match) {
            extractedFiles.push(match[1].trim());
          }
        }
      });
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(extractedFiles);
      } else {
        reject(new Error(`Extraction failed with code ${code}`));
      }
    });
    
    process.on('error', (err) => {
      reject(err);
    });
  });
};

export const listArchive = async (inputPath: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const args = ['l', inputPath];
    
    const files: string[] = [];
    
    const process = spawn(SEVEN_ZIP_PATH, args, {
      cwd: path.join(__dirname, '../../'),
    });
    
    process.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (line && !line.startsWith('Listing') && !line.startsWith('--') && !line.startsWith('Path') && !line.startsWith('--------') && line.trim()) {
          const parts = line.trim().split(/\s+/);
          if (parts.length > 5) {
            files.push(parts.slice(5).join(' '));
          }
        }
      });
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(files);
      } else {
        reject(new Error(`Listing failed with code ${code}`));
      }
    });
    
    process.on('error', (err) => {
      reject(err);
    });
  });
};